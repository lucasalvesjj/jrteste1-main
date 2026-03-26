import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Wrench,
  Droplets,
  Zap,
  Gauge,
  ShoppingCart,
  Award,
  Users,
  Package,
  ShieldCheck,
  Layers,
  Truck,
  MessageCircle,
  Clock3,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { company } from "@/data/company";
import { useBlogStore } from "@/stores/blogStore";
import { isPostVisibleInAnyCategory } from "@/lib/blogCategories";

/* ── Dados dos 7 segmentos ── */
const segmentos = [
  {
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    title: "Irrigação Agrícola",
    desc: "Sistemas completos de irrigação para lavouras, pastagem, horticultura e jardinagem.",
    href: "/segmentos/irrigacao",
  },
  {
    icon: Wrench,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    title: "Ferramentas Manuais",
    desc: "Ferramentas profissionais para marcenaria, serralheria, construção e uso rural.",
    href: "/segmentos/ferramentas",
  },
  {
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    title: "Máquinas Elétricas",
    desc: "Furadeiras, esmerilhadeiras, serras, compressores e as melhores marcas do mercado.",
    href: "/segmentos/maquinas",
  },
  {
    icon: Gauge,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    title: "Bombas e Motores",
    desc: "Bombas centrífugas, submersas, periféricas e motores elétricos para diversas aplicações.",
    href: "/segmentos/bombas-e-motores",
  },
  {
    icon: Package,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    title: "Locação de Equipamentos",
    desc: "Aluguel de máquinas e equipamentos para obras, reformas e serviços rurais.",
    href: "/segmentos/locacao",
  },
  {
    icon: ShieldCheck,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
    title: "Assistência STIHL",
    desc: "Revenda e assistência técnica autorizada com peças originais e garantia de fábrica.",
    href: "/segmentos/assistencia-stihl",
  },
  {
    icon: Layers,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    title: "Poços Artesianos",
    desc: "Bombas submersas, motores, painéis de controle e orientação técnica especializada.",
    href: "/segmentos/pocos-artesianos",
  },
];

const AUTOPLAY_MS = 5000;

