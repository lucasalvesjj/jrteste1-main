# Relatório de Desacoplamento Admin/Público — V2

**Data:** 2026-04-07
**Escopo:** Auditoria completa + implementação do desacoplamento real entre painel `/admin` e site público

---

## Contexto

O relatório anterior (`RELATORIO_DESACOPLAMENTO_ADMIN_PUBLICO.md`) descrevia uma arquitetura desacoplada, porém a auditoria revelou que **os arquivos mencionados como criados não existiam** e o acoplamento real persistia. Este trabalho corrigiu as divergências encontradas.

---

## Problemas Encontrados na Auditoria

### P1: Blog Store Compartilhado (CRÍTICO)

`src/stores/blogStore.ts` era um único Zustand store com `persist` middleware (localStorage key `"comercial-jr-blog-working-copy"`) usado simultaneamente por **todas as páginas públicas** e pelo admin.

- Quando o admin editava posts → `source` virava `"local-draft"` → persistia no localStorage
- Quando página pública carregava no mesmo navegador → `init()` verificava `state.initialized && state.posts.length > 0` → se true, **pulava o fetch do JSON publicado** → mostrava rascunhos do admin
- **Impacto**: Páginas públicas mostravam rascunhos não publicados no mesmo navegador

### P2: SEOHead.tsx Lia do localStorage (MODERADO)

`src/components/SEOHead.tsx` lia do localStorage key `"comercial-jr-global-seo"` via função `getGlobalSeoValue()` em vez do arquivo publicado `/data/seo-settings.json`.

- `App.tsx` chamava `syncSeoSettingsFromFile()` no mount como mitigação parcial
- Race condition: SEOHead podia renderizar com dados stale antes do sync completar
- Admin editava SEO → localStorage mudava → público mostrava rascunho até próximo reload

### P3: Redirect Store Mesmo Padrão (MODERADO)

`src/stores/redirectStore.ts` usava o mesmo padrão Zustand persist (localStorage key `"comercial-jr-redirects"`). O `init()` preservava explicitamente dados "local-draft". `RedirectGuard.tsx` (componente público) usava este store.

### P4: Relatório vs Realidade

O relatório anterior afirmava que foram criados:
- `src/hooks/usePublishedBlog.ts` — **NÃO EXISTIA**
- `src/lib/blogQueries.ts` — **NÃO EXISTIA**
- `src/stores/adminBlogStore.ts` — **NÃO EXISTIA**
- `src/lib/blogPublicationWarnings.ts` — **NÃO EXISTIA**

O relatório também afirmava que `blogStore.ts` foi removido — ele ainda existia e era o store principal.

### P5: BlogCard.tsx Acessava Store Diretamente (MENOR)

`src/components/BlogCard.tsx` importava `useBlogStore` para obter categorias em vez de recebê-las via props.

### O que JÁ Estava Corretamente Desacoplado

- **TrackingScripts.tsx** — fetch de `/data/tracking-codes.json` (JSON publicado)
- **Autenticação admin** — localStorage isolado, não vazava para público
- **Histórico de rascunhos do editor** — localStorage por post, admin-only

---

## Estratégia de Solução

**Abordagem escolhida: Hooks públicos read-only separados**

- Hooks públicos fazem fetch puro (JSON → state), sem localStorage, sem zustand persist
- O admin store permanece **100% intocado** — zero risco de regressão
- Stores Zustand são singletons no SPA — não conseguem servir admin e público com comportamentos diferentes simultaneamente

---

## Etapas Executadas

### Etapa 1: Criar `src/hooks/usePublishedBlog.ts` (NOVO)

Hook React que páginas públicas usam em vez de `useBlogStore`. Faz fetch de `/data/blog-posts.json`, nunca lê/escreve localStorage.

**Funções exportadas:**
- `usePublishedBlog()` — retorna `{ posts, categories, loading, error }`
- `getPublishedPosts(posts, categories)` — posts publicados e visíveis, ordenados por data
- `getPostBySlug(posts, slug)` — busca por slug
- `getPostsByCategory(posts, categories, categoryId)` — filtro por categoria
- `getRelatedPosts(posts, post, limit)` — posts relacionados

**Reutiliza:** `fetchPublishedPosts()` de `src/lib/blogContent.ts`, `isPostVisibleInAnyCategory()` de `src/lib/blogCategories.ts`

**Cache em memória do módulo** para evitar re-fetch a cada navegação SPA.

---

### Etapa 2: Criar `src/hooks/usePublishedRedirects.ts` (NOVO)

Hook que `RedirectGuard.tsx` usa no lugar de `useRedirectStore`. Fetch de `/data/redirects.json`, sem persist.

**Funções exportadas:**
- `usePublishedRedirects()` — retorna `{ rules, loading, initialized, findMatch }`

**Reutiliza:** `fetchPublishedRedirects()` de `src/lib/redirectContent.ts`, `findMatchingRule()` de `src/lib/redirectMatcher.ts`

---

