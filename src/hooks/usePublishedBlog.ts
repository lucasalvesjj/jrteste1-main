/**
 * usePublishedBlog.ts
 * Hook público read-only que busca dados do JSON publicado.
 * NÃO usa zustand, persist, nem localStorage.
 * Páginas públicas devem usar este hook em vez de useBlogStore.
 */

import { useState, useEffect } from "react";
import type { BlogPost, BlogCategory } from "@/data/blogTypes";
import { defaultCategories } from "@/data/blogTypes";
import { fetchPublishedPosts, normalizeImportedCategories } from "@/lib/blogContent";
import { isPostVisibleInAnyCategory } from "@/lib/blogCategories";

interface PublishedBlogState {
  posts: BlogPost[];
  categories: BlogCategory[];
  loading: boolean;
  error: string | null;
}

// Cache em memória do módulo — evita re-fetch a cada navegação SPA
let moduleCache: { posts: BlogPost[]; categories: BlogCategory[] } | null = null;

export function usePublishedBlog(): PublishedBlogState {
  const [state, setState] = useState<PublishedBlogState>(() =>
    moduleCache
      ? { posts: moduleCache.posts, categories: moduleCache.categories, loading: false, error: null }
      : { posts: [], categories: normalizeImportedCategories(defaultCategories), loading: true, error: null }
  );

  useEffect(() => {
    if (moduleCache) return;

    let cancelled = false;

    fetchPublishedPosts()
      .then((data) => {
        if (cancelled) return;
        moduleCache = { posts: data.posts, categories: data.categories };
        setState({ posts: data.posts, categories: data.categories, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "fetch-failed",
        }));
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}

// ── Seletores puros ─────────────────────────────────────────────────────────

export function getPublishedPosts(posts: BlogPost[], categories: BlogCategory[]): BlogPost[] {
  return posts
    .filter((p) => p.status === "published" && isPostVisibleInAnyCategory(p, categories))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(posts: BlogPost[], slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(
  posts: BlogPost[],
  categories: BlogCategory[],
  categoryId: string,
): BlogPost[] {
  return posts.filter(
    (p) =>
      p.categories.includes(categoryId) &&
      p.status === "published" &&
      isPostVisibleInAnyCategory(p, categories),
  );
}

export function getRelatedPosts(posts: BlogPost[], post: BlogPost, limit = 3): BlogPost[] {
  return posts
    .filter(
      (item) =>
        item.slug !== post.slug &&
        (item.categories.some((c) => post.categories.includes(c)) ||
          item.tags.some((t) => post.tags.includes(t))) &&
        item.status === "published",
    )
    .slice(0, limit);
}
