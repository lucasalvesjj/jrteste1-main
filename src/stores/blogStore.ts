import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultCategories } from "@/data/blogTypes";
import type { BlogCategory, BlogPost } from "@/data/blogTypes";
import {
  BlogExportFile,
  createBlogExportFile,
  fetchPublishedPosts,
  getFallbackPosts,
  normalizeImportedCategories,
  normalizePosts,
  type ParsedBlogImport,
} from "@/lib/blogContent";
import {
  normalizeCategoryId,
  isPostVisibleInAnyCategory,
} from "@/lib/blogCategories";

type BlogSource = "published-json" | "fallback-code" | "local-draft";

interface BlogStore {
  categories: BlogCategory[];
  posts: BlogPost[];
  initialized: boolean;
  loading: boolean;
  source: BlogSource;
  lastLoadedAt?: string;
  init: () => Promise<void>;
  reloadPublished: () => Promise<void>;
  resetToPublished: () => Promise<void>;
  addCategory: (label: string) => BlogCategory;
  toggleCategoryVisibility: (id: string) => void;
  addPost: (post: BlogPost) => void;
  updatePost: (slug: string, post: BlogPost) => void;
  deletePost: (slug: string) => void;
  getPost: (slug: string) => BlogPost | undefined;
  getPublished: () => BlogPost[];
  getByCategory: (cat: string) => BlogPost[];
  getRelated: (post: BlogPost, limit?: number) => BlogPost[];
  importPosts: (data: ParsedBlogImport) => void;
  exportFile: () => BlogExportFile;
  isSlugUnique: (slug: string, excludeSlug?: string) => boolean;
}

const loadPublishedPosts = async () => {
  try {
    const data = await fetchPublishedPosts();
    return { ...data, source: "published-json" as const };
  } catch {
    return {
      categories: normalizeImportedCategories(defaultCategories),
      posts: await getFallbackPosts(),
      source: "fallback-code" as const,
    };
  }
};

const hasDuplicateSlug = (posts: BlogPost[], slug: string, excludeSlug?: string) =>
  posts.some((post) => post.slug === slug && post.slug !== excludeSlug);

const nextCategoryColor = (categories: BlogCategory[]): BlogCategory["color"] => {
  const colorCycle: BlogCategory["color"][] = ["brand-orange", "brand-green", "brand-navy"];
  return colorCycle[categories.length % colorCycle.length];
};

const normalizePersistedState = (
  persisted: Partial<Pick<BlogStore, "categories" | "posts" | "initialized" | "source" | "lastLoadedAt">> | undefined
) => {
  const posts = normalizePosts(Array.isArray(persisted?.posts) ? persisted.posts : []);
  return {
    categories: normalizeImportedCategories(persisted?.categories),
    posts,
    // Se não há posts, força reinicialização para buscar do arquivo JSON
    initialized: Boolean(persisted?.initialized) && posts.length > 0,
    source: persisted?.source ?? "fallback-code",
    lastLoadedAt: persisted?.lastLoadedAt,
  };
};

