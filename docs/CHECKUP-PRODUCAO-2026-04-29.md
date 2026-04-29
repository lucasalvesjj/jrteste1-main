# Checkup de Produção — comercialjrltda.com.br

**Data:** 2026-04-29
**Build verificado:** dist atualmente publicado em Cloudflare Pages → domínio oficial `https://comercialjrltda.com.br`

## Contexto

A build .dev acabou de ser apontada para o domínio oficial. O usuário relatou que **"o favicon não está puxando nos links"** e pediu um checkup geral de saúde de produção. Este documento auditou o HTML servido, os ativos estáticos, headers de segurança/cache e a pipeline de SEO da rota `/` e rotas internas.

---

## Resultado por área

### ✅ O que está funcionando

| Área | Status | Evidência |
|---|---|---|
| HTTPS + HSTS | OK | `Strict-Transport-Security: max-age=15552000; includeSubDomains` |
| CSP | OK | Política completa, com GA, GTM, Hotjar, Facebook Pixel, CF Insights |
| Headers segurança | OK | `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy` |
| Favicon (arquivos) | OK | `/favicon.ico`, `/favicon-16/32/48/192/512.png`, `/apple-touch-icon.png` → 200 |
| og-image.jpg | OK | 1200x630, JPEG válido, 75 KB (dimensões ideais para WhatsApp/Facebook) |
| OG/Twitter na home `/` | OK | `og:title`, `og:description`, `og:image` (URL absoluta), `og:image:width/height`, `twitter:card=summary_large_image` presentes |
| OG nas rotas internas | OK | `/segmentos/`, `/segmentos/irrigacao/`, etc. com `<head>` completo gerado por `vite-plugin-route-seo.ts` |
| JSON-LD | OK | Organization+LocalBusiness, WebSite, BreadcrumbList servidos no HTML estático |
| Sitemaps | OK | `/sitemap.xml` → 301 → `/sitemap-index.xml` (servido) |
| robots.txt | OK | 200, 100 bytes |
| Canonical | OK | `<link rel="canonical">` injetado por rota |
| Pipeline route-seo | OK | 10 rotas estáticas + posts publicados gerando `dist/<rota>/index.html` |

### ⚠️ Problemas encontrados

#### 1. **`favicon.ico` é apenas 16×16 single-image** (alta prioridade)
- `file public/favicon.ico` → "1 icon, 16x16 ... 32 bits/pixel"
- Bookmarks de browser, abas de IDEs e scrapers que fazem fallback para favicon (alguns agregadores, Google Search resultlist) preferem 32×32 ou 48×48 dentro do `.ico` multi-tamanho.
- **Sintoma do usuário** ("favicon não puxando"): em previews de chat e alguns serviços, o `.ico` 16×16 fica borrado ou é ignorado, e o site cai no `favicon-32.png` declarado, mas alguns scrapers só leem `/favicon.ico` na raiz.

#### 2. **Cache de scraper provavelmente segurando preview antigo** (alta probabilidade de ser a causa real do relato do usuário)
- WhatsApp/Facebook/LinkedIn fazem cache agressivo (até 30 dias) do primeiro fetch de OG. Se o link foi compartilhado antes do domínio oficial estar correto, o preview "vazio" persiste.
- O HTML atual tem `og:image` 100% válido — então não é problema do código, e sim de cache externo.

#### 3. **`Cache-Control: no-cache, no-store, must-revalidate` em ativos imutáveis** (média prioridade)
- `og-image.jpg`, `apple-touch-icon.png`, `favicon-*.png`, `sitemap-index.xml` — todos com `no-store`.
- Para imagens versionadas/imutáveis isso desperdiça largura de banda e pode degradar performance / Lighthouse.
- Origem: regras em `public/_headers`.

#### 4. **`/manifest.webmanifest` não declarado no `<head>`** (baixa prioridade)
- Não há `<link rel="manifest">` em `index.html`. Sem isso, instalação como PWA, ícone em "Add to Home Screen" no Android e theme-color avançado ficam limitados.
- Os arquivos `favicon-192.png` e `favicon-512.png` já existem — falta o `manifest.json` e a tag.

#### 5. **CSP sem `report-uri`/`report-to`** (baixa prioridade)
- Política CSP é restritiva e correta, mas não tem endpoint de report — violações silenciosas em produção. Não é bloqueante.

