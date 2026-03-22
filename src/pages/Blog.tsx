import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { categories } from "@/data/blogPosts";
import { useBlogStore } from "@/stores/blogStore";

const Blog = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);
  const loading = useBlogStore((state) => state.loading);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    void init();
  }, [init]);

  const filtered = useMemo(() => {
    return posts
      .filter((post) => post.status === "published")
      .filter((post) => selectedCat === "all" || post.category === selectedCat)
      .filter(
        (post) =>
          !search ||
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts, search, selectedCat]);

  return (
    <Layout>
      <SEOHead
        title="Blog"
        description="Dicas, tutoriais e informações sobre máquinas, ferramentas e irrigação. Conteúdo técnico e prático para profissionais."
        canonical="/blog"
      />

      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom text-center">
          <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Blog</h1>
          <p className="mx-auto max-w-xl text-primary-foreground/80">
            Conteúdo técnico e prático sobre máquinas, ferramentas e irrigação.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="mb-8 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar artigos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCat("all")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCat === "all" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-accent/80"
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCat(category.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCat === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground hover:bg-accent/80"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            {loading
              ? "Carregando posts..."
              : `${filtered.length} artigo${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visibleCount).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount((count) => count + 12)}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Carregar mais
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
