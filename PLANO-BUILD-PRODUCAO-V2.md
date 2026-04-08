# PLANO DE BUILD DE PRODUCAO v2.0 -- Comercial JR LTDA

**Data:** 08/04/2026
**Autor:** Claude (com revisao critica do plano v1.0)
**Projeto:** comercialjrltda.com.br
**Stack:** React 18.3 + Vite 5.4 + TypeScript 5.8 + Tailwind 3.4
**Deploy:** VPS CentOS 7.9 + cPanel 110.0.92 + Cloudflare Free

---

## INDICE

- [Discrepancias entre Plano v1.0 e Estado Atual](#discrepancias)
- [PARTE 1 -- Preparacao VPS/cPanel](#parte-1)
- [PARTE 2 -- GitHub vs Build Local](#parte-2)
- [PARTE 3 -- Resolucao de Vulnerabilidades](#parte-3)
- [PARTE 4 -- Pre-otimizacoes e Selecao de Arquivos](#parte-4)
- [PARTE 5 -- Automacao da Build de Producao](#parte-5)
- [PARTE 6 -- Velocidade, Cache, Compressao e SEO](#parte-6)
- [Ordem de Execucao](#ordem-de-execucao)
- [Avaliacao de Riscos](#riscos)
- [Checklist Final](#checklist)

---

<a name="discrepancias"></a>
## DISCREPANCIAS ENTRE O PLANO v1.0 E O ESTADO REAL DO CODIGO

Antes de detalhar cada parte, e CRITICO documentar o que ja foi feito, o que nao foi feito, e o que o plano v1.0 propoe incorretamente.

### JA IMPLEMENTADO (nao precisa fazer de novo)

| Item | Arquivo | Status |
|------|---------|--------|
| Admin exclusion via `import.meta.env.DEV` | `src/App.tsx:29-36, 82-89` | Funcional -- chunks admin NAO aparecem no build |
| Tracking types extraidos | `src/types/tracking.ts` | Ja existe com TrackingCode, TrackingPosition, etc. |
| Admin-dark CSS separado | `src/styles/admin-dark.css` | Ja separado do index.css |
| Font loading nao-bloqueante | `index.html:26-32` | Preload + async implementado |
| Hero image preload | `index.html:35` | fetchpriority="high" implementado |
| `@import url(...)` removido do CSS | `src/index.css` | Ja limpo |
| `supabaseConfig.ts` removido | - | Arquivo nao existe mais |
| `_headers` removido | - | Arquivo nao existe mais |
| Vendor chunks configurados | `vite.config.ts:33-36` | vendor-react + vendor-ui ja existem |

### INCORRECOES NO PLANO v1.0

1. **O plano menciona `src/lib/supabaseConfig.ts` com JWT hardcoded** -- esse arquivo JA NAO EXISTE
2. **O plano propoe flag `VITE_INCLUDE_ADMIN`** -- DESNECESSARIA, o codigo ja usa `import.meta.env.DEV` que e automaticamente `false` em qualquer build de producao
3. **O plano sugere modificar TrackingScripts.tsx** -- o TrackingScripts JA importa de `@/types/tracking` (verificado)
4. **O plano estima admin chunks em 586KB** -- eles JA nao existem no build
5. **O plano fala em vulnerabilidade HIGH do `lodash`** -- NAO ha lodash nas dependencies do package.json
6. **O plano estima bundle principal em 453KB** -- na realidade: index 153KB + vendor-react 158KB + vendor-ui 145KB

### NAO IMPLEMENTADO (PRECISA FAZER)

- [ ] `scripts/build-production.mjs` -- script automatizado de build
- [ ] `scripts/verify-build.mjs` -- verificacao pos-build
- [ ] `build-production.bat` -- wrapper Windows
- [ ] Headers de seguranca adicionais no `.htaccess` (CSP, HSTS, Cache-Control, compressao)
- [ ] Limpeza de `recharts` do package.json (dependencia fantasma, 0 imports)
- [ ] Remocao de `public/data/blog-posts3.json` (arquivo orfao, 0 referencias)
- [ ] Opcao `esbuild.drop: ['console']` no vite.config.ts para producao
- [ ] Configuracao do Cloudflare (Page Rules, SSL, etc.)

---

<a name="parte-1"></a>
## PARTE 1 -- PREPARACAO DO AMBIENTE VPS/cPANEL

### 1.1 CentOS 7.9 EOL -- Avaliacao Critica

O CentOS 7.9 atingiu End-of-Life em **Junho de 2024**. Nao recebe mais patches de seguranca.

**Avaliacao de risco REAL para este caso:**
Para um site ESTATICO puro (sem backend, sem PHP processando requests, sem banco de dados), o risco e **limitado** porque:
- Nenhum processo server-side executa requests do usuario
- Cloudflare proxy esconde o IP real do servidor e fornece WAF/DDoS basico
- O vetor de ataque seria contra o Apache/httpd ou kernel, nao contra a aplicacao

**Porem:** cPanel 110 em CentOS 7 esta em modo de compatibilidade terminal. cPanel 114+ abandona CentOS 7 completamente. A migracao NAO e opcional -- e uma questao de **quando**, nao **se**.

**Alternativa superior (nao explorada no v1.0):** **Cloudflare Pages** (Free tier) como hospedagem do site estatico, mantendo o VPS apenas para email e servicos cPanel. Vantagens:
- Elimina completamente o risco CentOS para o site publico
- Deploy via `git push` ou upload direto
- CDN global automatico (sem configurar Page Rules)
- HTTPS nativo sem configuracao
- Custo: R$ 0

> **Decisao recomendada:** Usar cPanel agora (ja pago, ja configurado) e avaliar Cloudflare Pages como migracao futura quando o CentOS comecar a dar problemas. Documentar como plano B.

### 1.2 Document Root e Estrutura

O conteudo de `dist/` vai DIRETAMENTE para `/home/<usuario>/public_html/`. **NAO** criar subpasta.

```
/home/<usuario>/public_html/
  ├── index.html
  ├── .htaccess
  ├── robots.txt
  ├── sitemap-index.xml
  ├── page-sitemap.xml
  ├── post-sitemap.xml
  ├── favicon.ico
  ├── favicons/
  ├── og-image.jpg
  ├── assets/          ← JS/CSS com hash
  ├── blog/            ← imagens do blog
  ├── media/           ← media library
  └── data/
      ├── blog-posts.json
      ├── redirects.json
      ├── seo-settings.json
      └── tracking-codes.json
```

### 1.3 .htaccess -- REESCRITA COMPLETA NECESSARIA

O template atual em `public/.htaccess` esta **INCOMPLETO**. Ele tem:
- Bloqueio de /admin (correto)
- Placeholder de redirects (correto)
- SPA fallback (correto)
- Headers basicos: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

**FALTANDO (CRITICO):**

| Header/Feature | Status | Impacto |
|----------------|--------|---------|
| HSTS (Strict-Transport-Security) | AUSENTE | Sem HSTS, usuarios podem ser redirecionados para HTTP |
| CSP (Content-Security-Policy) | AUSENTE | Sem CSP, XSS facilitado |
| Cache-Control para assets hashados | AUSENTE | Sem cache, cada visita re-baixa todo JS/CSS |
| mod_deflate (compressao gzip) | AUSENTE | Fallback caso Cloudflare falhe |
| mod_expires (cache longo para imagens) | AUSENTE | Imagens re-baixadas a cada visita |
| HTTPS redirect | AUSENTE | Redundante com Cloudflare mas defense-in-depth |
| www normalization | AUSENTE | Conteudo duplicado se acessado com www |

**O .htaccess completo proposto:**

```apache
RewriteEngine On
RewriteBase /

# ============================================================
# HTTPS Redirect (defense-in-depth, Cloudflare ja faz)
# ============================================================
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# ============================================================
# www -> non-www (evita conteudo duplicado)
# ============================================================
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]

# ============================================================
# Bloqueia /admin em producao (404)
# ============================================================
RewriteRule ^admin(/.*)?$ - [R=404,L]

# --- REDIRECT RULES PLACEHOLDER ---

# ============================================================
# SPA Fallback
# ============================================================
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# ============================================================
# Security Headers
# ============================================================
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://script.hotjar.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://stats.g.doubleclick.net https://*.hotjar.com https://*.hotjar.io; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
</IfModule>

# ============================================================
# Compressao GZIP (fallback do Cloudflare Brotli)
# ============================================================
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# ============================================================
# Cache-Control
# ============================================================
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML -- sempre fresco (SPA entry point)
  ExpiresByType text/html "access plus 0 seconds"

  # JS/CSS com hash Vite -- cache agressivo (1 ano)
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"

  # Imagens -- cache longo (1 ano, media usa UUID no path)
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"

  # JSON (dados do blog, SEO) -- cache curto com revalidacao
  ExpiresByType application/json "access plus 1 minute"

  # XML (sitemaps) -- cache medio
  ExpiresByType application/xml "access plus 1 hour"
  ExpiresByType text/xml "access plus 1 hour"
</IfModule>

# Headers adicionais de cache para assets com hash
<IfModule mod_headers.c>
  <FilesMatch "\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(webp|jpg|jpeg|png|svg|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.json$">
    Header set Cache-Control "public, max-age=60, stale-while-revalidate=300"
  </FilesMatch>
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
  </FilesMatch>
  <FilesMatch "\.xml$">
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
</IfModule>
```

**Avaliacao critica sobre CSP:**
O `'unsafe-inline'` em `script-src` e `style-src` e **obrigatorio** por duas razoes:
1. `TrackingScripts.tsx` usa `dangerouslySetInnerHTML` para injetar tracking codes
2. `react-helmet-async` injeta estilos inline

Sem refatoracao significativa (nonces, hash-based CSP), nao ha como evitar `unsafe-inline`. Este e o trade-off correto para o momento.

**Output esperado:** O plugin `vite-plugin-htaccess.ts` le o template de `public/.htaccess`, substitui o placeholder de redirects e grava em `dist/.htaccess`. Todas as adicoes no template serao propagadas automaticamente.

### 1.4 SSL/TLS

| Opcao | Recomendacao | Motivo |
|-------|-------------|--------|
| Cloudflare Origin Certificate | **PREFERIDA** | Validade 15 anos, zero manutencao |
| cPanel AutoSSL (Let's Encrypt) | Alternativa | Renova a cada 90 dias automaticamente |
| Modo SSL | **Full (Strict)** | Obrigatorio -- modo "Flexible" causa redirect loop |

**AVISO CRITICO:** Se escolher Origin Certificate, ele NAO e confiavel para browsers que acessam o IP diretamente (bypass Cloudflare). Isso e by design e esta correto -- o site so deve ser acessado via Cloudflare.

### 1.5 Permissoes

```
Diretorios: 755 (rwxr-xr-x)
Arquivos:   644 (rw-r--r--)
.htaccess:  644 (rw-r--r--)
```

Comando no cPanel Terminal (se disponivel):
```bash
find /home/<usuario>/public_html -type d -exec chmod 755 {} \;
find /home/<usuario>/public_html -type f -exec chmod 644 {} \;
```

### 1.6 Acoes Manuais no cPanel

| Acao | Onde | Detalhes |
|------|------|----------|
| Verificar Document Root | Dominios > dominio principal | Deve apontar para `public_html` |
| Verificar PHP desativado | MultiPHP Manager | NAO precisa de PHP -- site e 100% estatico |
| Verificar mod_rewrite | Apache Handlers ou suporte | Necessario para SPA fallback |
| Verificar mod_headers | Apache Handlers ou suporte | Necessario para security/cache headers |
| Verificar mod_deflate | Apache Handlers ou suporte | Necessario para compressao gzip |
| Verificar mod_expires | Apache Handlers ou suporte | Necessario para cache |

---

<a name="parte-2"></a>
## PARTE 2 -- GITHUB ACTIONS vs BUILD LOCAL

### 2.1 Analise das Opcoes

| Criterio | Build Local | GitHub Actions + FTP |
|----------|------------|---------------------|
| Complexidade | Baixa (1 comando) | Media (setup YAML + secrets) |
| Velocidade 1o deploy | Rapida (ZIP upload manual) | Lenta (~15-30min para 70MB via FTP) |
| Velocidade deploys seguintes | Media (ZIP manual) | Rapida (automatico no push) |
| Dependencias externas | Zero | GitHub, FTP credentials |
| Reproducibilidade | Depende do ambiente local | 100% reprodutivel |
| Custo | R$ 0 | R$ 0 (GitHub Free: 2000 min/mes) |

### 2.2 Decisao Recomendada

**Fase 1 (Imediata -- para o launch):** Build LOCAL

Motivo: simplicidade. O site precisa ir ao ar AGORA. Zero configuracao extra necessaria.

Fluxo:
```
npm run build:production → gera dist/ + deploy/*.zip → upload ZIP no cPanel File Manager → extrair
```

**Fase 2 (Apos launch estabilizado):** GitHub Actions (OPCIONAL)

Para quando: apos 2-3 deploys manuais bem-sucedidos e o fluxo estar validado.

Fluxo proposto:
```
git push comercial-jr-2 → GitHub Actions → npm run build → FTP Deploy → done
```

**Avaliacao critica do plano v1.0 sobre GitHub Actions:**
O argumento de "CentOS 7 tem glibc incompativel" que o v1.0 usa e IRRELEVANTE para GitHub Actions. O Actions roda em `ubuntu-latest` (Ubuntu 24.04), nao no CentOS. O build acontece no runner do GitHub, nao no servidor. A unica interacao com o servidor e o upload FTP do artefato ja buildado.

### 2.3 Ponto de Atencao: Dois Repositorios

O projeto tem DOIS remotes:
- `origin` -> `lucasalvesjj/jrteste1-main` (branch: master) -- dev principal
- `seguinte` -> `lucasalvesjj/comercial-jr-2` (branch: main) -- repo de producao

O `sincronizar.bat` faz `git push --force` para AMBOS. Se GitHub Actions for configurado em `comercial-jr-2`, o force push pode causar triggers indesejados. Considerar isso na Fase 2.

### 2.4 Alternativa Futura Superior: Cloudflare Pages

| Criterio | cPanel + FTP | Cloudflare Pages |
|----------|-------------|-----------------|
| Deploy | Upload manual ou FTP | `git push` ou wrangler deploy |
| CDN | Cloudflare proxy | CDN nativo (200+ PoPs) |
| HTTPS | Configuracao manual | Automatico |
| Cache invalidation | Page Rules manuais | Automatico no deploy |
| Custo | VPS pago | R$ 0 (Free: 500 builds/mes) |
| Rollback | Restaurar backup manual | 1 click no dashboard |

**Recomendacao:** Documentar como plano de migracao quando o CentOS/cPanel comecar a dar problemas.

---

<a name="parte-3"></a>
## PARTE 3 -- RESOLUCAO DE VULNERABILIDADES

### 3.1 Status Atualizado de TODAS as Vulnerabilidades

| # | Vulnerabilidade | Status 08/04/2026 | Acao Necessaria |
|---|----------------|-------------------|-----------------|
| 1 | Supabase key hardcoded | **RESOLVIDO** -- `supabaseConfig.ts` removido | Nenhuma |
| 2 | Admin sem autenticacao | **RESOLVIDO** -- tree-shaken via DEV flag | .htaccess block (defense-in-depth, ja implementado) |
| 3 | GitHub PAT em localStorage | **MITIGADO** -- tree-shaken junto com admin | Nenhuma para producao |
| 4 | `_headers` ineficaz | **RESOLVIDO** -- arquivo removido | Nenhuma |
| 5 | TrackingScripts import de admin | **RESOLVIDO** -- tipos em `@/types/tracking` | Nenhuma |
| 6 | Sem CSP | **PENDENTE** | Adicionar ao .htaccess |
| 7 | Sem HSTS | **PENDENTE** | Adicionar ao .htaccess + Cloudflare |
| 8 | Sem Cache-Control | **PENDENTE** | Adicionar ao .htaccess |
| 9 | Sem compressao gzip | **PENDENTE** | Adicionar mod_deflate ao .htaccess |
| 10 | console.log em producao | **PENDENTE** | Adicionar `esbuild.drop` no vite.config.ts |
| 11 | `env.local` no repositorio | **BAIXO RISCO** | Apenas publishable key (segura por design do Supabase) |
| 12 | dangerouslySetInnerHTML (17x) | **ACEITO** | Conteudo proprio (blog, JSON-LD, tracking) -- risco controlado |

### 3.2 npm audit -- Avaliacao Critica REAL

O plano v1.0 menciona vulnerabilidade HIGH de lodash. **NAO HA LODASH** no `package.json`. As vulnerabilidades reais em 08/04/2026:

| Pacote | Severidade | Tipo | Afeta producao? | Acao |
|--------|-----------|------|-----------------|------|
| esbuild <= 0.24.2 | MODERATE | Dev server leak | **NAO** -- so afeta `vite dev` | Nenhuma |
| brace-expansion < 1.1.13 | MODERATE | ReDoS | **NAO** -- dep transitiva do minimatch | Nenhuma |
| @tootallnate/once < 3.0.1 | LOW | Control flow | **NAO** -- via jsdom (devDep) | Nenhuma |

**Veredito:** NENHUMA das vulnerabilidades reportadas pelo `npm audit` afeta o bundle de producao. Sao todas dev-dependencies ou dependencias transitivas de ferramentas de build/teste. **NAO bloquear o deploy por causa delas.**

### 3.3 console.log/warn/info -- Solucao Robusta

Locais com console output no `src/`:
- `src/stores/redirectStore.ts` -- console.warn (guarded por `import.meta.env.DEV`)
- `src/lib/adapters/manualAdapter.ts` -- console.warn/info (admin-only, tree-shaken)
- `src/lib/mediaApi.ts` -- console.info (admin-only, tree-shaken)
- `src/components/admin/AdminSeoEditor.tsx` -- console.warn (admin-only, tree-shaken)

**A maioria ja nao aparece no build** porque esta em codigo admin que e tree-shaken. Porem, como medida de seguranca definitiva:

**Solucao:** Adicionar ao `vite.config.ts`:
```typescript
esbuild: {
  drop: mode === 'production' ? ['console', 'debugger'] : [],
},
```

**Output:** Remove TODOS os `console.*` e `debugger` do build de producao. Mais robusto que buscar instancias manualmente. Reducao marginal no tamanho do bundle (~1-2KB).

### 3.4 Arquivos Orfaos que Vazam para Producao

| Arquivo | Tamanho | Referencias no src/ | Acao |
|---------|---------|---------------------|------|
| `public/data/blog-posts3.json` | ~357KB | **ZERO** | REMOVER antes do build |
| `public/data/media-library.json` | ~156KB | Apenas `src/lib/mediaApi.ts` (admin-only, tree-shaken) | REMOVER no script de build |

**Economia:** ~513KB a menos no deploy. O `media-library.json` e especialmente importante -- nenhum componente publico o acessa.

**Verificacao feita:**
- `usePublishedBlog.ts` -> busca `blog-posts.json` (OK)
- `usePublishedSeo.ts` -> busca `seo-settings.json` (OK)
- `usePublishedRedirects.ts` -> busca `redirects.json` (OK)
- `TrackingScripts.tsx` -> busca `tracking-codes.json` (OK)
- NENHUM componente publico busca `media-library.json` ou `blog-posts3.json`

### 3.5 Protecao Contra Alteracao Pos-Publicacao

O site e 100% estatico. Para que ninguem altere apos publicacao:

1. **Permissoes corretas** (644 arquivos, 755 diretorios) -- Apache le, mas ninguem escreve via HTTP
2. **.htaccess com X-Frame-Options: DENY** -- previne clickjacking
3. **CSP restritivo** -- limita de onde scripts podem ser carregados
4. **Cloudflare WAF** -- regras basicas de protecao no plano Free
5. **Sem formularios que processem dados no servidor** -- o formulario de contato usa `mailto:` ou WhatsApp
6. **Sem banco de dados** -- nao ha backend para comprometer

**Risco residual:** Se alguem obtiver acesso FTP/cPanel/SSH ao servidor, pode alterar os arquivos. Mitigacao: senhas fortes, 2FA no cPanel, e monitoramento via Cloudflare Analytics.

---

<a name="parte-4"></a>
## PARTE 4 -- PRE-OTIMIZACOES E SELECAO DE ARQUIVOS

### 4.1 Admin Exclusion -- VERIFICADO E FUNCIONAL

O mecanismo atual em `src/App.tsx:29-36`:
```tsx
const AdminPage = import.meta.env.DEV
  ? lazy(() => import("./pages/Admin"))
  : null;
```

Em `vite build` (mode production), `import.meta.env.DEV` e substituido por `false` em compile-time. O Vite/Rollup faz tree-shaking e **remove completamente** o import de `./pages/Admin` e toda sua arvore de dependencias (TipTap editor, MediaLibrary, etc.).

**Resultado confirmado:** NENHUM chunk admin aparece no build atual. A proposta do v1.0 de criar `VITE_INCLUDE_ADMIN` e REDUNDANTE e DESNECESSARIA.

### 4.2 Bundle Analysis Real (08/04/2026)

| Chunk | Tamanho | Conteudo |
|-------|---------|----------|
| vendor-react-*.js | 158 KB | React, ReactDOM, React Router |
| index-*.js | 153 KB | App core, Radix UI, Zustand, TanStack Query |
| vendor-ui-*.js | 145 KB | Framer Motion, Embla Carousel |
| index-*.css | 74 KB | Tailwind + componentes |
| Index-*.js (homepage) | 26 KB | Pagina principal |
| WhatsAppButton-*.js | 21 KB | Botao WhatsApp flutuante |
| NossaHistoria-*.js | 18 KB | Pagina |
| NossaMissao-*.js | 17 KB | Pagina |
| BlogPost-*.js | 15 KB | Template de post |
| (+ 34 chunks menores) | ~170 KB | Paginas + utilitarios |
| **TOTAL JS** | **~725 KB** | (antes de compressao) |
| **TOTAL CSS** | **74 KB** | (antes de compressao) |

**Com Brotli (Cloudflare):** JS transferido ~200KB, CSS ~15KB. **Excelente para a quantidade de funcionalidades.**

### 4.3 Proposta de Otimizacao de Chunks -- AVALIACAO CRITICA

O plano v1.0 propoe dividir o bundle principal em react-vendor, animation, ui-primitives, state.

**Minha avaliacao:** A configuracao atual de chunks **JA E ADEQUADA**. Dividir mais criaria chunks muito pequenos (<20KB), aumentando HTTP requests sem beneficio real de cache. O padrao HTTP/2 do Apache no cPanel suporta multiplexing, mas chunks minusculos ainda adicionam overhead de parsing.

**Recomendacao:** Manter `vendor-react` e `vendor-ui` como estao. Eles raramente mudam (so quando atualizar React/Framer). O `index-*.js` muda a cada deploy, como esperado.

### 4.4 Dependencia Fantasma: `recharts`

`recharts` (^2.15.4, ~500KB unpacked) esta no `package.json` mas NAO e importado por NENHUM arquivo em `src/` (grep confirmou 0 resultados). E provavelmente resquicio do template Lovable original.

**Acao:** Remover de `package.json`. O Vite ja nao inclui no bundle (nao importado = nao bundled), mas remove-lo:
- Acelera `npm install` em ~10-15 segundos
- Reduz `node_modules` em ~5MB
- Elimina confusao futura

**Output:** Zero impacto no site. Apenas limpeza de projeto.

### 4.5 Arquivos que VAN para o Build de Producao

**MANTER:**
```
dist/
  ├── index.html                 ← entry point do SPA
  ├── .htaccess                  ← gerado pelo plugin
  ├── robots.txt                 ← SEO
  ├── sitemap-index.xml          ← SEO
  ├── page-sitemap.xml           ← SEO
  ├── post-sitemap.xml           ← SEO
  ├── favicon.ico                ← favicon principal
  ├── favicons/                  ← todas as variantes
  ├── og-image.jpg               ← Open Graph default
  ├── assets/                    ← JS/CSS hashados
  ├── blog/                      ← imagens do blog
  ├── media/                     ← imagens da media library
  └── data/
      ├── blog-posts.json        ← dados do blog (357KB)
      ├── redirects.json         ← regras de redirect
      ├── seo-settings.json      ← configuracoes SEO
      └── tracking-codes.json    ← codigos de rastreamento
```

**EXCLUIR (via script de build):**
```
dist/data/blog-posts3.json      ← orfao (0 referencias)
dist/data/media-library.json    ← admin-only (0 usos publicos)
```

---

<a name="parte-5"></a>
## PARTE 5 -- AUTOMACAO DA BUILD DE PRODUCAO

Esta e a parte mais critica e que demanda mais discussao. Nenhum dos scripts propostos no plano v1.0 foi implementado ainda.

### 5.1 Arquitetura da Solucao

```
Arquivos a criar:
  scripts/build-production.mjs    ← script principal (Node.js ESM)
  scripts/verify-build.mjs        ← verificacao automatica pos-build
  build-production.bat             ← wrapper Windows (double-click)

Arquivos a modificar:
  package.json                     ← adicionar script "build:production"
  vite.config.ts                   ← adicionar esbuild.drop para producao
  public/.htaccess                 ← atualizar template completo
```

### 5.2 Script Principal: `scripts/build-production.mjs`

**Fluxo detalhado:**

```
ETAPA 1 -- Pre-flight Checks
  ├── Verificar Node.js >= 18
  ├── Verificar node_modules existe (senao, erro com instrucao)
  ├── Verificar public/data/blog-posts.json existe e e JSON valido
  └── Exibir versao do projeto e data

ETAPA 2 -- Limpeza
  └── rm -rf dist/

ETAPA 3 -- Build
  └── npx vite build
      (mode production e DEFAULT, nao precisa de flag)
      (import.meta.env.DEV = false automaticamente)
      (admin tree-shaken automaticamente)

ETAPA 4 -- Post-build Cleanup
  ├── Remover dist/data/blog-posts3.json (se existir)
  ├── Remover dist/data/media-library.json (se existir)
  └── Log do que foi removido

ETAPA 5 -- Gerar version.json
  └── Criar dist/version.json com:
      {
        "version": "1.0.0",
        "buildDate": "2026-04-08T14:30:00Z",
        "gitHash": "abc1234",
        "gitBranch": "master"
      }

ETAPA 6 -- Verificacao Automatica
  └── Executar verify-build.mjs (ver secao 5.3)

ETAPA 7 -- Gerar ZIPs
  ├── deploy/comercial-jr-2026-04-08-1430.zip (build COMPLETA com media/)
  └── deploy/comercial-jr-2026-04-08-1430-code-only.zip (SEM media/)

ETAPA 8 -- Resumo Final
  └── Exibir: tamanhos dos ZIPs, lista de assets, resultado da verificacao
```

**Avaliacao critica sobre ETAPA 3:**
O plano v1.0 propoe setar `VITE_INCLUDE_ADMIN = ''` antes do build. **DESNECESSARIO.** O `vite build` ja define `import.meta.env.DEV = false` e `import.meta.env.PROD = true` automaticamente. Nenhuma variavel de ambiente customizada e necessaria.

**Avaliacao critica sobre ETAPA 7 -- dois ZIPs:**
O ZIP completo (~67MB) e necessario apenas no PRIMEIRO deploy. Deploys subsequentes geralmente mudam apenas JS/CSS/JSON (~2-3MB). O ZIP `code-only` permite updates rapidos sem re-enviar 67MB de imagens. Esta e uma otimizacao PRATICA que o plano v1.0 nao contempla.

**Persistencia e longevidade:**
- Script em `.mjs` (ESM puro) funciona com Node 18+ em qualquer OS
- Usa apenas APIs nativas do Node (fs, path, child_process, readline)
- **ZERO dependencias externas** -- nenhum pacote npm adicional
- Funciona em Windows, Mac, Linux sem alteracao
- O `build-production.bat` e apenas conveniencia para double-click no Windows

### 5.3 Script de Verificacao: `scripts/verify-build.mjs`

**Checks obrigatorios (todos devem passar):**

| # | Check | Motivo |
|---|-------|--------|
| 1 | `dist/index.html` existe e contem `<div id="root">` | Entry point valido |
| 2 | NENHUM chunk em dist/assets/ contem "AdminPage", "AdminMedia", "tiptap", "RichTextEditor" | Admin excluido |
| 3 | NENHUM chunk contem "supabase" (case insensitive) | Sem leak de credenciais |
| 4 | `dist/data/blog-posts.json` existe e e JSON valido | Dados do blog presentes |
| 5 | Sitemaps existem (sitemap-index.xml, page-sitemap.xml, post-sitemap.xml) | SEO funcional |
| 6 | `dist/robots.txt` contem "Disallow: /admin" | SEO seguro |
| 7 | `dist/.htaccess` existe e contem "SPA Fallback" | Routing funcional |
| 8 | `dist/favicon.ico` existe | Branding presente |
| 9 | Total JS < 1000 KB | Bundle nao inflou (margem 38% sobre 725KB atual) |
| 10 | Nenhum chunk individual > 300 KB | Sem mega-bundle |
| 11 | `dist/data/media-library.json` NAO existe | Arquivo admin removido |
| 12 | `dist/data/blog-posts3.json` NAO existe | Arquivo orfao removido |
| 13 | `dist/version.json` existe | Metadata do build presente |
| 14 | `dist/.htaccess` contem "Strict-Transport-Security" | HSTS configurado |
| 15 | `dist/.htaccess` contem "Content-Security-Policy" | CSP configurado |

**Output:** Relatorio de PASS/FAIL para cada check. Se qualquer check critico falhar, o script exibe ERRO e NAO gera os ZIPs.

### 5.4 Wrapper Windows: `build-production.bat`

```batch
@echo off
echo ================================================
echo   COMERCIAL JR - Build de Producao
echo ================================================
echo.
node scripts/build-production.mjs
echo.
if %errorlevel% neq 0 (
    echo [ERRO] Build falhou! Verifique os erros acima.
    pause
    exit /b 1
)
echo [OK] Build de producao concluida com sucesso!
echo Verifique a pasta deploy/ para os arquivos ZIP.
pause
```

### 5.5 package.json -- Script Adicional

Adicionar:
```json
"build:production": "node scripts/build-production.mjs"
```

### 5.6 .env.production -- Minimo Necessario

```env
VITE_SITE_URL=https://comercialjrltda.com.br
```

**NAO incluir:** chaves Supabase, tokens GitHub, ou qualquer segredo.

**Avaliacao critica:** O `.env.production` NAO e estritamente necessario para o build funcionar. A URL do site ja esta hardcoded no `src/data/company.ts` e nos plugins de sitemap. Porem, criar o arquivo e boa pratica para parametrizacao futura sem alterar codigo.

### 5.7 Fluxo de Deploy Completo

```
Desenvolvedor (local):
  1. Faz alteracoes no codigo
  2. Testa com `npm run dev`
  3. Executa `npm run build:production` (ou double-click build-production.bat)
  4. Script gera dist/ + verifica + cria ZIPs em deploy/

cPanel (servidor):
  5. Upload do ZIP via File Manager (ou FTP)
  6. Extrair na public_html
  7. Verificar: homepage, blog, /admin (deve dar 404), HTTPS
  8. Limpar cache Cloudflare se necessario (Development Mode ou Purge Cache)
```

### 5.8 Discussao: Como Tornar a Solucao Persistente no Longo Prazo

**Problemas tipicos de scripts de build que "morrem":**
1. Dependencias externas mudam/quebram
2. Estrutura do projeto muda e o script nao acompanha
3. Desenvolvedor esquece que o script existe

**Mitigacoes implementadas nesta proposta:**

| Problema | Mitigacao |
|----------|----------|
| Dependencias quebram | **ZERO deps externas** -- usa apenas Node.js nativo |
| Estrutura muda | O `verify-build.mjs` falha se algo critico mudar, forcando atualizacao |
| Esquecimento | Script esta no `package.json` como `build:production` + `.bat` na raiz |
| Node.js atualiza | ESM (.mjs) e estavel desde Node 14, improvavel quebrar |
| Vite atualiza | O script chama `npx vite build` -- funciona com qualquer versao do Vite |
| Novo dev entra no projeto | `build-production.bat` e auto-explicativo por double-click |

**A chave da persistencia e a simplicidade.** O script faz EXATAMENTE 8 coisas em sequencia linear. Sem abstracoes, sem plugins, sem framework de build customizado. Qualquer dev com Node.js basico consegue ler, entender e manter.

---

<a name="parte-6"></a>
## PARTE 6 -- VELOCIDADE, CACHE, COMPRESSAO E SEO

### 6.1 Cloudflare Free -- Configuracao Completa

#### DNS
- **Todos registros A/CNAME com proxy ATIVADO** (icone laranja no dashboard)
- NAO usar DNS-only para o dominio principal

#### SSL/TLS
| Configuracao | Valor | Motivo |
|-------------|-------|--------|
| SSL Mode | **Full (Strict)** | Obrigatorio -- "Flexible" causa redirect loop |
| Always Use HTTPS | **ON** | Redireciona HTTP -> HTTPS |
| Automatic HTTPS Rewrites | **ON** | Corrige mixed content |
| Minimum TLS Version | **1.2** | TLS 1.0/1.1 deprecated |
| HSTS | **ON** (max-age 6 meses) | Depois aumentar para 12 meses |

#### Speed > Optimization
| Configuracao | Valor | Motivo |
|-------------|-------|--------|
| Auto Minify (JS, CSS, HTML) | **ON** | Reducao ~5-10% adicional |
| Brotli | **ON** (ja padrao) | Compressao superior ao gzip |
| Early Hints | **ON** | 103 hints para preload de assets |
| **Rocket Loader** | **OFF** | **CRITICO: interfere com SPAs React** |

**AVISO SOBRE ROCKET LOADER:** O Rocket Loader reescreve `<script type="module">` para carregar assincronamente de forma nao-deterministica. Isso pode QUEBRAR a hidratacao do React e causar tela branca ou bugs intermitentes. **MANTER DESATIVADO.**

#### Caching
| Configuracao | Valor | Motivo |
|-------------|-------|--------|
| Browser Cache TTL | **Respect Existing Headers** | Deixa o .htaccess controlar |
| Caching Level | **Standard** | Padrao adequado |

#### Page Rules (3 disponiveis no Free)

| # | URL Pattern | Configuracao | Motivo |
|---|------------|-------------|--------|
| 1 | `comercialjrltda.com.br/assets/*` | Cache Everything, Edge TTL: 1 month | JS/CSS com hash -- cache agressivo |
| 2 | `comercialjrltda.com.br/media/*` | Cache Everything, Edge TTL: 1 month | Imagens com UUID -- cache agressivo |
| 3 | `comercialjrltda.com.br/data/*.json` | Cache Everything, Edge TTL: 5 min | Dados do blog -- cache curto |

**Avaliacao critica sobre Page Rules:** Concordo com a distribuicao do v1.0. Nao ha margem para mais rules no Free. Se futuramente precisar de regras para sitemap XML ou robots.txt, considerar migrar para **Cache Rules** (Cloudflare Transform Rules, gratis e ilimitadas) que substituem Page Rules.

### 6.2 Compressao

**Cloudflare aplica Brotli automaticamente** em todo trafego proxied. Reducao tipica:
- JS: ~75% (725KB -> ~180KB transferido)
- CSS: ~80% (74KB -> ~15KB transferido)
- JSON: ~85% (357KB blog-posts -> ~55KB transferido)
- HTML: ~70% (index.html -> muito pequeno)

**mod_deflate no .htaccess** serve como fallback APENAS se:
- Alguem acessa o IP diretamente (bypass Cloudflare)
- Cloudflare estiver em modo DNS-only temporariamente
- Debug com proxy desativado

**Compressao pre-build (vite-plugin-compression para gerar .br/.gz):** NAO necessaria. Cloudflare comprime on-the-fly na edge. Gerar arquivos .br/.gz localmente dobraria o tamanho do deploy sem beneficio mensuravel.

### 6.3 Estrategia de Cache Detalhada

| Tipo de Arquivo | Cache-Control | Onde Configurar | Motivo |
|----------------|--------------|-----------------|--------|
| `index.html` | `no-cache, no-store, must-revalidate` | .htaccess | Entry point DEVE ser sempre fresco |
| JS/CSS (hash Vite) | `public, max-age=31536000, immutable` | .htaccess + Cloudflare Page Rule | Hash no nome = cache-buster automatico |
| Imagens (WebP, JPG, PNG) | `public, max-age=31536000, immutable` | .htaccess + Cloudflare Page Rule | UUID no path da media library |
| JSON (blog, SEO, redirects) | `public, max-age=60, stale-while-revalidate=300` | .htaccess + Cloudflare Page Rule | Dados podem mudar entre deploys |
| XML (sitemaps) | `public, max-age=3600` | .htaccess | Mudam raramente |
| Favicons | `public, max-age=31536000` | .htaccess | Nunca mudam |

**Como funciona `immutable`:** Diz ao browser que o arquivo NUNCA mudara naquela URL. Como Vite gera nomes como `vendor-react-VkgudWRV.js`, a URL muda automaticamente quando o conteudo muda. Seguro usar `immutable` para tudo com hash.

**Como funciona `stale-while-revalidate`:** O browser serve a copia em cache imediatamente E faz um fetch em background para atualizar. O usuario ve o conteudo antigo por ate 5 minutos, mas o UX e instantaneo. Ideal para `blog-posts.json`.

### 6.4 SEO -- Avaliacao Completa

#### O QUE JA FUNCIONA CORRETAMENTE

| Elemento | Arquivo | Status |
|----------|---------|--------|
| `<title>` dinamico por pagina | `src/components/SEOHead.tsx` | OK |
| `<meta name="description">` por pagina | SEOHead.tsx | OK |
| `<link rel="canonical">` por pagina | SEOHead.tsx | OK |
| Open Graph (og:title, og:description, og:image, og:url) | SEOHead.tsx | OK |
| hreflang (pt-BR + x-default) | SEOHead.tsx | OK |
| Google Search Console verification | `index.html` meta tag | OK |
| robots.txt com Disallow /admin | `public/robots.txt` | OK |
| Sitemap automatico (page + post + index) | `vite-plugin-sitemap.ts` | OK |
| BreadcrumbList JSON-LD | `src/components/SchemaOrg.tsx` | OK |
| Service JSON-LD | SchemaOrg.tsx | OK |
| WebPage JSON-LD | SchemaOrg.tsx | OK |
| Preconnect/dns-prefetch para Google Fonts | `index.html` | OK |
| Hero image preload (LCP) | `index.html` | OK |
| Font loading nao-bloqueante | `index.html` | OK |
| Lazy loading em todas as imagens | `src/components/OptimizedImage.tsx` | OK |

#### LACUNAS IDENTIFICADAS

**1. OG Tags em SPA (PRINCIPAL LACUNA)**

Quando alguem compartilha `comercialjrltda.com.br/blog/nome-do-post` no WhatsApp/Facebook, o crawler NAO executa JavaScript. Ele vera APENAS as meta tags do `index.html` base (titulo generico "Comercial JR LTDA - Maquinas..."), NAO o titulo/descricao especifico que react-helmet injeta client-side.

**Mitigacao disponivel:** Pre-rendering com `vite-plugin-prerender` para gerar HTML estatico por rota em build-time. NAO e bloqueante para o launch, mas e a melhoria de **maior impacto** para SEO social.

**Alternativa via Cloudflare Workers** (plano Free): Um Worker pode interceptar requests de crawlers (User-Agent: facebookexternalhit, WhatsApp, etc.) e servir HTML com meta tags corretas. Custo: R$ 0 (100k requests/dia no Free). Complexidade: media.

> **Recomendacao:** Lancar sem pre-rendering. Adicionar como melhoria pos-launch prioritaria.

**2. Structured Data Faltantes**

| Schema | Status | Impacto |
|--------|--------|---------|
| Organization | **AUSENTE** | Google Knowledge Panel (logo, redes sociais) |
| LocalBusiness | **AUSENTE** | SEO local (horario, telefone, endereco) |
| BlogPosting/Article | **AUSENTE** | Rich snippets nos posts |

**Recomendacao:** Adicionar Organization e LocalBusiness no Layout (aparece em todas as paginas). Adicionar BlogPosting no BlogPost.tsx. Impacto positivo em SEO local e rich results.

**3. Verificacao de Meta Tags por Pagina**

| Pagina | Title | Description | Canonical | OG Image | Schema |
|--------|-------|-------------|-----------|----------|--------|
| / (Home) | OK | OK | OK | OK | BreadcrumbList |
| /segmentos | OK | OK | OK | OK | BreadcrumbList |
| /segmentos/* (8x) | OK | OK | OK | OK | Service + Breadcrumb |
| /blog | OK | OK | OK | OK | BreadcrumbList |
| /:slug (posts) | OK (seo.metaTitle) | OK (seo.metaDescription) | OK | OK (post.image) | Breadcrumb |
| /nossa-historia | OK | OK | OK | OK | Breadcrumb |
| /nossa-missao | OK | OK | OK | OK | Breadcrumb |
| /contato | OK | OK | OK | OK | Breadcrumb |
| /politica-de-privacidade | OK | OK | OK | OK | Breadcrumb |
| /gone (410) | OK | N/A | N/A | N/A | N/A |
| /* (404) | OK | N/A | N/A | N/A | N/A |

**Resultado:** Todas as paginas publicas tem meta tags completas. As lacunas sao em structured data (Organization, LocalBusiness, BlogPosting), nao em meta tags basicas.

### 6.5 Performance -- Core Web Vitals Estimados

| Metrica | Estimativa | Alvo Google | Status |
|---------|-----------|-------------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | < 2.5s | **BOM** (hero preload + Cloudflare CDN) |
| FID (First Input Delay) | < 100ms | < 100ms | **BOM** (SPA, JS carregado em paralelo) |
| CLS (Cumulative Layout Shift) | ~0.05 | < 0.1 | **BOM** (layout estavel, fonts pre-carregadas) |
| INP (Interaction to Next Paint) | < 200ms | < 200ms | **BOM** (lazy loading, chunks pequenos) |

**Otimizacao adicional para LCP:** Verificar tamanho da hero image (`/media/2026/04/ece96451-.../hero.webp`). Se > 200KB, re-comprimir com Sharp quality 75-78. O preload ja esta correto.

### 6.6 Peso Total Estimado para Primeira Visita

| Recurso | Tamanho Original | Com Brotli | Notas |
|---------|-----------------|-----------|-------|
| index.html | ~5 KB | ~2 KB | Entry point |
| vendor-react-*.js | 158 KB | ~45 KB | React core |
| index-*.js | 153 KB | ~42 KB | App + UI |
| vendor-ui-*.js | 145 KB | ~40 KB | Animations |
| index-*.css | 74 KB | ~12 KB | Tailwind |
| Index-*.js (homepage) | 26 KB | ~8 KB | Pagina inicial |
| blog-posts.json | 357 KB | ~55 KB | Dados do blog |
| Fonts (Google Fonts) | ~40 KB | ~35 KB | Montserrat + Open Sans |
| Hero image | ~150 KB | ~150 KB | WebP (ja comprimido) |
| **TOTAL primeira visita** | **~1.1 MB** | **~390 KB** | |

**Visitas subsequentes (com cache):** Apenas `index.html` (~2KB) + check de JSON (~0KB se inalterado). **Quase instantaneo.**

---

<a name="ordem-de-execucao"></a>
## ORDEM DE EXECUCAO

```
FASE 0 -- Limpeza e Preparacao (~30 min)
  [ ] Remover recharts do package.json
  [ ] Remover public/data/blog-posts3.json
  [ ] npm install (atualizar lockfile)
  [ ] Verificar que nada quebrou com npm run dev

FASE 1 -- Atualizar .htaccess Template (~1 hora)
  [ ] Atualizar public/.htaccess com headers completos
      (HSTS, CSP, Cache-Control, mod_deflate, mod_expires, www redirect)
  [ ] Testar: npm run build && npx serve dist
  [ ] Verificar .htaccess gerado em dist/
  [ ] Confirmar que SPA routing funciona (/blog -> index.html)

FASE 2 -- Configurar vite.config.ts (~15 min)
  [ ] Adicionar esbuild.drop: ['console', 'debugger'] para mode production
  [ ] Testar: npm run build (confirmar que console.* sumiu dos chunks)

FASE 3 -- Criar Scripts de Build (~2-3 horas)
  [ ] Criar scripts/build-production.mjs
  [ ] Criar scripts/verify-build.mjs
  [ ] Criar build-production.bat na raiz
  [ ] Adicionar "build:production" ao package.json
  [ ] Opcionalmente criar .env.production minimo

FASE 4 -- Primeiro Build e Teste (~1 hora)
  [ ] npm run build:production
  [ ] Verificar output automatico (todos os checks passaram?)
  [ ] Testar com: npx serve dist
      - Homepage carrega?
      - /segmentos funciona?
      - /blog lista posts?
      - /admin retorna 404?
      - Refresh em /nossa-historia funciona (SPA fallback)?
  [ ] Verificar ZIPs em deploy/
  [ ] Abrir ZIP e confirmar conteudo

FASE 5 -- Configurar Servidor (~1-2 horas)
  [ ] Cloudflare: SSL Full Strict
  [ ] Cloudflare: Always Use HTTPS = ON
  [ ] Cloudflare: HSTS = ON (6 meses)
  [ ] Cloudflare: Brotli = ON
  [ ] Cloudflare: Rocket Loader = OFF
  [ ] Cloudflare: Early Hints = ON
  [ ] Cloudflare: 3 Page Rules (assets, media, data)
  [ ] cPanel: Origin Certificate OU AutoSSL ativo
  [ ] cPanel: Document root = public_html

FASE 6 -- Deploy Inicial (~30 min)
  [ ] Upload ZIP completo via cPanel File Manager
  [ ] Extrair em public_html (File Manager > Extract)
  [ ] Verificar:
      - https://comercialjrltda.com.br (homepage)
      - https://comercialjrltda.com.br/segmentos (routing)
      - https://comercialjrltda.com.br/blog (dados carregam)
      - https://comercialjrltda.com.br/admin (deve dar 404)
      - http://comercialjrltda.com.br (deve redirecionar para HTTPS)
      - www.comercialjrltda.com.br (deve redirecionar para sem www)

FASE 7 -- Pos-Deploy (dias seguintes)
  [ ] Verificar headers: https://securityheaders.com/?q=comercialjrltda.com.br
  [ ] PageSpeed Insights: https://pagespeed.web.dev
  [ ] Schema Validator: https://validator.schema.org
  [ ] Facebook Debugger: https://developers.facebook.com/tools/debug/
  [ ] Google Search Console: submeter sitemaps
  [ ] Adicionar schemas Organization + LocalBusiness (melhoria SEO)
```

---

<a name="riscos"></a>
## AVALIACAO DE RISCOS

| Risco | Severidade | Probabilidade | Mitigacao |
|-------|-----------|---------------|-----------|
| CentOS 7 EOL (vulnerabilidade OS) | ALTA | MEDIA | Cloudflare proxy esconde IP; planejar migracao |
| Redirect loop SSL (Flexible mode) | ALTA | MEDIA | SEMPRE usar Full (Strict); NUNCA Flexible |
| .htaccess ausente ou incorreto | ALTA | BAIXA | Gerado pelo plugin + verificado automaticamente |
| Rocket Loader quebrando React | ALTA | MEDIA | Desativar no Cloudflare dashboard |
| OG tags genericos ao compartilhar links | MEDIA | ALTA | Pre-rendering como melhoria futura |
| blog-posts.json invalido no deploy | MEDIA | BAIXA | Verificado pelo verify-build.mjs |
| Force push conflitando com GitHub Actions | MEDIA | MEDIA | Configurar Actions apenas no comercial-jr-2 |
| media-library.json incluido desnecessariamente | BAIXA | ALTA | Removido automaticamente pelo build script |
| blog-posts3.json orfao no deploy | BAIXA | ALTA | Removido na Fase 0 (permanente) |
| Hero image muito pesada | BAIXA | MEDIA | Verificar tamanho; re-comprimir se > 200KB |

---

<a name="checklist"></a>
## CHECKLIST FINAL PRE-DEPLOY

```
SEGURANCA:
  [ ] .htaccess tem HSTS header?
  [ ] .htaccess tem CSP header?
  [ ] .htaccess bloqueia /admin com 404?
  [ ] Nenhum chunk contem codigo admin?
  [ ] Nenhum chunk contem "supabase"?
  [ ] console.* removidos do build?
  [ ] Nenhum segredo em .env.production?

PERFORMANCE:
  [ ] Total JS < 1000KB (antes de compressao)?
  [ ] Cache-Control correto para assets hashados?
  [ ] Cloudflare Brotli ativado?
  [ ] Rocket Loader desativado?
  [ ] Hero image < 200KB?
  [ ] Fonts carregando de forma nao-bloqueante?

SEO:
  [ ] robots.txt com Disallow: /admin e Sitemap URL?
  [ ] sitemap-index.xml referencia page + post sitemaps?
  [ ] Todas as paginas tem <title> e <meta description>?
  [ ] Canonical URLs corretas (com trailing slash)?
  [ ] Open Graph tags completas?
  [ ] Google Search Console verification?
  [ ] Schema BreadcrumbList em todas as paginas?

FUNCIONALIDADE:
  [ ] SPA routing funciona (refresh em qualquer pagina)?
  [ ] Blog posts carregam e exibem corretamente?
  [ ] Imagens carregam (blog, media, favicons)?
  [ ] Links internos funcionam sem reload?
  [ ] 404 page exibe para rotas invalidas?
  [ ] Redirect rules funcionam (se houver)?
  [ ] Cookie banner aparece na primeira visita?
  [ ] WhatsApp button funciona?
```

---

## ARQUIVOS CRITICOS PARA IMPLEMENTACAO

| Arquivo | Acao | Prioridade |
|---------|------|-----------|
| `public/.htaccess` | ATUALIZAR com headers completos | ALTA |
| `package.json` | ADICIONAR build:production; REMOVER recharts | ALTA |
| `vite.config.ts` | ADICIONAR esbuild.drop para producao | MEDIA |
| `scripts/build-production.mjs` | CRIAR script de build | ALTA |
| `scripts/verify-build.mjs` | CRIAR script de verificacao | ALTA |
| `build-production.bat` | CRIAR wrapper Windows | MEDIA |
| `public/data/blog-posts3.json` | REMOVER (arquivo orfao) | BAIXA |
| `.env.production` | CRIAR (opcional, minimo) | BAIXA |

---

## MELHORIAS FUTURAS (POS-LAUNCH)

| Melhoria | Impacto | Complexidade | Quando |
|----------|---------|-------------|--------|
| Pre-rendering para OG tags | ALTO (SEO social) | MEDIA | Pos-launch prioridade 1 |
| Organization + LocalBusiness schemas | ALTO (SEO local) | BAIXA | Pos-launch prioridade 2 |
| BlogPosting schema nos posts | MEDIO (rich snippets) | BAIXA | Pos-launch prioridade 3 |
| GitHub Actions deploy automatico | MEDIO (DX) | MEDIA | Apos 3 deploys manuais |
| Cloudflare Pages como hosting | ALTO (elimina risco CentOS) | MEDIA | Quando CentOS der problemas |
| Service Worker (offline) | BAIXO (PWA) | ALTA | Opcional, longo prazo |
| Migracao CentOS -> AlmaLinux | CRITICO (seguranca) | ALTA | Quando cPanel forcar |

---

*Documento gerado em 08/04/2026 por Claude, com revisao critica do PLANO-BUILD-PRODUCAO.md v1.0.*
*Todos os dados de tamanho, chunks e configuracoes verificados contra o estado real do codigo.*
