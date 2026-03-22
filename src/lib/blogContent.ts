import { defaultCategories } from "@/data/blogTypes";
import type { BlogCategory, BlogPost } from "@/data/blogTypes";
import { normalizeCategories } from "@/lib/blogCategories";

export const BLOG_DATA_PATH = "/data/blog-posts.json";
export const BLOG_EXPORT_VERSION = 1;

export interface BlogExportFile {
  version: number;
  exportedAt: string;
  source: string;
  categories: BlogCategory[];
  posts: BlogPost[];
}

export interface ParsedBlogImport {
  categories: BlogCategory[];
  posts: BlogPost[];
}

const hasValidSeo = (seo: unknown): seo is BlogPost["seo"] => {
  if (!seo || typeof seo !== "object") return false;
  const value = seo as Record<string, unknown>;
  return typeof value.metaTitle === "string" && typeof value.metaDescription === "string";
};

const isBlogCategory = (value: unknown): value is BlogCategory => {
  if (!value || typeof value !== "object") return false;

  const category = value as Record<string, unknown>;

  return (
    typeof category.id === "string" &&
    typeof category.label === "string" &&
    (category.color === "brand-green" || category.color === "brand-orange" || category.color === "brand-navy")
  );
};

export const isBlogPost = (value: unknown): value is BlogPost => {
  if (!value || typeof value !== "object") return false;

  const post = value as Record<string, unknown>;

  return (
    typeof post.slug === "string" &&
    typeof post.title === "string" &&
    typeof post.excerpt === "string" &&
    typeof post.content === "string" &&
    (typeof post.image === "string" || typeof post.image === "undefined") &&
    (typeof post.category === "string" || typeof post.category === "undefined") &&
    Array.isArray(post.categories) &&
    post.categories.every((category) => typeof category === "string") &&
    Array.isArray(post.tags) &&
    post.tags.every((tag) => typeof tag === "string") &&
    typeof post.date === "string" &&
    (post.status === "published" || post.status === "draft") &&
    hasValidSeo(post.seo)
  );
};

const normalizePost = (post: BlogPost): BlogPost => {
  const categories =
    Array.isArray(post.categories) && post.categories.length > 0
      ? [...new Set(post.categories)]
      : post.category
        ? [post.category]
        : [];

  return {
    ...post,
    category: categories[0],
    categories,
  };
};

const normalizeLegacyPost = (item: unknown) => {
  if (item && typeof item === "object" && "category" in item && !("categories" in item)) {
    const legacy = item as BlogPost & { category: string };
    return { ...legacy, categories: legacy.category ? [legacy.category] : [] };
  }

  return item;
};

export const normalizePosts = (posts: BlogPost[]) =>
  [...posts]
    .map(normalizePost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const normalizeImportedCategories = (categories?: BlogCategory[]) => {
  if (!categories?.length) {
    return normalizeCategories(defaultCategories);
  }

  return normalizeCategories(categories);
};

export const createBlogExportFile = (posts: BlogPost[], categories: BlogCategory[]): BlogExportFile => ({
  version: BLOG_EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  source: BLOG_DATA_PATH,
  categories: normalizeImportedCategories(categories),
  posts: normalizePosts(posts),
});

export const parseBlogImport = (raw: string): ParsedBlogImport => {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    const normalizedArray = parsed.map(normalizeLegacyPost);

    if (!normalizedArray.every(isBlogPost)) {
      throw new Error("invalid-post-array");
    }

    return {
      categories: normalizeImportedCategories(defaultCategories),
      posts: normalizePosts(normalizedArray),
    };
  }

  if (parsed && typeof parsed === "object" && "posts" in parsed && Array.isArray((parsed as { posts: unknown[] }).posts)) {
    const data = parsed as { posts: unknown[]; categories?: unknown[] };
    const normalizedArray = data.posts.map(normalizeLegacyPost);

    if (!normalizedArray.every(isBlogPost)) {
      throw new Error("invalid-post-array");
    }

    const categories =
      Array.isArray(data.categories) && data.categories.every(isBlogCategory)
        ? normalizeImportedCategories(data.categories)
        : normalizeImportedCategories(defaultCategories);

    return {
      categories,
      posts: normalizePosts(normalizedArray),
    };
  }

  throw new Error("invalid-json-shape");
};

export const fetchPublishedPosts = async (): Promise<ParsedBlogImport> => {
  const response = await fetch(BLOG_DATA_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`http-${response.status}`);
  }

  const text = await response.text();
  return parseBlogImport(text);
};

export const getFallbackPosts = async () => [];
