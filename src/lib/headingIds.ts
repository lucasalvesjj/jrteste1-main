export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function injectHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  const existingIdRegex = /<h[23][^>]*\bid="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = existingIdRegex.exec(html)) !== null) {
    seen.set(m[1], 1);
  }

  return html.replace(
    /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi,
    (match: string, level: string, attrs: string, inner: string) => {
      if (/\bid\s*=/i.test(attrs)) return match;

      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (!text) return match;

      let base = slugify(text);
      if (!base) base = `heading-${level}`;

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

export function extractHeadings(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3;
    const id = match[2];
    const text = match[3].replace(/<[^>]+>/g, "").trim();
    if (id && text) {
      headings.push({ id, text, level });
    }
  }

  return headings;
}
