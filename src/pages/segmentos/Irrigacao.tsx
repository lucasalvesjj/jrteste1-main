import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Droplets, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import BrandSlider from "@/components/BrandSlider";
import { useBlogStore } from "@/stores/blogStore";

const BRANDS = [
  { name: "Amanco",    logo: "/brands/amanco.svg" },
  { name: "Tigre",     logo: "/brands/tigre.svg" },
  { name: "Spezzia",   logo: "/brands/spezzia.svg" },
  { name: "Viqua",     logo: "/brands/viqua.svg" },
  { name: "Durin",     logo: "/brands/durin.svg" },
  { name: "RSB",       logo: "/brands/rsb.svg" },
  { name: "Bermad",    logo: "/brands/bermad.svg" },
  { name: "Hunter",    logo: "/brands/hunter.svg" },
  { name: "Senninger", logo: "/brands/senninger.svg" },
];

const TIPOS = [
  { title: "Irrigação por Aspersão", desc: "Distribui água simulando chuva natural. Ideal para pastagens, grãos, café e hortaliças em amplas áreas do sul do ES." },
  { title: "Irrigação por Gotejamento", desc: "Aplica água diretamente na raiz. Econômico, eficiente e indicado para cafeicultura, fruticultura e cultivo protegido." },
  { title: "Microaspersão", desc: "Combina eficiência do gotejamento com cobertura do aspersão. Indicado para fruticultura e estufas." },
  { title: "Irrigação por Pivô Central", desc: "Sistema mecanizado para grandes lavouras. Alta eficiência, automação e redução de mão de obra." },
];

const APLICACOES = [
  "Irrigação de cafezais em todas as fases — do desenvolvimento à florada",
  "Manejo e recuperação de pastagem para pecuária no ES",
  "Cultivo de hortaliças, fruticultura e banana",
  "Sistemas de fertirrigação com injeção de nutrientes",
  "Irrigação de jardins, gramados e paisagismo residencial",
  "Irrigação de viveiros de mudas e cultivo protegido",
];

const PRODUTOS = [
  { title: "Bombas d'Água", desc: "Centrífugas, periféricas e submersas para todas as faixas de pressão e vazão." },
  { title: "Tubulações PVC e PEAD", desc: "Tubos Tigre e Amanco para adutoras, linhas de irrigação e derivações." },
  { title: "Aspersores e Microaspersores", desc: "Linhas Hunter, Senninger e Bermad para cobertura uniforme e eficiente." },
  { title: "Conexões e Registros", desc: "Fitting, uniões, registros de gaveta, válvulas solenoides e conexões de alta pressão." },
  { title: "Gotejadores e Fitas", desc: "Gotejamento preciso para linhas de café, tomate, morango e cultivo em estufa." },
  { title: "Acessórios e Automação", desc: "Temporizadores, controladores, filtros de tela, injetores Venturi e kits completos." },
];

const IrrigacaoPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);

  useEffect(() => { void init(); }, [init]);

  const categoryPosts = useMemo(
    () => posts.filter((p) => p.status === "published" && p.categories.includes("irrigacao")).slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Irrigação Agrícola em Castelo ES | Sistemas, Bombas e Acessórios"
        description="Soluções completas em irrigação para cafeicultura, pastagem e horticultura no Espírito Santo. Aspersão, gotejamento, bombas e acessórios das melhores marcas. Comercial JR — 41 anos de tradição em Castelo ES."
        canonical="/segmentos/irrigacao"
      />

      {/* Hero */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="h-10 w-10 text-primary-foreground/80" />
            <h1 className="font-heading text-4xl font-black md:text-5xl">Irrigação Agrícola</h1>
          </div>
          <p className="max-w-2xl text-primary-foreground/80 text-lg">
            Sistemas completos de irrigação para lavouras de café, pastagem, horticultura e
            jardinagem no sul do Espírito Santo. Atendemos produtores rurais, construtores e
            paisagistas com os melhores produtos do mercado.
          </p>
        </div>
      </section>

      {/* Intro + contexto SEO */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
            Soluções Completas em Irrigação — Castelo e Região Sul do ES
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            A <strong>Comercial JR</strong>, em Castelo – ES, é referência em sistemas de irrigação para
            o agronegócio capixaba há mais de 41 anos. Atendemos pequenos agricultores, grandes
            cafeicultores, pecuaristas e paisagistas com um estoque completo de bombas, tubulações,
            aspersores, gotejadores e acessórios das principais marcas nacionais e internacionais.
          </p>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            O sul do Espírito Santo tem características únicas de relevo e clima que exigem projetos de
            irrigação bem dimensionados. Nossa equipe auxilia na escolha do sistema ideal para cada
            cultura — seja um cafezal em produção, uma pastagem irrigada, uma horta comercial ou um
            jardim residencial. Temos os produtos certos, com garantia de fábrica e pronto atendimento.
          </p>

          {/* Slider de marcas */}
          <BrandSlider brands={BRANDS} title="Principais marcas que trabalhamos em irrigação" />
        </div>
      </section>

      {/* Tipos de irrigação */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Tipos de Irrigação</h2>
          <p className="mb-6 text-muted-foreground">Cada cultura exige um método diferente. Conheça as opções disponíveis:</p>
          <div className="grid gap-4 md:grid-cols-2">
            {TIPOS.map((item) => (
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
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Aplicações no Campo e na Cidade</h2>
          <ul className="mb-8 grid gap-3 md:grid-cols-2">
            {APLICACOES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Produtos */}
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Produtos Disponíveis em Estoque</h2>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {PRODUTOS.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <h3 className="mb-1 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Loja Online */}
      <section className="section-padding bg-brand-gradient text-primary-foreground">
        <div className="container-custom flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:justify-between">
          <div>
            <h2 className="mb-2 font-heading text-2xl font-bold">Compre na Nossa Loja Online</h2>
            <p className="max-w-xl text-primary-foreground/80">
              Não pode vir até Castelo? Acesse nossa loja virtual e compre bombas, tubulações,
              aspersores e acessórios de irrigação com entrega para todo o Brasil.
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

      {/* Artigos do blog */}
      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Irrigação</h2>
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
    </Layout>
  );
};

export default IrrigacaoPage;
