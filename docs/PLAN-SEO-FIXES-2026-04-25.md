# Plano — Correções de SEO (auditoria 2026-04-25)

## Contexto

A auditoria em `docs/SEO-AUDIT-2026-04-25.md` apontou problemas que impactam ranking local e CTR no Google: titles longos/duplicados, meta descriptions truncadas com `...`, ausência de Twitter Cards, ausência de schemas (LocalBusiness consolidado, Article, FAQPage) e gaps técnicos (redirect do `/sitemap.xml`, alt text vazio).

**Causa raiz dos titles:** [src/components/SEOHead.tsx:43-44](src/components/SEOHead.tsx) **sempre** sufixa ` | {shortName}` (Comercial JR) quando há `title` na prop. Logo, qualquer página que já inclua "Comercial JR" no title manual gera duplicação.

**Causa raiz dos schemas/Twitter Card no build:** o projeto é SPA puro (Vite + React). Existe **um único** `dist/index.html`, e [vite-plugin-seo-sync.ts:45-72](vite-plugin-seo-sync.ts) injeta apenas `<title>` e `<meta description>` da home. Tudo que `SEOHead` e `SchemaOrg` renderizam via Helmet (og:*, twitter:*, JSON-LD por rota) só aparece após o React hidratar — crawlers de redes sociais (Twitter, Facebook, LinkedIn, Slack, WhatsApp) **não veem**. Portanto, todos os schemas (LocalBusiness, Article, FAQ) e o Twitter Card precisam ser **gerados em build-time como HTML estático por rota**, alimentados por uma fonte única de builders.

**Resultado esperado:** 7 segmentos com title ≤60 chars sem brand duplicada; meta descriptions limpas; Twitter Card global; LocalBusiness/Article/FAQ JSON-LD entregues no HTML servido (não só no DOM pós-hidratação); `/sitemap.xml` resolvendo via 301.

**Convenções confirmadas:**
- URLs dos segmentos permanecem como `/segmentos/<slug>/` (estado atual).
- FAQ usa **campo dedicado** `post.faq` (Opção A), não heurística no markdown.

---

## Etapas (execução incremental, aprovação entre cada)

### Etapa 1 — Quick Wins de titles dos segmentos

Mudança independente do restante; reduz CTR-killer imediatamente. Os mesmos titles serão depois reaproveitados pelo plugin da Etapa 2 no HTML estático.

**Arquivos:**
- [src/pages/segmentos/BombasMotores.tsx:48](src/pages/segmentos/BombasMotores.tsx)
  - **Antes:** `"Bombas e Motores Elétricos em Castelo ES | WEG, Schneider, Lepono — Comercial JR"` (final 95 chars com `| Comercial JR` extra anexado pelo SEOHead)
  - **Depois:** `"Bombas e Motores Elétricos em Castelo ES"` (40 + 15 = 55 chars finais)
- [src/pages/segmentos/Irrigacao.tsx:59](src/pages/segmentos/Irrigacao.tsx)
  - **Antes:** `"Irrigação Agrícola em Castelo ES | Sistemas, Bombas e Acessórios"` (final 79 chars)
  - **Depois:** `"Irrigação Agrícola em Castelo ES"` (32 + 15 = 47 chars finais)
- Demais 5 segmentos (`AssistenciaStihl`, `Ferramentas`, `Locacao`, `Maquinas`, `PocosArtesianos`) — auditar e encurtar para `title.length + 15 ≤ 60`, sem repetir "Comercial JR".

**Regra geral:** nunca incluir "Comercial JR" no prop `title` — o `SEOHead` já anexa.

### Etapa 2 — Fundação SEO de build (plugin + builders + Twitter + LocalBusiness + Article)

**Justificativa de agrupamento:** Twitter Card, LocalBusiness e Article compartilham os mesmos componentes (`SEOHead`, `SchemaOrg`), os mesmos builders Node/browser, e o mesmo plugin de emissão estática. Quebrar em etapas separadas duplicaria refatoração e iteração de build. Esta etapa entrega a **fonte única de verdade** consumida tanto em runtime (React) quanto em build-time (Node).

**Substeps (executar nessa ordem dentro da etapa):**

