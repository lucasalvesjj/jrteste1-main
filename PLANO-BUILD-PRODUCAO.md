# PLANO COMPLETO DE BUILD DE PRODUÇÃO
## Comercial JR LTDA — comercialjrltda.com.br
**Data:** 03/04/2026 | **Versão:** 1.0

---

# SUMÁRIO

1. [PARTE 1 — Preparação do Ambiente VPS/cPanel](#parte-1)
2. [PARTE 2 — GitHub vs Build Local](#parte-2)
3. [PARTE 3 — Resolução de Vulnerabilidades](#parte-3)
4. [PARTE 4 — Pré-otimizações e Seleção de Arquivos](#parte-4)
5. [PARTE 5 — Automação da Build de Produção](#parte-5)
6. [PARTE 6 — Otimização de Velocidade, Cache, Compressão e SEO](#parte-6)
7. [ORDEM DE EXECUÇÃO E DEPENDÊNCIAS](#ordem-execucao)
8. [AVALIAÇÃO DE RISCOS](#riscos)
9. [CHECKLIST FINAL DE DEPLOY](#checklist)

---

<a name="parte-1"></a>
# PARTE 1 — PREPARAÇÃO DO AMBIENTE VPS/cPanel

## 1.1 Alerta Crítico: CentOS 7.9 está EOL

O CentOS 7.9 atingiu End of Life em **30 de Junho de 2024**. Isso significa:

- **Sem patches de segurança** — kernel, OpenSSL, glibc congelados e cada vez mais vulneráveis
- **cPanel 110 é provavelmente a última versão** que suporta CentOS 7 — cPanel está migrando para AlmaLinux/Rocky Linux
- **Risco real:** vulnerabilidades descobertas após Junho/2024 não serão corrigidas

### Mitigação Imediata
- **Cloudflare proxy (orange cloud) em TODOS os registros DNS** — esconde o IP real do servidor
- **Cloudflare SSL mode = "Full (Strict)"** — criptografa tráfego entre Cloudflare e servidor
- Manter pacotes atualizados via `yum update --security` (mesmo com suporte encerrado, repos do cPanel podem ter fixes)

### Recomendação de Longo Prazo
Planejar migração para **AlmaLinux 8 ou Rocky Linux 9** em 3-6 meses. Muitos provedores de VPS oferecem migração assistida.

**Avaliação crítica:** Continuar no CentOS 7.9 é aceitável no curto prazo (1-3 meses) SOMENTE porque o Cloudflare esconde o servidor. Se o IP do servidor vazar ou for descoberto, o risco aumenta significativamente. Para um site estático sem dados sensíveis de usuários no servidor, o risco é tolerável temporariamente.

---

## 1.2 Document Root — Onde Colocar os Arquivos

No cPanel, o document root do domínio principal é:
```
/home/<usuario_cpanel>/public_html/
```

**Passos:**
1. Acessar cPanel → "Domínios" → confirmar que `comercialjrltda.com.br` aponta para `public_html/`
2. Remover arquivos padrão do cPanel (index.html placeholder, .htaccess padrão)
3. Manter pasta `cgi-bin/` (não interfere)
4. **Todo conteúdo de `dist/` vai para `public_html/`** — NÃO criar subpasta

**O que NÃO fazer:**
- NÃO colocar em `public_html/dist/` — isso quebraria todas as rotas
- NÃO colocar `node_modules/`, `src/`, `package.json` no servidor — apenas o output do build

---

## 1.3 .htaccess — O Arquivo Mais Crítico do Deploy

Sem este arquivo, **todas as URLs diretas retornarão 404** porque o Apache procurará arquivos físicos que não existem (o site é SPA — tudo é roteado pelo `index.html`).

```apache
# ══════════════════════════════════════════════════════════════
# .htaccess — Comercial JR LTDA
# SPA Routing + Security Headers + Compression + Caching
# ══════════════════════════════════════════════════════════════

# ── Bloquear /admin ANTES de qualquer outra regra ─────────────
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^admin(/.*)?$ - [R=404,L]
</IfModule>

# ── HTTPS e www → non-www (redundância com Cloudflare) ────────
<IfModule mod_rewrite.c>
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
  RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
</IfModule>

# ── SPA Fallback: serve index.html para rotas React ──────────
<IfModule mod_rewrite.c>
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /index.html [L]
</IfModule>

# ── Headers de Segurança ─────────────────────────────────────
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
</IfModule>

# ── Compressão GZIP ──────────────────────────────────────────
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/json
  AddOutputFilterByType DEFLATE image/svg+xml application/xml text/xml
</IfModule>

# ── Cache do Navegador ───────────────────────────────────────
<IfModule mod_expires.c>
  ExpiresActive On

  # Assets com hash (JS/CSS do Vite) — imutáveis
  <FilesMatch "\.(js|css)$">
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Imagens
  <FilesMatch "\.(webp|jpg|jpeg|png|gif|ico|svg|avif)$">
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Fonts
  <FilesMatch "\.(woff|woff2|ttf|eot)$">
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # JSON (blog-posts.json, media-library.json)
  <FilesMatch "\.json$">
    ExpiresDefault "access plus 1 minute"
    Header set Cache-Control "public, max-age=60, stale-while-revalidate=300"
  </FilesMatch>

  # HTML — NUNCA cachear (entry point do SPA deve ser sempre fresh)
  <FilesMatch "\.html$">
    ExpiresDefault "access plus 0 seconds"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
  </FilesMatch>

  # Sitemaps XML
  <FilesMatch "\.xml$">
    ExpiresDefault "access plus 1 hour"
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
</IfModule>
```

### Por que cada seção é necessária:

| Seção | O que acontece SEM ela |
|-------|------------------------|
| Block /admin | Mesmo com admin removido do build, URL retornaria index.html em vez de 404 |
| HTTPS redirect | Visitantes via HTTP veriam site sem criptografia |
| SPA Fallback | Qualquer URL exceto `/` retorna 404 no refresh |
| Security Headers | Vulnerável a clickjacking, MIME sniffing, XSS |
| Compressão | Arquivos transferidos sem compressão (3-5x maior) |
| Cache | Navegador re-baixa todos os assets a cada visita |

---

## 1.4 Node.js no Servidor — NÃO necessário

O cPanel 110 tem "Setup Node.js App", mas:
- É para aplicações Node.js SERVER (Express, etc.), não para sites estáticos
- CentOS 7 tem glibc 2.17 — incompatível com muitos pacotes npm modernos
- **O build DEVE ser feito localmente** e apenas o output (`dist/`) vai para o servidor

**Decisão:** O servidor serve APENAS arquivos estáticos. Não instalar Node.js no VPS.

---

## 1.5 SSL/TLS com Cloudflare

**Arquitetura:** Visitante → Cloudflare (TLS + CDN) → Servidor (cPanel)

### Configuração Cloudflare:
1. DNS: Todos os registros A/CNAME com proxy **ativado** (ícone laranja)
2. SSL/TLS → Overview → Modo: **"Full (Strict)"**
3. SSL/TLS → Edge Certificates → "Always Use HTTPS": **ON**
4. SSL/TLS → Edge Certificates → "Automatic HTTPS Rewrites": **ON**
5. SSL/TLS → Edge Certificates → HSTS: **Ativado** (max-age 12 meses, includeSubDomains)

### Configuração cPanel:
1. cPanel → "SSL/TLS Status" → Executar AutoSSL (certificado gratuito do cPanel)
2. **OU** instalar Cloudflare Origin Certificate (validade 15 anos):
   - Cloudflare → SSL/TLS → Origin Server → Create Certificate
   - Copiar cert + private key
   - cPanel → SSL/TLS → Install → colar e instalar

**PERIGO:** Se o Cloudflare estiver em modo "Flexible" em vez de "Full (Strict)", haverá **loop de redirect infinito**. Sempre usar "Full (Strict)".

**Avaliação crítica:** A opção de Cloudflare Origin Certificate (15 anos) é mais persistente e evita problemas de renovação do AutoSSL. Recomendo esta opção.

---

## 1.6 Permissões de Arquivo

Padrões do cPanel para site estático:
- **Diretórios:** `755` (drwxr-xr-x)
- **Arquivos:** `644` (rw-r--r--)
- **.htaccess:** `644`

Estes são os defaults ao fazer upload via cPanel File Manager ou FTP. Não é necessário alterar permissões.

---

## 1.7 Método de Deploy (Transferência de Arquivos)

### Opção A: cPanel File Manager (Recomendado para início)
1. Upload do ZIP para `public_html/`
2. Clicar "Extrair" no File Manager
3. Deletar o ZIP após extração

### Opção B: FTP via FileZilla
1. Conectar via FTPS (TLS explícito) ao servidor
2. Upload do conteúdo de `dist/` para `public_html/`
3. **Vantagem:** Upload delta (apenas arquivos alterados)

### Opção C: SSH + rsync (se disponível)
```bash
rsync -avz --delete dist/ usuario@servidor:public_html/
```
**Melhor opção** para deploys repetidos — envia apenas diferenças.

**Avaliação crítica:** Para o primeiro deploy, cPanel File Manager é mais simples. Para deploys frequentes, FTP com FileZilla ou SSH são superiores. A automação via GitHub Actions (Parte 2) elimina a necessidade de fazer isso manualmente.

---

## 1.8 PHP — Não Necessário

PHP vem habilitado por padrão no cPanel. Para site estático:
- PHP **não precisa ser desabilitado** — o .htaccess trata as rotas antes do PHP
- **NÃO colocar** arquivos `.php` em `public_html/` — seriam executados
- Se o cPanel criar um `php.ini` ou `error_log`, pode ignorar

---

<a name="parte-2"></a>
# PARTE 2 — GitHub vs Build Local

## 2.1 Opção A: Build Local + Upload ZIP Manual

**Como funciona:** `npm run build:production` na máquina do dev → ZIP → upload via cPanel

| Prós | Contras |
|------|---------|
| Zero infraestrutura adicional | Processo manual a cada deploy |
| Controle total do ambiente | Risco de esquecer etapas |
| Sem secrets em serviços externos | Sem audit trail do que foi deployado |
| Funciona imediatamente | Single point of failure (máquina do dev) |

**Melhor para:** Primeiros deploys, site com atualizações pouco frequentes.

---

## 2.2 Opção B: GitHub Actions + FTP Deploy Automatizado

**Como funciona:** Push no GitHub → Actions builda → FTP envia para servidor

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:  # deploy manual também

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:production
      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: /public_html/
          dangerous-clean-slate: false
```

| Prós | Contras |
|------|---------|
| Totalmente automatizado | Requer FTP credentials como GitHub Secrets |
| Builds reproduzíveis (ambiente limpo) | FTP é lento e sem delta sync confiável |
| Histórico de deploys no GitHub Actions | 2000 min/mês no plano gratuito (suficiente) |
| Pode incluir verificações (Lighthouse, etc.) | Mais complexo para debugar quando falha |

**Melhor para:** Manutenção contínua, múltiplos deploys por semana.

---

## 2.3 Opção C: Build no Servidor via SSH

**Como funciona:** SSH no servidor → git pull → npm install → npm run build

| Prós | Contras |
|------|---------|
| Sem upload de arquivos grandes | CentOS 7 glibc 2.17 ← INCOMPATÍVEL com muitos pacotes |
| Sempre builda do source mais recente | Node.js limitado a v16 no CentOS 7 |
| | Consome CPU/RAM do servidor |
| | npm install = risco de segurança no servidor |

**VEREDITO: NÃO RECOMENDADO.** Fortemente contraindicado devido a incompatibilidades do CentOS 7.

---

## 2.4 Opção D: cPanel Git Version Control

O cPanel tem "Git Version Control" que puxa de um repositório GitHub e executa post-deploy hook.

**Problema:** O hook roda no ambiente CentOS 7 — mesmas limitações de Node.js da Opção C.

**Uso viável apenas se:** O repositório de produção contiver os arquivos já buildados (commitar `dist/` no repo de produção). Isso é possível mas polui o histórico git.

**VEREDITO:** Viável apenas como mecanismo de pull de arquivos estáticos pré-buildados. Não é a abordagem recomendada.

---

## 2.5 RECOMENDAÇÃO: Abordagem em Fases

### Fase 1 (Imediata) — Build Local + Upload Manual
- Usar o script automatizado da Parte 5
- Upload do ZIP via cPanel File Manager
- **Por quê:** Coloca o site no ar com zero dependência externa

### Fase 2 (1-2 semanas após launch) — GitHub Actions + FTP
- Configurar workflow no repositório de produção `lucasalvesjj/comercial-jr-2`
- Armazenar FTP credentials como GitHub Secrets
- Push = deploy automático
- **Por quê:** Automatiza o ciclo de deploy

### Fase 3 (Quando migrar o servidor) — SSH + rsync
- Migrar para AlmaLinux 8/9
- Habilitar SSH no VPS
- rsync para deploys atômicos (envia apenas diferenças)
- **Por quê:** Deploy mais rápido e confiável possível

**Avaliação crítica:** A Fase 1 é suficiente para um site que atualiza poucas vezes por mês. A Fase 2 vale o investimento se o blog for atualizado frequentemente. A Fase 3 é o gold standard mas depende da migração do servidor.

**Sugestão adicional:** Considere usar **Cloudflare Pages** como alternativa ao cPanel para hospedagem. O plano gratuito do Cloudflare Pages suporta sites estáticos ilimitados com deploy via GitHub, CDN global, HTTPS automático, e elimina a necessidade do VPS para o site público. O VPS ficaria apenas para email e outros serviços. Isso é significativamente mais simples e performante. O custo seria R$0 para o site.

---

<a name="parte-3"></a>
# PARTE 3 — RESOLUÇÃO DE VULNERABILIDADES

## 3.1 CRÍTICO: Painel Admin Sem Autenticação

### Estado Atual
As rotas `/admin` e `/admin/media` estão definidas em `App.tsx` (linhas 70-71) e fazem lazy-load de `Admin.tsx` (1281 linhas) e `AdminMedia.tsx`. **Zero autenticação** — qualquer pessoa que navegar para `/admin` tem acesso total ao CMS.

### Resolução (Abordagem Dupla)

**A) Remover admin do build de produção (Parte 4)**
- As rotas, páginas, componentes e todas as dependências do TipTap são excluídas do bundle
- **Esta é a defesa primária**

**B) Bloqueio no servidor (.htaccess)**
- Mesmo com admin removido do build, o .htaccess bloqueia `/admin` retornando 404
- **Defense-in-depth** — camada extra de proteção

**C) Admin roda APENAS no `npm run dev` local**
- O admin usa localStorage para estado
- O `vite-plugin-media-upload` só funciona em modo dev
- Este é o fluxo natural de trabalho

### Impacto
- Nenhum impacto no site público
- Admin continua funcionando normalmente no ambiente de desenvolvimento local

### Risco Residual
Nenhum — se o admin não está no bundle e o .htaccess bloqueia a rota, não há vetor de ataque.

---

## 3.2 CRÍTICO: Supabase Anon Key Hardcoded

### Estado Atual
Arquivo `src/lib/supabaseConfig.ts` (linha 15): JWT token hardcoded como fallback.

```typescript
// PROBLEMA: Token visível no bundle de produção
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIs...";  // ← EXPOSTO
```

### O Risco Real
A anon key é "pública por design" no Supabase. PORÉM, as políticas RLS (de `supabase-setup.sql`) permitem a **qualquer pessoa** com esta key:
- **Fazer upload** de arquivos no bucket "media" (sem autenticação)
- **Deletar QUALQUER** arquivo do bucket "media" (sem autenticação)
- **Atualizar** qualquer arquivo (sem autenticação)

Um atacante que encontrar a key no source code pode fazer upload de conteúdo malicioso ou deletar toda a mídia.

### Resolução

**Para produção:**
1. Remover o fallback hardcoded de `supabaseConfig.ts`
2. No build de produção, NÃO definir `VITE_SUPABASE_URL` nem `VITE_SUPABASE_ANON_KEY`
3. Sem as env vars, o módulo exporta `undefined` → tree-shaken pelo Vite (se nenhum código público o importa)
4. Resultado: **zero código Supabase no bundle de produção**

**Para desenvolvimento:**
1. Mover a key para `.env.local` (já gitignored): `VITE_SUPABASE_ANON_KEY=eyJ...`
2. Remover o fallback hardcoded

**Para o Supabase em si:**
1. Corrigir políticas RLS para exigir autenticação em INSERT/DELETE/UPDATE
2. Manter SELECT público (imagens precisam ser publicamente legíveis)
3. **Rotacionar a key atual** no dashboard do Supabase — ela já foi exposta no histórico git

### Impacto
- Site público: nenhum impacto (não usa Supabase)
- Ambiente dev: funciona via `.env.local`
- Necessário corrigir RLS no dashboard do Supabase

---

## 3.3 ALTO: GitHub PAT em localStorage

### Estado Atual
`src/lib/githubPublish.ts` armazena um GitHub Personal Access Token em localStorage sob a chave `comercial-jr-github-publish-config`. Token tem permissão `contents:write` no repositório de produção.

### Risco
Qualquer vulnerabilidade XSS ou extensão maliciosa no navegador pode ler localStorage e exfiltrar o token, podendo então alterar código no repo de produção.

### Resolução
**Para produção:** `githubPublish.ts` é excluído automaticamente do build (importado apenas por Admin.tsx → tree-shaken quando admin é excluído).

**Para desenvolvimento:**
- Usar PAT de granularidade fina (Fine-grained PAT) com escopo apenas para `lucasalvesjj/comercial-jr-2` + permissão `contents:write`
- Definir expiração curta (90 dias) e rotacionar
- Considerar adicionar lembrete no admin para rotacionar o token

### Impacto
Nenhum impacto em produção — código não existe no bundle.

---

## 3.4 ALTO: Sem Content Security Policy (CSP)

### Estado Atual
Nenhum header CSP definido. O arquivo `public/_headers` usa formato Netlify/Cloudflare Pages que o cPanel ignora.

### Resolução
1. CSP definido no `.htaccess` (seção 1.3 acima)
2. CSP adicional via Cloudflare Transform Rules (dashboard → Rules → Transform Rules → HTTP Response Header Modification)

### CSP Necessária
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

**Notas:**
- `'unsafe-inline'` em styles é necessário (Tailwind e react-helmet injetam inline styles)
- `'unsafe-inline'` em scripts é necessário para tracking codes injetados via `dangerouslySetInnerHTML`
- Ajustar domínios conforme os tracking codes configurados

**Avaliação crítica:** O `'unsafe-inline'` em scripts enfraquece significativamente o CSP. Se for possível hardcodar os tracking codes ao invés de usar `dangerouslySetInnerHTML`, podemos usar nonces ou hashes para eliminar `unsafe-inline`. Isso é um trade-off entre flexibilidade (admin configura tracking) e segurança.

---

## 3.5 ALTO: TrackingScripts.tsx — Vetor XSS

### Estado Atual
`src/components/TrackingScripts.tsx` (linhas 110-126): Lê códigos de tracking do localStorage e injeta via `dangerouslySetInnerHTML`. Se um atacante conseguir escrever no localStorage (via XSS, extensão, computador compartilhado), pode injetar JavaScript arbitrário.

**Além disso:** A linha 15 importa de `./admin/AdminSeoEditor`, criando uma dependência direta do site público → código admin. Isso puxa o TipTap e todo o admin para o bundle.

### Resolução

**A) Quebrar dependência com admin (OBRIGATÓRIO):**
Criar `src/lib/trackingTypes.ts` com os tipos e funções extraídos de `AdminSeoEditor.tsx` (linhas 7-35):
- `TrackingPosition` type
- `TrackingScope` type
- `TrackingCode` interface
- `TRACKING_STORAGE_KEY` constante
- `getTrackingCodes()` função
- `saveTrackingCodes()` função

Atualizar ambos `TrackingScripts.tsx` e `AdminSeoEditor.tsx` para importar do novo módulo.

**B) Para produção com tracking configurável (manter flexibilidade):**
Manter `TrackingScripts.tsx` como está (após A), mas aceitar o risco de `unsafe-inline` no CSP.

**C) Para máxima segurança (alternativa):**
Criar `ProductionTrackingScripts.tsx` que hardcoda os scripts de tracking aprovados (GA, Meta Pixel) como JSX estático. Sem `dangerouslySetInnerHTML`, sem leitura de localStorage. Permite eliminar `unsafe-inline` do CSP.

### Impacto
- Opção B: Nenhum impacto funcional, tracking continua configurável via admin local
- Opção C: Tracking codes fixos — para alterar, precisa rebuildar

**Minha recomendação:** Opção B para o launch, migrar para Opção C quando os tracking codes estiverem estabilizados.

---

## 3.6 MÉDIO: Políticas RLS do Supabase Permissivas

### Estado Atual (de `supabase-setup.sql`)
Todas as operações no bucket "media" são totalmente públicas:
```sql
-- QUALQUER UM pode fazer upload, deletar, atualizar
USING (bucket_id = 'media')  -- sem verificação de autenticação
```

### Resolução
1. No dashboard do Supabase → Storage → Policies:
   - **SELECT (leitura):** Manter público → `USING (bucket_id = 'media')`
   - **INSERT/DELETE/UPDATE:** Restringir a autenticados:
     ```sql
     USING (bucket_id = 'media' AND auth.role() = 'authenticated')
     ```
2. Criar uma conta de usuário no Supabase para o admin
3. Adicionar `supabase.auth.signInWithPassword()` antes de operações de upload no admin

### Impacto
- Site público: nenhum (não usa Supabase em produção)
- Admin dev: precisa fazer login antes de upload/delete de mídia

---

## 3.7 BAIXO: Rate Limiting e CORS

**Rate limiting:** O plano Free do Cloudflare inclui proteção DDoS básica. Para proteção adicional:
- Cloudflare → Security → WAF → Rate Limiting Rules
- Gratuito: 1 regra de rate limiting

**CORS:** Não necessário para o site estático atual. Blog data é fetch do mesmo domínio (`/data/blog-posts.json`). Se Supabase for removido da produção, CORS não é concern.

---

## 3.8 BAIXO: _headers File Ineficaz

O arquivo `public/_headers` usa formato Netlify/Cloudflare Pages. cPanel ignora esse arquivo.

**Resolução:** Remover `_headers` do build de produção. Todos os headers são tratados pelo `.htaccess`.

---

## Resumo de Vulnerabilidades

| # | Vulnerabilidade | Severidade | Resolução | Status após fix |
|---|----------------|-----------|-----------|----------------|
| 3.1 | Admin sem autenticação | CRÍTICO | Remover do build + .htaccess block | Eliminado |
| 3.2 | Supabase key hardcoded | CRÍTICO | Remover fallback + excluir de produção | Eliminado |
| 3.3 | GitHub PAT em localStorage | ALTO | Tree-shaken com admin | Eliminado |
| 3.4 | Sem CSP headers | ALTO | .htaccess + Cloudflare | Mitigado |
| 3.5 | TrackingScripts XSS | ALTO | Extrair tipos + CSP | Mitigado |
| 3.6 | RLS permissiva | MÉDIO | Corrigir policies no Supabase | Corrigido |
| 3.7 | Sem rate limiting | BAIXO | Cloudflare DDoS + WAF | Mitigado |
| 3.8 | _headers ineficaz | BAIXO | Deletar, usar .htaccess | Eliminado |

---

<a name="parte-4"></a>
# PARTE 4 — PRÉ-OTIMIZAÇÕES E SELEÇÃO DE ARQUIVOS

## 4.1 Impacto do Admin no Bundle Atual

Análise do build atual em `dist/assets/`:

| Chunk | Tamanho | Tipo |
|-------|---------|------|
| `RichTextEditor-DYSLCq0o.js` | **426 KB** | TipTap + extensões (admin) |
| `Admin-DR8x4kgq.js` | 53 KB | Página admin (admin) |
| `MediaLibrary-D1C9ak8U.js` | 42 KB | Biblioteca de mídia (admin) |
| `AdminPostEditor-CAfJ3PEt.js` | 25 KB | Editor de posts (admin) |
| `AdminMedia-C7c57ly1.js` | 17 KB | Página de mídia (admin) |
| `MediaUsageSection-BdaJvimX.js` | 5 KB | Uso de mídia (admin) |
| `MediaField-Dx7xxY1Z.js` | 5 KB | Campo de mídia (admin) |
| `mediaApi-DZqqDgTW.js` | 3.6 KB | API de mídia (admin) |
| `mediaStore-D4LJ_-rN.js` | 3 KB | Store de mídia (admin) |
| `ManualAdapterBanner-B8nW6EmX.js` | 2 KB | Banner adapter (admin) |
| `upload-DoSZDKVN.js` | 2.9 KB | Upload logic (admin) |
| `useMediaLibrary-kNqprjl3.js` | 1 KB | Hook mídia (admin) |
| `mediaTypes-oob4I_vY.js` | 1 KB | Tipos mídia (admin) |
| **TOTAL ADMIN** | **~586 KB** | |

**O bundle principal** `index-DWNMpLfp.js` é 453 KB (contém React, React Router, Framer Motion, Radix UI, etc.).
**O CSS** `index-PsX1uoRv.css` é 74 KB.

**Economia esperada ao remover admin:** ~586 KB de chunks + redução do CSS (classes admin-only).

---

## 4.2 Estratégia: Exclusão via Flag de Ambiente

Usar `import.meta.env.VITE_INCLUDE_ADMIN` para condicionar a inclusão do admin no build.

### Mecanismo
Em `App.tsx`, os lazy imports e rotas do admin são condicionados a esta env var. Em produção, sem a var definida, o Vite:
1. Avalia o import condicional como `false`
2. Remove o import morto (dead code elimination)
3. Tree-shaking remove toda a cadeia de dependências

**Por que esta abordagem e não duas configs separadas?**
- Uma única codebase = menos manutenção
- A flag é lida em build time (não runtime) — zero overhead
- Vite/Rollup tree-shaking é maduro e confiável para este padrão
- Fácil de testar: `VITE_INCLUDE_ADMIN=true npm run dev` vs `npm run build:production`

---

## 4.3 Arquivos a Modificar

### A) `src/App.tsx` — Entrada de todas as rotas

**Alteração nos imports (linhas 27-28):**
```typescript
// ANTES:
const AdminPage = lazy(() => import("./pages/Admin"));
const AdminMediaPage = lazy(() => import("./pages/AdminMedia"));

// DEPOIS:
const AdminPage = import.meta.env.VITE_INCLUDE_ADMIN
  ? lazy(() => import("./pages/Admin"))
  : lazy(() => import("./pages/NotFound"));
const AdminMediaPage = import.meta.env.VITE_INCLUDE_ADMIN
  ? lazy(() => import("./pages/AdminMedia"))
  : lazy(() => import("./pages/NotFound"));
```

**Alteração nas rotas (linhas 70-71):**
As rotas do admin redirecionam para NotFound quando a flag não está presente.

### B) `src/components/TrackingScripts.tsx` — Quebrar dependência admin

**Alteração (linhas 15-16):**
```typescript
// ANTES:
import { getTrackingCodes } from "./admin/AdminSeoEditor";
import type { TrackingCode } from "./admin/AdminSeoEditor";

// DEPOIS:
import { getTrackingCodes } from "@/lib/trackingTypes";
import type { TrackingCode } from "@/lib/trackingTypes";
```

### C) Criar `src/lib/trackingTypes.ts`

Novo arquivo com os tipos e funções extraídos de `AdminSeoEditor.tsx` (linhas 7-35):
```typescript
export type TrackingPosition = "head" | "body_start" | "body_end";
export type TrackingScope = "global" | "specific";

export interface TrackingCode {
  id: string;
  name: string;
  code: string;
  position: TrackingPosition;
  scope: TrackingScope;
  includedPaths: string[];
  excludedPaths: string[];
  enabled: boolean;
  order: number;
}

export const TRACKING_STORAGE_KEY = "comercial-jr-tracking-codes";

export function getTrackingCodes(): TrackingCode[] {
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveTrackingCodes(codes: TrackingCode[]): void {
  localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(codes));
}
```

### D) `src/components/admin/AdminSeoEditor.tsx` — Re-exportar do novo módulo

```typescript
// ANTES: definições locais (linhas 7-35)
// DEPOIS: re-exportar do módulo compartilhado
export { getTrackingCodes, saveTrackingCodes, TRACKING_STORAGE_KEY } from "@/lib/trackingTypes";
export type { TrackingCode, TrackingPosition, TrackingScope } from "@/lib/trackingTypes";
```

### E) `src/lib/supabaseConfig.ts` — Remover key hardcoded

```typescript
// ANTES (linha 12-15):
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string) ||
  "eyJhbGci...";

// DEPOIS:
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string) ||
  "";
```

### F) `src/index.css` — Font loading e admin-dark

1. **Remover linha 1:** `@import url('https://fonts.googleapis.com/css2?...')`
2. **Mover linhas 103-132** (bloco `.admin-dark`) para `src/admin-dark.css`
3. Importar `admin-dark.css` apenas em `Admin.tsx`

### G) `index.html` — Preloads

Adicionar antes do `</head>`:
```html
<!-- Font loading não-bloqueante -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap" /></noscript>

<!-- Preload hero image (LCP) -->
<link rel="preload" as="image" type="image/webp" href="/hero-bg.webp" fetchpriority="high" />
```

---

## 4.4 Dependências Automaticamente Excluídas por Tree-Shaking

Quando o admin é excluído, estas dependências viram dead code e são removidas automaticamente:

| Pacote | Tamanho ~aprox | Razão da exclusão |
|--------|---------------|-------------------|
| `@tiptap/react` + core + 13 extensões | ~400 KB | Importados apenas por RichTextEditor |
| `@tiptap/starter-kit` (prosemirror-*) | ~150 KB | Dep do TipTap |
| `react-resizable-panels` | ~15 KB | Não importado em nenhum lugar de `src/` |
| `supabase-js` | ~30 KB | Importado apenas via adapters (admin-only) |

**Total de código eliminado: ~600+ KB** — mais da metade do bundle atual.

---

## 4.5 blogPosts.ts — Fallback de 345 KB

`src/data/blogPosts.ts` é um arquivo de 345 KB com todos os posts hardcoded. É usado como fallback em `blogStore.ts` (via `getFallbackPosts()` em `blogContent.ts` linha 155-168) quando o fetch de `/data/blog-posts.json` falha.

**Problema:** Mesmo com dynamic import, o Vite gera um chunk para este arquivo.

**Resolução recomendada:** Não é prioritário. O dynamic import garante que só é carregado sob falha. Em produção, `blog-posts.json` estará sempre disponível. O chunk será gerado mas nunca carregado pelos visitantes.

**Resolução alternativa (otimização futura):** Para eliminar completamente, modificar `getFallbackPosts()` para retornar `[]` quando `import.meta.env.PROD` é true.

**Avaliação crítica:** O impacto real é zero para os visitantes (chunk nunca carregado). Recomendo não alterar agora para não arriscar quebrar o fallback durante o development. Revisitar após o launch.

---

## 4.6 Plugins Dev-Only — Já Corretos

Em `vite.config.ts`:
```typescript
mode === "development" && componentTagger(),   // ✅ Já excluído em produção
mode === "development" && mediaUploadPlugin(),  // ✅ Já excluído em produção
```

**Nenhuma ação necessária.**

---

<a name="parte-5"></a>
# PARTE 5 — AUTOMAÇÃO DA BUILD DE PRODUÇÃO

## 5.1 Arquitetura do Sistema de Build

```
npm run build:production
        │
        ▼
scripts/build-production.mjs
        │
        ├── 1. Pre-flight checks
        ├── 2. Limpa dist/
        ├── 3. Seta env vars (VITE_EXCLUDE_ADMIN)
        ├── 4. Executa vite build
        ├── 5. Post-build cleanup
        ├── 6. Copia .htaccess
        ├── 7. Gera version.json
        ├── 8. Cria ZIPs
        └── 9. Verificação (verify-build.mjs)
```

---

## 5.2 Scripts no package.json

```json
{
  "scripts": {
    "dev": "vite",
    "dev:admin": "VITE_INCLUDE_ADMIN=true vite",
    "build": "vite build",
    "build:production": "node scripts/build-production.mjs",
    "build:verify": "node scripts/verify-build.mjs",
    "preview": "vite preview"
  }
}
```

**Nota:** `dev` e `dev:admin` — em desenvolvimento normal, o admin está disponível. O `dev:admin` é opcional se preferir ter a flag explícita.

---

## 5.3 `scripts/build-production.mjs` — Detalhamento

### Etapa 1: Pre-flight Checks
```
✔ Node.js >= 18
✔ node_modules existe (npm ci foi executado)
✔ public/data/blog-posts.json existe e é JSON válido
✔ Nenhum arquivo .env contém SUPABASE_ANON_KEY hardcoded
✔ Git está limpo (aviso se há mudanças não commitadas)
```

### Etapa 2: Limpar dist/
```
rm -rf dist/
```

### Etapa 3: Configurar Ambiente
```javascript
process.env.VITE_INCLUDE_ADMIN = '';  // Falsy = exclui admin
// NÃO definir VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY
```

### Etapa 4: Executar Build
```javascript
execSync('npx vite build', { stdio: 'inherit', env: process.env });
```

### Etapa 5: Post-build Cleanup
```javascript
// Remover chunks admin que possam ter escapado do tree-shaking
const adminPatterns = ['Admin-', 'AdminMedia-', 'AdminPost', 'RichTextEditor-',
  'MediaLibrary-', 'MediaField-', 'MediaUsageSection-', 'ManualAdapter-',
  'upload-', 'useMediaLibrary-', 'mediaApi-', 'mediaStore-', 'mediaTypes-'];
// Deletar arquivos que matchem esses padrões em dist/assets/

// Remover _headers (formato Netlify, inútil no cPanel)
fs.unlinkSync('dist/_headers');
```

### Etapa 6: Copiar .htaccess
```javascript
fs.copyFileSync('deploy-templates/.htaccess', 'dist/.htaccess');
```

### Etapa 7: Gerar version.json
```json
{
  "version": "1.0.0",
  "buildDate": "2026-04-03T14:00:00.000Z",
  "gitCommit": "abc1234",
  "gitBranch": "master",
  "nodeVersion": "v20.11.0",
  "excludeAdmin": true
}
```

### Etapa 8: Criar ZIPs
```
deploy/
├── comercial-jr-2026-04-03-1400.zip           ← Full (com media/)
└── comercial-jr-2026-04-03-1400-code-only.zip ← Sem media/ (para updates rápidos)
```

**Por que dois ZIPs?**
- O ZIP completo (com `media/`) é necessário no **primeiro deploy** ou quando novas imagens são adicionadas
- O ZIP code-only (sem `media/`) é para **atualizações de código** — muito menor e mais rápido de subir
- Media já no servidor não precisa ser re-enviada

### Etapa 9: Verificação Automática
Executa `verify-build.mjs` (ver seção 5.4).

---

## 5.4 `scripts/verify-build.mjs` — Detalhamento

Verifica:

| Check | O que verifica | Falha se |
|-------|---------------|----------|
| 1 | `dist/index.html` existe | Arquivo ausente |
| 2 | `dist/index.html` contém `<div id="root">` | HTML incorreto |
| 3 | Nenhum chunk contém "AdminPage" | Admin no bundle |
| 4 | Nenhum chunk contém "tiptap" (case insensitive) | TipTap no bundle |
| 5 | Nenhum chunk contém o prefixo JWT do Supabase | Key exposta |
| 6 | `dist/data/blog-posts.json` existe e é JSON válido | Blog data ausente |
| 7 | `dist/sitemap-index.xml` existe | Sitemap ausente |
| 8 | `dist/page-sitemap.xml` existe | Sitemap ausente |
| 9 | `dist/post-sitemap.xml` existe | Sitemap ausente |
| 10 | `dist/robots.txt` contém "Disallow: /admin" | Admin não bloqueado |
| 11 | `dist/.htaccess` existe | SPA routing quebrado |
| 12 | `dist/favicon.ico` existe | Favicon ausente |
| 13 | Total JS em `dist/assets/` < 800 KB | Bundle inflado (admin?) |
| 14 | Nenhum chunk > 500 KB | Chunk suspeito |
| 15 | `dist/version.json` existe | Versioning ausente |

**Output do script:**
```
══════════════════════════════════════════
  BUILD VERIFICATION — Comercial JR LTDA
══════════════════════════════════════════

 ✔ index.html presente e válido
 ✔ Nenhum código admin detectado nos chunks
 ✔ Nenhuma chave Supabase detectada
 ✔ blog-posts.json válido (47 posts)
 ✔ Sitemaps presentes (3/3)
 ✔ robots.txt bloqueia /admin
 ✔ .htaccess presente
 ✔ favicon.ico presente
 ✔ Bundle JS total: 487 KB (limite: 800 KB) ✔
 ✔ Maior chunk: 453 KB (limite: 500 KB) ✔
 ✔ version.json presente

 RESULTADO: 15/15 checks passaram ✔

══════════════════════════════════════════
```

---

## 5.5 `build-production.bat` — Wrapper Windows

```batch
@echo off
echo.
echo ══════════════════════════════════════════
echo   Comercial JR - Build de Producao
echo ══════════════════════════════════════════
echo.

cd /d "%~dp0"
call npm run build:production

if %errorlevel%==0 (
    echo.
    echo  BUILD COMPLETO COM SUCESSO!
    echo.
    echo  Arquivos ZIP prontos:
    dir deploy\*.zip /b /o-d 2>nul
    echo.
    echo  Proximo passo: Upload do ZIP para cPanel
) else (
    echo.
    echo  ERRO NO BUILD! Verifique o log acima.
)

echo.
pause
```

---

## 5.6 Persistência da Solução

**Por que esta solução é persistente e de longo prazo:**

1. **Script único:** `npm run build:production` faz tudo — não há "receita" para lembrar
2. **Verificação automática:** Impossível gerar build quebrado sem ser alertado
3. **Versionamento:** `version.json` rastreia cada build
4. **Dois ZIPs:** Flexibilidade para deploys completos ou incrementais
5. **Funciona em qualquer máquina Windows** com Node.js 18+
6. **Evolução natural:** Pode ser integrado ao GitHub Actions (Fase 2) sem alterações
7. **Idempotente:** Pode rodar quantas vezes quiser sem efeitos colaterais

---

<a name="parte-6"></a>
# PARTE 6 — OTIMIZAÇÃO DE VELOCIDADE, CACHE, COMPRESSÃO E SEO

## 6.1 Compressão

### Cloudflare (Primário — Automático)
O Cloudflare Free aplica **Brotli** automaticamente em todo tráfego proxied. Não precisa configurar nada. Tipos comprimidos: HTML, CSS, JS, JSON, XML, SVG.

### Apache/cPanel (Fallback)
O `.htaccess` da seção 1.3 inclui `mod_deflate` para gzip. Serve como fallback se o Cloudflare for contornado ou para acesso direto ao servidor.

### Compressão Pré-build (Opcional, Futuro)
Adicionar `vite-plugin-compression` para gerar `.br` e `.gz` no build time. Apache pode servir pré-comprimidos. Benefício marginal porque Cloudflare já faz isso na edge.

**Avaliação crítica:** Com Cloudflare ativado, a compressão é tratada 100% na edge. O `mod_deflate` no .htaccess é belt-and-suspenders — útil mas não crítico.

---

## 6.2 Estratégia de Cache — 3 Camadas

### Camada 1: Cloudflare Edge Cache

| Recurso | Page Rule | Edge TTL | Browser TTL |
|---------|-----------|----------|-------------|
| `*/assets/*` | Cache Everything | 1 mês | 1 ano |
| `*/media/*` | Cache Everything | 1 mês | 1 ano |
| `*/data/*` | Cache Everything | 5 minutos | 1 minuto |

**Cloudflare Free: 3 Page Rules gratuitas** — exatamente o que precisamos.

**Configuração no dashboard:**
1. Cloudflare → Rules → Page Rules → Create Rule
2. URL: `comercialjrltda.com.br/assets/*` → Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month, Browser Cache TTL = 1 year
3. Repetir para `/media/*` e `/data/*`

### Camada 2: Browser Cache (via .htaccess)

Já configurado na seção 1.3. Resumo:

| Tipo | Cache-Control | Max-Age |
|------|--------------|---------|
| JS, CSS (hashed) | public, immutable | 1 ano |
| Imagens | public, immutable | 1 ano |
| Fonts | public, immutable | 1 ano |
| JSON | public, stale-while-revalidate | 60s |
| HTML | no-cache, must-revalidate | 0 |
| XML (sitemaps) | public | 1 hora |

**Por que funciona perfeitamente com Vite:**
- Vite adiciona hash no nome dos arquivos JS/CSS (ex: `index-DWNMpLfp.js`)
- Quando o código muda, o hash muda → nome diferente → cache miss automático
- Isso permite caching agressivo (1 ano) sem risco de servir conteúdo desatualizado
- O `index.html` NUNCA é cacheado — ele sempre aponta para os hashes corretos

### Camada 3: Service Worker (Futuro)
Não implementado atualmente. Pode ser adicionado com `vite-plugin-pwa` para:
- Funcionalidade offline
- Cache de rotas visitadas
- Background sync de blog posts

**Avaliação crítica:** Service Worker é uma otimização de Fase 3. O cache de Cloudflare + browser já cobre 95% dos casos. Adicionar PWA aumenta complexidade significativamente.

---

## 6.3 Otimização de Imagens

### Estado Atual
Imagens já em WebP com 3 variantes: thumbnail (300px), medium (800px), large (1920px). `OptimizedImage.tsx` usa `srcSet` responsivo e `loading="lazy"`.

### Otimizações Pendentes

| Imagem | Tamanho Atual | Meta | Ação |
|--------|--------------|------|------|
| `hero-bg.webp` | 459 KB | < 200 KB | Re-comprimir com quality 75-80 via sharp |
| `og-image.jpg` | 75 KB | < 40 KB | Converter para WebP (Open Graph aceita) |
| `favicon-512.png` | 321 KB | < 50 KB | Otimizar com pngquant/optipng |
| `apple-touch-icon.png` | 63 KB | < 20 KB | Otimizar com pngquant |
| `favicon-base.png` | 45 KB | - | Remover (não referenciado no index.html) |
| `favicon.webp` | 27 KB | - | Remover (não referenciado no index.html) |

**Comando para comprimir hero-bg.webp:**
```bash
npx sharp-cli -i public/hero-bg.webp -o public/hero-bg.webp --quality 78 --effort 6
```

**Avaliação crítica:** A `hero-bg.webp` de 459 KB é o maior impacto no LCP. Reduzi-la para ~200 KB melhora significativamente o primeiro carregamento. As outras otimizações são menores mas cumulativas.

---

## 6.4 Bundle Splitting Inteligente

### Estado Atual
O bundle principal `index-DWNMpLfp.js` é **453 KB** — contém todas as libs juntas.

### Proposta: Manual Chunks no Vite

Adicionar ao `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'animation': ['framer-motion'],
        'ui-primitives': [
          '@radix-ui/react-dialog',
          '@radix-ui/react-dropdown-menu',
          '@radix-ui/react-tooltip',
          '@radix-ui/react-scroll-area',
          '@radix-ui/react-separator',
          '@radix-ui/react-tabs',
        ],
        'state': ['zustand', '@tanstack/react-query'],
      }
    }
  }
}
```

### Resultado Esperado

| Chunk | Tamanho ~aprox | Cache |
|-------|---------------|-------|
| `react-vendor` | ~160 KB | Raramente muda |
| `animation` | ~90 KB | Raramente muda |
| `ui-primitives` | ~50 KB | Raramente muda |
| `state` | ~20 KB | Raramente muda |
| `app` (código do site) | ~130 KB | Muda a cada deploy |

**Benefício:** Quando o código do site muda (novo post, ajuste de texto), visitantes recorrentes re-baixam apenas o chunk `app` (~130 KB) em vez do bundle inteiro (453 KB). Libs estáveis ficam em cache.

**Avaliação crítica:** Esta é uma otimização de médio impacto. Para visitantes novos (primeira visita), o tempo total é similar (mesmo volume de dados). O ganho é para visitantes recorrentes. Recomendo implementar, mas não é bloqueante para o launch.

---

## 6.5 Otimização de Fonts

### Estado Atual
Google Fonts via `@import` no CSS (render-blocking).

### Fase 1: Font Loading Não-Bloqueante (IMPLEMENTAR AGORA)

1. **Remover** `@import url(...)` de `src/index.css` (linha 1)
2. **Adicionar** ao `index.html`:
```html
<link rel="preload"
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'" />
<noscript>
  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap" />
</noscript>
```

**Impacto:** Elimina bloqueio de renderização. O texto aparece imediatamente com font de fallback e troca para a font correta quando carregada (FOUT — Flash of Unstyled Text). O `display=swap` já está configurado.

### Subsets e Pesos (AVALIAR)

Pesos carregados atualmente:
- **Montserrat:** 400, 500, 600, 700, 800, 900 (6 pesos)
- **Open Sans:** 400, 500, 600, 700 (4 pesos)

**Cada peso adicional ≈ 15-20 KB.** Verificar se 800 e 900 de Montserrat são realmente usados. Se não, remover economiza ~30-40 KB.

### Fase 2: Self-Hosting (FUTURO)

Instalar via `@fontsource/montserrat` e `@fontsource/open-sans`:
- Elimina DNS lookup para `fonts.googleapis.com`
- Elimina conexão para `fonts.gstatic.com`
- Fonts servidas do mesmo domínio com Brotli via Cloudflare

**Avaliação crítica:** A Fase 1 é high-impact e low-effort — fazer imediatamente. A Fase 2 economiza ~100-200ms no primeiro load mas adiciona ~200 KB ao bundle (fonts ficam no build). Recomendo apenas se o Lighthouse indicar fonts como bottleneck.

---

## 6.6 Critical CSS (Opcional, Futuro)

Injetar CSS above-the-fold diretamente no `<head>` do `index.html` para eliminar o download do CSS como bloqueio de renderização.

**Ferramentas:** `critters` ou `vite-plugin-critical`

**Trade-off:** Aumenta o tamanho do HTML inicial (~10 KB inline CSS) mas elimina uma request. Com Cloudflare cachando o CSS, o benefício é marginal.

**Avaliação crítica:** Low priority. O CSS total é 74 KB — com Brotli, transfere em ~15 KB. O ganho de inline critical CSS é de ~50-100ms. Não recomendo para o launch.

---

## 6.7 Lazy Loading — Verificação

### Rotas ✅
Todas as 15+ páginas usam `lazy()` em `App.tsx`. Correto.

### Imagens ✅
`OptimizedImage.tsx` usa `loading="lazy"` por padrão. Hero image deve usar `loading="eager"` (verificar).

### Componentes ✅
`BrandSlider` é importado diretamente em `Index.tsx` — carrega com a homepage. Aceitável pois é above-the-fold.

**Nenhuma ação necessária** — lazy loading já está bem implementado.

---

## 6.8 Preloading de Recursos Críticos

Adicionar ao `index.html`:
```html
<!-- Hero image (LCP) -->
<link rel="preload" as="image" type="image/webp" href="/hero-bg.webp" fetchpriority="high" />

<!-- Logo -->
<link rel="preload" as="image" type="image/webp" href="/logo.webp" />
```

**Nota:** O Vite adiciona automaticamente `<link rel="modulepreload">` para o chunk JS principal. Verificar no `dist/index.html`.

---

## 6.9 SEO — Verificação Completa

### A) Sitemaps ✅
- `vite-plugin-sitemap.ts` gera 3 arquivos no build:
  - `page-sitemap.xml` — 14 URLs estáticas com priority e changefreq
  - `post-sitemap.xml` — Posts publicados de `blog-posts.json`
  - `sitemap-index.xml` — Referencia ambos
- **Status:** Correto e automático

### B) robots.txt ✅
```
User-agent: * (+ específicos para Google, Bing, Facebook)
Allow: /
Disallow: /admin
Sitemap: https://comercialjrltda.com.br/sitemap-index.xml
```
**Status:** Correto

### C) Meta Tags (SEOHead.tsx) ✅
- `<title>` com sufixo da empresa
- `<meta name="description">`
- `<meta name="robots">`
- `<link rel="canonical">`
- `<link rel="alternate" hreflang="pt-BR">` e `hreflang="x-default"`
- Google Search Console verification
- Theme color

### D) Open Graph Tags ✅
- `og:title`, `og:description`, `og:url`, `og:image` (com width/height)
- `og:type`, `og:locale`, `og:site_name`
- Tags específicas de artigo para blog posts

### E) Schema.org (SchemaOrg.tsx) ⚠️ INCOMPLETO

**Existente:**
- `BreadcrumbList` — navegação
- `Service` — páginas de segmento
- `WebPage` — páginas gerais

**FALTANDO (recomendado adicionar):**
- `Organization` schema no homepage — logo, contato, redes sociais, sameAs
- `LocalBusiness` schema — endereço, horário, telefone, área de atendimento
- `BlogPosting` / `Article` schema nos posts — author, datePublished, dateModified

### F) Canonical URLs ✅
Definidas via `canonical` prop no `SEOHead.tsx`.

### G) hreflang ✅
`pt-BR` e `x-default` — correto para site monolíngue em português.

### H) Observação sobre SEO de SPA

O site é SPA (Single Page Application) renderizado no cliente. Implicações:

- **Googlebot:** Renderiza JavaScript → vê o conteúdo → indexa. Funciona, mas com delay (dias a semanas para novas páginas).
- **Bing/outros:** Podem não renderizar JavaScript → veem apenas o `index.html` base.
- **Redes sociais (OG tags):** Facebook/Twitter fazem crawl sem JS → veem apenas as meta tags do `index.html` base, NÃO as tags dinâmicas do react-helmet.

**Mitigação atual:** O `index.html` tem meta tags base razoáveis (título, descrição, robots).

**Mitigação futura (recomendada):**
1. **Pre-rendering** com `vite-plugin-prerender` — gera HTML estático para cada rota no build time
2. O SPA hidrata sobre o HTML estático → melhor indexação + performance
3. Alternativa: Cloudflare Workers com `prerender.io` para SSR dinâmico

**Avaliação crítica:** Para o Google, a SPA funciona aceitavelmente. O problema real é com OG tags — quando alguém compartilha `/blog/irrigacao-eficiente` no WhatsApp/Facebook, o preview mostrará o título/descrição genérico do `index.html`, não o específico do post. Pre-rendering resolve isso completamente. Recomendo para Fase 2.

### I) Core Web Vitals — Targets

| Métrica | Target | Risco Atual | Mitigação |
|---------|--------|-------------|-----------|
| **LCP** | < 2.5s | `hero-bg.webp` 459 KB | Preload + comprimir para < 200 KB |
| **INP** | < 200ms | Mínimo — sem interações pesadas | Framer Motion usa CSS transforms |
| **CLS** | < 0.1 | FOUT das fonts | `font-display:swap` + preload |

---

<a name="ordem-execucao"></a>
# ORDEM DE EXECUÇÃO E DEPENDÊNCIAS

```
FASE 0 — Pré-trabalho (pode começar imediatamente)
├── 3.5/4.3B: Criar src/lib/trackingTypes.ts
├── 3.5/4.3D: Atualizar AdminSeoEditor.tsx para re-exportar
└── 4.3E: Remover Supabase key hardcoded

FASE 1 — Alterações de Código
├── 4.3A: Condicionar admin no App.tsx
├── 4.3C: Atualizar TrackingScripts.tsx
├── 4.3F: Font loading + admin-dark CSS
├── 4.3G: Preloads no index.html
└── 6.4: Manual chunks no vite.config.ts
         ↓
FASE 2 — Infraestrutura de Build
├── 5.3: Criar build-production.mjs
├── 5.4: Criar verify-build.mjs
├── 5.5: Criar build-production.bat
├── 1.3: Criar template .htaccess
└── 5.2: Adicionar scripts ao package.json
         ↓
FASE 3 — Primeiro Build & Teste Local
├── Executar npm run build:production
├── Verificar output com verify-build.mjs
├── Testar com npx serve dist
├── Verificar: sem admin, tamanhos corretos, sitemaps OK
└── Comprimir hero-bg.webp (6.3)
         ↓
FASE 4 — Setup do Servidor
├── 1.2: Configurar document root no cPanel
├── 1.5: SSL com Cloudflare (Full Strict)
├── Upload .htaccess para public_html
└── 6.2: Configurar Page Rules no Cloudflare
         ↓
FASE 5 — Deploy Inicial
├── Upload ZIP para cPanel File Manager
├── Extrair em public_html
├── Testar todas as rotas
├── Verificar /admin retorna 404
├── Verificar SPA routing (refresh de página)
├── Verificar HTTPS sem redirect loop
└── Verificar headers de segurança
         ↓
FASE 6 — Pós-Deploy (1-2 semanas)
├── Lighthouse / PageSpeed Insights
├── SecurityHeaders.com
├── Google Search Console (submeter sitemaps)
├── 6.9E: Adicionar schemas Organization/LocalBusiness
├── 2.5: GitHub Actions + FTP (automatização)
└── 3.6: Corrigir RLS do Supabase
```

---

<a name="riscos"></a>
# AVALIAÇÃO DE RISCOS

| Risco | Severidade | Probabilidade | Mitigação |
|-------|-----------|---------------|-----------|
| CentOS 7 EOL — vulnerabilidade no servidor | ALTA | MÉDIA | Cloudflare proxy; planejar migração do OS |
| Código admin vaza para produção | ALTA | BAIXA | Verify-build.mjs + .htaccess block |
| Supabase RLS permite operações destrutivas | ALTA | MÉDIA | Remover de produção; corrigir RLS para dev |
| SPA routing falha (sem .htaccess) | ALTA | BAIXA | Parte do build script; testado antes do go-live |
| Redirect loop SSL (Cloudflare Flexible) | MÉDIA | MÉDIA | Sempre usar Full (Strict); documentar |
| hero-bg.webp pesada afetando LCP | MÉDIA | ALTA | Preload + comprimir < 200 KB |
| TrackingScripts XSS | MÉDIA | BAIXA | CSP + em produção hardcodar tracking |
| Build script falha em paths Windows | BAIXA | MÉDIA | path.resolve() e forward slashes no Node.js |
| Font flash (FOUT) | BAIXA | ALTA | font-display:swap aceitável; preload mitiga |
| blog-posts.json ausente em produção | MÉDIA | BAIXA | Verificado no build; fallback no blogStore |
| OG tags genéricos ao compartilhar links | MÉDIA | ALTA | Pre-rendering futuro (Fase 2) |

---

<a name="checklist"></a>
# CHECKLIST FINAL DE DEPLOY

## Antes do Build
- [ ] Tracking codes (Google Analytics, Meta Pixel) configurados no admin local
- [ ] Blog posts atualizados e publicados
- [ ] Imagens de mídia processadas e presentes em `public/media/`
- [ ] `blog-posts.json` atualizado em `public/data/`
- [ ] Alterações commitadas no git

## Após o Build
- [ ] `npm run build:production` executou sem erros
- [ ] Verificação automática: 15/15 checks passaram
- [ ] ZIP gerado na pasta `deploy/`
- [ ] Testar localmente: `npx serve dist` → navegar em todas as rotas
- [ ] `/admin` retorna 404 ou página não encontrada
- [ ] Nenhum chunk admin visível no DevTools → Network

## Após o Deploy
- [ ] Homepage carrega corretamente
- [ ] Todas as páginas de segmento funcionam
- [ ] Blog lista posts corretamente
- [ ] Posts individuais carregam
- [ ] Página 404 funciona para URLs inexistentes
- [ ] Refresh de página funciona em qualquer rota (SPA routing)
- [ ] HTTPS funciona sem redirect loop
- [ ] `www.` redireciona para sem-www
- [ ] `http://` redireciona para `https://`
- [ ] `/admin` retorna 404
- [ ] Headers de segurança presentes (check: securityheaders.com)
- [ ] Compressão ativa (DevTools → Network → Content-Encoding: br ou gzip)
- [ ] Sitemaps acessíveis: `/sitemap-index.xml`, `/page-sitemap.xml`, `/post-sitemap.xml`
- [ ] `robots.txt` acessível e bloqueia `/admin`
- [ ] `version.json` acessível com data correta

## Ferramentas de Verificação
- **Performance:** [PageSpeed Insights](https://pagespeed.web.dev/)
- **Security Headers:** [securityheaders.com](https://securityheaders.com/)
- **SSL:** [SSL Labs](https://www.ssllabs.com/ssltest/)
- **SEO:** Google Search Console (submeter sitemaps)
- **Schema:** [Schema Markup Validator](https://validator.schema.org/)
- **OG Tags:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

---

*Documento gerado em 03/04/2026 para o projeto jrteste1-main (Comercial JR LTDA)*
*Plano de implementação v1.0*
