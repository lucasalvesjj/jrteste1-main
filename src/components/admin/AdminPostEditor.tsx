import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Image as ImageIcon, X, Eye } from "lucide-react";
import { BlogPost, categories } from "@/data/blogPosts";
import RichTextEditor from "./RichTextEditor";

interface AdminPostEditorProps {
  post?: BlogPost;
  onSave: (post: BlogPost, isNew: boolean) => void;
  onCancel: () => void;
  isSlugUnique: (slug: string) => boolean;
}

const generateSlug = (title: string) =>
  title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const emptyPost: BlogPost = {
  slug: "", title: "", excerpt: "", content: "", image: "", category: "ferramentas", tags: [], date: new Date().toISOString().split("T")[0], status: "draft",
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
};

const AdminPostEditor = ({ post, onSave, onCancel, isSlugUnique }: AdminPostEditorProps) => {
  const isNew = !post;
  const [form, setForm] = useState<BlogPost>(post || { ...emptyPost });
  const [tagsInput, setTagsInput] = useState(post?.tags.join(", ") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"content" | "seo">("content");
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew && form.title) {
      setForm((f) => ({ ...f, slug: generateSlug(form.title) }));
    }
  }, [form.title, isNew]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Título é obrigatório";
    if (!form.slug.trim()) errs.slug = "Slug é obrigatório";
    else if (!isSlugUnique(form.slug)) errs.slug = "Slug já existe";
    if (!form.content.trim()) errs.content = "Conteúdo é obrigatório";
    if (!form.excerpt.trim()) errs.excerpt = "Resumo é obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const seo = { ...form.seo, metaTitle: form.seo.metaTitle || `${form.title} | Comercial JR`, metaDescription: form.seo.metaDescription || form.excerpt };
    onSave({ ...form, tags, seo }, isNew);
  };

  const updateField = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateField("image", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
        <div className="container-custom flex items-center justify-between h-14">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="font-heading font-bold text-sm">{isNew ? "Novo Post" : "Editar Post"}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(!showPreview)} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${showPreview ? "bg-secondary text-secondary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"}`}>
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /> Salvar
            </button>
          </div>
        </div>
      </header>

      <div className={`container-custom py-6 ${showPreview ? "max-w-7xl" : "max-w-4xl"} mx-auto`}>
        <div className={`${showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}`}>
          {/* Editor Column */}
          <div>
            <div className="flex gap-1 mb-6 bg-card border border-border rounded-lg p-1 w-fit">
              {(["content", "seo"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "content" ? "Conteúdo" : "SEO"}
                </button>
              ))}
            </div>

            {tab === "content" ? (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Título *</label>
                  <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none ${errors.title ? "border-destructive" : "border-input"}`} maxLength={200} />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Slug *</label>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <span>URL: /</span><span className="font-mono">{form.slug || "..."}</span><span>/</span>
                  </div>
                  <input type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground font-mono text-sm focus:ring-2 focus:ring-ring focus:outline-none ${errors.slug ? "border-destructive" : "border-input"}`} />
                  {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Imagem Destacada</label>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {form.image ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img src={form.image} alt="Imagem destacada" className="w-full h-48 object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => fileInputRef.current?.click()} className="bg-background/80 backdrop-blur-sm p-1.5 rounded-lg hover:bg-background transition-colors" title="Trocar imagem">
                          <ImageIcon className="w-4 h-4 text-foreground" />
                        </button>
                        <button onClick={() => updateField("image", "")} className="bg-background/80 backdrop-blur-sm p-1.5 rounded-lg hover:bg-background transition-colors" title="Remover imagem">
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-input rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">Clique para adicionar imagem</span>
                    </button>
                  )}
                  <div className="mt-2">
                    <input type="url" value={form.image || ""} onChange={(e) => updateField("image", e.target.value)} placeholder="Ou cole a URL da imagem..."
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Resumo *</label>
                  <textarea value={form.excerpt} onChange={(e) => updateField("excerpt", e.target.value)} rows={2}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none resize-none ${errors.excerpt ? "border-destructive" : "border-input"}`} maxLength={300} />
                  {errors.excerpt && <p className="text-xs text-destructive mt-1">{errors.excerpt}</p>}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Conteúdo *</label>
                  <RichTextEditor content={form.content} onChange={(html) => updateField("content", html)} error={!!errors.content} />
                  {errors.content && <p className="text-xs text-destructive mt-1">{errors.content}</p>}
                </div>

                {/* Category + Status + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Categoria</label>
                    <select value={form.category} onChange={(e) => updateField("category", e.target.value)}
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none">
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select value={form.status} onChange={(e) => updateField("status", e.target.value)}
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none">
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Data</label>
                    <input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)}
                      className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tags (separadas por vírgula)</label>
                  <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder="ex: furadeira, ferramentas, dicas" />
                  {tagsInput && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagsInput.split(",").map((t) => t.trim()).filter(Boolean).map((tag, i) => (
                        <span key={i} className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Meta Title</label>
                  <input type="text" value={form.seo.metaTitle} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, metaTitle: e.target.value } }))}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                    placeholder={`${form.title} | Comercial JR`} maxLength={70} />
                  <p className="text-xs text-muted-foreground mt-1">{(form.seo.metaTitle || `${form.title} | Comercial JR`).length}/70</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Meta Description</label>
                  <textarea value={form.seo.metaDescription} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, metaDescription: e.target.value } }))} rows={3}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none resize-none"
                    placeholder={form.excerpt} maxLength={160} />
                  <p className="text-xs text-muted-foreground mt-1">{(form.seo.metaDescription || form.excerpt).length}/160</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">OG Image URL</label>
                  <input type="url" value={form.seo.ogImage || ""} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, ogImage: e.target.value } }))}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:outline-none" placeholder="https://..." />
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-heading font-bold text-sm text-foreground mb-3">Preview Google</h3>
                  <div className="space-y-1">
                    <div className="text-blue-600 text-base font-medium line-clamp-1">{form.seo.metaTitle || `${form.title} | Comercial JR`}</div>
                    <div className="text-green-700 text-xs">comercialjrltda.com.br/{form.slug}/</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{form.seo.metaDescription || form.excerpt}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Column */}
          {showPreview && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <h3 className="font-heading font-bold text-sm text-foreground mb-3">Preview do Post</h3>
                <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {form.image && (
                    <img src={form.image} alt={form.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                        {categories.find(c => c.id === form.category)?.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{form.date ? new Date(form.date).toLocaleDateString("pt-BR") : ""}</span>
                    </div>
                    <h1 className="font-heading text-xl font-bold text-foreground mb-3">{form.title || "Título do post"}</h1>
                    <p className="text-sm text-muted-foreground mb-4">{form.excerpt || "Resumo do post..."}</p>
                    {tagsInput && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tagsInput.split(",").map((t) => t.trim()).filter(Boolean).map((tag, i) => (
                          <span key={i} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.content || "<p>Conteúdo do post...</p>" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPostEditor;
