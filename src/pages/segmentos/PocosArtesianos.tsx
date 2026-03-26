import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Layers, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import { company } from "@/data/company";

const SOLUCOES = [
  { title: "Bombas Submersas para Poço", desc: "Bombas submersas de alta eficiência para poços artesianos e semi-artesianos, com potências que vão de ½ a 5 CV, adequadas para diferentes profundidades e vazões." },
  { title: "Motores para Poço Profundo", desc: "Motores elétricos monofásicos e trifásicos com proteção contra sobrecarga, corrosão e areia, desenvolvidos especificamente para operação submersa em poços." },
  { title: "Painéis de Controle e Proteção", desc: "Painéis elétricos com proteção contra seca, sobretensão e inversão de fase. Essenciais para garantir vida útil longa ao conjunto moto-bomba." },
  { title: "Tubulações e Colunas de Recalque", desc: "Tubos galvanizados, PVC e PEAD para composição da coluna de recalque dentro do poço. Diâmetros variados conforme especificação técnica." },
  { title: "Registros e Válvulas de Retenção", desc: "Válvulas de retenção, registros de gaveta e passagem para controle de fluxo e proteção do sistema de bombeamento." },
  { title: "Acessórios e Conexões", desc: "Adaptadores, uniões, colunas de aço, cabos elétricos submersos e demais acessórios para montagem completa do sistema." },
];

const DIFERENCIAIS = [
  "Auxílio técnico na especificação da bomba correta para a profundidade e vazão do seu poço",
  "Estoque de bombas submersas de marcas líderes para pronta entrega em Castelo – ES",
  "Peças e acessórios originais para manutenção e reposição",
  "Atendimento a produtores rurais, propriedades urbanas e empreendimentos comerciais",
  "Orientação sobre painéis de proteção e automação do sistema",
  "41 anos de experiência no fornecimento de soluções hídricas no sul do ES",
];

const PocosArtesianosPage = () => (
  <Layout>
    <SEOHead
      title="Soluções para Poços Artesianos em Castelo ES | Bombas Submersas — Comercial JR"
      description="Bombas submersas, motores, painéis de controle e acessórios para poços artesianos e semi-artesianos em Castelo ES. Orientação técnica especializada e estoque para pronta entrega no sul do Espírito Santo."
      canonical="/segmentos/pocos-artesianos/"
      ogImage="/favicon.webp"
    />

    {/* Hero */}
    <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
      <div className="container-custom">
        <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
          ← Segmentos
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <Layers className="h-10 w-10 text-primary-foreground/80" />
          <h1 className="font-heading text-4xl font-black md:text-5xl">Poços Artesianos</h1>
        </div>
        <p className="max-w-2xl text-primary-foreground/80 text-lg">
          Soluções completas de bombeamento para poços artesianos e semi-artesianos: bombas submersas,
          motores, painéis de controle e acessórios com orientação técnica especializada em
          Castelo – ES.
        </p>
      </div>
    </section>

    {/* Intro */}
    <section className="section-padding">
      <div className="container-custom">
        <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
          Equipamentos para Poços Artesianos — Castelo e Sul do ES
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          A <strong>Comercial JR</strong>, em Castelo – ES, é parceira de quem busca soluções
          completas de bombeamento para poços artesianos e semi-artesianos. Fornecemos bombas
          submersas, motores, painéis de proteção, tubulações e todos os acessórios necessários
          para um sistema de bombeamento eficiente, seguro e durável.
        </p>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          O dimensionamento correto do conjunto moto-bomba é fundamental para a eficiência e vida
          útil do sistema. Nossa equipe técnica orienta na escolha da bomba ideal com base na
          profundidade do poço, nível dinâmico, vazão necessária e distância de recalque —
          evitando erros de especificação que comprometem o investimento.
        </p>
        <p className="mb-8 leading-relaxed text-muted-foreground">
          Atendemos produtores rurais, proprietários de sítios e fazendas, residências e
          empresas em Castelo, Venda Nova do Imigrante, Alegre, Cachoeiro de Itapemirim e
          toda a região sul do Espírito Santo.
        </p>
      </div>
    </section>

    {/* Soluções */}
    <section className="section-padding bg-muted/50">
      <div className="container-custom">
        <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">O que Fornecemos</h2>
        <p className="mb-6 text-muted-foreground">Produtos disponíveis em estoque para poços artesianos:</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SOLUCOES.map((item) => (
            <div key={item.title} className="rounded-lg bg-accent p-5">
              <h3 className="mb-2 font-heading font-bold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Diferenciais */}
    <section className="section-padding">
      <div className="container-custom">
        <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Por que Comprar na Comercial JR?</h2>
        <ul className="mb-8 grid gap-3 md:grid-cols-2">
          {DIFERENCIAIS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted-foreground">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>

    {/* CTA duplo */}
    <section className="section-padding bg-brand-gradient text-primary-foreground">
      <div className="container-custom flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:justify-between">
        <div>
          <h2 className="mb-2 font-heading text-2xl font-bold">Precisa de Orientação Técnica?</h2>
          <p className="max-w-xl text-primary-foreground/80">
            Nossa equipe auxilia na especificação do sistema de bombeamento ideal para o seu poço.
            Entre em contato ou acesse nossa loja online para ver os produtos disponíveis.
          </p>
        </div>
        <div className="flex flex-col gap-3 shrink-0 sm:flex-row">
          <a
            href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Preciso de orientação sobre bombas para poço artesiano.")}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-bold text-white transition-opacity hover:opacity-90">
            Falar no WhatsApp
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://loja.comercialjrltda.com.br/"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-bold text-[hsl(240_60%_25%)] transition-opacity hover:opacity-90">
            <ShoppingCart className="h-5 w-5" />
            Ver Loja Online
          </a>
        </div>
      </div>
    </section>

    <SchemaOrg type="breadcrumb" items={[
      { name: "Início",    url: "/" },
      { name: "Segmentos", url: "/segmentos/" },
      { name: "Poços Artesianos", url: "/segmentos/pocos-artesianos/" },
    ]} />
    <SchemaOrg type="service"
      name="Soluções para Poços Artesianos"
      description="Bombas submersas, motores, painéis de controle e acessórios para poços artesianos em Castelo ES. Orientação técnica especializada."
      url="/segmentos/pocos-artesianos/"
    />
  </Layout>
);

export default PocosArtesianosPage;
