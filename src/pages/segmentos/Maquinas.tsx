import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { getPostsByCategory } from "@/data/blogPosts";

const MaquinasPage = () => {
  const posts = getPostsByCategory("maquinas").slice(0, 3);

  return (
    <Layout>
      <SEOHead title="Máquinas" description="Máquinas elétricas e a combustão para profissionais. Motosserras, compressores, esmerilhadeiras, furadeiras e equipamentos." canonical="/segmentos/maquinas" />

      <section className="bg-brand-gradient text-primary-foreground py-16 md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4 inline-block">← Segmentos</Link>
          <h1 className="font-heading text-4xl md:text-5xl font-black mb-4">Máquinas</h1>
          <p className="text-primary-foreground/80 max-w-xl">Máquinas elétricas e a combustão para uso profissional e doméstico.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Máquinas e Equipamentos</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            A Comercial JR oferece uma ampla variedade de máquinas para os mais diversos setores. Das marcas mais confiáveis do mercado, com garantia e assistência técnica.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { title: "Motosserras", desc: "A gasolina e elétricas para corte de madeira, poda e derrubada." },
              { title: "Compressores", desc: "De ar comprimido para pintura, pneumática e uso industrial." },
              { title: "Esmerilhadeiras e Serras", desc: "Para corte, desbaste e acabamento em diversos materiais." },
              { title: "Soldas e Inversores", desc: "Equipamentos de soldagem para profissionais e amadores." },
              { title: "Furadeiras e Parafusadeiras", desc: "Elétricas e a bateria para perfuração e fixação." },
              { title: "Cortadores de Grama", desc: "Elétricos e a gasolina para manutenção de gramados." },
            ].map((item) => (
              <div key={item.title} className="bg-accent rounded-lg p-4">
                <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="font-heading text-xl font-bold text-foreground mb-3">Setores Atendidos</h3>
          <ul className="space-y-2 mb-8">
            {[
              "Agricultura e pecuária",
              "Construção civil",
              "Marcenaria e serralheria",
              "Manutenção industrial",
              "Jardinagem e paisagismo",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Artigos sobre Máquinas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => <BlogCard key={post.slug} post={post} />)}
            </div>
            <div className="text-center mt-8">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Ver mais <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default MaquinasPage;
