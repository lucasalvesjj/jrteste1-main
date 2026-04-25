export interface BlogPost {
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

export const blogPosts: BlogPost[] = [];
