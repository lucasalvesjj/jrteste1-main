import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BlogPost } from "@/data/blogPosts";
import {
  BlogExportFile,
  createBlogExportFile,
  fetchPublishedPosts,
  getFallbackPosts,
  normalizePosts,
} from "@/lib/blogContent";

type BlogSource = "published-json" | "fallback-code" | "local-draft";

interface BlogStore {
  posts: BlogPost[];
  initialized: boolean;
  loading: boolean;
  source: BlogSource;
  lastLoadedAt?: string;
  init: () => Promise<void>;
  reloadPublished: () => Promise<void>;
  resetToPublished: () => Promise<void>;
  addPost: (post: BlogPost) => void;
  updatePost: (slug: string, post: BlogPost) => void;
  deletePost: (slug: string) => void;
  getPost: (slug: string) => BlogPost | undefined;
  getPublished: () => BlogPost[];
  getByCategory: (cat: string) => BlogPost[];
  getRelated: (post: BlogPost, limit?: number) => BlogPost[];
  importPosts: (posts: BlogPost[]) => void;
  exportFile: () => BlogExportFile;
  isSlugUnique: (slug: string, excludeSlug?: string) => boolean;
}

const loadPublishedPosts = async () => {
  try {
    const posts = await fetchPublishedPosts();
    return { posts, source: "published-json" as const };
  } catch {
    return { posts: getFallbackPosts(), source: "fallback-code" as const };
  }
};

export const useBlogStore = create<BlogStore>()(
  persist(
    (set, get) => ({
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
          posts: loaded.posts,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      addPost: (post) =>
        set((state) => ({
          posts: normalizePosts([post, ...state.posts]),
          source: "local-draft",
          initialized: true,
        })),
      updatePost: (slug, post) =>
        set((state) => ({
          posts: normalizePosts(state.posts.map((item) => (item.slug === slug ? post : item))),
          source: "local-draft",
          initialized: true,
        })),
      deletePost: (slug) =>
        set((state) => ({
          posts: state.posts.filter((item) => item.slug !== slug),
          source: "local-draft",
          initialized: true,
        })),
      getPost: (slug) => get().posts.find((post) => post.slug === slug),
      getPublished: () => get().posts.filter((post) => post.status === "published"),
      getByCategory: (cat) => get().posts.filter((post) => post.category === cat && post.status === "published"),
      getRelated: (post, limit = 3) =>
        get()
          .posts.filter(
            (item) =>
              item.slug !== post.slug &&
              (item.category === post.category || item.tags.some((tag) => post.tags.includes(tag))) &&
              item.status === "published"
          )
          .slice(0, limit),
      importPosts: (posts) =>
        set({
          posts: normalizePosts(posts),
          source: "local-draft",
          initialized: true,
          lastLoadedAt: new Date().toISOString(),
        }),
      exportFile: () => createBlogExportFile(get().posts),
      isSlugUnique: (slug, excludeSlug) =>
        !get().posts.some((post) => post.slug === slug && post.slug !== excludeSlug),
    }),
    {
      name: "comercial-jr-blog-working-copy",
      partialize: (state) => ({
        posts: state.posts,
        initialized: state.initialized,
        source: state.source,
        lastLoadedAt: state.lastLoadedAt,
      }),
    }
  )
);
