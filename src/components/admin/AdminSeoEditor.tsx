import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface GlobalSeo {
  homeTitle: string;
  homeDescription: string;
  companyName: string;
  defaultImage: string;
}

const STORAGE_KEY = "comercial-jr-global-seo";

const getGlobalSeo = (): GlobalSeo => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          homeTitle: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação",
          homeDescription:
            "Referência em máquinas, ferramentas e irrigação no Espírito Santo. Mais de 13.000 produtos e 39 anos de tradição.",
          companyName: "Comercial JR LTDA",
          defaultImage: "/og-image.jpg",
        };
  } catch {
    return {
      homeTitle: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação",
      homeDescription: "Referência em máquinas, ferramentas e irrigação no Espírito Santo.",
      companyName: "Comercial JR LTDA",
      defaultImage: "/og-image.jpg",
    };
  }
};

const AdminSeoEditor = ({ onBack }: { onBack: () => void }) => {
  const [form, setForm] = useState<GlobalSeo>(getGlobalSeo);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    toast.success("Configurações de SEO salvas com sucesso");
  };

  return (
    <div className="dark admin-dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container-custom flex h-14 items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="font-heading text-sm font-bold">SEO Global</h1>
          <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground transition-opacity hover:opacity-90">
            <Save className="h-4 w-4" />
            Salvar
          </button>
        </div>
      </header>

      <div className="container-custom mx-auto max-w-2xl space-y-6 py-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">Configurações Globais de SEO</h2>
          <p className="text-sm text-muted-foreground">Essas configurações são aplicadas como padrão em todo o site.</p>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Título da Homepage</label>
            <input
              type="text"
              value={form.homeTitle}
              onChange={(e) => setForm({ ...form, homeTitle: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={70}
            />
            <p className="mt-1 text-xs text-muted-foreground">{form.homeTitle.length}/70 caracteres</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Descrição do Site</label>
            <textarea
              value={form.homeDescription}
              onChange={(e) => setForm({ ...form, homeDescription: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={160}
            />
            <p className="mt-1 text-xs text-muted-foreground">{form.homeDescription.length}/160 caracteres</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Nome da Empresa</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Imagem Padrão (OG Image)</label>
            <input
              type="text"
              value={form.defaultImage}
              onChange={(e) => setForm({ ...form, defaultImage: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="/og-image.jpg"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-3 font-heading text-sm font-bold text-foreground">Preview Google</h3>
          <div className="space-y-1">
            <div className="text-base font-medium text-blue-600">{form.homeTitle}</div>
            <div className="text-xs text-green-700">comercialjrltda.com.br</div>
            <div className="text-sm text-muted-foreground">{form.homeDescription}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSeoEditor;