export const useBlogStore = create<BlogStore>()(
  persist(
    (set, get) => ({
      categories: normalizeImportedCategories(defaultCategories),
      posts: [],
      initialized: false,
      loading: false,
      source: "fallback-code",
      lastLoadedAt: undefined,
      init: async () => {
        const state = get();

        if (state.initialized && state.posts.length > 0) {
          return;
        }

        set({ loading: true });
        const loaded = await loadPublishedPosts();
        set({
          categories: loaded.categories,
          posts: loaded.posts,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      reloadPublished: async () => {
        set({ loading: true });
        const loaded = await loadPublishedPosts();
        set({
          categories: loaded.categories,
          posts: loaded.posts,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      resetToPublished: async () => {
        set({ loading: true });
        const loaded = await loadPublishedPosts();
        set({
          categories: loaded.categories,
          posts: loaded.posts,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      toggleCategoryVisibility: (id) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, hidden: !cat.hidden } : cat
          ),
          source: "local-draft" as const,
          initialized: true,
        })),
      addCategory: (label) => {
        const trimmedLabel = label.trim();
        if (!trimmedLabel) {
          throw new Error("empty-category");
        }

        const state = get();
        const normalizedLabel = trimmedLabel.toLocaleLowerCase("pt-BR");
        const duplicateByLabel = state.categories.some((category) => category.label.toLocaleLowerCase("pt-BR") === normalizedLabel);
        if (duplicateByLabel) {
          throw new Error("duplicate-category");
        }

        const baseId = normalizeCategoryId(trimmedLabel);
        if (!baseId) {
          throw new Error("invalid-category");
        }

        let candidate = baseId;
        let counter = 2;
        while (state.categories.some((category) => category.id === candidate)) {
          candidate = `${baseId}-${counter}`;
          counter += 1;
        }

        const category: BlogCategory = {
          id: candidate,
          label: trimmedLabel,
          color: nextCategoryColor(state.categories),
        };

        set({
          categories: [...state.categories, category],
          source: "local-draft",
          initialized: true,
        });

        return category;
      },
      addPost: (post) =>
        set((state) => {
          if (hasDuplicateSlug(state.posts, post.slug)) {
            throw new Error(`Slug duplicado: ${post.slug}`);
          }

          return {
            posts: normalizePosts([post, ...state.posts]),
            source: "local-draft",
            initialized: true,
          };
        }),
      updatePost: (slug, post) =>
        set((state) => {
          if (hasDuplicateSlug(state.posts, post.slug, slug)) {
            throw new Error(`Slug duplicado: ${post.slug}`);
          }

          return {
            posts: normalizePosts(state.posts.map((item) => (item.slug === slug ? post : item))),
            source: "local-draft",
            initialized: true,
          };
        }),
      deletePost: (slug) =>
        set((state) => ({
          posts: state.posts.filter((item) => item.slug !== slug),
          source: "local-draft",
          initialized: true,
        })),
      getPost: (slug) => get().posts.find((post) => post.slug === slug),
      getPublished: () =>
        get().posts.filter(
          (post) =>
            post.status === "published" &&
            isPostVisibleInAnyCategory(post, get().categories)
        ),
      getByCategory: (cat) =>
        get().posts.filter(
          (post) =>
            post.categories.includes(cat) &&
            post.status === "published" &&
            isPostVisibleInAnyCategory(post, get().categories)
        ),
      getRelated: (post, limit = 3) =>
        get()
          .posts.filter(
            (item) =>
              item.slug !== post.slug &&
              (item.categories.some((category) => post.categories.includes(category)) ||
                item.tags.some((tag) => post.tags.includes(tag))) &&
              item.status === "published"
          )
          .slice(0, limit),
      importPosts: (data) =>
        set({
          categories: normalizeImportedCategories(data.categories),
          posts: normalizePosts(data.posts),
          source: "local-draft",
          initialized: true,
          lastLoadedAt: new Date().toISOString(),
        }),
      exportFile: () => createBlogExportFile(get().posts, get().categories),
      isSlugUnique: (slug, excludeSlug) => !hasDuplicateSlug(get().posts, slug, excludeSlug),
    }),
    {
      name: "comercial-jr-blog-working-copy",
      merge: (persistedState, currentState) => {
        const normalized = normalizePersistedState(
          (persistedState as Partial<Pick<BlogStore, "categories" | "posts" | "initialized" | "source" | "lastLoadedAt">>) || undefined
        );

        return {
          ...currentState,
          ...normalized,
        };
      },
      partialize: (state) => ({
        categories: state.categories,
        posts: state.posts,
        initialized: state.initialized,
        source: state.source,
        lastLoadedAt: state.lastLoadedAt,
      }),
    }
  )
);
