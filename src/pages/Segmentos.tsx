import { Link } from "react-router-dom";
import { ArrowRight, Droplets, Wrench, Cog } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const segments = [
  {
    title: "Irrigação",
    href: "/segmentos/irrigacao",
    emoji: "💧",
    icon: Droplets,
    description:
      "Sistemas completos de irrigação para lavouras de café, pastagem, horticultura e jardinagem. Oferecemos bombas d'água, tubulações, aspersores e acessórios das melhores marcas.",
    features: ["Irrigação por aspersão", "Irrigação por gotejamento", "Bombas d'água", "Tubulações e conexões"],
  },
  {
    title: "Ferramentas",
    href: "/segmentos/ferramentas",
    emoji: "🔧",
    icon: Wrench,
    description:
      "Ferramentas manuais e elétricas para marcenaria, serralheria, construção civil e uso doméstico. Qualidade profissional com garantia de fábrica.",
    features: ["Ferramentas manuais", "Ferramentas elétricas", "Instrumentos de medição", "EPIs"],
  },
  {
    title: "Máquinas",
    href: "/segmentos/maquinas",
    emoji: "⚙️",
    icon: Cog,
    description:
      "Máquinas elétricas e a combustão para uso profissional e doméstico. Motosserras, compressores, esmerilhadeiras, furadeiras e muito mais.",
    features: ["Motosserras", "Compressores", "Soldas e inversores", "Cortadores de grama"],
  },
];

const Segmentos = () => (
  <Layout>
    <SEOHead
      title="Segmentos"
      description="Conheça nossos segmentos: irrigação, ferramentas e máquinas. Mais de 13.000 produtos para atender suas necessidades."
      canonical="/segmentos"
    />

    <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
      <div className="container-custom text-center">
        <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Nossos Segmentos</h1>
        <p className="mx-auto max-w-xl text-primary-foreground/80">
          Soluções completas em irrigação, ferramentas e máquinas para profissionais e entusiastas.
        </p>
      </div>
    </section>

    <section className="section-padding">
      <div className="container-custom space-y-12">
        {segments.map((seg, i) => (
          <div key={seg.title} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:flex-row-reverse" : ""}`}>
            <div className={i % 2 ? "md:order-2" : ""}>
              <div className="mb-4 text-6xl">{seg.emoji}</div>
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground md:text-3xl">{seg.title}</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">{seg.description}</p>
              <ul className="mb-6 space-y-2">
                {seg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={seg.href} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Saiba mais
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className={`flex items-center justify-center rounded-xl bg-accent p-12 ${i % 2 ? "md:order-1" : ""}`}>
              <seg.icon className="h-32 w-32 text-primary/20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  </Layout>
);

export default Segmentos;
