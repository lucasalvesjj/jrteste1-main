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
    return stored ? JSON.parse(stored) : {
      homeTitle: "Comercial JR LTDA - Máquinas, Ferramentas e Irrigação",
      homeDescription: "Referência em máquinas, ferramentas e irrigação no Espírito Santo. Mais de 13.000 produtos e 39 anos de tradição.",
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
    <div className="min-h-screen bg-muted">
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
        <div className="container-custom flex items-center justify-between h-14">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="font-heading font-bold text-sm">SEO Global</h1>
          <button onClick={handleSave} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </header>

      <div className="container-custom py-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-heading font-bold text-lg text-foreground">Configurações Globais de SEO</h2>
          <p className="text-sm text-muted-foreground">Essas configurações são aplicadas como padrão em todo o site.</p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Título da Homepage</label>
            <input type="text" value={form.homeTitle} onChange={(e) => setForm({ ...form, homeTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" maxLength={70} />
            <p className="text-xs text-muted-foreground mt-1">{form.homeTitle.length}/70 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descrição do Site</label>
            <textarea value={form.homeDescription} onChange={(e) => setForm({ ...form, homeDescription: e.target.value })} rows={3}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none resize-none" maxLength={160} />
            <p className="text-xs text-muted-foreground mt-1">{form.homeDescription.length}/160 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome da Empresa</label>
            <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Imagem Padrão (OG Image)</label>
            <input type="text" value={form.defaultImage} onChange={(e) => setForm({ ...form, defaultImage: e.target.value })}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="/og-image.jpg" />
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading font-bold text-sm text-foreground mb-3">Preview Google</h3>
          <div className="space-y-1">
            <div className="text-blue-600 text-base font-medium">{form.homeTitle}</div>
            <div className="text-green-700 text-xs">comercialjrltda.com.br</div>
            <div className="text-sm text-muted-foreground">{form.homeDescription}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSeoEditor;
