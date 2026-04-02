import { Link } from "react-router-dom";
import { ArrowRight, Droplets, Wrench, Zap, Gauge, Package, ShieldCheck, Layers } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import BrandSlider from "@/components/BrandSlider";
import OptimizedImage from "@/components/OptimizedImage";
import { allBrands } from "@/data/company";

const segments = [
  /* 1 */ {
    title: "Irrigação Agrícola",
    href: "/segmentos/irrigacao",
    icon: Droplets,
    color: "text-blue-500",
    image: "/media/2026/04/b06fdcc3-978d-466b-b297-6377a8fb4e5b/large.webp",
    imageAlt: "Sistema de irrigação agrícola por aspersão e gotejamento para lavouras - Comercial JR Castelo ES",
    description: "Sistemas completos de irrigação para lavouras de café, pastagem, horticultura e jardinagem. Aspersão, gotejamento, microaspersão e mais.",
    features: ["Irrigação por aspersão e gotejamento", "Bombas d'água", "Tubulações e conexões", "Aspersores Hunter e Senninger"],
  },
  /* 2 */ {
    title: "Bombas e Motores",
    href: "/segmentos/bombas-e-motores",
    icon: Gauge,
    color: "text-cyan-600 dark:text-cyan-400",
    image: "/media/2026/04/e739945b-7f2f-40da-9d44-27309c43edaf/large.webp",
    imageAlt: "Bombas centrífugas e motores elétricos para irrigação e abastecimento - Comercial JR Castelo ES",
    description: "Bombas centrífugas, submersas, periféricas e motores elétricos monofásicos e trifásicos para irrigação, abastecimento e indústria.",
    features: ["Bombas centrífugas e submersas", "Motobombas a gasolina", "Motores mono e trifásicos", "Marcas WEG, Schneider, Lepono"],
  },
  /* 3 – alfabético a partir daqui */ {
    title: "Assistência Técnica STIHL",
    href: "/segmentos/assistencia-stihl",
    icon: ShieldCheck,
    color: "text-green-600 dark:text-green-400",
    image: "/media/2026/04/65d0c2ec-54b6-4e44-a992-054e46f401a0/large.webp",
    imageAlt: "Assistência técnica autorizada STIHL - manutenção com peças originais e garantia de fábrica - Comercial JR",
    description: "Revenda e assistência técnica autorizada STIHL. Manutenção com técnicos certificados, peças originais e garantia de fábrica.",
    features: ["Revenda autorizada STIHL", "Manutenção preventiva e corretiva", "Motores 2 tempos e linha Makita", "Peças e acessórios originais"],
  },
  /* 4 */ {
    title: "Ferramentas Manuais",
    href: "/segmentos/ferramentas",
    icon: Wrench,
    color: "text-orange-500",
    image: "/media/2026/04/ab470b90-9fed-4160-8f3a-a8c209588bf9/large.webp",
    imageAlt: "Ferramentas manuais profissionais Gedore, MTX e Foxlux para construção e serralheria - Comercial JR",
    description: "Ferramentas manuais profissionais para marcenaria, serralheria, construção civil e uso rural. Marcas Gedore, MTX, Foxlux e mais.",
    features: ["Chaves, alicates e soquetes", "Serras e formões", "Martelos e marretas", "Instrumentos de medição"],
  },
  /* 5 */ {
    title: "Locação de Equipamentos",
    href: "/segmentos/locacao",
    icon: Package,
    color: "text-purple-500",
    image: "/media/2026/04/30e714ee-83b7-4476-a17f-9b93a5679a3f/large.webp",
    imageAlt: "Equipamentos para locação em obras e reformas - compactador, martelo rompedor e perfurador - Comercial JR",
    description: "Aluguel de máquinas e equipamentos leves e médios para obras, reformas e serviços rurais. Retire na loja em Castelo – ES.",
    features: ["Compressor e martelo rompedor", "Compactador e vibrador", "Perfurador de solo", "Locação por dia, semana ou mês"],
  },
  /* 6 */ {
    title: "Máquinas Elétricas",
    href: "/segmentos/maquinas",
    icon: Zap,
    color: "text-yellow-500",
    image: "/media/2026/04/97751b68-291e-49ec-bbbc-a8047e12db5c/large.webp",
    imageAlt: "Máquinas elétricas profissionais - furadeiras, esmerilhadeiras e serras DeWalt e Bosch - Comercial JR",
    description: "Furadeiras, marteletes, esmerilhadeiras, serras, compressores, politrizes e muito mais. As melhores marcas do mercado.",
    features: ["Furadeiras e parafusadeiras", "Esmerilhadeiras e serras", "Compressores de ar", "Lixadeiras e politrizes"],
  },
  /* 7 */ {
    title: "Poços Artesianos",
    href: "/segmentos/pocos-artesianos",
    icon: Layers,
    color: "text-teal-600 dark:text-teal-400",
    image: "/media/2026/04/a163b809-e005-46eb-b2f6-d6ffb08989bd/large.webp",
    imageAlt: "Soluções para poços artesianos - bombas submersas e painéis de controle - Comercial JR Castelo ES",
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
      <BrandSlider brands={allBrands} title="Marcas que representamos" />
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
              <OptimizedImage
                src={seg.image}
                alt={seg.imageAlt}
                className="h-64 w-full rounded-xl md:h-72"
                preset="content"
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
