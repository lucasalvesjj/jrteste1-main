import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { useBlogStore } from "@/stores/blogStore";

const FerramentasPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);

  useEffect(() => {
    void init();
  }, [init]);

  const categoryPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "published" && post.categories.includes("ferramentas"))
        .slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Ferramentas"
        description="Ferramentas manuais e elétricas para profissionais. Marcenaria, serralheria, construção civil e uso doméstico."
        canonical="/segmentos/ferramentas"
      />

      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Ferramentas</h1>
          <p className="max-w-xl text-primary-foreground/80">
            Ferramentas manuais e elétricas para marcenaria, serralheria, construção civil e uso doméstico.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Ferramentas Profissionais e Domésticas</h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            A Comercial JR possui o mais completo estoque de ferramentas da região, atendendo desde
            o profissional exigente até quem busca ferramentas para uso doméstico.
          </p>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {[
              { title: "Ferramentas Manuais", desc: "Chaves, alicates, martelos, serrotes, formões, limas, esquadros e toda linha manual." },
              { title: "Ferramentas Elétricas", desc: "Furadeiras, parafusadeiras, esmerilhadeiras, serras, lixadeiras e politrizes." },
              { title: "Instrumentos de Medição", desc: "Trenas, níveis, paquímetros, esquadros, prumos e medidores laser." },
              { title: "EPIs", desc: "Capacetes, luvas, óculos, protetores auriculares, máscaras e calçados de segurança." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-accent p-4">
                <h3 className="mb-1 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-3 font-heading text-xl font-bold text-foreground">Aplicações</h3>
          <ul className="mb-8 space-y-2">
            {[
              "Marcenaria e carpintaria profissional",
              "Serralheria e metalurgia",
              "Construção civil e reformas",
              "Manutenção industrial",
              "Reparos domésticos e hobby",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Ferramentas</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {categoryPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Ver mais
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default FerramentasPage;
