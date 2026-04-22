/**
 * Utilitário isomórfico de IDs para headings.
 * Roda em Node (scripts de migração) e no browser (via Vite).
 * Sem dependências externas — JS puro com regex.
 */

/**
 * Converte texto em slug URL-safe compatível com pt-BR.
 * Ex: "Proteção Individual" → "protecao-individual"
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Injeta id="slug" nos <h2> e <h3> que ainda não têm id.
 * - Preserva id manual existente.
 * - Garante unicidade global no post (dedup com -2, -3, etc.).
 * - Pré-escaneia ids manuais para evitar colisão com os gerados.
 * @param {string} html
 * @returns {string}
 */
export function injectHeadingIds(html) {
  const seen = new Map();

  // Pré-escaneia ids manuais existentes para evitar colisões
  const existingIdRegex = /<h[23][^>]*\bid="([^"]+)"/gi;
  let m;
  while ((m = existingIdRegex.exec(html)) !== null) {
    seen.set(m[1], 1);
  }

  return html.replace(
    /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi,
    (match, level, attrs, inner) => {
      // Já tem id manual — preserva sem alteração
      if (/\bid\s*=/i.test(attrs)) return match;

      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (!text) return match;

      let base = slugify(text);
      if (!base) base = `heading-${level}`;

      // Garante unicidade: se "introducao" já existe, tenta "introducao-2", "-3"...
      let id = base;
      let n = 1;
      while (seen.has(id)) {
        n++;
        id = `${base}-${n}`;
      }
      seen.set(id, 1);

      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );
}

/**
 * Extrai lista de headings já com id do HTML processado.
 * Operação leve — apenas lê ids, sem slugify.
 * @param {string} html
 * @returns {{ id: string, text: string, level: number }[]}
 */
export function extractHeadings(html) {
  const headings = [];
  const regex = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    const text = match[3].replace(/<[^>]+>/g, "").trim();
    if (id && text) {
      headings.push({ id, text, level });
    }
  }

  return headings;
}
