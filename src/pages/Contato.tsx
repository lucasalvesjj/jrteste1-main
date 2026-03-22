import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { company } from "@/data/company";
import { toast } from "sonner";

const Contato = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const whatsappUrl = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de falar com a equipe da Comercial JR.")}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <Layout>
      <SEOHead
        title="Contato"
        description="Entre em contato com a Comercial JR LTDA. Telefone, e-mail, endereço e formulário de contato."
        canonical="/contato"
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
                  { icon: MapPin, label: "Endereço", value: company.fullAddress },
                  { icon: Clock, label: "Horário", value: "Seg a Sex: 7h às 17h30 | Sáb: 7h às 12h" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="rounded-lg bg-accent p-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-muted/60 p-6">
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Atendimento rápido pelo WhatsApp</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Se preferir, fale agora com nossa equipe para consultar produtos, disponibilidade e
                  condições de entrega.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Falar no WhatsApp
                </a>
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
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
