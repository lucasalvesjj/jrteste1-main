import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Phone, Send, Copy, Check, ShieldCheck, CheckCircle, ArrowRight, Star } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import { company } from "@/data/company";
import { toast } from "sonner";

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

const PRODUTOS_STIHL = [
  { title: "Motosserras STIHL", desc: "Toda a linha de motosserras a gasolina e elétricas para corte, poda e derrubada de árvores." },
  { title: "Roçadeiras STIHL", desc: "Roçadeiras profissionais a gasolina e a bateria para capina, limpeza de terrenos e manutenção de pastagens." },
  { title: "Sopradores STIHL", desc: "Sopradores e aspiradores para jardins, quintais, pátios e uso agrícola." },
  { title: "Podadores STIHL", desc: "Podadores de altura, tesouras de poda elétrica e hedge trimmers para jardins e pomares." },
  { title: "Atomizadores STIHL", desc: "Para aplicação de defensivos agrícolas em lavouras de café, horticultura e fruticultura." },
  { title: "Linha Elétrica STIHL", desc: "Furadeiras, esmerilhadeiras e serras elétricas STIHL para uso doméstico e profissional." },
];

const SERVICOS = [
  "Manutenção preventiva e revisão completa de equipamentos STIHL",
  "Manutenção corretiva — diagnóstico e reparo de falhas",
  "Troca de peças e acessórios originais STIHL",
  "Regulagem de carburador e sistemas de ignição",
  "Afiar e substituição de correntes de motosserra",
  "Revisão e lubrificação de sistemas de transmissão",
  "Atendimento a motores 2 tempos de pequeno porte",
  "Assistência técnica a máquinas elétricas Makita",
];

