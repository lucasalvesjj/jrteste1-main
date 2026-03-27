// ──────────────────────────────────────────────────────────────
// githubPublish.ts — Publica blog-posts.json direto no GitHub
// ──────────────────────────────────────────────────────────────
// Usa a API REST do GitHub para criar/atualizar o arquivo
// public/data/blog-posts.json no repositório de produção.
// O token fica apenas no localStorage do navegador — nunca vai
// para nenhum servidor externo além da API oficial do GitHub.
// ──────────────────────────────────────────────────────────────

export interface GitHubPublishConfig {
  /** Personal Access Token com permissão contents:write */
  token: string;
  /** Ex: "lucasalvesjj/comercial-jr-2" */
  repo: string;
  /** Branch de produção. Padrão: "main" */
  branch?: string;
  /** Caminho do arquivo no repositório. Padrão: "public/data/blog-posts.json" */
  filePath?: string;
}

export interface GitHubPublishResult {
  ok: boolean;
  commitUrl?: string;
  error?: string;
}

const GITHUB_CONFIG_KEY = "comercial-jr-github-publish-config";
export const DEFAULT_FILE_PATH = "public/data/blog-posts.json";
export const DEFAULT_BRANCH = "main";

export function loadGitHubConfig(): GitHubPublishConfig | null {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GitHubPublishConfig;
  } catch {
    return null;
  }
}

export function saveGitHubConfig(config: GitHubPublishConfig): void {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

export function clearGitHubConfig(): void {
  localStorage.removeItem(GITHUB_CONFIG_KEY);
}

/** Converte string para base64 preservando UTF-8 */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * Publica o conteúdo JSON no GitHub via API REST.
 * Busca o SHA atual do arquivo (se existir) para fazer update,
 * ou cria um novo arquivo se não existir ainda.
 */
export async function publishToGitHub(
  jsonContent: string,
  config: GitHubPublishConfig
): Promise<GitHubPublishResult> {
  const { token, repo } = config;
  const branch = config.branch || DEFAULT_BRANCH;
  const filePath = config.filePath || DEFAULT_FILE_PATH;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  // 1. Busca SHA atual do arquivo (necessário para update)
  let sha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (getRes.ok) {
      const data = (await getRes.json()) as { sha?: string };
      sha = data.sha;
    } else if (getRes.status !== 404) {
      const err = (await getRes.json()) as { message?: string };
      return { ok: false, error: `Erro ao buscar arquivo: ${err.message ?? getRes.status}` };
    }
  } catch (e) {
    return { ok: false, error: `Falha de rede ao buscar arquivo: ${String(e)}` };
  }

  // 2. Cria ou atualiza o arquivo
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const body: Record<string, unknown> = {
    message: `blog: publica posts via admin (${now})`,
    content: toBase64(jsonContent),
    branch,
  };
  if (sha) body.sha = sha;

  try {
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const err = (await putRes.json()) as { message?: string };
      return { ok: false, error: `Erro ao publicar: ${err.message ?? putRes.status}` };
    }

    const result = (await putRes.json()) as { commit?: { html_url?: string } };
    return { ok: true, commitUrl: result.commit?.html_url };
  } catch (e) {
    return { ok: false, error: `Falha de rede ao publicar: ${String(e)}` };
  }
}
