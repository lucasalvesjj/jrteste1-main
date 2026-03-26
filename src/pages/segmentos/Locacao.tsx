import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Phone, Send, Copy, Check, Package, CheckCircle, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import SchemaOrg from "@/components/SchemaOrg";
import { company } from "@/data/company";
import { toast } from "sonner";

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

const EQUIPAMENTOS = [
  { title: "Compressor de Ar", desc: "Compressores portáteis e estacionários para obras, pintura e pneumática." },
  { title: "Martelo Rompedor", desc: "Para demolição de piso, paredes e concreto. Leve e médio porte." },
  { title: "Roçadeira", desc: "Roçadeiras profissionais a combustão para limpeza de terrenos e propriedades." },
  { title: "Perfurador de Solo", desc: "Para perfuração de buracos para mourões, postes e mourões de cerca." },
  { title: "Furadeiras e Marteletes", desc: "Furadeiras de impacto e marteletes elétricos para obras e reformas." },
  { title: "Compactador de Solo", desc: "Placa vibratória e sapo compactador para compactação de base e pavimento." },
  { title: "Vibrador de Concreto", desc: "Vibrador de imersão para adensamento e consolidação de peças de concreto." },
];

const VANTAGENS = [
  { titulo: "Custo reduzido", desc: "Pague apenas pelo tempo de uso. Sem investimento inicial em equipamento próprio." },
  { titulo: "Sem manutenção", desc: "Toda a manutenção e revisão é por nossa conta. Você recebe o equipamento funcionando." },
  { titulo: "Equipamento sempre atualizado", desc: "Trabalhamos com equipamentos revisados e em bom estado de conservação." },
  { titulo: "Ideal para uso pontual", desc: "Para obras esporádicas, é muito mais econômico locar do que comprar." },
  { titulo: "Flexibilidade de prazo", desc: "Locação por dia, semana ou mês conforme a necessidade da sua obra." },
  { titulo: "Atendimento local em Castelo ES", desc: "Retire e devolva diretamente em nossa loja. Sem fretes complicados." },
];

const LocacaoPage = () => {
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
      `*Solicitação de Locação — Site Comercial JR*`, ``,
      `*Nome:* ${form.name}`,
      `*Telefone:* ${form.phone}`,
      form.email.trim() ? `*E-mail:* ${form.email}` : null,
      form.equipment.trim() ? `*Equipamento de interesse:* ${form.equipment}` : null,
      form.message.trim() ? `\n*Observações:*\n${form.message}` : null,
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
        title="Locação de Máquinas e Equipamentos em Castelo ES — Comercial JR"
        description="Aluguel de equipamentos para obra em Castelo ES: compressor, martelo rompedor, roçadeira, compactador, vibrador de concreto e mais. Locação por dia, semana ou mês."
        canonical="/segmentos/locacao/"
        ogImage="/favicon.webp"
      />

      {/* Hero */}
      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom">
          <Link to="/segmentos" className="mb-4 inline-block text-sm text-primary-foreground/60 hover:text-primary-foreground">
            ← Segmentos
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-10 w-10 text-primary-foreground/80" />
            <h1 className="font-heading text-4xl font-black md:text-5xl">Locação de Máquinas</h1>
          </div>
          <p className="max-w-2xl text-primary-foreground/80 text-lg">
            Aluguel de máquinas e equipamentos leves e médios para obras, reformas e serviços
            agrícolas em Castelo e região sul do Espírito Santo. Retire na loja e devolva
            quando terminar.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
            Locação de Equipamentos para Obras e Serviços — Castelo ES
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            A <strong>Comercial JR</strong> oferece serviço de locação de máquinas e equipamentos
            para quem precisa realizar obras, reformas ou serviços pontuais sem a necessidade de
            comprar o equipamento. Uma solução prática, econômica e acessível para construtores,
            profissionais autônomos e proprietários rurais de Castelo e da região sul do ES.
          </p>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Todos os equipamentos são entregues revisados e prontos para uso. Locação por dia,
            semana ou mês conforme o prazo da sua necessidade. Para consultar disponibilidade
            e solicitar orçamento, utilize o formulário abaixo ou entre em contato por WhatsApp.
          </p>
        </div>
      </section>

      {/* Equipamentos */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Equipamentos Disponíveis para Locação</h2>
          <p className="mb-6 text-muted-foreground">Consulte disponibilidade diretamente com nossa equipe:</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {EQUIPAMENTOS.map((item) => (
              <div key={item.title} className="rounded-lg bg-accent p-5">
                <h3 className="mb-2 font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground italic">
            * Lista sujeita a disponibilidade. Entre em contato para confirmar e verificar outros itens.
          </p>
        </div>
      </section>

      {/* Vantagens */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Por que Locar em vez de Comprar?</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {VANTAGENS.map((v) => (
              <div key={v.titulo} className="flex gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-brand-green" />
                <div>
                  <h3 className="mb-1 font-heading font-bold text-foreground">{v.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário + Telefone */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Formulário */}
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Solicitar Orçamento de Locação</h2>
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
                  <label className="mb-1 block text-sm font-medium text-foreground">Equipamento de interesse</label>
                  <input type="text" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    placeholder="Ex: Compressor de ar, Martelo rompedor..."
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={150} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Observações / Prazo</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4} placeholder="Informe o período de locação e detalhes da obra..."
                    className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" maxLength={500} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <Send className="h-4 w-4" />
                  Enviar pelo WhatsApp
                </button>
              </form>
            </div>

            {/* Ligar */}
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Prefere Ligar?</h2>
              <p className="mb-4 text-muted-foreground">
                Fale diretamente com nossa equipe por telefone para verificar disponibilidade e
                condições de locação.
              </p>
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Comercial JR — Locação</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Seg a Sex: 7h às 17h | Sáb: 7h às 11h30
                </p>
                {isMobileDevice() ? (
                  <a href={telLink}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                    <Phone className="h-4 w-4" />
                    Ligar para {phoneFormatted}
                  </a>
                ) : (
                  <button onClick={handleCopyPhone}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-5 py-3 font-semibold text-foreground transition-colors hover:bg-accent">
                    {copied ? (
                      <><Check className="h-4 w-4 text-green-600" /><span className="text-green-600">Número copiado!</span></>
                    ) : (
                      <><Copy className="h-4 w-4" />{phoneFormatted} — clique para copiar</>
                    )}
                  </button>
                )}

                <div className="mt-6">
                  <p className="mb-3 text-sm text-muted-foreground">Ou mande uma mensagem pelo WhatsApp:</p>
                  <a
                    href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de informações sobre locação de equipamentos.")}`}
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
        { name: "Locação de Equipamentos", url: "/segmentos/locacao/" },
      ]} />
      <SchemaOrg type="service"
        name="Locação de Máquinas e Equipamentos"
        description="Aluguel de equipamentos para obras em Castelo ES: compressor, martelo rompedor, roçadeira, compactador e mais. Locação por dia, semana ou mês."
        url="/segmentos/locacao/"
      />
    </Layout>
  );
};

export default LocacaoPage;
