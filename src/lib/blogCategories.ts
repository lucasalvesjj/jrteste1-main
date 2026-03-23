import { defaultCategories } from "@/data/blogTypes";
import type { BlogCategory, BlogPost } from "@/data/blogTypes";

const categoryLabelMap: Record<string, string> = {
  irrigacao: "Irrigação",
  ferramentas: "Ferramentas",
  maquinas: "Máquinas",
};

const colorToneMap: Record<BlogCategory["color"], string> = {
  "brand-green": "bg-brand-green/10 text-brand-green",
  "brand-orange": "bg-brand-orange/10 text-brand-orange",
  "brand-navy": "bg-primary/10 text-primary",
};

const colorEmojiMap: Record<BlogCategory["color"], string> = {
  "brand-green": "🌱",
  "brand-orange": "🔧",
  "brand-navy": "⚙️",
};

export const normalizeCategoryId = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const normalizeCategories = (categories: BlogCategory[] = defaultCategories) =>
  categories.map((category) => ({
    ...category,
    label: categoryLabelMap[category.id] ?? category.label,
  }));

export const normalizedCategories = normalizeCategories();

const findCategory = (categoryId: string, categories: BlogCategory[] = normalizedCategories) =>
  categories.find((category) => category.id === categoryId);

export const getCategoryLabel = (categoryId: string, categories: BlogCategory[] = normalizedCategories) =>
  findCategory(categoryId, categories)?.label ?? categoryId;

export const getPostCategories = (post: Pick<BlogPost, "categories" | "category">) => {
  if (Array.isArray(post.categories) && post.categories.length > 0) {
    return [...new Set(post.categories)];
  }

  return post.category ? [post.category] : [];
};

export const getPrimaryCategory = (post: Pick<BlogPost, "categories" | "category">) =>
  getPostCategories(post)[0];

export const getCategoryTone = (categoryId?: string, categories: BlogCategory[] = normalizedCategories) => {
  const category = categoryId ? findCategory(categoryId, categories) : undefined;
  return category ? colorToneMap[category.color] : "bg-primary/10 text-primary";
};

export const getCategoryEmoji = (categoryId?: string, categories: BlogCategory[] = normalizedCategories) => {
  const category = categoryId ? findCategory(categoryId, categories) : undefined;
  return category ? (colorEmojiMap[category.color] ?? "📦") : "📦";
};

export const getVisibleCategories = (categories: BlogCategory[] = normalizedCategories) =>
  categories.filter((category) => !category.hidden);

export const isPostVisibleInAnyCategory = (
  post: Pick<BlogPost, "categories" | "category">,
  categories: BlogCategory[] = normalizedCategories
) => {
  const postCats = getPostCategories(post);
  // post sem categoria nenhuma → visível normalmente
  if (postCats.length === 0) return true;
  // basta ter ao menos uma categoria visível
  return postCats.some((catId) => {
    const found = categories.find((c) => c.id === catId);
    return !found || !found.hidden;
  });
};