/* ── Componente do carrossel de segmentos ── */
const SegmentosCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerStart = useRef(Date.now());
  const rafId = useRef<number>(0);

  /* Reseta a barra de progresso */
  const resetProgress = useCallback(() => {
    timerStart.current = Date.now();
    setProgress(0);
  }, []);

  /* Animação da barra de progresso via requestAnimationFrame */
  useEffect(() => {
    if (!emblaApi) return;

    const tick = () => {
      if (!isPaused) {
        const elapsed = Date.now() - timerStart.current;
        const pct = Math.min((elapsed / AUTOPLAY_MS) * 100, 100);
        setProgress(pct);

        if (pct >= 100) {
          emblaApi.scrollNext();
          timerStart.current = Date.now();
          setProgress(0);
        }
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [emblaApi, isPaused]);

  /* Quando o slide muda manualmente, reseta o timer */
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => resetProgress();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, resetProgress]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        timerStart.current = Date.now() - (progress / 100) * AUTOPLAY_MS;
      }}
    >
      {/* Carrossel */}
      <div className="relative">
        {/* Setas */}
        <button
          onClick={scrollPrev}
          className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-sm transition-colors hover:bg-accent md:-left-5"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-sm transition-colors hover:bg-accent md:-right-5"
          aria-label="Próximo"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Slides */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {segmentos.map((seg) => (
              <div
                key={seg.title}
                className="min-w-0 shrink-0 grow-0 basis-full pl-5 sm:basis-1/2 lg:basis-1/3"
              >
                <Link
                  to={seg.href}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${seg.bg}`}>
                    <seg.icon className={`h-7 w-7 ${seg.color}`} />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    {seg.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {seg.desc}
                  </p>
                  <span className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                    Saiba mais
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mx-auto mt-6 h-1 max-w-xs overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Index = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);
  const categories = useBlogStore((state) => state.categories);

  useEffect(() => {
    init();
  }, [init]);

  const recentPosts = posts
    .filter((post) => post.status === "published")
    .filter((post) => isPostVisibleInAnyCategory(post, categories))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const whatsappUrl = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de um atendimento da Comercial JR.")}`;

  return (
    <Layout>
      <SEOHead canonical="/" />

      {/* Hero */}
      <section className="relative overflow-hidden text-primary-foreground">
        {/* Imagem de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.webp')" }}
        />
        {/* Filtro sobre a imagem — azul no light, cinza escuro no dark */}
        <div className="absolute inset-0 bg-[#1a237e]/80 dark:bg-[#111111]/85" />
        <div className="container-custom relative z-10 py-10 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-3xl">
              <span className="mb-6 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">
                Loja online, atendimento local e tradição no Espírito Santo
              </span>
              <h1 className="mb-6 font-heading text-4xl font-black leading-tight md:text-6xl">
                Soluções em máquinas, ferramentas e irrigação para quem precisa comprar certo.
              </h1>
              <p className="mb-4 text-lg text-primary-foreground/90 md:text-xl">
                {company.shortName} reúne variedade, atendimento próximo e marcas confiáveis para
                obra, oficina, propriedade rural e manutenção do dia a dia.
              </p>
              <p className="mb-8 text-primary-foreground/75">
                Mais de {company.stats.products.toLocaleString("pt-BR")} produtos, {company.stats.years}+ anos de mercado e frete grátis para todo o Espírito Santo.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={company.store}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-bold text-secondary-foreground transition-opacity hover:opacity-90"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Comprar na Loja
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-foreground/25 px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                >
                  <MessageCircle className="h-5 w-5" />
                  Pedir Atendimento
                </a>
              </div>
            </motion.div>

            {/* Stats card hero */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ ...fadeIn, visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } } }}
              className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Package, value: `${company.stats.products.toLocaleString("pt-BR")}+`, label: "produtos em linha" },
                  { icon: Users, value: `${company.stats.clients.toLocaleString("pt-BR")}+`, label: "clientes atendidos" },
                  { icon: Award, value: `${company.stats.years}+`, label: "anos de tradição" },
                  { icon: Truck, value: "ES", label: "frete grátis no estado" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/10 p-5">
                    <stat.icon className="mb-3 h-8 w-8 text-secondary" />
                    <div className="font-heading text-2xl font-black">{stat.value}</div>
                    <div className="text-sm text-primary-foreground/80">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-white/8 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
                  Atendimento
                </p>
                <p className="mt-2 text-lg font-semibold">Equipe pronta para orientar a escolha do produto ideal.</p>
                <p className="mt-2 text-sm text-primary-foreground/75">{company.serviceArea}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Segmentos */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-10 text-center"
          >
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Nossos Segmentos
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Um portfólio completo para quem trabalha no campo, na construção, na oficina ou quer
              mais eficiência em casa.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ ...fadeIn, visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } } }}
          >
            <SegmentosCarousel />
          </motion.div>

          <div className="mt-8 text-center">
            <Link
              to="/segmentos"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver todos os segmentos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre + stats secundários */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 font-heading text-3xl font-bold text-foreground md:text-4xl">
                Tradição de balcão, variedade de estoque e atendimento que ajuda de verdade.
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                A Comercial JR é referência na venda de máquinas, ferramentas, acessórios e
                soluções para irrigação no sul do Espírito Santo.
              </p>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                Trabalhamos com linhas para obra, manutenção, jardinagem, agro e uso profissional,
                sempre com foco em disponibilidade, marcas confiáveis e orientação na compra.
              </p>
              <Link to="/nossa-historia" className="inline-flex items-center gap-2 font-semibold text-primary transition-all hover:gap-3">
                Conheça nossa história
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: Package, value: `${company.stats.products.toLocaleString("pt-BR")}+`, label: "Produtos" },
                { icon: Users, value: `${company.stats.clients.toLocaleString("pt-BR")}+`, label: "Clientes" },
                { icon: Award, value: `${company.stats.years}+`, label: "Anos" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-accent p-5 text-center">
                  <stat.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <div className="font-heading text-2xl font-black text-primary">{stat.value}</div>
                  <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Conecte-se com a gente */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom text-center">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground md:text-3xl">
            Conecte-se com a gente
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-muted-foreground">
            Acompanhe novidades, dicas, bastidores e ofertas nas nossas redes sociais.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { name: "Instagram", handle: "@comercialjrltda", href: company.social.instagram, icon: <Instagram className="h-7 w-7" />, color: "from-pink-500 to-orange-400" },
              { name: "Facebook", handle: "/ComercialJRCastelo", href: company.social.facebook, icon: <Facebook className="h-7 w-7" />, color: "from-blue-600 to-blue-500" },
              { name: "TikTok", handle: "@lojacomercialjr", href: company.social.tiktok, icon: <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.27 8.27 0 0 0 4.76 1.5V7.12a4.83 4.83 0 0 1-1-.43Z" /></svg>, color: "from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300" },
              { name: "YouTube", handle: "@comercialjrltda", href: company.social.youtube, icon: <Youtube className="h-7 w-7" />, color: "from-red-600 to-red-500" },
              { name: "LinkedIn", handle: "/comercial-jr", href: company.social.linkedin, icon: <Linkedin className="h-7 w-7" />, color: "from-blue-700 to-blue-600" },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${social.color} text-white transition-transform duration-300 group-hover:scale-110`}>
                  {social.icon}
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-foreground">{social.name}</p>
                  <p className="text-xs text-muted-foreground">{social.handle}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Seguir <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">Por que escolher a Comercial JR</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Destacamos os diferenciais que mais importam para quem quer comprar com segurança.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Marcas e linhas confiáveis",
                description: "Seleção de fabricantes reconhecidos para entregar desempenho, reposição e mais segurança na compra.",
              },
              {
                icon: Clock3,
                title: "Agilidade no atendimento",
                description: "Equipe preparada para orientar por telefone, WhatsApp ou presencialmente com resposta rápida.",
              },
              {
                icon: Truck,
                title: "Facilidade para comprar",
                description: "Loja online ativa, estoque amplo e frete grátis para todo o Espírito Santo.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <item.icon className="mb-5 h-11 w-11 text-primary" />
                <h3 className="mb-3 font-heading text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossa História — Timeline */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-secondary">
              Desde 1960
            </span>
            <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
              Uma história construída em gerações
            </h2>
            <p className="text-primary-foreground/75">
              Do balcão da oficina ao e-commerce com mais de 18 mil produtos. Três gerações
              de uma família dedicada a atender quem trabalha com as mãos.
            </p>
          </motion.div>

          {/* Timeline desktop (horizontal) / mobile (vertical) */}
          <div className="relative mx-auto max-w-4xl">
            {/* Linha horizontal — visível apenas no md+ */}
            <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-white/20 md:block" />
            {/* Linha vertical — visível apenas no mobile */}
            <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-white/20 md:hidden" />

            <div className="grid gap-8 md:grid-cols-4">
              {[
                {
                  year: "1960",
                  title: "A oficina",
                  desc: "Tudo começou numa pequena oficina mecânica em Castelo, com foco em reparo de máquinas agrícolas.",
                },
                {
                  year: "1985",
                  title: "Comercial JR nasce",
                  desc: "A loja foi fundada e passou a vender ferramentas, peças e equipamentos para a região.",
                },
                {
                  year: "2006",
                  title: "Nova geração",
                  desc: "A segunda geração assumiu a gestão, ampliando o portfólio e a área de atuação.",
                },
                {
                  year: "Hoje",
                  title: "Terceira geração",
                  desc: "Mais de 41 anos, 18 mil produtos, loja online e atendimento em todo o Espírito Santo.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.year}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.5 } },
                  }}
                  className="relative pl-14 md:pl-0 md:text-center"
                >
                  {/* Nó da timeline */}
                  <div className="absolute left-4 top-0 flex h-5 w-5 items-center justify-center md:left-1/2 md:-translate-x-1/2">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-secondary bg-secondary/30" />
                  </div>

                  <div className="pt-1 md:pt-10">
                    <span className="font-heading text-2xl font-black text-secondary">{item.year}</span>
                    <h3 className="mt-1 font-heading text-base font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ ...fadeIn, visible: { opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.5 } } }}
            className="mt-10 text-center"
          >
            <Link
              to="/nossa-historia"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-bold text-secondary-foreground transition-opacity hover:opacity-90"
            >
              Conhecer nossa história
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Localização */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">Onde Estamos</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Venha nos visitar em Castelo ou entre em contato pelo WhatsApp. Estamos prontos para atender você.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Card Endereço */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent p-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Endereço</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{company.fullAddress}</p>
              <a
                href={company.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MapPin className="h-4 w-4" />
                Abrir no Google Maps
              </a>
            </div>

            {/* Card Horário */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent p-3">
                  <Clock3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Horário de Funcionamento</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-lg bg-accent/50 px-4 py-3">
                  <span className="font-semibold text-foreground">Segunda a Sexta</span>
                  <span>7h às 17h</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-accent/50 px-4 py-3">
                  <span className="font-semibold text-foreground">Sábado</span>
                  <span>7h às 11:30h</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <span className="font-semibold text-foreground">Domingo</span>
                  <span className="text-destructive font-medium">Fechado</span>
                </div>
              </div>
            </div>

            {/* Card WhatsApp */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent p-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Fale Conosco</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Prefere resolver pelo WhatsApp? Nossa equipe está pronta para te ajudar a escolher o produto ideal e tirar qualquer dúvida.
              </p>
              <p className="text-sm font-semibold text-foreground">{company.phone}</p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" />
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Posts Recentes</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Ver todos os posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-gradient py-16 text-primary-foreground">
        <div className="container-custom text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold">Pronto para encontrar o produto ideal?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Visite a loja online ou fale com nossa equipe para receber apoio na escolha de
            máquinas, ferramentas, acessórios e soluções de irrigação.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={company.store} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-secondary px-8 py-3 font-bold text-secondary-foreground transition-opacity hover:opacity-90">
              <ShoppingCart className="h-5 w-5" />
              Acessar Loja
            </a>
            <Link to="/contato" className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/25 px-8 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              Falar com a Equipe
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["Organization", "LocalBusiness"],
            "@id": "https://comercialjrltda.com.br/#organization",
            name: company.name,
            alternateName: company.shortName,
            url: company.siteUrl,
            logo: {
              "@type": "ImageObject",
              url: "https://comercialjrltda.com.br/logo.webp",
              width: 512,
              height: 512,
            },
            image: "https://comercialjrltda.com.br/og-image.jpg",
            description: company.seo.description,
            foundingDate: "1983",
            slogan: company.slogan,
            address: {
              "@type": "PostalAddress",
              streetAddress: "Av. Nossa Senhora da Penha, 1320",
              addressLocality: "Castelo",
              addressRegion: "ES",
              postalCode: "29360-000",
              addressCountry: "BR",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: -20.6044,
              longitude: -41.1939,
            },
            telephone: "+552835421332",
            email: company.email,
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
                opens: "07:00",
                closes: "17:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: "Saturday",
                opens: "07:00",
                closes: "11:30",
              },
            ],
            sameAs: [
              company.social.facebook,
              company.social.instagram,
              company.social.youtube,
              company.social.linkedin,
              company.social.tiktok,
            ],
            hasMap: company.mapsUrl,
            priceRange: "$$",
            areaServed: {
              "@type": "State",
              name: "Espírito Santo",
              addressCountry: "BR",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+552835421332",
              contactType: "customer service",
              availableLanguage: "Portuguese",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://comercialjrltda.com.br/#website",
            url: "https://comercialjrltda.com.br/",
            name: company.name,
            inLanguage: "pt-BR",
            publisher: { "@id": "https://comercialjrltda.com.br/#organization" },
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://comercialjrltda.com.br/blog/?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </Layout>
  );
};

export default Index;