**2.1 — Builders compartilhados:** novo módulo [src/lib/seo/schemas.ts](src/lib/seo/schemas.ts) com funções puras (sem dependências React, importáveis em Node):
- `buildLocalBusiness(seoSettings)` — extrai os campos hoje hard-coded em [src/pages/Index.tsx:713-777](src/pages/Index.tsx) para um builder único, parametrizado por `seo-settings.json` (name, address, geo, telephone, openingHours, priceRange, sameAs).
- `buildArticle(post)` — headline, description, image, datePublished, dateModified, author, publisher (`@id` apontando para `ORG_ID`), mainEntityOfPage.
- `buildBreadcrumb(items)` e `buildService(...)` — migrar os builders já existentes em [src/components/SchemaOrg.tsx:43-67](src/components/SchemaOrg.tsx) para este módulo.
- `buildFAQPage(items)` — adicionado na Etapa 3 (assinatura já reservada aqui).

**2.2 — Twitter Card no SEOHead:** [src/components/SEOHead.tsx](src/components/SEOHead.tsx), após o bloco Open Graph (linhas 84-93):
```tsx
{/* ── Twitter Card ── */}
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content={fullTitle} />
<meta name="twitter:description" content={desc} />
<meta name="twitter:image"       content={image} />
```

**2.3 — SchemaOrg estendido:** [src/components/SchemaOrg.tsx](src/components/SchemaOrg.tsx) ganha discriminadores `localBusiness` e `article` (via union type), delegando para `buildLocalBusiness` / `buildArticle` em `src/lib/seo/schemas.ts`. Builders existentes (`breadcrumb`, `service`, `webpage`) passam a importar do módulo compartilhado.

**2.4 — Refatorar Index.tsx:** substituir o bloco LocalBusiness inline em [src/pages/Index.tsx:713-777](src/pages/Index.tsx) por `<SchemaOrg type="localBusiness" />`. Mesmo objeto, fonte única.

**2.5 — Article em BlogPost.tsx:** após `<SEOHead>` em [src/pages/BlogPost.tsx:208-219](src/pages/BlogPost.tsx):
```tsx
<SchemaOrg type="article" post={post} />
```

**2.6 — Plugin `vite-plugin-route-seo`:** novo arquivo [vite-plugin-route-seo.ts](vite-plugin-route-seo.ts), registrado em [vite.config.ts](vite.config.ts) após `sitemapPlugin()`.
- Hook `closeBundle` (após o build).
- Lê `dist/index.html` (SPA shell), `public/data/seo-settings.json`, novo `public/data/route-seo.json` e `public/data/blogPosts.json`.
- Manifest `route-seo.json` (novo): array de `{ path, title, description, ogImage, schemas: ["localBusiness" | "service" | "breadcrumb" | ...] }` cobrindo home (`/`) + 7 segmentos + páginas estáticas.
- Para cada rota da lista estática, emite `dist/<path>/index.html` cópia do shell com `<head>` substituído (title, description, og:*, twitter:*, canonical, JSON-LD via `buildLocalBusiness`/`buildService`/`buildBreadcrumb`).
- Para cada post publicado em `blogPosts.json`, emite `dist/blog/<slug>/index.html` com Article + Breadcrumb (FAQ entrará na Etapa 3).
- Cloudflare Pages serve `dist/segmentos/bombas-e-motores/index.html` antes do fallback SPA, então o crawler recebe HTML completo; o usuário ainda boota o SPA porque `<div id="root">` e `<script>` permanecem intactos.

**Resultado da etapa:** Twitter Card, LocalBusiness e Article entregues tanto via React (runtime) quanto via HTML estático (build). Mudança runtime ↔ build sempre passa pelo mesmo builder em `schemas.ts`.

### Etapa 3 — FAQPage JSON-LD (Opção A: campo dedicado `post.faq`)

Separada da Etapa 2 porque toca modelo de dados e UI admin — ciclo de mudança e teste distinto.

**Mudanças:**
1. Adicionar `faq?: Array<{ question: string; answer: string }>` na interface `BlogPost` em [src/data/blogTypes.ts](src/data/blogTypes.ts).
2. Atualizar form de edição de post no admin (localizar em `src/pages/admin/`) com campo array de Q/A — adicionar/remover par, validação simples.
3. Implementar `buildFAQPage(items)` em [src/lib/seo/schemas.ts](src/lib/seo/schemas.ts) (assinatura já reservada na Etapa 2.1).
4. Estender `SchemaOrg.tsx` com `type: "faqPage"`.
5. Em [src/pages/BlogPost.tsx](src/pages/BlogPost.tsx), renderização condicional: `{post.faq?.length > 0 && <SchemaOrg type="faqPage" items={post.faq} />}`.
6. Plugin `vite-plugin-route-seo` (Etapa 2.6) já consome `blogPosts.json` — adicionar lógica para emitir o FAQ schema no `dist/blog/<slug>/index.html` quando `post.faq` existe.

### Etapa 4 — Redirect /sitemap.xml

**Arquivo:** [public/data/redirects.json](public/data/redirects.json)

