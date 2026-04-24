/**
 * build-production.mjs
 * Orquestrador completo de build de producao para Comercial JR LTDA.
 *
 * Fluxo: pre-flight → versao → build → cleanup → version.json →
 *        changelog → verificacao → ZIPs → build-history → git tag → resumo
 *
 * Uso:
 *   npm run build:production              → incrementa patch (1.0.0 → 1.0.1)
 *   npm run build:production -- --minor   → incrementa minor (1.0.1 → 1.1.0)
 *   npm run build:production -- --major   → incrementa major (1.1.0 → 2.0.0)
 *   npm run build:production -- --no-tag  → nao cria git tag
 *
 * Dependencias npm adicionais: ZERO (usa apenas Node.js nativo)
 * Requisitos do sistema: Node.js >= 18, git, PowerShell (Windows) ou tar (Linux/Mac)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// ============================================================
// Configuracao
// ============================================================
const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const DEPLOY = path.join(ROOT, "deploy");
const PKG_PATH = path.join(ROOT, "package.json");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");
const HISTORY_PATH = path.join(DEPLOY, "build-history.json");

// Arquivos a remover do dist apos o build
const FILES_TO_REMOVE = [
  "data/blog-posts3.json",
  "data/media-library.json",
];

// ============================================================
// Utilidades
// ============================================================

function log(msg) {
  console.log(`  ${msg}`);
}

function logStep(step, title) {
  console.log(`\n[${"=".repeat(3)} ETAPA ${step} ${"=".repeat(3)}] ${title}`);
}

function logOk(msg) {
  console.log(`  [OK] ${msg}`);
}

function logErr(msg) {
  console.error(`  [ERRO] ${msg}`);
}

function exec(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: "pipe", ...opts }).trim();
}

function fileExists(p) {
  return fs.existsSync(p);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dirSize(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

// ============================================================
// Versionamento
// ============================================================

function incrementVersion(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return "1.0.0";
  }
  switch (type) {
    case "major":
      return `${parts[0] + 1}.0.0`;
    case "minor":
      return `${parts[0]}.${parts[1] + 1}.0`;
    case "patch":
    default:
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

function getVersionType(args) {
  if (args.includes("--major")) return "major";
  if (args.includes("--minor")) return "minor";
  return "patch";
}

function getGitHash() {
  try {
    return exec("git rev-parse --short HEAD");
  } catch {
    return "unknown";
  }
}

function getGitBranch() {
  try {
    return exec("git rev-parse --abbrev-ref HEAD");
  } catch {
    return "unknown";
  }
}

function getLastTag() {
  try {
    return exec("git describe --tags --abbrev=0 2>/dev/null");
  } catch {
    return null;
  }
}

function getCommitsSinceTag(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : "HEAD~20..HEAD";
    const output = exec(`git log ${range} --oneline --no-decorate`);
    return output
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        const spaceIdx = l.indexOf(" ");
        return {
          hash: l.substring(0, spaceIdx),
          message: l.substring(spaceIdx + 1),
        };
      });
  } catch {
    return [];
  }
}

// ============================================================
// Changelog
// ============================================================

function generateChangelogEntry(version, date, commits, buildInfo) {
  const lines = [];
  lines.push(`## [${version}] - ${date}`);
  lines.push("");

  if (commits.length > 0) {
    lines.push("### Alteracoes");
    for (const c of commits) {
      // Filtra commits de auto-backup e merge
      const msg = c.message.trim();
      if (msg.startsWith("auto backup") || msg.startsWith("Merge")) continue;
      lines.push(`- ${msg}`);
    }
    // Se todos foram filtrados, adiciona nota generica
    if (lines[lines.length - 1] === "### Alteracoes") {
      lines.push("- Atualizacoes e melhorias gerais");
    }
  } else {
    lines.push("### Alteracoes");
    lines.push("- Release inicial de producao");
  }

  lines.push("");
  lines.push("### Build Info");
  lines.push(`- Git: ${buildInfo.gitHash} (${buildInfo.gitBranch})`);
  lines.push(`- Bundle: ${buildInfo.bundleJS} JS, ${buildInfo.bundleCSS} CSS`);
  lines.push(`- Posts: ${buildInfo.postCount} publicados`);
  lines.push("");

  return lines.join("\n");
}

function updateChangelog(entry) {
  let existing = "";
  if (fileExists(CHANGELOG_PATH)) {
    existing = fs.readFileSync(CHANGELOG_PATH, "utf-8");
  }

  // Se ja tem header, insere a nova entrada apos o header
  if (existing.startsWith("# Changelog")) {
    const headerEnd = existing.indexOf("\n\n");
    if (headerEnd > -1) {
      const header = existing.substring(0, headerEnd + 2);
      const rest = existing.substring(headerEnd + 2);
      fs.writeFileSync(CHANGELOG_PATH, header + entry + "---\n\n" + rest, "utf-8");
    } else {
      fs.writeFileSync(CHANGELOG_PATH, existing + "\n\n" + entry, "utf-8");
    }
  } else {
    // Cria novo CHANGELOG
    fs.writeFileSync(CHANGELOG_PATH, `# Changelog\n\n${entry}`, "utf-8");
  }
}

// ============================================================
// ZIP
// ============================================================

function createZip(sourcePath, zipPath, excludeDirs = []) {
  ensureDir(path.dirname(zipPath));

  // Remove ZIP anterior se existir
  if (fileExists(zipPath)) fs.unlinkSync(zipPath);

  const isWindows = process.platform === "win32";

  if (isWindows) {
    // PowerShell: cria ZIP nativo
    try {
      if (excludeDirs.length > 0) {
        // Cria pasta temporaria sem as dirs excluidas
        const tempDir = path.join(ROOT, ".build-temp");
        rmrf(tempDir);
        ensureDir(tempDir);

        // Copia dist para temp excluindo pastas
        const excludeSet = new Set(excludeDirs);
        copyDirFiltered(sourcePath, tempDir, excludeSet);

        const psCmd = `Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipPath}' -Force`;
        exec(`powershell -NoProfile -Command "${psCmd}"`);

        rmrf(tempDir);
      } else {
        const psCmd = `Compress-Archive -Path '${sourcePath}\\*' -DestinationPath '${zipPath}' -Force`;
        exec(`powershell -NoProfile -Command "${psCmd}"`);
      }
      return true;
    } catch (err) {
      logErr(`PowerShell ZIP falhou: ${err.message}`);
      return false;
    }
  } else {
    // Linux/Mac: tar
    try {
      const excludeArgs = excludeDirs.map((d) => `--exclude='${d}'`).join(" ");
      exec(`tar -czf "${zipPath}" ${excludeArgs} -C "${sourcePath}" .`);
      return true;
    } catch (err) {
      logErr(`tar falhou: ${err.message}`);
      return false;
    }
  }
}

function copyDirFiltered(src, dest, excludeSet) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeSet.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      ensureDir(destPath);
      copyDirFiltered(srcPath, destPath, new Set()); // so exclui no primeiro nivel
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============================================================
// Build History
// ============================================================

function updateBuildHistory(entry) {
  ensureDir(DEPLOY);
  let history = [];
  if (fileExists(HISTORY_PATH)) {
    try {
      history = readJson(HISTORY_PATH);
    } catch {
      history = [];
    }
  }
  history.unshift(entry);
  writeJson(HISTORY_PATH, history);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const noTag = args.includes("--no-tag");
  const versionType = getVersionType(args);

  console.log("================================================");
  console.log("  COMERCIAL JR - Build de Producao");
  console.log("================================================");

  // ===========================================================
  // ETAPA 1 -- Pre-flight Checks
  // ===========================================================
  logStep(1, "Pre-flight Checks");

  // Node.js >= 18
  const nodeVersion = parseInt(process.versions.node.split(".")[0]);
  if (nodeVersion < 18) {
    logErr(`Node.js ${process.versions.node} detectado. Requer >= 18.`);
    process.exit(1);
  }
  logOk(`Node.js ${process.versions.node}`);

  // node_modules
  if (!fileExists(path.join(ROOT, "node_modules"))) {
    logErr("node_modules nao encontrado. Execute: npm install");
    process.exit(1);
  }
  logOk("node_modules presente");

  // blog-posts.json
  const blogPath = path.join(ROOT, "public", "data", "blog-posts.json");
  if (!fileExists(blogPath)) {
    logErr("public/data/blog-posts.json nao encontrado.");
    process.exit(1);
  }
  try {
    const blog = readJson(blogPath);
    const postCount = blog.posts ? blog.posts.filter((p) => p.status === "published").length : 0;
    logOk(`blog-posts.json valido (${postCount} posts publicados)`);
  } catch {
    logErr("blog-posts.json invalido (JSON parse failed)");
    process.exit(1);
  }

  // ===========================================================
  // ETAPA 2 -- Versao
  // ===========================================================
  logStep(2, "Versionamento");

  const pkg = readJson(PKG_PATH);
  const oldVersion = pkg.version || "0.0.0";
  const isFirstRelease = oldVersion === "0.0.0";
  const newVersion = isFirstRelease ? "1.0.0" : incrementVersion(oldVersion, versionType);

  pkg.version = newVersion;
  writeJson(PKG_PATH, pkg);

  log(`${oldVersion} → ${newVersion} (${isFirstRelease ? "release inicial" : versionType})`);
  logOk(`package.json atualizado para v${newVersion}`);

  // ===========================================================
  // ETAPA 3 -- Limpeza
  // ===========================================================
  logStep(3, "Limpeza");

  rmrf(DIST);
  logOk("dist/ removido");

  // ===========================================================
  // ETAPA 4 -- Build Vite
  // ===========================================================
  logStep(4, "Build Vite");

  try {
    execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    logErr("vite build falhou!");
    // Restaura versao em caso de falha
    pkg.version = oldVersion;
    writeJson(PKG_PATH, pkg);
    process.exit(1);
  }

  if (!fileExists(path.join(DIST, "index.html"))) {
    logErr("Build nao gerou dist/index.html");
    pkg.version = oldVersion;
    writeJson(PKG_PATH, pkg);
    process.exit(1);
  }
  logOk("Build concluido");

  // ===========================================================
  // ETAPA 5 -- Post-build Cleanup
  // ===========================================================
  logStep(5, "Post-build Cleanup");

  for (const file of FILES_TO_REMOVE) {
    const fullPath = path.join(DIST, file);
    if (fileExists(fullPath)) {
      fs.unlinkSync(fullPath);
      logOk(`Removido: dist/${file}`);
    }
  }

  // ===========================================================
  // ETAPA 5.5 -- Pre-render (SSG via Puppeteer)
  // ===========================================================
  logStep("5.5", "Pre-render (SSG via Puppeteer)");

  try {
    const { prerender } = await import("./prerender.mjs");
    const prerenderReport = await prerender();
    logOk(`${prerenderReport.succeeded}/${prerenderReport.total} rotas pre-renderizadas`);
    if (prerenderReport.failed > 0) {
      log(`[AVISO] ${prerenderReport.failed} rota(s) falharam no pre-render.`);
    }
  } catch (err) {
    log(`[AVISO] Pre-render falhou: ${err.message}`);
    log("Build continua — site funcionara como SPA (schema.org nao estara no HTML estatico).");
  }

  // ===========================================================
  // ETAPA 6 -- Gerar version.json
  // ===========================================================
  logStep(6, "Gerar version.json");

  const gitHash = getGitHash();
  const gitBranch = getGitBranch();
  const buildDate = new Date().toISOString();
  const buildNumber = (() => {
    if (fileExists(HISTORY_PATH)) {
      try {
        const h = readJson(HISTORY_PATH);
        return h.length + 1;
      } catch {
        return 1;
      }
    }
    return 1;
  })();

  const versionData = {
    version: newVersion,
    buildDate,
    buildNumber,
    gitHash,
    gitBranch,
  };

  writeJson(path.join(DIST, "version.json"), versionData);
  logOk(`version.json → v${newVersion} (build #${buildNumber})`);

  // ===========================================================
  // ETAPA 7 -- Changelog
  // ===========================================================
  logStep(7, "Changelog");

  // Calcular info do bundle para o changelog
  const assetsDir = path.join(DIST, "assets");
  let bundleJS = "0 KB";
  let bundleCSS = "0 KB";
  let postCount = 0;

  if (fileExists(assetsDir)) {
    const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
    const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"));
    const jsSize = jsFiles.reduce((s, f) => s + fs.statSync(path.join(assetsDir, f)).size, 0);
    const cssSize = cssFiles.reduce((s, f) => s + fs.statSync(path.join(assetsDir, f)).size, 0);
    bundleJS = formatBytes(jsSize);
    bundleCSS = formatBytes(cssSize);
  }

  try {
    const blogData = readJson(path.join(DIST, "data", "blog-posts.json"));
    postCount = blogData.posts ? blogData.posts.filter((p) => p.status === "published").length : 0;
  } catch {
    postCount = 0;
  }

  const lastTag = getLastTag();
  const commits = getCommitsSinceTag(lastTag);
  const dateStr = new Date().toISOString().split("T")[0];

  const changelogEntry = generateChangelogEntry(newVersion, dateStr, commits, {
    gitHash,
    gitBranch,
    bundleJS,
    bundleCSS,
    postCount,
  });

  updateChangelog(changelogEntry);
  logOk(`CHANGELOG.md atualizado (${commits.length} commits desde ${lastTag || "inicio"})`);

  // ===========================================================
  // ETAPA 8 -- Verificacao
  // ===========================================================
  logStep(8, "Verificacao");

  const { verifyBuild, printReport } = await import("./verify-build.mjs");
  const report = verifyBuild();
  printReport(report);

  if (!report.passed) {
    logErr("Verificacao CRITICA falhou! ZIPs nao serao gerados.");
    // Restaura versao
    pkg.version = oldVersion;
    writeJson(PKG_PATH, pkg);
    process.exit(1);
  }

  // ===========================================================
  // ETAPA 9 -- Gerar ZIPs
  // ===========================================================
  logStep(9, "Gerar ZIPs");

  ensureDir(DEPLOY);

  const zipFullName = `comercial-jr-${newVersion}.zip`;
  const zipCodeName = `comercial-jr-${newVersion}-code-only.zip`;
  const zipFullPath = path.join(DEPLOY, zipFullName);
  const zipCodePath = path.join(DEPLOY, zipCodeName);

  // ZIP completo (com media e blog)
  log("Gerando ZIP completo (com media)...");
  const fullOk = createZip(DIST, zipFullPath);
  if (fullOk) {
    const size = formatBytes(fs.statSync(zipFullPath).size);
    logOk(`${zipFullName} (${size})`);
  } else {
    logErr(`Falha ao gerar ${zipFullName}`);
  }

  // ZIP code-only (sem media/ e sem blog/)
  log("Gerando ZIP code-only (sem media)...");
  const codeOk = createZip(DIST, zipCodePath, ["media", "blog"]);
  if (codeOk) {
    const size = formatBytes(fs.statSync(zipCodePath).size);
    logOk(`${zipCodeName} (${size})`);
  } else {
    logErr(`Falha ao gerar ${zipCodeName}`);
  }

  // ===========================================================
  // ETAPA 10 -- Build History
  // ===========================================================
  logStep(10, "Build History");

  const historyEntry = {
    version: newVersion,
    date: buildDate,
    buildNumber,
    gitHash,
    gitBranch,
    bundleJS,
    bundleCSS,
    postCount,
    zipFull: fullOk ? zipFullName : null,
    zipFullSize: fullOk ? formatBytes(fs.statSync(zipFullPath).size) : null,
    zipCode: codeOk ? zipCodeName : null,
    zipCodeSize: codeOk ? formatBytes(fs.statSync(zipCodePath).size) : null,
  };

  updateBuildHistory(historyEntry);
  logOk(`deploy/build-history.json atualizado (build #${buildNumber})`);

  // ===========================================================
  // ETAPA 11 -- Git Tag
  // ===========================================================
  logStep(11, "Git Tag");

  if (noTag) {
    log("--no-tag: pulando criacao de tag");
  } else {
    const tagName = `v${newVersion}`;
    try {
      exec(`git tag -a ${tagName} -m "Release ${tagName}"`);
      logOk(`Tag ${tagName} criada`);
      log(`Para enviar ao remote: git push origin ${tagName}`);
    } catch (err) {
      if (err.message.includes("already exists")) {
        log(`Tag ${tagName} ja existe, pulando`);
      } else {
        logErr(`Falha ao criar tag: ${err.message}`);
      }
    }
  }

  // ===========================================================
  // ETAPA 12 -- Resumo
  // ===========================================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n================================================");
  console.log("  RESUMO DA BUILD");
  console.log("================================================");
  console.log(`  Versao:     v${newVersion}`);
  console.log(`  Build:      #${buildNumber}`);
  console.log(`  Git:        ${gitHash} (${gitBranch})`);
  console.log(`  Bundle:     ${bundleJS} JS, ${bundleCSS} CSS`);
  console.log(`  Posts:      ${postCount} publicados`);
  console.log(`  Checks:     ${report.totalPassed}/${report.total} passed`);
  if (fullOk) console.log(`  ZIP full:   deploy/${zipFullName} (${formatBytes(fs.statSync(zipFullPath).size)})`);
  if (codeOk) console.log(`  ZIP code:   deploy/${zipCodeName} (${formatBytes(fs.statSync(zipCodePath).size)})`);
  console.log(`  Tempo:      ${elapsed}s`);
  console.log(`  Changelog:  CHANGELOG.md`);
  console.log("================================================\n");
}

main().catch((err) => {
  console.error("\n[ERRO FATAL]", err.message);
  process.exit(1);
});
