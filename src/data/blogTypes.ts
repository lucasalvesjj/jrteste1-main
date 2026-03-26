export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  imageAlt?: string;
  category?: string;
  categories: string[];
  tags: string[];
  date: string;
  status: "published" | "draft";
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
    robots?: string;
  };
}

export interface BlogCategory {
  id: string;
  label: string;
  color: "brand-green" | "brand-orange" | "brand-navy";
  hidden?: boolean;
}

export const defaultCategories: BlogCategory[] = [
  { id: "irrigacao", label: "Irrigação", color: "brand-green" },
  { id: "ferramentas", label: "Ferramentas", color: "brand-orange" },
  { id: "maquinas", label: "Máquinas", color: "brand-navy" },
];
