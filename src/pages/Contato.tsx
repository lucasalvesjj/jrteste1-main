import { useState, useCallback } from "react";
import { Phone, Mail, MapPin, Clock, Send, Copy, Check, Facebook, Instagram, Linkedin, Youtube, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { company } from "@/data/company";
import { toast } from "sonner";

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

const Contato = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  // Número principal para ligações (primeiro número do campo phone)
  const phoneRaw = "2835421332"; // (28) 3542-1332
  const phoneFormatted = "(28) 3542-1332";
  const telLink = `tel:+55${phoneRaw}`;

  const [copied, setCopied] = useState(false);
  const handleCopyPhone = useCallback(() => {
    const doCopy = () => {
      setCopied(true);
      toast.success("Número copiado! Cole onde quiser.");
      setTimeout(() => setCopied(false), 2500);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(phoneFormatted).then(doCopy).catch(() => {
        // fallback para contextos sem permissão
        fallbackCopy(phoneFormatted);
        doCopy();
      });
    } else {
      fallbackCopy(phoneFormatted);
      doCopy();
    }
  }, [phoneFormatted]);

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const lines = [
      `*Novo contato pelo site*`,
      ``,
      `*Nome:* ${form.name}`,
      `*E-mail:* ${form.email}`,
      form.phone.trim() ? `*Telefone:* ${form.phone}` : null,
      ``,
      `*Mensagem:*`,
      form.message,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const encodedText = encodeURIComponent(lines);
    const waUrl = isMobileDevice()
      ? `https://wa.me/${company.whatsapp}?text=${encodedText}`
      : `https://web.whatsapp.com/send?phone=${company.whatsapp}&text=${encodedText}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <Layout>
      <SEOHead
        title="Contato"
        description="Fale com a Comercial JR em Castelo ES: (28) 3542-1332. Atendimento seg–sex 7h–17h | sáb 7h–11h30. Presencial, WhatsApp e e-mail."
        canonical="/contato/"
        ogImage="/og-image.jpg"
      />

      <section className="bg-brand-gradient py-16 text-primary-foreground md:py-24">
        <div className="container-custom text-center">
          <h1 className="mb-4 font-heading text-4xl font-black md:text-5xl">Contato</h1>
          <p className="mx-auto max-w-2xl text-primary-foreground/80">
            Estamos prontos para atender você. Fale com nossa equipe, tire dúvidas sobre produtos e
            encontre a melhor solução para sua necessidade.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Informações de Contato</h2>
              <div className="space-y-6">
                {[
                  { icon: Phone, label: "Telefone", value: company.phone },
                  { icon: Mail, label: "E-mail", value: company.email },
                  { icon: MapPin, label: "Endereço", value: company.fullAddress, href: company.mapsUrl },
                  { icon: Clock, label: "Horário", value: company.businessHours },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="rounded-lg bg-accent p-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground">{item.label}</h3>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-muted/60 p-6">
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Prefere ligar?</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Fale diretamente com nossa equipe por telefone.
                </p>
                {isMobileDevice() ? (
                  <a
                    href={telLink}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Phone className="h-4 w-4" />
                    Ligar para {phoneFormatted}
                  </a>
                ) : (
                  <button
                    onClick={handleCopyPhone}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Número copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {phoneFormatted} — clique para copiar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Envie uma Mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Mensagem *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={1000}
                  />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <Send className="h-4 w-4" />
                  Enviar pelo WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Conecte-se com a gente */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom text-center">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground md:text-3xl">
            Conecte-se com a gente
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-muted-foreground">
            Acompanhe novidades, dicas, bastidores e ofertas nas nossas redes sociais.
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                name: "Instagram",
                handle: "@comercialjrltda",
                href: company.social.instagram,
                icon: <Instagram className="h-7 w-7" />,
                color: "from-pink-500 to-orange-400",
              },
              {
                name: "Facebook",
                handle: "/ComercialJRCastelo",
                href: company.social.facebook,
                icon: <Facebook className="h-7 w-7" />,
                color: "from-blue-600 to-blue-500",
              },
              {
                name: "TikTok",
                handle: "@lojacomercialjr",
                href: company.social.tiktok,
                icon: (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.27 8.27 0 0 0 4.76 1.5V7.12a4.83 4.83 0 0 1-1-.43Z" /></svg>
                ),
                color: "from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300",
              },
              {
                name: "YouTube",
                handle: "@comercialjrltda",
                href: company.social.youtube,
                icon: <Youtube className="h-7 w-7" />,
                color: "from-red-600 to-red-500",
              },
              {
                name: "LinkedIn",
                handle: "/comercial-jr",
                href: company.social.linkedin,
                icon: <Linkedin className="h-7 w-7" />,
                color: "from-blue-700 to-blue-600",
              },
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${social.color} text-white transition-transform duration-300 group-hover:scale-110`}>
                  {social.icon}
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-foreground">{social.name}</p>
                  <p className="text-xs text-muted-foreground">{social.handle}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Seguir <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início",  item: "https://comercialjrltda.com.br/" },
              { "@type": "ListItem", position: 2, name: "Contato", item: "https://comercialjrltda.com.br/contato/" },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "@id": "https://comercialjrltda.com.br/contato/",
            name: "Contato — Comercial JR",
            url: "https://comercialjrltda.com.br/contato/",
            inLanguage: "pt-BR",
            publisher: { "@id": "https://comercialjrltda.com.br/#organization" },
          }),
        }}
      />
    </Layout>
  );
};

export default Contato;
