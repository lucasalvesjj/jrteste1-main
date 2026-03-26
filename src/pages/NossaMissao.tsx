import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import { company } from "@/data/company";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Eye,
  Heart,
  Wrench,
  GraduationCap,
  Users,
  Trophy,
  ShieldCheck,
  DollarSign,
  Handshake,
  RefreshCw,
  Sprout,
  ArrowRight,
} from "lucide-react";

/* ───────── Dados do carrossel ───────── */
const carouselSlides = [
  {
    id: "missao",
    emoji: "🔵",
    icon: Target,
    label: "Missão",
    color: "primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    headline: "Resolver problemas reais de quem produz, constrói e trabalha.",
    body: "Nossa missão é entregar soluções técnicas confiáveis que reduzem risco e evitam retrabalho. Não vendemos apenas produtos — oferecemos segurança para quem depende de cada decisão no campo, na obra e na indústria. Com mais de 41 anos de experiência, entendemos que por trás de cada compra existe uma necessidade real: manter a produção funcionando, cumprir prazos e proteger o investimento de quem trabalha todos os dias.",
  },
  {
    id: "visao",
    emoji: "🟢",
    icon: Eye,
    label: "Visão",
    color: "brand-green",
    borderColor: "border-brand-green/30",
    bgColor: "bg-brand-green/5",
    iconBg: "bg-brand-green/10",
    iconColor: "text-brand-green",
    headline:
      "Ser a empresa mais confiável da região quando a decisão é difícil.",
    body: "Queremos ser a primeira escolha quando o cliente não pode errar. Quando a decisão envolve risco, prazo apertado ou investimento alto, a Comercial JR é a opção segura. Nossa visão é consolidar essa posição de confiança não apenas em Castelo e no sul do Espírito Santo, mas em toda a região — sendo referência em atendimento técnico, suporte completo e compromisso com o resultado do cliente.",
  },
  {
    id: "valores",
    emoji: "🟡",
    icon: Heart,
    label: "Valores",
    color: "secondary",
    borderColor: "border-secondary/30",
    bgColor: "bg-secondary/5",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    headline: "9 princípios que guiam cada decisão desde 1960.",
    body: "Nossos valores não foram criados em uma reunião — foram herdados. Começaram com Jorge de Assis Alves na forma de trabalhar, de tratar as pessoas e de respeitar quem depende do campo para viver. Atravessaram gerações, evoluíram com o tempo e continuam guiando cada decisão da Comercial JR até hoje. São a base de tudo que fazemos e de como fazemos.",
  },
];

/* ───────── Dados dos 9 valores ───────── */
const valoresDetalhados = [
  {
    num: "01",
    icon: Wrench,
    title: "Resolução acima de tudo",
    short: "Não vendemos produto — resolvemos problema.",
    detail:
      "Cada atendimento começa pela necessidade real do cliente. Antes de sugerir qualquer produto, entendemos o problema. Essa abordagem garante que o cliente saia com a solução certa — e não apenas com uma venda.",
  },
  {
    num: "02",
    icon: GraduationCap,
    title: "Domínio técnico de verdade",
    short: "Conhecimento não é discurso, é prática aplicada no campo.",
    detail:
      "Nossa equipe conhece os produtos que vende porque entende onde e como eles serão usados. Esse conhecimento técnico real é o que diferencia uma recomendação segura de um simples palpite.",
  },
  {
    num: "03",
    icon: Users,
    title: "Proximidade com o cliente",
    short: "Estamos próximos não só para vender, mas para entender e acompanhar.",
    detail:
      "Conhecemos nossos clientes pelo nome, sabemos o que plantam, o que constroem e o que precisam. Essa proximidade nos permite antecipar necessidades e oferecer um atendimento que vai além do balcão.",
  },
  {
    num: "04",
    icon: Trophy,
    title: "Compromisso com o resultado",
    short: "Se não funcionar na prática, não serve.",
    detail:
      "Não nos interessa apenas fechar a venda — nos interessa que o produto funcione, que o projeto dê certo e que o cliente volte satisfeito. O resultado do cliente é o nosso resultado.",
  },
  {
    num: "05",
    icon: ShieldCheck,
    title: "Honestidade nas decisões",
    short: "Falamos a verdade, mesmo quando não é a mais fácil.",
    detail:
      "Se um produto não é o ideal para a situação do cliente, dizemos. Se existe uma opção melhor, recomendamos. Preferimos perder uma venda hoje do que perder a confiança de quem conta com a gente.",
  },
  {
    num: "06",
    icon: DollarSign,
    title: "Segurança antes do preço",
    short: "Mais importante do que ser barato é evitar prejuízo.",
    detail:
      "Sabemos que no campo e na obra, o barato pode sair caro. Por isso priorizamos soluções seguras e duráveis, que protegem o investimento do cliente a longo prazo.",
  },
  {
    num: "07",
    icon: Handshake,
    title: "Trabalho construído com confiança",
    short: "Confiança não se compra — se conquista ao longo do tempo.",
    detail:
      "São mais de 41 anos construindo relações de confiança com produtores, construtores e profissionais da região. Cada atendimento é uma oportunidade de fortalecer esse vínculo.",
  },
  {
    num: "08",
    icon: RefreshCw,
    title: "Evolução sem perder a essência",
    short: "A empresa muda, cresce e se moderniza — mas não abandona o que a construiu.",
    detail:
      "Abraçamos a tecnologia, expandimos canais e modernizamos processos. Mas os valores que Jorge de Assis Alves plantou em 1960 continuam intactos em cada decisão que tomamos.",
  },
  {
    num: "09",
    icon: Sprout,
    title: "Respeito pelo campo",
    short: "Entendemos que por trás de cada decisão existe o sustento de uma família.",
    detail:
      "O produtor rural não compra por impulso — ele investe. E esse investimento sustenta famílias, comunidades e a economia da região. Tratamos cada atendimento com a seriedade que essa responsabilidade exige.",
  },
];

