import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Wrench,
  Droplets,
  Cog,
  ShoppingCart,
  Award,
  Users,
  Package,
  ShieldCheck,
  Truck,
  MessageCircle,
  Clock3,
} from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import BlogCard from "@/components/BlogCard";
import { company, brands } from "@/data/company";
import { useBlogStore } from "@/stores/blogStore";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Index = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);

  useEffect(() => {
    init();
  }, [init]);

  const recentPosts = posts
    .filter((post) => post.status === "published")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const whatsappUrl = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de um atendimento da Comercial JR.")}`;

  return (
    <Layout>
      <SEOHead canonical="/" />

      <section className="relative overflow-hidden bg-brand-gradient text-primary-foreground">
        <div className="absolute inset-0 opacity-15">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>
        <div className="container-custom relative z-10 py-20 md:py-32">
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

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ ...fadeIn, visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } } }}
              className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Package, value: "13.000+", label: "produtos em linha" },
                  { icon: Users, value: "50.000+", label: "clientes atendidos" },
                  { icon: Award, value: "39+", label: "anos de tradição" },
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

      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">Nossos Segmentos</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Um portfólio completo para quem trabalha no campo, na construção, na oficina ou quer
              mais eficiência em casa.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: Cog,
                title: "Máquinas",
                desc: "Máquinas elétricas, motosserras, compressores e soluções para alto desempenho.",
                href: "/segmentos/maquinas",
                emoji: "⚙️",
              },
              {
                icon: Wrench,
                title: "Ferramentas",
                desc: "Ferramentas manuais e elétricas para profissionais, oficinas e uso doméstico.",
                href: "/segmentos/ferramentas",
                emoji: "🔧",
              },
              {
                icon: Droplets,
                title: "Irrigação",
                desc: "Sistemas completos para agricultura, jardim, pastagem e distribuição de água.",
                href: "/segmentos/irrigacao",
                emoji: "💧",
              },
            ].map((seg, i) => (
              <motion.div
                key={seg.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeIn, visible: { ...fadeIn.visible, transition: { delay: i * 0.15, duration: 0.6 } } }}
              >
                <Link
                  to={seg.href}
                  className="group block rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 text-5xl">{seg.emoji}</div>
                  <seg.icon className="mx-auto mb-4 h-10 w-10 text-primary/30 transition-colors group-hover:text-primary" />
                  <h3 className="mb-2 font-heading text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                    {seg.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">{seg.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Saiba mais
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                { icon: Package, value: "13.000+", label: "Produtos" },
                { icon: Users, value: "50.000+", label: "Clientes" },
                { icon: Award, value: "39+", label: "Anos" },
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

      <section className="section-padding bg-muted">
        <div className="container-custom">
          <h2 className="mb-12 text-center font-heading text-3xl font-bold text-foreground md:text-4xl">Principais Marcas</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => (
              <div key={brand.name} className="rounded-xl border border-border bg-card p-6 text-center transition-shadow hover:shadow-md">
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">{brand.name}</h3>
                <p className="text-sm text-muted-foreground">{brand.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Posts Recentes</h2>
            <Link to="/blog" className="hidden items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2 md:inline-flex">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Ver todos os posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

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
            "@type": "Organization",
            name: company.name,
            url: company.siteUrl,
            description: company.seo.description,
            address: { "@type": "PostalAddress", addressLocality: "Castelo", addressRegion: "ES", addressCountry: "BR" },
            contactPoint: { "@type": "ContactPoint", telephone: company.phone, contactType: "sales" },
          }),
        }}
      />
    </Layout>
  );
};

export default Index;