#### 6. **Sitemap servido com `Cache-Control: no-cache, no-store`** (baixa)
- Crawlers do Google geralmente respeitam, mas é incomum. `max-age=3600` ou `max-age=86400` seria mais saudável.

---

## Plano de correção (em ordem de prioridade)

### Etapa 1 — Reconstruir `favicon.ico` multi-size (rápido, alto impacto)
- Gerar um `public/favicon.ico` contendo **16×16, 32×32 e 48×48** a partir de `public/favicon-base.png` (que já existe).
- Ferramenta sugerida: `png-to-ico` via `npx`, ou script em `scripts/build-favicon.mjs` integrado ao `npm run build`.
- **Arquivo afetado:** `public/favicon.ico` (substituir).
- **Verificação:** `file public/favicon.ico` deve listar 3 ícones; abrir no Chrome/Firefox e conferir nitidez na aba.

### Etapa 2 — Forçar re-scrape dos OGs externos (sem código)
Após confirmar que produção está correta:
- **Facebook/WhatsApp:** rodar https://developers.facebook.com/tools/debug/ → colar a URL → "Scrape Again". WhatsApp puxa do cache do FB.
- **LinkedIn:** https://www.linkedin.com/post-inspector/
- **Twitter/X:** https://cards-dev.twitter.com/validator (se ainda disponível) ou compartilhar e ver preview.
- **Telegram:** enviar `@WebpageBot` a URL para limpar o cache.

### Etapa 3 — Ajustar `_headers` (Cloudflare Pages)
Em `public/_headers`, separar políticas:
- HTML/JSON: `Cache-Control: no-cache, no-store, must-revalidate` (mantém — admin precisa atualização imediata).
- Imagens estáticas (`*.jpg`, `*.png`, `*.webp`, `*.ico`): `Cache-Control: public, max-age=31536000, immutable`.
- Fontes/JS/CSS com hash em `/assets/`: já costumam vir do Vite com `immutable` — manter.
- Sitemap/robots: `Cache-Control: public, max-age=3600`.

**Arquivo afetado:** `public/_headers`.

### Etapa 4 — Adicionar Web App Manifest
Criar `public/manifest.webmanifest`:
```json
{
  "name": "Comercial JR LTDA",
  "short_name": "Comercial JR",
  "icons": [
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#1a3c6e",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```
Incluir `<link rel="manifest" href="/manifest.webmanifest" />` em `index.html` na seção de favicons.

**Arquivos afetados:** `public/manifest.webmanifest` (novo), `index.html`.

### Etapa 5 — Smoke test final (verificação end-to-end)
- `curl -sI https://comercialjrltda.com.br/og-image.jpg` → confirmar novo cache
- `curl -sI https://comercialjrltda.com.br/favicon.ico` → 200
- Abrir `https://comercialjrltda.com.br/` em janela anônima → verificar:
  - Favicon nítido na aba
  - Console do DevTools sem erros 4xx/5xx (rede)
  - Lighthouse SEO ≥ 95, Best Practices ≥ 95
- Compartilhar link em WhatsApp Web (após Etapa 2) → preview com og-image deve aparecer
- Rodar `npm run build` localmente após mudanças e conferir `dist/index.html` antes de commit

---

## Arquivos críticos

- [index.html](../index.html) — manifest link, favicons
- [public/_headers](../public/_headers) — política de cache por tipo
- [public/favicon.ico](../public/favicon.ico) — substituir por multi-size
- [public/favicon-base.png](../public/favicon-base.png) — fonte para gerar o .ico
- [public/manifest.webmanifest](../public/manifest.webmanifest) — novo
- [vite-plugin-route-seo.ts](../vite-plugin-route-seo.ts) — pipeline de OG por rota (sem alterações)
- [public/data/route-seo.json](../public/data/route-seo.json) — fonte das metas (sem alterações)

## Notas

- **Pipeline de SEO está saudável** — rotas estáticas, blog e home têm `<head>` completo no HTML servido (importante para crawlers sem JS). Nenhuma alteração no `vite-plugin-route-seo.ts` necessária.
- **Os JSON-LD (Organization/LocalBusiness/WebSite/Breadcrumb) já estão em produção** — nada a fazer.
- O issue real do relato do usuário ("favicon não puxando nos links") é provavelmente **cache de scraper** (Etapa 2) + **`.ico` 16×16** (Etapa 1). O HTML em si não tem bug.