### Etapa 3: Criar `src/hooks/usePublishedSeo.ts` (NOVO)

Hook que substitui a leitura de localStorage no SEOHead. Fetch de `/data/seo-settings.json` direto.

**Funções exportadas:**
- `usePublishedSeo()` — retorna `SeoSettings` com defaults enquanto carrega

**Mapeamento de campos:** O JSON publicado usa campos como `defaultImage`, `googleVerification`, `defaultRobots` que são mapeados para o formato `SeoSettings` (`ogImage`, `googleSiteVerification`, `robotsDefault`).

---

### Etapa 4: Criar `src/contexts/PublishedSeoContext.tsx` (NOVO)

Context React que envolve o app e disponibiliza SEO settings publicadas para todos os componentes públicos.

**Exports:**
- `PublishedSeoProvider` — provider que usa `usePublishedSeo()` internamente
- `usePublishedSeoContext()` — hook de consumo para componentes públicos

---

### Etapa 5: Refatorar `src/components/BlogCard.tsx`

**Antes:**
```tsx
import { useBlogStore } from "@/stores/blogStore";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  const availableCategories = useBlogStore((state) => state.categories);
```

**Depois:**
```tsx
interface BlogCardProps {
  post: BlogPost;
  categories: BlogCategory[];
}

const BlogCard = ({ post, categories: availableCategories }: BlogCardProps) => {
```

- Removido `import { useBlogStore }` — elimina dependência do store admin
- Componente recebe categorias via prop

---

### Etapa 6: Migrar 7 Páginas Públicas

Todas as páginas públicas migraram de `useBlogStore` para `usePublishedBlog`:

| Arquivo | Mudanças |
|---|---|
| `src/pages/Blog.tsx` | `useBlogStore` → `usePublishedBlog`, removido `useEffect(init)`, `<BlogCard>` com prop `categories` |
| `src/pages/Index.tsx` | `useBlogStore` → `usePublishedBlog` + `getPublishedPosts`, removido `useEffect(init)` |
| `src/pages/BlogPost.tsx` | `useBlogStore` → `usePublishedBlog` + seletores puros, redirect store → `usePublishedRedirects` (mantido `redirectIncrementHit` e `log404` do store para métricas) |
| `src/pages/segmentos/Ferramentas.tsx` | `useBlogStore` → `usePublishedBlog`, removido `useEffect`, import `useEffect` removido |
| `src/pages/segmentos/Irrigacao.tsx` | Idem |
| `src/pages/segmentos/Maquinas.tsx` | Idem |
| `src/pages/segmentos/BombasMotores.tsx` | Idem |

**Padrão de migração (exemplo páginas de segmento):**

Antes:
```tsx
import { useBlogStore } from "@/stores/blogStore";
const Page = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);
  useEffect(() => { void init(); }, [init]);
```

Depois:
```tsx
import { usePublishedBlog } from "@/hooks/usePublishedBlog";
const Page = () => {
  const { posts, categories } = usePublishedBlog();
```

---

### Etapa 7: Refatorar `src/components/RedirectGuard.tsx`

**Antes:** Usava `useRedirectStore` (store com persist em localStorage). Dependia de `hydrated`, `init`, `incrementHit`.

**Depois:** Usa `usePublishedRedirects` (hook read-only do JSON publicado). Simplificado — não precisa mais esperar "hidratação" do localStorage.

Mudanças principais:
- `useRedirectStore` → `usePublishedRedirects`
- Removidas dependências de `hydrated`, `init`, `incrementHit`
- `findMatch` vem do hook publicado que filtra regras ativas automaticamente

---

### Etapa 8: Refatorar `src/components/SEOHead.tsx`

**Antes:**
```tsx
const SEO_STORAGE_KEY = "comercial-jr-global-seo";
function getGlobalSeoValue(key, fallback) {
  const raw = localStorage.getItem(SEO_STORAGE_KEY);
  // ...
}
```

**Depois:**
```tsx
import { usePublishedSeoContext } from "@/contexts/PublishedSeoContext";
// ...
const seo = usePublishedSeoContext();
const googleVerification = seo.googleSiteVerification || "da794cd9937527d01";
const themeColor         = seo.themeColor || "#1a3c6e";
// ...
```

- Removida função `getGlobalSeoValue()` e constante `SEO_STORAGE_KEY`
- Todos os valores SEO agora vêm do `/data/seo-settings.json` via context

---

### Etapa 9: Atualizar `src/App.tsx`

- Removido import de `syncSeoSettingsFromFile` e o `useEffect` que a chamava
- Adicionado `<PublishedSeoProvider>` envolvendo todo o conteúdo dentro do `BrowserRouter`
- O provider faz fetch de `/data/seo-settings.json` uma única vez e disponibiliza via context

---

### Etapa 10: Verificação e Testes

