import { Link } from "react-router-dom";
import { ArrowRight, Droplets, Wrench, Zap, Gauge, Package, ShieldCheck, Layers } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import BrandSlider from "@/components/BrandSlider";

const ALL_BRANDS = [
  { name: "Bosch",        logo: "/brands/bosch.svg" },
  { name: "Tigre",        logo: "/brands/tigre.svg" },
  { name: "DeWalt",       logo: "/brands/dewalt.svg" },
  { name: "Amanco",       logo: "/brands/amanco.svg" },
  { name: "STIHL",        logo: "/brands/stihl.svg" },
  { name: "WEG",          logo: "/brands/weg.svg" },
  { name: "Gedore",       logo: "/brands/gedore.svg" },
  { name: "Makita",       logo: "/brands/makita.svg" },
  { name: "Hunter",       logo: "/brands/hunter.svg" },
  { name: "Stanley",      logo: "/brands/stanley.svg" },
  { name: "Schneider",    logo: "/brands/schneider.svg" },
  { name: "Foxlux",       logo: "/brands/foxlux.svg" },
  { name: "Black+Decker", logo: "/brands/blackdecker.svg" },
  { name: "Bermad",       logo: "/brands/bermad.svg" },
  { name: "MTX",          logo: "/brands/mtx.svg" },
  { name: "Lepono",       logo: "/brands/lepono.svg" },
  { name: "Senninger",    logo: "/brands/senninger.svg" },
  { name: "APEX",         logo: "/brands/apex.svg" },
  { name: "Anauger",      logo: "/brands/anauger.svg" },
];

const segments = [
  {
    title: "Irrigação Agrícola",
    href: "/segmentos/irrigacao",
    icon: Droplets,
    color: "text-blue-500",
    image: "/images/seg-irrigacao.jpg",
    imageAlt: "Sistema de irrigação agrícola",
    description: "Sistemas completos de irrigação para lavouras de café, pastagem, horticultura e jardinagem. Aspersão, gotejamento, microaspersão e mais.",
    features: ["Irrigação por aspersão e gotejamento", "Bombas d'água", "Tubulações e conexões", "Aspersores Hunter e Senninger"],
  },
  {
    title: "Ferramentas Manuais",
    href: "/segmentos/ferramentas",
    icon: Wrench,
    color: "text-orange-500",
    image: "/blog/chaves-modelos.jpg",
    imageAlt: "Ferramentas manuais profissionais",
    description: "Ferramentas manuais profissionais para marcenaria, serralheria, construção civil e uso rural. Marcas Gedore, MTX, Foxlux e mais.",
    features: ["Chaves, alicates e soquetes", "Serras e formões", "Martelos e marretas", "Instrumentos de medição"],
  },
  {
    title: "Máquinas Elétricas",
    href: "/segmentos/maquinas",
    icon: Zap,
    color: "text-yellow-500",
    image: "/blog/ferramentas-eletricas.jpg",
    imageAlt: "Máquinas elétricas profissionais",
    description: "Furadeiras, marteletes, esmerilhadeiras, serras, compressores, politrizes e muito mais. As melhores marcas do mercado.",
    features: ["Furadeiras e parafusadeiras", "Esmerilhadeiras e serras", "Compressores de ar", "Lixadeiras e politrizes"],
  },
  {
    title: "Bombas e Motores",
    href: "/segmentos/bombas-e-motores",
    icon: Gauge,
    color: "text-cyan-600 dark:text-cyan-400",
    image: "/images/seg-bombas.jpg",
    imageAlt: "Bombas e motores elétricos",
    description: "Bombas centrífugas, submersas, periféricas e motores elétricos monofásicos e trifásicos para irrigação, abastecimento e indústria.",
    features: ["Bombas centrífugas e submersas", "Motobombas a gasolina", "Motores mono e trifásicos", "Marcas WEG, Schneider, Lepono"],
  },
  {
    title: "Locação de Equipamentos",
    href: "/segmentos/locacao",
    icon: Package,
    color: "text-purple-500",
    image: "/images/seg-locacao.jpg",
    imageAlt: "Equipamentos para locação em obras",
    description: "Aluguel de máquinas e equipamentos leves e médios para obras, reformas e serviços rurais. Retire na loja em Castelo – ES.",
    features: ["Compressor e martelo rompedor", "Compactador e vibrador", "Perfurador de solo", "Locação por dia, semana ou mês"],
  },
  {
    title: "Assistência Técnica STIHL",
    href: "/segmentos/assistencia-stihl",
    icon: ShieldCheck,
    color: "text-green-600 dark:text-green-400",
    image: "/images/seg-stihl.jpg",
    imageAlt: "Assistência técnica STIHL autorizada",
    description: "Revenda e assistência técnica autorizada STIHL. Manutenção com técnicos certificados, peças originais e garantia de fábrica.",
    features: ["Revenda autorizada STIHL", "Manutenção preventiva e corretiva", "Motores 2 tempos e linha Makita", "Peças e acessórios originais"],
  },
  {
    title: "Poços Artesianos",
    href: "/segmentos/pocos-artesianos",
    icon: Layers,
    color: "text-teal-600 dark:text-teal-400",
    image: "/images/seg-pocos.jpg",
    imageAlt: "Soluções para poços artesianos",
    description: "Soluções completas para poços artesianos: bombas submersas, motores, painéis de controle e acessórios com orientação técnica.",
    features: ["Bombas submersas e motores", "Painéis de proteção", "Tubulações e válvulas", "Orientação técnica especializada"],
  },
];

