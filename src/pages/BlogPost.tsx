import { useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { usePublishedBlog, getPostBySlug, getRelatedPosts } from "@/hooks/usePublishedBlog";
import { getCategoryLabel, getPostCategories } from "@/lib/blogCategories";
import JRLoader from "@/components/JRLoader";
import { useMediaStore } from "@/stores/mediaStore";
import { enrichContentImages } from "@/lib/contentImages";
import { injectHeadingIds, extractHeadings } from "@/lib/headingIds";
import type { TocHeading } from "@/lib/headingIds";
import TableOfContents from "@/components/TableOfContents";
import { usePublishedRedirects } from "@/hooks/usePublishedRedirects";
import { useRedirectStore } from "@/stores/redirectStore";

/** Fallback quando o slug não corresponde a nenhum post — loga 404 e exibe página NotFound */
const PostNotFound = () => {
  const location = useLocation();
  const log404 = useRedirectStore((s) => s.log404);

  useEffect(() => {
    log404(location.pathname, document.referrer, navigator.userAgent);
  }, [location.pathname, log404]);

  return (
    <Layout>
      <SEOHead title="Página não encontrada" robots="noindex,nofollow" />
      <div className="section-padding text-center min-h-[60vh] flex flex-col items-center justify-center">
        <span className="text-8xl mb-4">🔧</span>
        <h1 className="font-heading text-5xl font-black text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Ops! Página não encontrada.</p>
        <div className="flex gap-4">
          <Link to="/" className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Voltar ao Início
          </Link>
          <Link to="/blog" className="border border-border text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-accent transition-colors">
            Ver Blog
          </Link>
        </div>
      </div>
    </Layout>
  );
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { posts, categories: categoriesList, loading } = usePublishedBlog();
  const blogInitialized = !loading && posts.length >= 0;

  const { findMatch: redirectFindMatch, initialized: redirectInitialized } = usePublishedRedirects();
  const redirectIncrementHit = useRedirectStore((s) => s.incrementHit);

  // Catálogo de mídias para enriquecer <img> no HTML do post
  const mediaItems = useMediaStore((s) => s.items);
  const loadMedia  = useMediaStore((s) => s.loadItems);
  const mediaState = useMediaStore((s) => s.loadState);

  useEffect(() => {
    // Carrega o catálogo de mídias apenas uma vez (se ainda não carregado)
    if (mediaState === "idle") loadMedia();
  }, [loadMedia, mediaState]);

  const post = getPostBySlug(posts, slug || "");

  const isHtml = (content: string) => /<[a-z][\s\S]*>/i.test(content);

  // Enriquece imagens, injeta ids nos headings (defesa para posts sem migração) e extrai ToC
  const { processedHtml, headings } = useMemo((): { processedHtml: string; headings: TocHeading[] } => {
    if (!post || !isHtml(post.content)) return { processedHtml: post?.content ?? "", headings: [] };
    const enriched = enrichContentImages(post.content, mediaItems);
    const withIds = injectHeadingIds(enriched);
    return { processedHtml: withIds, headings: extractHeadings(withIds) };
  }, [post?.content, mediaItems]);

  // Quando o post não existe e o blog já inicializou, verifica regras de redirect
  useEffect(() => {
    if (loading || !blogInitialized || post || !redirectInitialized) return;

    const rule = redirectFindMatch(location.pathname);
    if (!rule) return;

    redirectIncrementHit(rule.id);

    if (rule.type === 410) {
      navigate("/gone", { replace: true, state: { originalUrl: location.pathname } });
    } else {
      const target = rule.targetUrl;
      if (target && target !== location.pathname) {
        navigate(target, { replace: true });
      }
    }
  }, [loading, blogInitialized, post, redirectInitialized, redirectFindMatch, redirectIncrementHit, location.pathname, navigate]);

  // Rola até o heading quando a URL contém hash (deep-link compartilhado ou direto)
  useEffect(() => {
    if (!post) return;
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [post?.slug]);

  if (loading && !post) {
    return (
      <Layout>
        <SEOHead title="Carregando post" />
        <JRLoader size="md" label="Carregando post..." />
      </Layout>
    );
  }

  if (!post && blogInitialized) {
    // Verifica se existe regra de redirect — se sim, o useEffect acima já redireciona
    const rule = redirectFindMatch(location.pathname);
    if (rule) {
      return (
        <Layout>
          <SEOHead title="Redirecionando..." />
          <JRLoader size="md" label="Redirecionando..." />
        </Layout>
      );
    }

    return <PostNotFound />;
  }

  if (!post) {
    return (
      <Layout>
        <SEOHead title="Carregando post" />
        <JRLoader size="md" label="Carregando post..." />
      </Layout>
    );
  }

  const related = getRelatedPosts(posts, post);
  const categories = getPostCategories(post);

  const renderContent = (content: string) => {
    if (isHtml(content)) {
      return <div className="prose prose-lg max-w-none [&_h2]:scroll-mt-20 md:[&_h2]:scroll-mt-28 [&_h3]:scroll-mt-20 md:[&_h3]:scroll-mt-28" dangerouslySetInnerHTML={{ __html: processedHtml }} />;
    }

    return (
      <div className="prose prose-lg max-w-none">
        {content.split("\n").map((line, index) => {
          if (line.startsWith("### ")) {
            return <h3 key={index}>{line.slice(4)}</h3>;
          }

          if (line.startsWith("## ")) {
            return <h2 key={index}>{line.slice(3)}</h2>;
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
        canonical={post.seo.canonical || `/${post.slug}/`}
        ogImage={post.seo.ogImage || undefined}
        type={post.seo.ogType || "article"}
        robots={post.seo.robots || undefined}
        article={{
          publishedTime: post.date,
          section: categories.map((categoryId) => getCategoryLabel(categoryId, categoriesList)).join(", "),
          tags: post.tags,
        }}
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

        <section className="px-4 md:px-8 pb-16 md:pb-24">
          <div className="container-custom mx-auto max-w-3xl">
            <TableOfContents headings={headings} />
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
                <BlogCard key={relatedPost.slug} post={relatedPost} categories={categoriesList} />
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
            description: post.seo.metaDescription || post.excerpt,
            datePublished: post.date,
            dateModified: post.updatedAt ?? post.date,
            image: post.seo.ogImage || post.image || `https://comercialjrltda.com.br/og-image.jpg`,
            url: `https://comercialjrltda.com.br/${post.slug}/`,
            inLanguage: "pt-BR",
            author: {
              "@type": "Organization",
              name: "Comercial JR LTDA",
              url: "https://comercialjrltda.com.br",
            },
            publisher: {
              "@type": "Organization",
              name: "Comercial JR LTDA",
              url: "https://comercialjrltda.com.br",
              logo: {
                "@type": "ImageObject",
                url: "https://comercialjrltda.com.br/logo.webp",
              },
            },
            keywords: post.tags.join(", "),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início",  item: "https://comercialjrltda.com.br/" },
              { "@type": "ListItem", position: 2, name: "Blog",    item: "https://comercialjrltda.com.br/blog/" },
              { "@type": "ListItem", position: 3, name: post.title, item: `https://comercialjrltda.com.br/${post.slug}/` },
            ],
          }),
        }}
      />
    </Layout>
  );
};

export default BlogPostPage;
