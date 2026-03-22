import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { useBlogStore } from "@/stores/blogStore";

const IrrigacaoPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);

  useEffect(() => {
    void init();
  }, [init]);

  const categoryPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "published" && post.categories.includes("irrigacao"))
        .slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Irrigação"
        description="Soluções completas em irrigação para lavouras de café, pastagem e jardinagem. Bombas, aspersores, tubulações e acessórios."
        canonical="/segmentos/irrigacao"
      />

      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Irrigação</h1>
          <p className="max-w-xl text-primary-foreground/80">
            Tudo para irrigação de lavouras, pastagem e jardinagem com as melhores marcas do mercado.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="prose prose-lg max-w-none">
            <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Soluções em Irrigação</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              A Comercial JR oferece uma linha completa de produtos para irrigação, atendendo desde
              pequenas hortas até grandes lavouras de café e pastagem.
            </p>

            <h3 className="mb-3 font-heading text-xl font-bold text-foreground">Tipos de Irrigação</h3>
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {[
                { title: "Irrigação por Aspersão", desc: "Sistema que distribui água simulando chuva. Ideal para pastagens, grãos e hortaliças." },
                { title: "Irrigação por Gotejamento", desc: "Aplica água diretamente na raiz da planta. Econômico e eficiente para fruticultura e café." },
                { title: "Microaspersão", desc: "Combina aspersão e gotejamento. Indicado para fruticultura e cultivo protegido." },
                { title: "Irrigação por Pivô Central", desc: "Sistema mecanizado para grandes áreas. Alta eficiência e automação." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg bg-accent p-4">
                  <h4 className="mb-1 font-heading font-bold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="mb-3 font-heading text-xl font-bold text-foreground">Aplicações no Setor Agrícola</h3>
            <ul className="mb-8 space-y-2">
              {[
                "Irrigação de cafezais em todas as fases de desenvolvimento",
                "Manejo de pastagem para pecuária",
                "Cultivo de hortaliças e fruticultura",
                "Sistemas de fertirrigação",
                "Irrigação de jardins e paisagismo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="mb-3 font-heading text-xl font-bold text-foreground">Produtos Disponíveis</h3>
            <p className="text-muted-foreground">
              Oferecemos bombas d&apos;água, tubulações PVC e PE, aspersores, registros, conexões e
              acessórios para montagem completa do sistema.
            </p>
          </div>
        </div>
      </section>

      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Irrigação</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {categoryPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Ver mais artigos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default IrrigacaoPage;
