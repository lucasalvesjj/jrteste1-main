import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/blog-posts.json'), 'utf-8'));

const lines = [];
lines.push(`export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  category: string;
  tags: string[];
  date: string;
  status: "published" | "draft";
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage?: string;
  };
}

export const categories = [
  { id: "irrigacao", label: "Irrigação", color: "brand-green" },
  { id: "ferramentas", label: "Ferramentas", color: "brand-orange" },
  { id: "maquinas", label: "Máquinas", color: "brand-navy" },
] as const;

export const blogPosts: BlogPost[] = [`);

for (const p of data.posts) {
  const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const escContent = (s) => (s || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const category = (p.categories && p.categories[0]) || p.category || '';
  const tags = JSON.stringify(p.tags || []);

  lines.push(`  {
    slug: "${esc(p.slug)}",
    title: "${esc(p.title)}",
    excerpt: "${esc(p.excerpt)}",
    image: "${esc(p.image)}",
    content: \`${escContent(p.content)}\`,
    category: "${esc(category)}",
    tags: ${tags},
    date: "${esc(p.date)}",
    status: "${p.status}",
    seo: {
      metaTitle: "${esc(p.seo?.metaTitle)}",
      metaDescription: "${esc(p.seo?.metaDescription)}",
    },
  },`);
}

lines.push(`];
`);

fs.writeFileSync(path.join(ROOT, 'src/data/blogPosts.ts'), lines.join('\n'), 'utf-8');
console.log(`blogPosts.ts regenerated with ${data.posts.length} posts`);
