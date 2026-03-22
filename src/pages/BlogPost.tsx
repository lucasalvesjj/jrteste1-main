import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { useBlogStore } from "@/stores/blogStore";
import { getCategoryLabel, getPostCategories } from "@/lib/blogCategories";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const init = useBlogStore((state) => state.init);
  const categoriesList = useBlogStore((state) => state.categories);
  const getPost = useBlogStore((state) => state.getPost);
  const getRelated = useBlogStore((state) => state.getRelated);
  const loading = useBlogStore((state) => state.loading);

  useEffect(() => {
    void init();
  }, [init]);

  const post = getPost(slug || "");

  if (loading && !post) {
    return (
      <Layout>
        <SEOHead title="Carregando post" />
        <div className="section-padding text-center">
          <h1 className="mb-4 font-heading text-3xl font-bold text-foreground">Carregando post...</h1>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <SEOHead title="Post não encontrado" />
        <div className="section-padding text-center">
          <h1 className="mb-4 font-heading text-3xl font-bold text-foreground">Post não encontrado</h1>
          <Link to="/blog" className="font-semibold text-primary">
            ← Voltar ao Blog
          </Link>
        </div>
      </Layout>
    );
  }

  const related = getRelated(post);
  const categories = getPostCategories(post);

  const isHtml = (content: string) => /<[a-z][\s\S]*>/i.test(content);

  const renderContent = (content: string) => {
    if (isHtml(content)) {
      return <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
    }

    return (
      <div className="prose prose-lg max-w-none">
        {content.split("\n").map((line, index) => {
          if (line.startsWith("### ")) {
            return (
              <h3 key={index} className="mb-2 mt-6 font-heading text-lg font-bold text-foreground">
                {line.slice(4)}
              </h3>
            );
          }

          if (line.startsWith("## ")) {
            return (
              <h2 key={index} className="mb-3 mt-8 font-heading text-xl font-bold text-foreground">
                {line.slice(3)}
              </h2>
            );
          }

          if (line.startsWith("- **")) {
            const match = line.match(/^- \*\*(.+?)\*\*:\s*(.+)$/);
            if (match) {
              return (
                <li key={index} className="mb-1 text-muted-foreground">
                  <strong className="text-foreground">{match[1]}:</strong> {match[2]}
                </li>
              );
            }
          }

          if (line.startsWith("- ")) {
            return (
              <li key={index} className="mb-1 flex items-start gap-2 text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                {line.slice(2)}
              </li>
            );
          }

          if (line.match(/^\d+\.\s/)) {
            return (
              <li key={index} className="mb-1 text-muted-foreground">
                {line}
              </li>
            );
          }

          if (line.trim() === "") {
            return <div key={index} className="h-2" />;
          }

          const boldedLine = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
          return (
            <p
              key={index}
              className="mb-2 leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: boldedLine }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <SEOHead
        title={post.seo.metaTitle.replace(" | Comercial JR", "")}
        description={post.seo.metaDescription}
        canonical={`/${post.slug}/`}
        type="article"
        article={{ publishedTime: post.date, section: categories.map((categoryId) => getCategoryLabel(categoryId, categoriesList)).join(", "), tags: post.tags }}
      />

      <article>
        <section className="bg-brand-gradient py-12 text-primary-foreground md:py-20">
          <div className="container-custom mx-auto max-w-3xl">
            <Link to="/blog" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground">
              <ArrowLeft className="h-4 w-4" />
              Blog
            </Link>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {categories.map((categoryId) => (
                <span key={categoryId} className="rounded-full bg-primary-foreground/20 px-2 py-1 text-xs font-semibold">
                  {getCategoryLabel(categoryId, categoriesList)}
                </span>
              ))}
              <span className="flex items-center gap-1 text-xs text-primary-foreground/60">
                <Calendar className="h-3 w-3" />
                {new Date(post.date).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-black leading-tight md:text-4xl">{post.title}</h1>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-custom mx-auto max-w-3xl">
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="mb-8 h-64 w-full rounded-xl object-cover md:h-96"
                loading="lazy"
              />
            )}
            {renderContent(post.content)}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </article>

      {related.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Posts Relacionados</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.seo.metaDescription,
            datePublished: post.date,
            author: { "@type": "Organization", name: "Comercial JR LTDA" },
            publisher: { "@type": "Organization", name: "Comercial JR LTDA" },
          }),
        }}
      />
    </Layout>
  );
};

export default BlogPostPage;
