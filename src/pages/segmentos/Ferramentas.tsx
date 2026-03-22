import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { getPostsByCategory } from "@/data/blogPosts";

const FerramentasPage = () => {
  const posts = getPostsByCategory("ferramentas").slice(0, 3);

  return (
    <Layout>
      <SEOHead title="Ferramentas" description="Ferramentas manuais e elétricas para profissionais. Marcenaria, serralheria, construção civil e uso doméstico." canonical="/segmentos/ferramentas" />

      <section className="bg-brand-gradient text-primary-foreground py-16 md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4 inline-block">← Segmentos</Link>
          <h1 className="font-heading text-4xl md:text-5xl font-black mb-4">Ferramentas</h1>
          <p className="text-primary-foreground/80 max-w-xl">Ferramentas manuais e elétricas para marcenaria, serralheria, construção civil e uso doméstico.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Ferramentas Profissionais e Domésticas</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            A Comercial JR possui o mais completo estoque de ferramentas da região, atendendo desde o profissional exigente até quem busca ferramentas para uso doméstico. Trabalhamos com as melhores marcas nacionais e internacionais.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { title: "Ferramentas Manuais", desc: "Chaves, alicates, martelos, serrotes, formões, limas, esquadros e toda linha de ferramentas manuais." },
              { title: "Ferramentas Elétricas", desc: "Furadeiras, parafusadeiras, esmerilhadeiras, serras, lixadeiras e politrizes." },
              { title: "Instrumentos de Medição", desc: "Trenas, níveis, paquímetros, esquadros, prumos e medidores laser." },
              { title: "EPIs", desc: "Capacetes, luvas, óculos, protetores auriculares, máscaras e calçados de segurança." },
            ].map((item) => (
              <div key={item.title} className="bg-accent rounded-lg p-4">
                <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="font-heading text-xl font-bold text-foreground mb-3">Aplicações</h3>
          <ul className="space-y-2 mb-8">
            {[
              "Marcenaria e carpintaria profissional",
              "Serralheria e metalurgia",
              "Construção civil e reformas",
              "Manutenção industrial",
              "Reparos domésticos e hobby",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-brand-orange rounded-full mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Artigos sobre Ferramentas</h2>
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

export default FerramentasPage;