Adicionar regra:
```json
{
  "id": "<uuid-novo>",
  "sourceUrl": "/sitemap.xml",
  "targetUrl": "/sitemap-index.xml",
  "type": 301,
  "isRegex": false,
  "enabled": true,
  "hits": 0,
  "note": "Compat: alguns crawlers buscam /sitemap.xml"
}
```

Pipeline (memória `redirects pipeline`): edição em DEV → commit → CF Pages build gera `dist/_redirects` via `cloudflareRedirectsPlugin`.

### Etapa 5 — Reescrever metaDescriptions truncadas (correção de dados)

**Não é mudança de código** — correção via admin (pipeline `blog flow`: localStorage → export → `public/data/blogPosts.json`).

Auditar últimos 15-20 posts publicados, reescrever cada `seo.metaDescription` para 120-150 chars **sem** `"..."` no final. Mesma passada: preencher `seo.ogImage` individualizado nos top-20 (caminho `/og/<slug>.jpg` ou imagem de capa do post).

Após reexport, o plugin da Etapa 2 reflete automaticamente no HTML estático no próximo build.

### Etapa 6 — Alt text em imagens de conteúdo

Buscar `alt=""` ou `alt={""}` em posts e em componentes de blog ([src/pages/BlogPost.tsx](src/pages/BlogPost.tsx), parser de markdown). Para imagens vindas do markdown dos posts, é correção no conteúdo (admin). Para imagens de UI sem texto alternativo válido, decidir caso a caso entre alt descritivo ou `alt=""` intencional + `role="presentation"`.

---

## Arquivos críticos modificados

**Novos:**
- [src/lib/seo/schemas.ts](src/lib/seo/schemas.ts) — builders compartilhados runtime + build (Etapa 2.1)
- [vite-plugin-route-seo.ts](vite-plugin-route-seo.ts) — emissão de HTML por rota (Etapa 2.6)
- [public/data/route-seo.json](public/data/route-seo.json) — manifest de rotas estáticas

**Modificados:**
- [vite.config.ts](vite.config.ts) — registrar `routeSeoPlugin()`
- [src/components/SEOHead.tsx](src/components/SEOHead.tsx) — Twitter Card
- [src/components/SchemaOrg.tsx](src/components/SchemaOrg.tsx) — `localBusiness`, `article`, `faqPage`; consome `schemas.ts`
- [src/pages/Index.tsx](src/pages/Index.tsx) — refatorar bloco LocalBusiness inline → `<SchemaOrg>`
- [src/pages/BlogPost.tsx](src/pages/BlogPost.tsx) — `<SchemaOrg type="article">` + FAQ condicional
- [src/pages/segmentos/*.tsx](src/pages/segmentos/) — todos os 7 titles (Etapa 1)
- [src/data/blogTypes.ts](src/data/blogTypes.ts) — campo `faq`
- Admin de posts — UI para campo FAQ
- [public/data/redirects.json](public/data/redirects.json) — regra `/sitemap.xml`
- [public/data/blogPosts.json](public/data/blogPosts.json) — meta descriptions e ogImages reescritas (via admin)

## Verificação end-to-end

1. **Build local:** `npm run build` — confirmar que `dist/segmentos/bombas-e-motores/index.html`, `dist/blog/<slug>/index.html` e `dist/index.html` existem com `<head>` populado por rota.
2. **Inspeção do HTML estático (sem JS):** `curl https://comercialjrltda.com.br/segmentos/irrigacao/ | grep -E "twitter:|og:|application/ld\+json|<title>"` — todas as tags devem estar no HTML servido.
3. **Preview SPA:** `npm run preview` — abrir cada uma das 7 páginas de segmento, blog post de exemplo e home; DevTools → Elements para conferir consistência runtime ↔ HTML inicial:
   - `<title>` ≤60 chars sem "Comercial JR" duplicado
   - `<meta name="description">` sem `...`
   - `<meta name="twitter:card" content="summary_large_image">` presente
   - `<script type="application/ld+json">` com LocalBusiness (home), Article (post), FAQPage (post c/ FAQ)
4. **Validators externos** (após deploy em CF Pages):
   - Google Rich Results Test: home, 1 segmento, 1 post.
   - Twitter Card Validator (cards-dev.twitter.com): home + 1 post.
   - Facebook Sharing Debugger: home + 1 post (revalida cache OG).
   - `curl -I https://comercialjrltda.com.br/sitemap.xml` → 301 para `/sitemap-index.xml`.
5. **Regressão de titles:** `grep -r 'Comercial JR' src/pages/segmentos/` deve retornar zero ocorrências em props `title=`.
