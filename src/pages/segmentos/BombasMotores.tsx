import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Gauge, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import BrandSlider from "@/components/BrandSlider";
import { useBlogStore } from "@/stores/blogStore";

const BRANDS = [
  { name: "WEG",        logo: "/brands/weg.svg" },
  { name: "Eletroplas", logo: "/brands/eletroplas.svg" },
  { name: "Schneider",  logo: "/brands/schneider.svg" },
  { name: "Anauger",    logo: "/brands/anauger.svg" },
  { name: "Lepono",     logo: "/brands/lepono.svg" },
];

const PRODUTOS = [
  { title: "Bombas Centrífugas", desc: "Para sistemas de irrigação, abastecimento e recalque. Alta vazão e pressão para lavouras, pastagens e propriedades rurais." },
  { title: "Bombas Periféricas", desc: "Compactas e versáteis para abastecimento doméstico e pequenas irrigações. Fácil instalação e alta durabilidade." },
  { title: "Bombas Submersas", desc: "Ideais para poços semi-artesianos e artesianos, cisternas e reservatórios subterrâneos." },
  { title: "Motobombas a Gasolina e Diesel", desc: "Para locais sem energia elétrica ou como backup. Alta capacidade de vazão para uso agrícola e de emergência." },
  { title: "Motores Elétricos Monofásicos", desc: "Para acionar bombas, compressores, trituradores e equipamentos em instalações residenciais e comerciais." },
  { title: "Motores Elétricos Trifásicos", desc: "Para uso industrial, agrícola e comercial. Alta eficiência energética, disponíveis em diversas potências." },
];

const APLICACOES = [
  "Irrigação por aspersão e gotejamento em lavouras e cafezais",
  "Abastecimento de água em propriedades rurais e residências",
  "Recalque de água em reservatórios e caixas d'água",
  "Acionamento de poços semi-artesianos e artesianos",
  "Sistemas de combate a incêndio e pressurização",
  "Uso industrial: resfriamento, lavagem e transferência de líquidos",
];

const BombasMotoresPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);
  useEffect(() => { void init(); }, [init]);

  const categoryPosts = useMemo(
    () => posts.filter((p) => p.status === "published" && p.categories.includes("bombas-motores")).slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Bombas e Motores Elétricos em Castelo ES | WEG, Schneider, Lepono — Comercial JR"
        description="Bombas centrífugas, submersas, periféricas e motores elétricos monofásicos e trifásicos em Castelo ES. Marcas WEG, Schneider, Lepono, Anauger e Eletroplas. Atendimento técnico especializado."
        canonical="/segmentos/bombas-e-motores"
      />

      {/* Hero */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="h-10 w-10 text-primary-foreground/80" />
            <h1 className="font-heading text-4xl font-black md:text-5xl">Bombas e Motores</h1>
          </div>
          <p className="max-w-2xl text-primary-foreground/80 text-lg">
            Bombas centrífugas, periféricas, submersas, motobombas e motores elétricos para
            irrigação, abastecimento e uso industrial. Marcas líderes com suporte técnico em
            Castelo – ES.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
            Bombas e Motores para Agricultura, Abastecimento e Indústria — Castelo ES
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            A <strong>Comercial JR</strong>, em Castelo – ES, disponibiliza uma linha completa de
            bombas e motores elétricos para atender desde o produtor rural que precisa de uma bomba
            para irrigação até o profissional que busca um motor trifásico para uso industrial.
          </p>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Com 41 anos de experiência no mercado capixaba, nossa equipe auxilia no dimensionamento
            correto da bomba ou motor para cada aplicação — considerando vazão, altura manométrica,
            tipo de instalação e fonte de energia disponível. Trabalhamos com as marcas mais
            confiáveis do setor, com garantia e suporte pós-venda.
          </p>

          <BrandSlider brands={BRANDS} title="Marcas que trabalhamos em bombas e motores" />
        </div>
      </section>

      {/* Produtos */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Linha de Produtos</h2>
          <p className="mb-6 text-muted-foreground">Equipamentos disponíveis em estoque para pronta entrega:</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUTOS.map((item) => (
              <div key={item.title} className="rounded-lg bg-accent p-5">
                <h3 className="mb-2 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aplicações */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Aplicações e Setores Atendidos</h2>
          <ul className="mb-8 grid gap-3 md:grid-cols-2">
            {APLICACOES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-accent/60 p-6">
            <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Precisa de orientação técnica?</h3>
            <p className="mb-4 text-muted-foreground">
              Nossa equipe auxilia no dimensionamento correto da bomba ou motor ideal para sua
              necessidade. Entre em contato antes de comprar e evite erros de especificação.
            </p>
            <Link to="/contato"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Falar com nossa equipe <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Loja */}
      <section className="section-padding bg-brand-gradient text-primary-foreground">
        <div className="container-custom flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:justify-between">
          <div>
            <h2 className="mb-2 font-heading text-2xl font-bold">Compre Bombas e Motores Online</h2>
            <p className="max-w-xl text-primary-foreground/80">
              Acesse nossa loja virtual e encontre bombas e motores com entrega para todo o Brasil.
            </p>
          </div>
          <a
            href="https://loja.comercialjrltda.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-[hsl(240_60%_25%)] transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-5 w-5" />
            Acessar a Loja Online
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Bombas e Motores</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {categoryPosts.map((post) => <BlogCard key={post.slug} post={post} />)}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BombasMotoresPage;