/* ───────── Componente Carrossel ───────── */
const MVVCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c === 0 ? carouselSlides.length - 1 : c - 1));
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c === carouselSlides.length - 1 ? 0 : c + 1));
  };

  const slide = carouselSlides[current];
  const SlideIcon = slide.icon;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Setas */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-14 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-foreground hover:bg-accent hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={next}
        aria-label="Próximo"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-14 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-foreground hover:bg-accent hover:text-primary transition-colors"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Card animado */}
      <div className="overflow-hidden rounded-2xl min-h-[320px] md:min-h-[280px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`rounded-2xl border-2 ${slide.borderColor} ${slide.bgColor} p-8 md:p-10`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-xl ${slide.iconBg} flex items-center justify-center`}>
                <SlideIcon className={`w-6 h-6 ${slide.iconColor}`} />
              </div>
              <div>
                <span className="text-2xl mr-2">{slide.emoji}</span>
                <span className="font-heading text-2xl font-bold text-foreground">{slide.label}</span>
              </div>
            </div>
            <h3 className="font-heading text-lg md:text-xl font-bold text-foreground mb-4 leading-snug">
              {slide.headline}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {carouselSlides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Ir para ${s.label}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              i === current
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-accent text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <span>{s.emoji}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ───────── Página Principal ───────── */
const NossaMissao = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.siteUrl,
    description:
      "Missão, visão e valores da Comercial JR LTDA. Mais de 41 anos resolvendo problemas reais de quem produz, constrói e trabalha no Espírito Santo.",
    foundingDate: "1985",
    foundingLocation: {
      "@type": "Place",
      name: "Castelo, Espírito Santo, Brasil",
    },
    slogan: "Resolver problemas reais de quem produz, constrói e trabalha.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Nossa Senhora da Penha, 1320 - Centro",
      addressLocality: "Castelo",
      addressRegion: "ES",
      addressCountry: "BR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: company.phone,
      contactType: "sales",
    },
    knowsAbout: [
      "Irrigação agrícola",
      "Máquinas elétricas",
      "Ferramentas profissionais",
      "Bombas e motores",
      "Assistência técnica STIHL",
      "Poços artesianos",
      "Locação de equipamentos",
    ],
  };

  return (
    <Layout>
      <SEOHead
        title="Missão, Visão e Valores — Comercial JR LTDA em Castelo ES"
        description="Conheça a missão, visão e os 9 valores que guiam a Comercial JR LTDA há mais de 41 anos. Referência em máquinas, ferramentas e irrigação em Castelo e no Espírito Santo."
        canonical="/nossa-missao/"
        ogImage="/og-image.jpg"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-brand-gradient text-primary-foreground py-16 md:py-24">
        <div className="container-custom text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-black mb-4">
            Missão, Visão e Valores
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            Os pilares que guiam cada decisão da Comercial JR desde 1960 — construídos com trabalho, confiança e respeito pelo campo.
          </p>
        </div>
      </section>

      {/* Carrossel MVV */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
              O que nos move
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Três pilares fundamentais definem quem somos, para onde vamos e como agimos no dia a dia.
            </p>
          </div>
          <MVVCarousel />
        </div>
      </section>

      {/* 9 Valores detalhados */}
      <section className="section-padding bg-accent/50">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3">
              Nossos 9 Valores
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Princípios herdados, não inventados. Cada um deles nasceu da prática e da convivência com quem depende do campo para viver.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {valoresDetalhados.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.num}
                  className="rounded-xl border border-border bg-background p-6 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-muted-foreground">{item.num}</span>
                      <h3 className="font-heading text-sm font-bold text-foreground leading-tight">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-2">{item.short}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              );
            })}
          </div>

          <blockquote className="mt-12 rounded-xl border-l-4 border-secondary bg-background p-6 italic text-foreground font-medium text-center text-lg">
            "A Comercial JR existe para garantir que o cliente não erre quando mais importa."
          </blockquote>
        </div>
      </section>

      {/* Nosso Compromisso */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6">
            Nosso Compromisso
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Há mais de 41 anos, a Comercial JR LTDA mantém o mesmo compromisso: estar ao lado de quem produz, constrói e trabalha. Nossos valores não estão em um quadro na parede — estão em cada atendimento, cada recomendação técnica e cada solução que entregamos.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Somos uma empresa familiar de Castelo, no Espírito Santo, que cresceu ouvindo o cliente, respeitando o campo e investindo em conhecimento. Essa é a base que sustenta tudo — e que continuará sustentando nas próximas gerações.
          </p>
          <Link
            to="/nossa-historia"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Conheça Nossa História Completa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SchemaOrg type="breadcrumb" items={[
        { name: "Início",       url: "/" },
        { name: "Nossa Missão", url: "/nossa-missao/" },
      ]} />
      <SchemaOrg type="webpage"
        name="Nossa Missão — Comercial JR LTDA"
        description="Conheça a missão, visão e valores da Comercial JR LTDA, referência em máquinas, ferramentas e irrigação no Espírito Santo."
        url="/nossa-missao/"
      />
    </Layout>
  );
};

export default NossaMissao;
