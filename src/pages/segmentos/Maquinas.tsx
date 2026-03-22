import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { useBlogStore } from "@/stores/blogStore";

const MaquinasPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);

  useEffect(() => {
    void init();
  }, [init]);

  const categoryPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "published" && post.categories.includes("maquinas"))
        .slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Máquinas"
        description="Máquinas elétricas e a combustão para profissionais. Motosserras, compressores, esmerilhadeiras, furadeiras e equipamentos."
        canonical="/segmentos/maquinas"
      />

      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Máquinas</h1>
          <p className="max-w-xl text-primary-foreground/80">
            Máquinas elétricas e a combustão para uso profissional e doméstico.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Máquinas e Equipamentos</h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            A Comercial JR oferece uma ampla variedade de máquinas para os mais diversos setores,
            com marcas confiáveis, garantia e assistência técnica.
          </p>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {[
              { title: "Motosserras", desc: "A gasolina e elétricas para corte de madeira, poda e derrubada." },
              { title: "Compressores", desc: "De ar comprimido para pintura, pneumática e uso industrial." },
              { title: "Esmerilhadeiras e Serras", desc: "Para corte, desbaste e acabamento em diversos materiais." },
              { title: "Soldas e Inversores", desc: "Equipamentos de soldagem para profissionais e amadores." },
              { title: "Furadeiras e Parafusadeiras", desc: "Elétricas e a bateria para perfuração e fixação." },
              { title: "Cortadores de Grama", desc: "Elétricos e a gasolina para manutenção de gramados." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-accent p-4">
                <h3 className="mb-1 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-3 font-heading text-xl font-bold text-foreground">Setores Atendidos</h3>
          <ul className="mb-8 space-y-2">
            {[
              "Agricultura e pecuária",
              "Construção civil",
              "Marcenaria e serralheria",
              "Manutenção industrial",
              "Jardinagem e paisagismo",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Máquinas</h2>
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

export default MaquinasPage;
