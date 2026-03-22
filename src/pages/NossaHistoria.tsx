import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Award, Users, MapPin, Calendar } from "lucide-react";

const NossaHistoria = () => (
  <Layout>
    <SEOHead title="Nossa História" description="Conheça a história da Comercial JR LTDA, mais de 39 anos de tradição em máquinas, ferramentas e irrigação no Espírito Santo." canonical="/nossa-historia" />

    <section className="bg-brand-gradient text-primary-foreground py-16 md:py-24">
      <div className="container-custom text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-black mb-4">Nossa História</h1>
        <p className="text-primary-foreground/80 max-w-xl mx-auto">Mais de 39 anos construindo tradição e confiança no Espírito Santo.</p>
      </div>
    </section>

    <section className="section-padding">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <p>
            A Comercial JR LTDA nasceu em Castelo, Espírito Santo, com a missão de oferecer os melhores produtos em máquinas, ferramentas e irrigação para produtores rurais, profissionais da construção civil e entusiastas.
          </p>
          <p>
            Com mais de 39 anos de atuação no mercado, nos consolidamos como uma das maiores referências do setor no estado. Nossa trajetória é marcada pela dedicação em atender cada cliente com excelência, oferecendo não apenas produtos de qualidade, mas também orientação técnica especializada.
          </p>
          <p>
            Hoje, contamos com mais de 13.000 produtos em estoque, atendendo às mais diversas necessidades. Trabalhamos com as principais marcas do mercado como STIHL, DeWalt, Tigre, Amanco, entre outras, garantindo qualidade e confiabilidade em cada produto.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
            {[
              { icon: Calendar, label: "Fundação", value: "39+ anos" },
              { icon: MapPin, label: "Sede", value: "Castelo - ES" },
              { icon: Users, label: "Clientes", value: "50.000+" },
              { icon: Award, label: "Prêmios", value: "4x Marcas de Castelo" },
            ].map((item) => (
              <div key={item.label} className="text-center bg-accent rounded-xl p-4">
                <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-heading text-sm font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>

          <h2 className="font-heading text-2xl font-bold text-foreground">Prêmio Marcas de Castelo</h2>
          <p>
            A Comercial JR é vencedora por 4 anos consecutivos do "Prêmio Marcas de Castelo", um reconhecimento pelo empenho de nossos colaboradores em oferecer o melhor preço e os melhores serviços de atendimento e entrega.
          </p>

          <h2 className="font-heading text-2xl font-bold text-foreground">Nossos Valores</h2>
          <ul className="space-y-3">
            {[
              "Compromisso com a qualidade dos produtos",
              "Atendimento personalizado e especializado",
              "Preços justos e competitivos",
              "Frete grátis para todo o Espírito Santo",
              "Amplo estoque para pronta entrega",
            ].map((v) => (
              <li key={v} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                {v}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  </Layout>
);

export default NossaHistoria;
