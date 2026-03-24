import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Award, Users, MapPin, Calendar, ArrowRight } from "lucide-react";

const NossaHistoria = () => (
  <Layout>
    <SEOHead
      title="Nossa História"
      description="Conheça a história da Comercial JR LTDA, mais de 41 anos de tradição em máquinas, ferramentas e irrigação no Espírito Santo."
      canonical="/nossa-historia"
    />

    {/* Hero */}
    <section className="bg-brand-gradient text-primary-foreground py-16 md:py-24">
      <div className="container-custom text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-black mb-4">Nossa História</h1>
        <p className="text-primary-foreground/80 max-w-xl mx-auto">
          Mais de 41 anos construindo tradição e confiança no Espírito Santo.
        </p>
      </div>
    </section>

    <section className="section-padding">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="space-y-12 text-muted-foreground leading-relaxed">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: "Fundação", value: "41+ anos" },
              { icon: MapPin, label: "Sede", value: "Castelo - ES" },
              { icon: Users, label: "Clientes", value: "15.000+" },
              { icon: Award, label: "Prêmios", value: "4x Marcas de Castelo" },
            ].map((item) => (
              <div key={item.label} className="text-center bg-accent rounded-xl p-4">
                <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-heading text-sm font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>

          {/* CTA — Missão, Visão e Valores */}
          <div className="rounded-2xl border-2 border-primary/15 bg-accent p-8 text-center">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-3">
              Missão, Visão e Valores
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
              Conheça os 9 princípios que guiam cada decisão da Comercial JR desde 1960 — construídos com trabalho, confiança e respeito pelo campo.
            </p>
            <Link
              to="/nossa-missao"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Conhecer Nossa Missão
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ── HISTÓRIA ── */}

          {/* 1. O começo */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">O Começo — 1960</h2>
            <p>
              Na década de 1960, o interior do Espírito Santo vivia um momento de transformação. A cafeicultura já era a base da economia regional, mas a mecanização ainda era limitada, e muitos produtores dependiam de soluções improvisadas para manter suas lavouras funcionando.
            </p>
            <p className="mt-4">
              Foi nesse cenário que, em 1960, <strong className="text-foreground">Jorge de Assis Alves</strong> fundou uma pequena oficina e indústria metalmecânica em Castelo.
            </p>
            <p className="mt-4">
              Mais do que um empreendedor, Jorge era um homem à frente do seu tempo. Com visão, conhecimento técnico e um profundo respeito pelas pessoas e pela realidade do campo, ele enxergava problemas que muitos ignoravam — e se propunha a resolvê-los.
            </p>
            <p className="mt-4">
              Rapidamente, conquistou algo raro: <strong className="text-foreground">confiança</strong>. Não apenas pelos serviços prestados, mas pelo caráter, pela forma de trabalhar e pelo compromisso com quem dependia daquilo para produzir e sustentar sua família.
            </p>
            <p className="mt-4">
              Mais do que um espaço de trabalho, aquela oficina se tornou um ponto de apoio para produtores da região. Ali eram realizados consertos, adaptações e até a fabricação de peças e equipamentos que muitas vezes não existiam prontos no mercado.
            </p>
            <p className="mt-4">Desde o início, três pilares ficaram claros — e continuam presentes até hoje:</p>
            <ul className="mt-3 space-y-2">
              {["domínio técnico", "resolução prática de problemas", "proximidade real com o produtor rural"].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4 italic text-sm border-l-2 border-secondary pl-4">
              A Comercial JR nasceu, antes de tudo, resolvendo problemas do campo — e carregando a visão, a integridade e o respeito que Jorge construiu desde o primeiro dia.
            </p>
          </div>

          {/* 2. Primeira expansão */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Primeira Expansão — 1965</h2>
            <p>Em 1965, a empresa dá um passo decisivo.</p>
            <p className="mt-4">
              Jorge passa a representar uma indústria paulista de máquinas para beneficiamento de café — um movimento que muda completamente o posicionamento do negócio.
            </p>
            <p className="mt-4">Se antes a atuação era focada na oficina, agora a empresa passa a:</p>
            <ul className="mt-3 space-y-2">
              {[
                "fornecer soluções completas",
                "atender uma demanda crescente da cafeicultura",
                "ampliar seu alcance para além de Castelo",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Esse momento marca uma virada importante: a empresa deixa de ser apenas uma oficina e passa a se tornar parte ativa da cadeia produtiva do café. Mais do que vender máquinas, ela passa a participar diretamente da evolução da produção rural da região.
            </p>
          </div>

          {/* 3. Nova geração */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">A Nova Geração — 1985</h2>
            <p>
              Em 1985, nasce oficialmente a Comercial JR — mas essa história começa alguns anos antes.
            </p>
            <p className="mt-4">
              Buscando trazer um novo nível de conhecimento para a empresa, <strong className="text-foreground">Jaime Machado Alves</strong> sai de Castelo no final da década de 1970 para estudar Engenharia Mecânica na PUC Minas, onde se forma entre 1979 e 1983. Em 1984, já inicia sua atuação prática na área em Minas Gerais, tendo contato direto com processos industriais, tecnologia e uma visão mais estruturada do setor.
            </p>
            <p className="mt-4">
              Enquanto isso, em Castelo, <strong className="text-foreground">Renato Sérgio Machado Alves</strong> faz uma escolha igualmente decisiva. Ao invés de seguir o caminho acadêmico, Renato permanece ao lado do pai, Jorge de Assis Alves, atuando diretamente na oficina.
            </p>
            <p className="mt-4">No dia a dia, ele desenvolve algo que não se aprende em sala de aula:</p>
            <ul className="mt-3 space-y-2">
              {[
                "experiência prática",
                "leitura do mercado",
                "proximidade com o produtor rural",
                "entendimento real das necessidades do campo",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Essa divisão não foi acaso. Renato assume o papel de sustentar e fortalecer a operação, enquanto Jaime busca fora o conhecimento técnico que faltava para levar a empresa a um novo nível. Foi uma escolha estratégica — e, acima de tudo, familiar. Enquanto um se aprofundava na prática, o outro se especializava na teoria.
            </p>
            <p className="mt-4">
              Quando Jaime retorna para Castelo, trazendo essa bagagem técnica, os três — Jorge, Jaime e Renato — unem forças. Em 1985, nasce oficialmente a Comercial JR.
            </p>
            <p className="mt-4">Mais do que uma nova empresa, surge a união de três pilares complementares:</p>
            <ul className="mt-3 space-y-2">
              {[
                "a experiência e reputação de Jorge",
                "o conhecimento técnico e visão de engenharia de Jaime",
                "a vivência prática e leitura de mercado de Renato",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Essa combinação é o que permite à Comercial JR dar o salto de uma operação tradicional para uma empresa estruturada, técnica e preparada para crescer.
            </p>
            <p className="mt-4 italic text-sm border-l-2 border-secondary pl-4">
              Aqui não nasce apenas uma empresa. Nasce um modelo que acompanha a Comercial JR até hoje: equilibrar prática e técnica para resolver problemas reais do cliente.
            </p>
          </div>

          {/* 4. Consolidação */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Consolidação Regional</h2>
            <p>
              Ao longo dos anos, a Comercial JR constrói algo que não se compra: <strong className="text-foreground">confiança</strong>.
            </p>
            <p className="mt-4">
              Em um mercado onde o produtor rural não pode errar — porque erro significa prejuízo — a empresa se posiciona de forma diferente. Não só como a que vende mais barato. Mas como a <strong className="text-foreground">mais segura</strong>.
            </p>
            <p className="mt-4 italic text-sm border-l-2 border-secondary pl-4">
              Esse posicionamento nasce de um princípio que continua atual: o cliente não compra produto — ele compra segurança, parceria e redução de risco.
            </p>
            <p className="mt-4">A empresa se consolida na região por:</p>
            <ul className="mt-3 space-y-2">
              {[
                "atendimento próximo",
                "conhecimento técnico real",
                "suporte antes, durante e depois da venda",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">Essa fase é onde a Comercial JR se torna, de fato, referência regional.</p>
          </div>

          {/* 5. Modernização */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Modernização — 2000 a 2006</h2>
            <p>A partir dos anos 2000, a empresa entra em uma nova fase de evolução.</p>
            <p className="mt-4">
              É nesse período que entra em cena <strong className="text-foreground">Moisés Barbosa Marques</strong>, que rapidamente se destaca e em 2010 assume a posição de Gerente de Vendas. Moisés traz uma nova visão de gestão e operação, contribuindo diretamente para:
            </p>
            <ul className="mt-3 space-y-2">
              {["organização interna", "fortalecimento da equipe", "melhoria dos processos"].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Sua atuação se torna uma peça-chave na evolução da empresa, ajudando a preparar a Comercial JR para um novo ciclo de crescimento.
            </p>
            <p className="mt-4">
              Em 2006, ocorre a reestruturação societária, com <strong className="text-foreground">Jaime Machado Alves</strong> e <strong className="text-foreground">Nailda Alves</strong> assumindo a condução da empresa. Esse período é marcado por:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "profissionalização da gestão",
                "treinamento da equipe",
                "modernização da estrutura",
                "ampliação estratégica do mix de produtos",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">A empresa se prepara para crescer de forma mais estruturada e consistente.</p>
          </div>

          {/* 6. Ampliação */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Ampliação de Soluções</h2>
            <p>Com o passar dos anos, a Comercial JR evolui junto com o mercado.</p>
            <p className="mt-4">
              A empresa amplia seu portfólio e passa a oferecer soluções completas para diferentes necessidades do campo, construção e da indústria. Ao mesmo tempo, ocorre uma decisão estratégica importante: a empresa deixa de atuar com máquinas pesadas, como tratores, e direciona seu foco para soluções mais técnicas, acessíveis e de alta rotatividade.
            </p>
            <p className="mt-4">Hoje, a Comercial JR trabalha com milhares de itens e soluções, incluindo:</p>
            <ul className="mt-3 space-y-2">
              {[
                "ferramentas profissionais",
                "máquinas elétricas",
                "bombas e motores",
                "locação de equipamentos",
                "assistência técnica especializada",
                "soluções completas para poços artesianos",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              E principalmente: <strong className="text-foreground">projetos e soluções de irrigação</strong>, que se tornam o principal foco estratégico da empresa.
            </p>
            <p className="mt-4">
              Essa mudança não foi aleatória. Ela acompanha a evolução do campo, onde produtividade, eficiência e controle passaram a ser fatores decisivos.
            </p>
          </div>

          {/* 7. Digital */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Nova Fase Digital</h2>
            <p>
              Com a mudança de comportamento do cliente e o avanço da tecnologia, a Comercial JR expande sua presença para o ambiente digital. O atendimento passa a acontecer também por WhatsApp, redes sociais e canais online.
            </p>
            <p className="mt-4">
              O digital não substitui o atendimento tradicional — ele amplia. A empresa passa a usar o conteúdo como ferramenta de:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "construção de autoridade",
                "redução de objeções",
                "aproximação com o cliente",
                "geração de confiança",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4 italic text-sm border-l-2 border-secondary pl-4">
              Se antes a decisão era tomada apenas no balcão, agora ela começa muito antes — no conteúdo.
            </p>
          </div>

          {/* 8. Legado */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Legado e Terceira Geração</h2>
            <p>A história da Comercial JR é, acima de tudo, uma história de continuidade.</p>
            <p className="mt-4">
              Cada fase da empresa trouxe algo novo, mas sem perder a essência. Uma empresa construída por gerações que compartilham os mesmos valores:
            </p>
            <ul className="mt-3 space-y-2">
              {["trabalho sério", "conhecimento técnico", "compromisso com o cliente"].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Valores que começaram lá atrás, com Jorge de Assis Alves — na forma de trabalhar, na forma de tratar as pessoas e no respeito por quem depende do campo para viver. Valores que atravessaram gerações, evoluíram com o tempo e continuam guiando cada decisão da empresa até hoje. Eles não foram criados. Foram <strong className="text-foreground">herdados</strong>.
            </p>
            <p className="mt-4">
              Após 2020, uma nova geração entra na empresa: <strong className="text-foreground">Lucas Alves</strong> e <strong className="text-foreground">Gabriel Alves</strong>, representando a terceira geração da família.
            </p>
            <p className="mt-4">
              Mas essa nova fase começa ainda antes. Em 2019, Lucas Alves vai para Toronto, no Canadá, para estudar International Business Management, seguindo um caminho muito semelhante ao que Jaime percorreu décadas antes ao sair de Castelo em busca de conhecimento técnico.
            </p>
            <p className="mt-4">
              Enquanto isso, Gabriel Alves, assim como Renato no passado, permanece mais próximo da operação, contribuindo diretamente com a vivência prática do negócio, entendendo o dia a dia da empresa e fortalecendo a base construída pelas gerações anteriores.
            </p>
            <p className="mt-4 italic text-sm border-l-2 border-secondary pl-4">
              Mais uma vez, a história se repete — não por acaso, mas por essência. De um lado, a busca por conhecimento e visão de futuro. Do outro, a prática, a experiência e a conexão com a realidade do cliente.
            </p>
            <p className="mt-4">
              Assim como aconteceu em 1985, essa nova fase não representa ruptura — mas continuidade. A mesma lógica se mantém: novas ideias chegam, novos conhecimentos são incorporados, mas os valores permanecem.
            </p>
            <p className="mt-4">
              A Comercial JR segue evoluindo com o mesmo princípio que deu origem a tudo: não é sobre vender produtos. É <strong className="text-foreground">resolver problemas reais</strong> de quem produz, constrói e trabalha todos os dias.
            </p>
          </div>

          {/* Prêmio */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Prêmio Marcas de Castelo</h2>
            <p>
              A Comercial JR é vencedora por 4 anos consecutivos do "Prêmio Marcas de Castelo", um reconhecimento pelo empenho de nossos colaboradores em oferecer o melhor preço e os melhores serviços de atendimento e entrega.
            </p>
          </div>

        </div>
      </div>
    </section>
  </Layout>
);

export default NossaHistoria;
