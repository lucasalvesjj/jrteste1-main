/**
 * verify-build.mjs
 * Verificacao automatica do build de producao.
 * 16 checks com severidades CRITICO, ALTO e MEDIO.
 *
 * Uso: import { verifyBuild } from './verify-build.mjs'
 *      ou: node scripts/verify-build.mjs
 *
 * Dependencias: apenas Node.js nativo (fs, path)
 */

import fs from "fs";
import path from "path";

const DIST = path.resolve(process.cwd(), "dist");
const ASSETS = path.join(DIST, "assets");
const DATA = path.join(DIST, "data");

// Limites
const MAX_TOTAL_JS_KB = 1000;
const MAX_SINGLE_CHUNK_KB = 300;

// Strings proibidas nos chunks (paths de import e nomes de pacotes -- nao sao minificados)
const ADMIN_STRINGS = ["/admin/", "pages/Admin", "/AdminMedia", "/AdminRedirects", "AdminPostEditor", "AdminSeoEditor"];
const TIPTAP_STRINGS = ["tiptap", "@tiptap", "prosemirror", "RichTextEditor"];
const SUPABASE_STRINGS = ["supabase"];

/**
 * Le todos os arquivos .js de dist/assets/ e retorna seus conteudos
 */
function readAllChunks() {
  if (!fs.existsSync(ASSETS)) return [];
  const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith(".js"));
  return files.map((f) => ({
    name: f,
    path: path.join(ASSETS, f),
    size: fs.statSync(path.join(ASSETS, f)).size,
    content: fs.readFileSync(path.join(ASSETS, f), "utf-8"),
  }));
}

/**
 * Verifica se algum chunk contem alguma das strings proibidas
 */
function chunksContainAny(chunks, strings) {
  const found = [];
  for (const chunk of chunks) {
    for (const str of strings) {
      if (chunk.content.toLowerCase().includes(str.toLowerCase())) {
        found.push({ chunk: chunk.name, match: str });
      }
    }
  }
  return found;
}

/**
 * Executa todos os 16 checks
 */