const Segmentos = () => (
  <Layout>
    <SEOHead
      title="Segmentos | Irrigação, Ferramentas, Máquinas e Mais — Comercial JR Castelo ES"
      description="Conheça todos os segmentos da Comercial JR: irrigação agrícola, ferramentas manuais, máquinas elétricas, bombas e motores, locação de equipamentos, assistência STIHL e poços artesianos. 41 anos no sul do ES."
      canonical="/segmentos/"
      ogImage="/og-image.jpg"
    />

    <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
      <div className="container-custom text-center">
        <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Nossos Segmentos</h1>
        <p className="mx-auto max-w-2xl text-primary-foreground/80 text-lg">
          Há mais de 41 anos a <strong>Comercial JR</strong> é referência em Castelo – ES e no sul
          do Espírito Santo. Com mais de 18.000 produtos, atuamos em 7 segmentos distintos para
          atender profissionais, produtores rurais e consumidores com qualidade e suporte técnico.
        </p>
      </div>
    </section>

    <section className="container-custom pt-10 pb-2">
      <BrandSlider brands={ALL_BRANDS} title="Marcas que representamos" />
    </section>

    <section className="section-padding">
      <div className="container-custom space-y-16">
        {segments.map((seg, i) => (
          <div key={seg.title} className="grid items-center gap-8 md:grid-cols-2">
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5">
                <seg.icon className={`h-5 w-5 ${seg.color}`} />
                <span className="text-sm font-semibold text-foreground">{seg.title}</span>
              </div>
              <h2 className="mb-3 font-heading text-2xl font-bold text-foreground md:text-3xl">{seg.title}</h2>
              <p className="mb-5 leading-relaxed text-muted-foreground">{seg.description}</p>
              <ul className="mb-6 space-y-2">
                {seg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={seg.href}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Saiba mais
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <img
                src={seg.image}
                alt={seg.imageAlt}
                className="h-64 w-full rounded-xl object-cover shadow-md md:h-72"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="section-padding bg-muted/50">
      <div className="container-custom text-center">
        <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
          Tudo em um só lugar — Castelo, ES
        </h2>
        <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
          A Comercial JR atende Castelo, Venda Nova do Imigrante, Alegre, Cachoeiro de Itapemirim
          e toda a região sul do Espírito Santo com estoque físico, equipe técnica e loja online
          para entregas em todo o Brasil. Mais de 41 anos de tradição e compromisso com a qualidade.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/contato"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Fale Conosco <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="https://loja.comercialjrltda.com.br/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-accent">
            Acessar Loja Online <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>

    <SchemaOrg type="breadcrumb" items={[
      { name: "Início",    url: "/" },
      { name: "Segmentos", url: "/segmentos/" },
    ]} />
    <SchemaOrg type="webpage"
      name="Segmentos — Comercial JR LTDA"
      description="Irrigação, ferramentas, máquinas elétricas, bombas e motores, locação, assistência STIHL e poços artesianos em Castelo ES."
      url="/segmentos/"
    />
  </Layout>
);

export default Segmentos;
