# Plano: Corrigir aparência "quebrada" dos sitemaps em produção

## Contexto

Usuário relatou que `https://comercialjrltda.com.br/page-sitemap.xml` e `https://comercialjrltda.com.br/post-sitemap.xml` aparecem **quebrados** em produção.

### Diagnóstico

Os XMLs em si **estão corretos** — `WebFetch` confirmou que ambos retornam XML válido com 24 URLs (page) e 75 URLs (post), com `lastmod 2026-05-15`. O `sitemap-index.xml` também está OK.

**A causa real:** O plugin `vite-plugin-sitemap.ts` insere em cada sitemap o cabeçalho:

```xml
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
```

(arquivo [vite-plugin-sitemap.ts:45](vite-plugin-sitemap.ts:45))

Mas **`/sitemap.xsl` não existe** — nem em `public/` nem em `dist/`. Quando o navegador abre o XML, busca o stylesheet em `/sitemap.xsl`, cai no SPA fallback do Cloudflare (`/*  /index.html  200` em [public/_redirects:12](public/_redirects:12)) e recebe o HTML da home no lugar de XSL. O navegador então falha em aplicar a transformação e mostra a página como "quebrada" (erro de parse XSL, página em branco, ou apenas texto sem formatação dependendo do navegador).

Googlebot e demais crawlers ignoram `<?xml-stylesheet?>` — por isso o SEO continua funcionando. O problema é puramente visual quando um humano abre a URL.

## Decisão

Remover a referência ao XSL inexistente. Não há benefício em adicionar uma folha XSL real — sitemaps são consumidos por crawlers, e a "página quebrada" é o único sintoma visível.

## Mudança

**Arquivo:** [vite-plugin-sitemap.ts](vite-plugin-sitemap.ts)

Linha 45, função `buildXmlHeader()`:

```ts
// ANTES
return `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

// DEPOIS
return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
```

Apenas isso. `sitemap-index.xml` (linha 215) já não tem stylesheet, não precisa de alteração.

### Alternativa (descartada)

Criar `public/sitemap.xsl` com transformação real. Mais trabalho, sem ganho real — sitemaps não são páginas para humanos.

## Pipeline para aplicar

Conforme [memory: project_build_pipeline](../../.claude/projects/.../memory/project_build_pipeline.md):

1. Editar `vite-plugin-sitemap.ts` (a única mudança)
2. Rodar `build-production.bat` → regenera `dist/page-sitemap.xml`, `dist/post-sitemap.xml`, `dist/sitemap-index.xml` sem o `<?xml-stylesheet?>`
3. Rodar `sincronizar-v2.bat` para sincronizar com o repo de produção (`comercial-jr-2`)
4. Cloudflare Pages faz deploy automaticamente

## Verificação

1. **Local após build:** abrir `dist/page-sitemap.xml` e `dist/post-sitemap.xml` — confirmar que a linha `<?xml-stylesheet ...?>` desapareceu.
2. **Em produção (após deploy):** abrir as duas URLs no navegador (Chrome/Firefox). Deve aparecer a árvore XML formatada nativamente pelo browser, sem erro de "stylesheet não encontrado".
3. **Validar SEO:** `https://www.xml-sitemaps.com/validate-xml-sitemap.html` com as duas URLs — devem passar.
4. **Google Search Console:** reenviar `sitemap-index.xml` para confirmar que continua sendo lido corretamente (já estava — só validar que nada quebrou).

## Arquivos críticos

- [vite-plugin-sitemap.ts](vite-plugin-sitemap.ts) — **único arquivo a editar**
- [public/_redirects](public/_redirects) — referência (SPA fallback que mascara a falha)
- `dist/page-sitemap.xml`, `dist/post-sitemap.xml` — regenerados pelo build
