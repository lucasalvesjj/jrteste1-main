import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Wrench, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import BlogCard from "@/components/BlogCard";
import BrandSlider from "@/components/BrandSlider";
import { useBlogStore } from "@/stores/blogStore";

const BRANDS = [
  { name: "Gedore",       logo: "/brands/gedore.svg" },
  { name: "Gedore Red",   logo: "/brands/gedore-red.svg" },
  { name: "Foxlux",       logo: "/brands/foxlux.svg" },
  { name: "Carbografite", logo: "/brands/carbografite.svg" },
  { name: "MTX",          logo: "/brands/mtx.svg" },
  { name: "APEX",         logo: "/brands/apex.svg" },
];

const CATEGORIAS = [
  { title: "Chaves e Soquetes", desc: "Chaves combinadas, Allen, Torx, Phillips, chaves de boca e soquetes de todos os tamanhos. Precisão e durabilidade para uso profissional." },
  { title: "Alicates e Torquímetros", desc: "Alicates universais, de corte, bico chato, de pressão e torquímetros para aperto preciso em manutenção mecânica e serralheria." },
  { title: "Martelos e Marretas", desc: "Martelos de borracha, de carpinteiro, marretas de 1 a 5 kg e macetas para alvenaria, marcenaria e trabalho em metal." },
  { title: "Serras e Arcos", desc: "Serrotes para madeira, arcos de serra para metal, serras de poda e folhas de reposição de alta resistência." },
  { title: "Formões e Limas", desc: "Formões para marcenaria, goivas, limas chatas e redondas, grosas e raspas para acabamento e remoção de material." },
  { title: "Trenas e Medição", desc: "Trenas de 3 a 50 m, réguas, esquadros, esquadros de plástico, prumos de face e instrumentos de marcação em geral." },
];

const APLICACOES = [
  "Marcenaria e carpintaria profissional — móveis, esquadrias, forros e estruturas",
  "Serralheria e metalurgia — grades, portões, estruturas metálicas",
  "Construção civil e reformas residenciais e comerciais",
  "Manutenção agrícola — consertos em máquinas, implementos e instalações rurais",
  "Eletricistas e encanadores — ferramentas específicas para cada ofício",
  "Uso doméstico e reparos do dia a dia",
];

const FerramentasPage = () => {
  const init = useBlogStore((state) => state.init);
  const posts = useBlogStore((state) => state.posts);
  useEffect(() => { void init(); }, [init]);

  const categoryPosts = useMemo(
    () => posts.filter((p) => p.status === "published" && p.categories.includes("ferramentas")).slice(0, 3),
    [posts]
  );

  return (
    <Layout>
      <SEOHead
        title="Ferramentas Manuais em Castelo ES | Gedore, MTX, Foxlux — Comercial JR"
        description="Ferramentas manuais profissionais e domésticas em Castelo ES. Chaves, alicates, serras, martelos e mais. Marcas Gedore, Gedore Red, Foxlux, MTX, APEX e Carbografite. 41 anos de tradição."
        canonical="/segmentos/ferramentas/"
        ogImage="/favicon.webp"
      />

      {/* Hero */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="h-10 w-10 text-primary-foreground/80" />
            <h1 className="font-heading text-4xl font-black md:text-5xl">Ferramentas Manuais</h1>
          </div>
          <p className="max-w-2xl text-primary-foreground/80 text-lg">
            O mais completo estoque de ferramentas manuais de Castelo e região. Atendemos
            marceneiros, serralheiros, eletricistas, pedreiros, agricultores e entusiastas com as
            melhores marcas nacionais e importadas.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
            Ferramentas Manuais de Qualidade — Para Profissionais e Uso Doméstico
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Na <strong>Comercial JR</strong>, em Castelo – ES, você encontra uma linha completa de
            ferramentas manuais para todos os ofícios. Nosso estoque abrange desde chaves e alicates
            para manutenção mecânica até serrotes, formões e trenas para marcenaria e construção civil.
          </p>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Trabalhamos com marcas reconhecidas pela resistência e precisão, atendendo tanto o
            profissional exigente quanto quem precisa de uma boa ferramenta para resolver problemas
            do dia a dia em casa, na roça ou no trabalho. Garantia de fábrica e equipe preparada
            para indicar a ferramenta certa para cada tarefa.
          </p>

          <BrandSlider brands={BRANDS} title="Marcas que trabalhamos em ferramentas manuais" />
        </div>
      </section>

      {/* Categorias */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Categorias Disponíveis</h2>
          <p className="mb-6 text-muted-foreground">Encontre a ferramenta certa para cada trabalho:</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIAS.map((item) => (
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
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Quem Atendemos</h2>
          <ul className="mb-8 grid gap-3 md:grid-cols-2">
            {APLICACOES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-accent/60 p-6">
            <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Por que comprar na Comercial JR?</h3>
            <p className="text-muted-foreground">
              Mais de 41 anos atendendo Castelo e o sul do Espírito Santo. Temos estoque físico
              amplo para pronta entrega, equipe técnica para indicar a ferramenta ideal e o suporte
              completo de pós-venda. Garantia de fábrica em todos os produtos.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Loja */}
      <section className="section-padding bg-brand-gradient text-primary-foreground">
        <div className="container-custom flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:justify-between">
          <div>
            <h2 className="mb-2 font-heading text-2xl font-bold">Compre Ferramentas na Nossa Loja Online</h2>
            <p className="max-w-xl text-primary-foreground/80">
              Não pode vir até Castelo? Acesse nossa loja virtual e compre ferramentas manuais com
              entrega rápida para todo o Brasil.
            </p>
          </div>
          <a
            href="https://loja.comercialjrltda.com.br/ferramentas-manuais"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-[hsl(240_60%_25%)] transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-5 w-5" />
            Ver Ferramentas Manuais
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {categoryPosts.length > 0 && (
        <section className="section-padding bg-muted">
          <div className="container-custom">
            <h2 className="mb-8 font-heading text-2xl font-bold text-foreground">Artigos sobre Ferramentas</h2>
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
        { name: "Ferramentas Manuais", url: "/segmentos/ferramentas/" },
      ]} />
      <SchemaOrg type="service"
        name="Ferramentas Manuais"
        description="Ferramentas manuais profissionais Gedore, MTX, Foxlux para marcenaria, serralheria e construção civil em Castelo ES."
        url="/segmentos/ferramentas/"
      />
    </Layout>
  );
};

export default FerramentasPage;