| Verificação | Resultado |
|---|---|
| TypeScript `tsc --noEmit` | ZERO erros |
| Build de produção `npm run build` | Aprovado (6.79s) |
| Testes `npm run test` | 1/1 passando |
| Sitemap | 14 URLs + 70 posts |
| Auditoria `useBlogStore` fora do admin | ZERO usos |
| Auditoria `useRedirectStore` fora do admin | Apenas `log404` e `incrementHit` (métricas) |
| Auditoria `localStorage` em componentes públicos | Apenas `CookieBanner` (cookie consent, seguro) |

---

## Arquivos Criados (4)

- `src/hooks/usePublishedBlog.ts` — Hook público para blog posts
- `src/hooks/usePublishedRedirects.ts` — Hook público para redirects
- `src/hooks/usePublishedSeo.ts` — Hook público para SEO settings
- `src/contexts/PublishedSeoContext.tsx` — Context para SEO settings

## Arquivos Modificados (11)

- `src/components/BlogCard.tsx` — Prop `categories` em vez de store
- `src/components/SEOHead.tsx` — Context em vez de localStorage
- `src/components/RedirectGuard.tsx` — Hook publicado em vez de store
- `src/pages/Blog.tsx` — `usePublishedBlog` em vez de `useBlogStore`
- `src/pages/Index.tsx` — `usePublishedBlog` em vez de `useBlogStore`
- `src/pages/BlogPost.tsx` — `usePublishedBlog` + `usePublishedRedirects`
- `src/pages/segmentos/Ferramentas.tsx` — `usePublishedBlog`
- `src/pages/segmentos/Irrigacao.tsx` — `usePublishedBlog`
- `src/pages/segmentos/Maquinas.tsx` — `usePublishedBlog`
- `src/pages/segmentos/BombasMotores.tsx` — `usePublishedBlog`
- `src/App.tsx` — `PublishedSeoProvider`, removido `syncSeoSettingsFromFile`

## Arquivos Admin NÃO Alterados

- `src/stores/blogStore.ts` — Permanece como working copy do admin
- `src/stores/redirectStore.ts` — Permanece como working copy do admin
- `src/pages/Admin.tsx` — Continua usando `useBlogStore`
- `src/pages/AdminRedirects.tsx` — Continua usando `useRedirectStore`
- `src/pages/AdminMedia.tsx` — Não usa blog/redirect stores
- `src/components/admin/*` — Todos permanecem intocados

---

## Estado Final do Projeto

### O que agora funciona corretamente

- Editar posts no `/admin` **não altera mais** o site público no mesmo navegador
- O site público lê **apenas** os JSON publicados em `/public/data/`
- O admin mantém sua própria cópia local de trabalho via zustand persist
- SEO global lê do `/data/seo-settings.json` publicado, não do localStorage
- Redirects públicos lêem do `/data/redirects.json` publicado, não do localStorage
- Tracking codes já liam do JSON publicado (sem alteração necessária)

### Fluxo de dados — Público

```
Visitante acessa /blog
  → usePublishedBlog()
    → fetch(/data/blog-posts.json, { cache: "no-store" })
      → parseBlogImport()
        → { posts, categories }
          → Renderiza página

Visitante acessa qualquer página (SEO)
  → PublishedSeoProvider
    → fetch(/data/seo-settings.json, { cache: "no-store" })
      → usePublishedSeoContext()
        → SEOHead renderiza meta tags

Visitante navega (redirects)
  → usePublishedRedirects()
    → fetch(/data/redirects.json, { cache: "no-store" })
      → findMatch(pathname)
        → Redireciona se houver regra
```

### Fluxo de dados — Admin

```
Admin edita post
  → useBlogStore.updatePost()
    → zustand persist → localStorage("comercial-jr-blog-working-copy")
      → source: "local-draft"

Admin exporta
  → useBlogStore.exportFile()
    → downloadJson("blog-posts.json") ou publishToGitHub()
      → Substitui /public/data/blog-posts.json
        → Público reflete as mudanças
```

### O que continua intencionalmente local

- Autenticação do admin (`comercial-jr-admin-authenticated`)
- Histórico local de versões do editor (`comercial-jr-editor-history:*`)
- Working copy do blog no admin (`comercial-jr-blog-working-copy`)
- Working copy de redirects no admin (`comercial-jr-redirects`)
- SEO settings do admin (`comercial-jr-global-seo`)
- Tracking codes do admin (`comercial-jr-tracking-codes`)

### Usos residuais de `useRedirectStore` em páginas públicas

- `BlogPost.tsx` — `log404()` e `incrementHit()` (apenas escrita de métricas, não leitura de regras)
- `NotFound.tsx` — `log404()` (apenas escrita de métricas)

Estes usos são aceitáveis pois apenas adicionam dados ao store admin (append-only), sem ler regras de redirect nem influenciar o conteúdo exibido.

---

## Validação Executada

- `npx tsc --noEmit` — Zero erros
- `npm run build` — Build aprovado (6.79s)
- `npm run test` — 1/1 testes passando
- Auditoria estática de imports cruzados
- Auditoria de uso de `localStorage` em componentes públicos
