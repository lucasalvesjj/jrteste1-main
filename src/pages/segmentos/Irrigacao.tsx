import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { getPostsByCategory } from "@/data/blogPosts";

const IrrigacaoPage = () => {
  const posts = getPostsByCategory("irrigacao").slice(0, 3);

  return (
    <Layout>
      <SEOHead title="Irrigação" description="Soluções completas em irrigação para lavouras de café, pastagem e jardinagem. Bombas, aspersores, tubulações e acessórios." canonical="/segmentos/irrigacao" />

      <section className="bg-brand-gradient text-primary-foreground py-16 md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="text-sm text-primary-foreground/60 hover:text-primary-foreground mb-4 inline-block">← Segmentos</Link>
          <h1 className="font-heading text-4xl md:text-5xl font-black mb-4">Irrigação</h1>
          <p className="text-primary-foreground/80 max-w-xl">Tudo para irrigação de lavouras, pastagem e jardinagem com as melhores marcas do mercado.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="prose prose-lg max-w-none">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Soluções em Irrigação</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A Comercial JR oferece uma linha completa de produtos para irrigação, atendendo desde pequenas hortas até grandes lavouras de café e pastagem. Trabalhamos com as melhores marcas do mercado para garantir eficiência e durabilidade.
            </p>

            <h3 className="font-heading text-xl font-bold text-foreground mb-3">Tipos de Irrigação</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                { title: "Irrigação por Aspersão", desc: "Sistema que distribui água simulando chuva. Ideal para pastagens, grãos e hortaliças." },
                { title: "Irrigação por Gotejamento", desc: "Aplica água diretamente na raiz da planta. Econômico e eficiente para fruticultura e café." },
                { title: "Microaspersão", desc: "Combina aspersão e gotejamento. Indicado para fruticultura e cultivo protegido." },
                { title: "Irrigação por Pivô Central", desc: "Sistema mecanizado para grandes áreas. Alta eficiência e automação." },
              ].map((item) => (
                <div key={item.title} className="bg-accent rounded-lg p-4">
                  <h4 className="font-heading font-bold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="font-heading text-xl font-bold text-foreground mb-3">Aplicações no Setor Agrícola</h3>
            <ul className="space-y-2 mb-8">
              {[
                "Irrigação de cafezais em todas as fases de desenvolvimento",
                "Manejo de pastagem para pecuária",
                "Cultivo de hortaliças e fruticultura",
                "Sistemas de fertirrigação",
                "Irrigação de jardins e paisagismo",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <span className="w-2 h-2 bg-brand-green rounded-full mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="font-heading text-xl font-bold text-foreground mb-3">Produtos Disponíveis</h3>
            <p className="text-muted-foreground mb-4">
              Oferecemos bombas d'água centrífugas, submersas e periféricas, tubulações PVC e PE, aspersores, registros, conexões, mangueiras e todos os acessórios para montagem completa do sistema de irrigação.
            </p>
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Artigos sobre Irrigação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => <BlogCard key={post.slug} post={post} />)}
            </div>
            <div className="text-center mt-8">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Ver mais artigos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default IrrigacaoPage;