const AssistenciaStihlPage = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", equipment: "", message: "" });
  const phoneRaw = "2835421332";
  const phoneFormatted = "(28) 3542-1332";
  const telLink = `tel:+55${phoneRaw}`;
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = useCallback(() => {
    const doCopy = () => { setCopied(true); toast.success("Número copiado!"); setTimeout(() => setCopied(false), 2500); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(phoneFormatted).then(doCopy).catch(() => { fallbackCopy(phoneFormatted); doCopy(); });
    } else { fallbackCopy(phoneFormatted); doCopy(); }
  }, [phoneFormatted]);

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea"); el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
    document.body.appendChild(el); el.focus(); el.select(); document.execCommand("copy"); document.body.removeChild(el);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.error("Preencha nome e telefone."); return; }
    const lines = [
      `*Solicitação de Assistência Técnica — Site Comercial JR*`, ``,
      `*Nome:* ${form.name}`,
      `*Telefone:* ${form.phone}`,
      form.email.trim() ? `*E-mail:* ${form.email}` : null,
      form.equipment.trim() ? `*Equipamento:* ${form.equipment}` : null,
      form.message.trim() ? `\n*Descrição do problema:*\n${form.message}` : null,
    ].filter((l) => l !== null).join("\n");
    const encodedText = encodeURIComponent(lines);
    const waUrl = isMobileDevice()
      ? `https://wa.me/${company.whatsapp}?text=${encodedText}`
      : `https://web.whatsapp.com/send?phone=${company.whatsapp}&text=${encodedText}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setForm({ name: "", phone: "", email: "", equipment: "", message: "" });
  };

  return (
    <Layout>
      <SEOHead
        title="Assistência Técnica STIHL Autorizada em Castelo ES | Revenda Oficial — Comercial JR"
        description="Revenda e assistência técnica autorizada STIHL em Castelo ES. Manutenção de motosserras, roçadeiras, sopradores e toda a linha STIHL. Peças originais e atendimento especializado no sul do Espírito Santo."
        canonical="/segmentos/assistencia-stihl/"
        ogImage="/og-image.jpg"
      />

      {/* Hero */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-10 w-10 text-primary-foreground/80" />
            <h1 className="font-heading text-4xl font-black md:text-5xl">Assistência Técnica STIHL</h1>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-primary-foreground/90">Revenda e Assistência Técnica Autorizada STIHL</span>
          </div>
          <p className="max-w-2xl text-primary-foreground/80 text-lg">
            A Comercial JR é revendedora e assistência técnica autorizada STIHL em Castelo – ES.
            Atendemos toda a linha STIHL com técnicos certificados, peças originais e garantia
            de fábrica. Referência no sul do Espírito Santo há mais de 41 anos.
          </p>
        </div>
      </section>

      {/* Revenda + autoridade */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="mb-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: "🏅", titulo: "Revenda Autorizada", desc: "Somos revendedores oficiais STIHL. Compre com a garantia de produto original e suporte completo de fábrica." },
              { icon: "🔧", titulo: "Assistência Certificada", desc: "Técnicos treinados e certificados pela STIHL para manutenção e reparo de toda a linha de equipamentos." },
              { icon: "📦", titulo: "Peças Originais", desc: "Utilizamos exclusivamente peças e acessórios originais STIHL, preservando desempenho e garantia dos equipamentos." },
            ].map((card) => (
              <div key={card.titulo} className="rounded-xl border border-border bg-background p-6 text-center shadow-sm">
                <div className="mb-3 text-4xl">{card.icon}</div>
                <h3 className="mb-2 font-heading font-bold text-foreground">{card.titulo}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
            Revenda e Assistência Técnica Autorizada STIHL — Castelo ES
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            A <strong>Comercial JR</strong> é a referência em produtos e serviços STIHL no sul do
            Espírito Santo. Como revenda autorizada, comercializamos toda a linha STIHL com preço
            oficial, garantia de fábrica e a segurança de estar comprando de quem é especialista
            na marca há décadas.
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Nossa assistência técnica autorizada atende motosserras, roçadeiras, sopradores,
            podadores, atomizadores e toda a linha elétrica STIHL. Além disso, realizamos
            manutenção em motores 2 tempos de pequeno porte e em máquinas elétricas Makita.
          </p>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Utilizamos exclusivamente peças originais STIHL e seguimos os procedimentos técnicos
            indicados pelo fabricante, garantindo desempenho, segurança e preservação da garantia
            do seu equipamento.
          </p>
        </div>
      </section>

      {/* Produtos STIHL */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Produtos STIHL que Comercializamos</h2>
          <p className="mb-6 text-muted-foreground">Linha completa disponível em nossa loja física em Castelo – ES:</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUTOS_STIHL.map((item) => (
              <div key={item.title} className="rounded-lg bg-accent p-5">
                <h3 className="mb-2 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">Serviços de Assistência Técnica</h2>
          <ul className="mb-8 grid gap-3 md:grid-cols-2">
            {SERVICOS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-accent/60 p-6">
            <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Equipamentos Atendidos</h3>
            <p className="text-muted-foreground">
              Atendemos <strong>toda a linha STIHL</strong> (motosserras, roçadeiras, sopradores,
              podadores, atomizadores, hedgers e linha elétrica), <strong>motores 2 tempos de pequeno porte</strong> e
              <strong> máquinas elétricas Makita</strong>. Dúvidas sobre seu equipamento? Entre em contato.
            </p>
          </div>
        </div>
      </section>

      {/* Formulário + Ligar */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Solicitar Orçamento de Assistência</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Nome *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={100} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Telefone / WhatsApp *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={20} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={255} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Equipamento</label>
                  <input type="text" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    placeholder="Ex: Motosserra MS 170, Roçadeira FS 38..."
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={150} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Descrição do problema</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4} placeholder="Descreva o problema ou o serviço desejado..."
                    className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={500} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <Send className="h-4 w-4" />
                  Enviar pelo WhatsApp
                </button>
              </form>
            </div>

            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Prefere Ligar?</h2>
              <p className="mb-4 text-muted-foreground">
                Fale diretamente com nosso time técnico para agendar a revisão do seu equipamento STIHL.
              </p>
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Comercial JR — Assistência STIHL</h3>
                <p className="mb-4 text-sm text-muted-foreground">Seg a Sex: 7h às 17h | Sáb: 7h às 11h30</p>
                {isMobileDevice() ? (
                  <a href={telLink}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                    <Phone className="h-4 w-4" />
                    Ligar para {phoneFormatted}
                  </a>
                ) : (
                  <button onClick={handleCopyPhone}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-5 py-3 font-semibold text-foreground transition-colors hover:bg-accent">
                    {copied
                      ? <><Check className="h-4 w-4 text-green-600" /><span className="text-green-600">Número copiado!</span></>
                      : <><Copy className="h-4 w-4" />{phoneFormatted} — clique para copiar</>}
                  </button>
                )}
                <div className="mt-6">
                  <p className="mb-3 text-sm text-muted-foreground">Ou mande uma mensagem diretamente:</p>
                  <a href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Preciso de assistência técnica para um equipamento STIHL.")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90">
                    <Phone className="h-4 w-4" />
                    Chamar no WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SchemaOrg type="breadcrumb" items={[
        { name: "Início",    url: "/" },
        { name: "Segmentos", url: "/segmentos/" },
        { name: "Assistência Técnica STIHL", url: "/segmentos/assistencia-stihl/" },
      ]} />
      <SchemaOrg type="service"
        name="Assistência Técnica STIHL Autorizada"
        description="Revenda e assistência técnica autorizada STIHL em Castelo ES. Manutenção de motosserras, roçadeiras e sopradores com peças originais."
        url="/segmentos/assistencia-stihl/"
      />
    </Layout>
  );
};

export default AssistenciaStihlPage;
