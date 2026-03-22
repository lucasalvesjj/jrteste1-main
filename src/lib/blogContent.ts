import { BlogPost, blogPosts as fallbackPosts } from "@/data/blogPosts";

export const BLOG_DATA_PATH = "/data/blog-posts.json";
export const BLOG_EXPORT_VERSION = 1;

export interface BlogExportFile {
  version: number;
  exportedAt: string;
  source: string;
  posts: BlogPost[];
}

const hasValidSeo = (seo: unknown): seo is BlogPost["seo"] => {
  if (!seo || typeof seo !== "object") return false;
  const value = seo as Record<string, unknown>;
  return typeof value.metaTitle === "string" && typeof value.metaDescription === "string";
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
    typeof post.category === "string" &&
    Array.isArray(post.tags) &&
    post.tags.every((tag) => typeof tag === "string") &&
    typeof post.date === "string" &&
    (post.status === "published" || post.status === "draft") &&
    hasValidSeo(post.seo)
  );
};

export const normalizePosts = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const createBlogExportFile = (posts: BlogPost[]): BlogExportFile => ({
  version: BLOG_EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  source: BLOG_DATA_PATH,
  posts: normalizePosts(posts),
});

export const parseBlogImport = (raw: string): BlogPost[] => {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    if (!parsed.every(isBlogPost)) {
      throw new Error("invalid-post-array");
    }

    return normalizePosts(parsed);
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "posts" in parsed &&
    Array.isArray((parsed as { posts: unknown[] }).posts)
  ) {
    const posts = (parsed as { posts: unknown[] }).posts;

    if (!posts.every(isBlogPost)) {
      throw new Error("invalid-post-array");
    }

    return normalizePosts(posts);
  }

  throw new Error("invalid-json-shape");
};

export const fetchPublishedPosts = async (): Promise<BlogPost[]> => {
  const response = await fetch(BLOG_DATA_PATH, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`http-${response.status}`);
  }

  const text = await response.text();
  return parseBlogImport(text);
};

export const getFallbackPosts = () => normalizePosts(fallbackPosts);