export function verifyBuild() {
  const results = [];
  const chunks = readAllChunks();

  function check(id, severity, description, fn) {
    try {
      const result = fn();
      results.push({
        id,
        severity,
        description,
        passed: result.passed,
        detail: result.detail || "",
      });
    } catch (err) {
      results.push({
        id,
        severity,
        description,
        passed: false,
        detail: `Erro: ${err.message}`,
      });
    }
  }

  // 1. index.html valido
  check(1, "CRITICO", "index.html valido", () => {
    const htmlPath = path.join(DIST, "index.html");
    if (!fs.existsSync(htmlPath)) return { passed: false, detail: "Arquivo nao encontrado" };
    const html = fs.readFileSync(htmlPath, "utf-8");
    const hasRoot = html.includes('<div id="root">');
    return { passed: hasRoot, detail: hasRoot ? "Contem <div id=\"root\">" : "Faltando <div id=\"root\">" };
  });

  // 2. Sem paths admin nos chunks
  check(2, "CRITICO", "Sem codigo admin nos chunks", () => {
    const found = chunksContainAny(chunks, ADMIN_STRINGS);
    if (found.length === 0) return { passed: true, detail: `0 ocorrencias em ${chunks.length} chunks` };
    const details = found.map((f) => `${f.chunk}: "${f.match}"`).join(", ");
    return { passed: false, detail: details };
  });

  // 3. Sem TipTap/editor
  check(3, "CRITICO", "Sem TipTap/editor nos chunks", () => {
    const found = chunksContainAny(chunks, TIPTAP_STRINGS);
    if (found.length === 0) return { passed: true, detail: `0 ocorrencias em ${chunks.length} chunks` };
    const details = found.map((f) => `${f.chunk}: "${f.match}"`).join(", ");
    return { passed: false, detail: details };
  });

  // 4. Sem Supabase
  check(4, "CRITICO", "Sem Supabase nos chunks", () => {
    const found = chunksContainAny(chunks, SUPABASE_STRINGS);
    if (found.length === 0) return { passed: true, detail: `0 ocorrencias em ${chunks.length} chunks` };
    const details = found.map((f) => `${f.chunk}: "${f.match}"`).join(", ");
    return { passed: false, detail: details };
  });

  // 5. blog-posts.json schema valido
  check(5, "CRITICO", "blog-posts.json schema valido", () => {
    const jsonPath = path.join(DATA, "blog-posts.json");
    if (!fs.existsSync(jsonPath)) return { passed: false, detail: "Arquivo nao encontrado" };
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    if (!data.posts || !Array.isArray(data.posts)) {
      return { passed: false, detail: "Faltando propriedade 'posts' (array)" };
    }
    if (!data.categories || !Array.isArray(data.categories)) {
      return { passed: false, detail: "Faltando propriedade 'categories' (array)" };
    }

    const published = data.posts.filter((p) => p.status === "published");
    if (published.length === 0) {
      return { passed: false, detail: "Nenhum post publicado encontrado" };
    }

    // Verificar schema de pelo menos o primeiro post
    const sample = published[0];
    const requiredFields = ["slug", "title", "date", "status"];
    const missing = requiredFields.filter((f) => !sample[f]);
    if (missing.length > 0) {
      return { passed: false, detail: `Post faltando campos: ${missing.join(", ")}` };
    }

    return { passed: true, detail: `${published.length} posts publicados, schema OK` };
  });

  // 6. Sitemaps
  check(6, "ALTO", "Sitemaps presentes", () => {
    const files = ["sitemap-index.xml", "page-sitemap.xml", "post-sitemap.xml"];
    const existing = files.filter((f) => fs.existsSync(path.join(DIST, f)));
    return {
      passed: existing.length === files.length,
      detail: `${existing.length}/${files.length} encontrados`,
    };
  });

  // 7. robots.txt
  check(7, "ALTO", "robots.txt correto", () => {
    const robotsPath = path.join(DIST, "robots.txt");
    if (!fs.existsSync(robotsPath)) return { passed: false, detail: "Arquivo nao encontrado" };
    const content = fs.readFileSync(robotsPath, "utf-8");
    const hasDisallow = content.includes("Disallow: /admin");
    return { passed: hasDisallow, detail: hasDisallow ? "Contem Disallow: /admin" : "Faltando Disallow: /admin" };
  });

  // 8. .htaccess funcional
  check(8, "CRITICO", ".htaccess com SPA fallback", () => {
    const htPath = path.join(DIST, ".htaccess");
    if (!fs.existsSync(htPath)) return { passed: false, detail: "Arquivo nao encontrado" };
    const content = fs.readFileSync(htPath, "utf-8");
    const hasFallback = content.includes("SPA Fallback");
    return { passed: hasFallback, detail: hasFallback ? "SPA Fallback presente" : "Faltando SPA Fallback" };
  });

  // 9. Favicon
  check(9, "MEDIO", "favicon.ico presente", () => {
    const exists = fs.existsSync(path.join(DIST, "favicon.ico"));
    return { passed: exists, detail: exists ? "OK" : "Nao encontrado" };
  });

  // 10. Bundle total < 1000 KB
  check(10, "ALTO", `Bundle JS total < ${MAX_TOTAL_JS_KB} KB`, () => {
    const totalBytes = chunks.reduce((sum, c) => sum + c.size, 0);
    const totalKB = Math.round(totalBytes / 1024);
    return {
      passed: totalKB < MAX_TOTAL_JS_KB,
      detail: `${totalKB} KB (limite: ${MAX_TOTAL_JS_KB} KB)`,
    };
  });

  // 11. Nenhum chunk > 300 KB
  check(11, "ALTO", `Nenhum chunk > ${MAX_SINGLE_CHUNK_KB} KB`, () => {
    const oversized = chunks.filter((c) => c.size / 1024 > MAX_SINGLE_CHUNK_KB);
    if (oversized.length === 0) {
      const largest = chunks.reduce((max, c) => (c.size > max.size ? c : max), { size: 0 });
      return { passed: true, detail: `Maior: ${largest.name} (${Math.round(largest.size / 1024)} KB)` };
    }
    const details = oversized.map((c) => `${c.name}: ${Math.round(c.size / 1024)} KB`).join(", ");
    return { passed: false, detail: details };
  });

  // 12. media-library.json removido
  check(12, "MEDIO", "media-library.json removido", () => {
    const exists = fs.existsSync(path.join(DATA, "media-library.json"));
    return { passed: !exists, detail: exists ? "AINDA PRESENTE (deveria ter sido removido)" : "Removido OK" };
  });

  // 13. blog-posts3.json removido
  check(13, "MEDIO", "blog-posts3.json removido", () => {
    const exists = fs.existsSync(path.join(DATA, "blog-posts3.json"));
    return { passed: !exists, detail: exists ? "AINDA PRESENTE (deveria ter sido removido)" : "Removido OK" };
  });

  // 14. version.json presente
  check(14, "MEDIO", "version.json presente", () => {
    const vPath = path.join(DIST, "version.json");
    if (!fs.existsSync(vPath)) return { passed: false, detail: "Nao encontrado" };
    try {
      const data = JSON.parse(fs.readFileSync(vPath, "utf-8"));
      if (!data.version || !data.buildDate) {
        return { passed: false, detail: "Schema incompleto (faltando version ou buildDate)" };
      }
      return { passed: true, detail: `v${data.version} - ${data.buildDate}` };
    } catch {
      return { passed: false, detail: "JSON invalido" };
    }
  });

  // 15. HSTS no .htaccess
  check(15, "ALTO", "HSTS configurado no .htaccess", () => {
    const htPath = path.join(DIST, ".htaccess");
    if (!fs.existsSync(htPath)) return { passed: false, detail: ".htaccess nao encontrado" };
    const content = fs.readFileSync(htPath, "utf-8");
    const hasHSTS = content.includes("Strict-Transport-Security");
    return { passed: hasHSTS, detail: hasHSTS ? "HSTS presente" : "HSTS ausente" };
  });

  // 16. CSP no .htaccess
  check(16, "ALTO", "CSP configurado no .htaccess", () => {
    const htPath = path.join(DIST, ".htaccess");
    if (!fs.existsSync(htPath)) return { passed: false, detail: ".htaccess nao encontrado" };
    const content = fs.readFileSync(htPath, "utf-8");
    const hasCSP = content.includes("Content-Security-Policy");
    return { passed: hasCSP, detail: hasCSP ? "CSP presente" : "CSP ausente" };
  });

  // Resumo
  const critical = results.filter((r) => r.severity === "CRITICO");
  const criticalFailed = critical.filter((r) => !r.passed);
  const totalPassed = results.filter((r) => r.passed).length;

  return {
    passed: criticalFailed.length === 0,
    total: results.length,
    totalPassed,
    criticalFailed: criticalFailed.length,
    results,
  };
}

/**
 * Imprime relatorio formatado no console
 */
export function printReport(report) {
  console.log("");
  console.log("=== VERIFICACAO DO BUILD ===");
  console.log("");

  for (const r of report.results) {
    const icon = r.passed ? "PASS" : "FAIL";
    const severity = r.passed ? "" : ` [${r.severity}]`;
    console.log(`  [${icon}]${severity} ${r.description}`);
    if (r.detail) {
      console.log(`         ${r.detail}`);
    }
  }

  console.log("");
  console.log(`Resultado: ${report.totalPassed}/${report.total} PASSED`);

  if (report.criticalFailed > 0) {
    console.log(`\n  ERRO: ${report.criticalFailed} check(s) CRITICO(s) falharam!`);
    console.log("  Build NAO esta pronta para deploy.\n");
  } else if (report.totalPassed < report.total) {
    console.log(`\n  AVISO: ${report.total - report.totalPassed} check(s) nao-criticos falharam.`);
    console.log("  Build pode ser usada, mas revise os avisos.\n");
  } else {
    console.log("\n  Build aprovada para deploy!\n");
  }
}

// Execucao direta: node scripts/verify-build.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"))) {
  const report = verifyBuild();
  printReport(report);
  process.exit(report.passed ? 0 : 1);
}
