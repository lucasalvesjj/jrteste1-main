import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Zap, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import BlogCard from "@/components/BlogCard";
import BrandSlider from "@/components/BrandSlider";
import { useBlogStore } from "@/stores/blogStore";

const BRANDS = [
  { name: "DeWalt",       logo: "/brands/dewalt.svg" },
  { name: "Black+Decker", logo: "/brands/blackdecker.svg" },
  { name: "Stanley",      logo: "/brands/stanley.svg" },
  { name: "Makita",       logo: "/brands/makita.svg" },
  { name: "Bosch",        logo: "/brands/bosch.svg" },
];

const PRODUTOS = [
  { title: "Furadeiras e Parafusadeiras", desc: "Elétricas e a bateria para perfuração em madeira, metal e alvenaria. Furadeiras de impacto, parafusadeiras sem fio e combinadas.", link: "https://loja.comercialjrltda.com.br/furadeira" },
  { title: "Marteletes", desc: "Marteletes elétricos e roto-percursores para demolição, quebra de piso e perfuração em concreto armado.", link: "https://loja.comercialjrltda.com.br/martelete" },
  { title: "Esmerilhadeiras", desc: "Esmerilhadeiras angulares de 4½\" a 9\" para corte, desbaste e rebarbamento em metal, pedra e concreto.", link: "https://loja.comercialjrltda.com.br/esmerilhadeira" },
  { title: "Serras Elétricas", desc: "Serra circular, serra tico-tico e serra mármore para cortes precisos em madeira, cerâmica e metal.", link: "https://loja.comercialjrltda.com.br/serra-circular" },
  { title: "Lixadeiras e Politrizes", desc: "Lixadeiras orbitais, de cinta e politrizes para acabamento profissional em madeira, metal e lataria.", link: "https://loja.comercialjrltda.com.br/lixadeira" },
  { title: "Compressores de Ar", desc: "Compressores de 2 a 100 litros para pintura, limpeza, pneumática e ferramentas de ar comprimido em geral." },
  { title: "Sopradores Térmicos", desc: "Sopradores de ar quente para remoção de tinta, soldagem de termoplásticos e acabamentos.", link: "https://loja.comercialjrltda.com.br/soprador-termico" },
  { title: "Chaves Elétricas e Impacto", desc: "Chaves de impacto elétricas e pneumáticas para montagem e desmontagem de parafusos de alta resistência.", link: "https://loja.comercialjrltda.com.br/chave-eletrica" },
];

const SETORES = [
  "Construção civil — obras, reformas, acabamentos e instalações",
  "Marcenaria profissional e fabricação de móveis",
  "Serralheria e metalurgia — corte e desbaste de metais",
  "Oficinas mecânicas e manutenção veicular",
  "Agropecuária — manutenção de galpões, cercas e equipamentos",
  "Uso doméstico — reformas e reparos residenciais",
];

const MaquinasPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);
  useEffect(() => { void init(); }, [init]);

  const categoryPosts = useMemo(
    () => posts.filter((p) => p.status === "published" && p.categories.includes("maquinas")).slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Máquinas Elétricas em Castelo ES | DeWalt, Bosch, Makita — Comercial JR"
        description="Máquinas elétricas profissionais em Castelo ES: furadeiras, marteletes, esmerilhadeiras, serras, compressores, politrizes e mais. Marcas DeWalt, Bosch, Makita, Black & Decker e Stanley. 41 anos de tradição."
        canonical="/segmentos/maquinas/"
        ogImage="/og-image.jpg"
      />

      {/* Hero */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-10 w-10 text-primary-foreground/80" />
            <h1 className="font-heading text-4xl font-black md:text-5xl">Máquinas Elétricas</h1>
          </div>
          <p className="max-w-2xl text-primary-foreground/80 text-lg">
            Máquinas elétricas profissionais para construção civil, marcenaria, serralheria e
            agropecuária. As melhores marcas do mercado, com garantia e suporte técnico em
            Castelo e no sul do Espírito Santo.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
            Máquinas Elétricas para Profissionais e Uso Doméstico — Castelo ES
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            A <strong>Comercial JR</strong> oferece a mais completa linha de máquinas elétricas do sul
            do Espírito Santo. Em nosso estoque você encontra desde furadeiras simples para reparos
            domésticos até marteletes demolidores e compressores de alta capacidade para obras
            profissionais.
          </p>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Trabalhamos com as marcas mais confiáveis do setor, garantindo qualidade, durabilidade e
            assistência técnica para os equipamentos. Nossos consultores estão prontos para indicar
            a máquina certa para cada aplicação, considerando potência, frequência de uso e
            orçamento disponível.
          </p>

          <BrandSlider brands={BRANDS} title="Marcas de máquinas elétricas que trabalhamos" />
        </div>
      </section>

      {/* Produtos */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Linha de Máquinas Elétricas</h2>
          <p className="mb-6 text-muted-foreground">Produtos disponíveis em loja física e na nossa loja online:</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUTOS.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-background p-4 shadow-sm flex flex-col">
                <h3 className="mb-1 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="mb-3 text-sm text-muted-foreground flex-1">{item.desc}</p>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Ver na loja <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setores */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Setores Atendidos</h2>
          <ul className="mb-8 grid gap-3 md:grid-cols-2">
            {SETORES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Loja */}
      <section className="section-padding bg-brand-gradient text-primary-foreground">
        <div className="container-custom flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:justify-between">
          <div>
            <h2 className="mb-2 font-heading text-2xl font-bold">Compre Máquinas Elétricas Online</h2>
            <p className="max-w-xl text-primary-foreground/80">
              Acesse nossa loja virtual e compre furadeiras, esmerilhadeiras, serras e muito mais
              com entrega para todo o Brasil.
            </p>
          </div>
          <a
            href="https://loja.comercialjrltda.com.br/ferramentas-eletricas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-[hsl(240_60%_25%)] transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-5 w-5" />
            Ver Máquinas Elétricas
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Máquinas Elétricas</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {categoryPosts.map((post) => <BlogCard key={post.slug} post={post} />)}
            </div>
            <div className="mt-8 text-center">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Ver mais artigos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
      <SchemaOrg type="breadcrumb" items={[
        { name: "Início",    url: "/" },
        { name: "Segmentos", url: "/segmentos/" },
        { name: "Máquinas Elétricas", url: "/segmentos/maquinas/" },
      ]} />
      <SchemaOrg type="service"
        name="Máquinas Elétricas"
        description="Furadeiras, esmerilhadeiras, serras, compressores e máquinas elétricas DeWalt, Bosch, Makita em Castelo ES."
        url="/segmentos/maquinas/"
      />
    </Layout>
  );
};

export default MaquinasPage;
