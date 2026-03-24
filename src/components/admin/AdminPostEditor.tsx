import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AlertTriangle, ArrowLeft, Eye, History, Image as ImageIcon, Info, RotateCcw, Save, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import type { BlogCategory, BlogPost } from "@/data/blogTypes";
import { getCategoryLabel } from "@/lib/blogCategories";

const RichTextEditor = lazy(() => import("./RichTextEditor"));

interface AdminPostEditorProps {
  post?: BlogPost;
  categories: BlogCategory[];
  onSave: (post: BlogPost, isNew: boolean) => void;
  onCancel: () => void;
  onDelete?: (slug: string) => void;
  isSlugUnique: (slug: string) => boolean;
}

interface DraftVersion {
  id: string;
  savedAt: string;
  label: string;
  form: BlogPost;
  tagsInput: string;
}

const MAX_DRAFT_VERSIONS = 12;

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const emptyPost: BlogPost = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  image: "",
  category: "ferramentas",
  categories: ["ferramentas"],
  tags: [],
  date: new Date().toISOString().split("T")[0],
  status: "draft",
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
};

const EditorFallback = () => (
  <div className="rounded-lg border border-input bg-background p-4 text-sm text-muted-foreground">
    Carregando editor...
  </div>
);

const buildDraftStorageKey = (post?: BlogPost) =>
  `comercial-jr-editor-history:${post?.slug || "new-post"}`;

const readDraftVersions = (storageKey: string): DraftVersion[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDraftVersions = (storageKey: string, versions: DraftVersion[]) => {
  localStorage.setItem(storageKey, JSON.stringify(versions.slice(0, MAX_DRAFT_VERSIONS)));
};

const buildDraftSignature = (form: BlogPost, tagsInput: string) =>
  JSON.stringify({ form, tagsInput });

const normalizeEditorPost = (post: BlogPost | undefined, availableCategories: BlogCategory[]): BlogPost => {
  const base = post || { ...emptyPost };
  const fallbackCategory = availableCategories[0]?.id || emptyPost.categories[0];
  const nextCategories =
    Array.isArray(base.categories) && base.categories.length > 0
      ? [...base.categories]
      : base.category
        ? [base.category]
        : [fallbackCategory];

  return {
    ...base,
    category: nextCategories[0],
    categories: nextCategories,
    tags: Array.isArray(base.tags) ? [...base.tags] : [],
    seo: { ...emptyPost.seo, ...base.seo },
  };
};

const formatSavedAt = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

const AdminPostEditor = ({ post, categories, onSave, onCancel, onDelete, isSlugUnique }: AdminPostEditorProps) => {
  const isNew = !post;
  const [form, setForm] = useState<BlogPost>(normalizeEditorPost(post, categories));
  const [tagsInput, setTagsInput] = useState(post?.tags.join(", ") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"content" | "seo">("content");
  const [showPreview, setShowPreview] = useState(false);
  const [editorMode, setEditorMode] = useState<"simple" | "rich">("simple");
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([]);
  const [hasRestorableVersion, setHasRestorableVersion] = useState(false);
  const [publishedGuardAccepted, setPublishedGuardAccepted] = useState(isNew || post?.status !== "published");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedSignatureRef = useRef("");
  const skipAutosaveRef = useRef(true);
  const initialSnapshotRef = useRef({
    form: normalizeEditorPost(post, categories),
    tagsInput: post?.tags.join(", ") || "",
  });

  const storageKey = useMemo(() => buildDraftStorageKey(post), [post]);
  const currentSignature = useMemo(() => buildDraftSignature(form, tagsInput), [form, tagsInput]);

  useEffect(() => {
    if (isNew && form.title) {
      setForm((current) => ({ ...current, slug: generateSlug(form.title) }));
    }
  }, [form.title, isNew]);

  useEffect(() => {
    const storedVersions = readDraftVersions(storageKey);
    setDraftVersions(storedVersions);
    setHasRestorableVersion(storedVersions.length > 0);
    lastSavedSignatureRef.current = currentSignature;
    skipAutosaveRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    setPublishedGuardAccepted(isNew || post?.status !== "published");
  }, [isNew, post?.slug, post?.status]);

  useEffect(() => {
    initialSnapshotRef.current = {
      form: normalizeEditorPost(post, categories),
      tagsInput: post?.tags.join(", ") || "",
    };
  }, [categories, post, isNew]);

  const restoreDraftVersion = (version: DraftVersion) => {
    setForm(version.form);
    setTagsInput(version.tagsInput);
    setHasRestorableVersion(false);
    toast.success(`Versão restaurada de ${formatSavedAt(version.savedAt)}`);
  };

  const restoreInitialVersion = () => {
    setForm(normalizeEditorPost(initialSnapshotRef.current.form, categories));
    setTagsInput(initialSnapshotRef.current.tagsInput);
    setErrors({});
    setPublishedGuardAccepted(isNew || initialSnapshotRef.current.form.status !== "published");
    toast.success("Alterações desta edição foram descartadas");
  };

  const persistDraftVersion = (label: string) => {
    const snapshot: DraftVersion = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      label,
      form,
      tagsInput,
    };

    const nextVersions = [
      snapshot,
      ...draftVersions.filter((item) => buildDraftSignature(item.form, item.tagsInput) !== currentSignature),
    ].slice(0, MAX_DRAFT_VERSIONS);

    writeDraftVersions(storageKey, nextVersions);
    setDraftVersions(nextVersions);
    setHasRestorableVersion(false);
    lastSavedSignatureRef.current = currentSignature;
  };

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    if (currentSignature === lastSavedSignatureRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      persistDraftVersion("Salvamento automático");
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [currentSignature]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Título é obrigatório";
    if (!form.slug.trim()) nextErrors.slug = "Slug é obrigatório";
    else if (!isSlugUnique(form.slug)) nextErrors.slug = "Slug já existe";
    if (!form.content.trim()) nextErrors.content = "Conteúdo é obrigatório";
    if (!form.excerpt.trim()) nextErrors.excerpt = "Resumo é obrigatório";
    if (!form.categories.length) nextErrors.categories = "Selecione pelo menos uma categoria";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const seo = {
      ...form.seo,
      metaTitle: form.seo.metaTitle || `${form.title} | Comercial JR`,
      metaDescription: form.seo.metaDescription || form.excerpt,
    };

    persistDraftVersion("Versão antes de salvar");
    onSave({ ...form, tags, seo }, isNew);
  };

  const updateField = (field: keyof BlogPost, value: string | string[]) => {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "categories" && Array.isArray(value)) {
        next.category = value[0];
      }

      return next;
    });
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    const nextCategories = form.categories.includes(categoryId)
      ? form.categories.filter((item) => item !== categoryId)
      : [...form.categories, categoryId];

    updateField("categories", nextCategories);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateField("image", event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isPublishedPost = !isNew && post?.status === "published";

  return (
    <div className="dark admin-dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container-custom flex h-14 items-center justify-between">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="font-heading text-sm font-bold">{isNew ? "Novo Post" : "Editar Post"}</h1>
          <div className="flex items-center gap-2">
            {!isNew && post?.slug && onDelete && (
              <button
                onClick={() => onDelete(post.slug)}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                showPreview ? "bg-secondary text-secondary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isPublishedPost && !publishedGuardAccepted}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Salvar
            </button>
          </div>
        </div>
      </header>

      <div className={`container-custom mx-auto py-6 ${showPreview ? "max-w-7xl" : "max-w-4xl"}`}>
        <div className={`${showPreview ? "grid grid-cols-1 gap-6 lg:grid-cols-2" : ""}`}>
          <div>
            <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Publicação por arquivo JSON
              </div>
              <p>
                Este editor salva na sua cópia local. Para publicar no servidor, exporte o arquivo
                `blog-posts.json` no painel e substitua o arquivo em `/data/blog-posts.json`.
              </p>
              <p className="mt-2">
                O modo visual já aceita desfazer e refazer. No modo leve, `Ctrl+Z` e `Ctrl+Shift+Z`
                continuam funcionando normalmente no campo de texto.
              </p>
            </div>

            {isPublishedPost && (
              <div className="mb-4 rounded-xl border border-brand-orange/30 bg-brand-orange/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-brand-orange" />
                  <div className="flex-1">
                    <div className="font-heading text-base font-bold text-foreground">Post publicado</div>
                    <p className="mt-1 text-sm text-foreground/80">
                      Este post já está publicado. Qualquer alteração aqui pode virar a próxima versão que você exportar para o site.
                    </p>
                    <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={publishedGuardAccepted}
                        onChange={(e) => setPublishedGuardAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <span>Entendi e quero liberar a edição deste post publicado.</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
                    <History className="h-4 w-4 text-primary" />
                    Histórico Local
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O editor salva versões automáticas no navegador enquanto você trabalha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    persistDraftVersion("Versão manual");
                    toast.success("Versão salva localmente");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Save className="h-4 w-4" />
                  Salvar versão agora
                </button>
                <button
                  type="button"
                  onClick={restoreInitialVersion}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Voltar ao original
                </button>
              </div>

              {hasRestorableVersion && draftVersions[0] && (
                <div className="mt-4 rounded-lg bg-muted/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-foreground">
                      Existe uma versão local disponível de {formatSavedAt(draftVersions[0].savedAt)}.
                    </p>
                    <button
                      type="button"
                      onClick={() => restoreDraftVersion(draftVersions[0])}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar última versão
                    </button>
                  </div>
                </div>
              )}

              {draftVersions.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {draftVersions.slice(0, 5).map((version) => (
                    <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-foreground">{version.label}</div>
                        <div className="text-xs text-muted-foreground">{formatSavedAt(version.savedAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => restoreDraftVersion(version)}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        <Undo2 className="h-4 w-4" />
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhuma versão local ainda. Assim que você editar, o histórico começa a ser salvo.
                </p>
              )}
            </div>

            <div className="mb-6 flex w-fit gap-1 rounded-lg border border-border bg-card p-1">
              {(["content", "seo"] as const).map((currentTab) => (
                <button
                  key={currentTab}
                  onClick={() => setTab(currentTab)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    tab === currentTab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {currentTab === "content" ? "Conteúdo" : "SEO"}
                </button>
              ))}
            </div>

            {tab === "content" ? (
              <div className={`space-y-4 ${isPublishedPost && !publishedGuardAccepted ? "pointer-events-none opacity-55" : ""}`}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Título *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.title ? "border-destructive" : "border-input"
                    }`}
                    maxLength={200}
                  />
                  {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Slug *</label>
                  <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <span>URL: /</span>
                    <span className="font-mono">{form.slug || "..."}</span>
                    <span>/</span>
                  </div>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.slug ? "border-destructive" : "border-input"
                    }`}
                  />
                  {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Imagem Destacada</label>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                  {form.image ? (
                    <div className="relative overflow-hidden rounded-lg border border-border">
                      <img src={form.image} alt="Imagem destacada" className="h-48 w-full object-cover" />
                      <div className="absolute right-2 top-2 flex gap-1">
                        <button onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background" title="Trocar imagem">
                          <ImageIcon className="h-4 w-4 text-foreground" />
                        </button>
                        <button onClick={() => updateField("image", "")} className="rounded-lg bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background" title="Remover imagem">
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm">Clique para adicionar imagem</span>
                    </button>
                  )}
                  <div className="mt-2">
                    <input
                      type="url"
                      value={form.image || ""}
                      onChange={(e) => updateField("image", e.target.value)}
                      placeholder="Ou cole a URL/caminho da imagem, ex: /blog/post.jpg"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Resumo *</label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    rows={2}
                    className={`w-full resize-none rounded-lg border bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.excerpt ? "border-destructive" : "border-input"
                    }`}
                    maxLength={300}
                  />
                  {errors.excerpt && <p className="mt-1 text-xs text-destructive">{errors.excerpt}</p>}
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-foreground">Conteúdo *</label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditorMode("simple")}
                        className={`rounded-md px-2.5 py-1 transition-colors ${
                          editorMode === "simple"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Modo leve
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("rich")}
                        className={`rounded-md px-2.5 py-1 transition-colors ${
                          editorMode === "rich"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Editor visual
                      </button>
                    </div>
                  </div>
                  {editorMode === "rich" ? (
                    <Suspense fallback={<EditorFallback />}>
                      <RichTextEditor content={form.content} onChange={(html) => updateField("content", html)} error={!!errors.content} />
                    </Suspense>
                  ) : (
                    <div className={`rounded-lg border bg-background p-3 ${errors.content ? "border-destructive" : "border-input"}`}>
                      <p className="mb-3 text-xs text-muted-foreground">
                        O modo leve abre mais rápido e não baixa o editor avançado. Use HTML simples,
                        como `&lt;p&gt;`, `&lt;h2&gt;`, `&lt;ul&gt;` e `&lt;strong&gt;`.
                      </p>
                      <textarea
                        value={form.content}
                        onChange={(e) => updateField("content", e.target.value)}
                        rows={14}
                        className="w-full resize-y rounded-md border border-input bg-background px-4 py-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="<p>Escreva o conteúdo do post aqui...</p>"
                      />
                    </div>
                  )}
                  {errors.content && <p className="mt-1 text-xs text-destructive">{errors.content}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Categorias</label>
                    <div className={`rounded-lg border bg-background p-3 ${errors.categories ? "border-destructive" : "border-input"}`}>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => {
                          const checked = form.categories.includes(category.id);
                          return (
                            <label
                              key={category.id}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                                checked
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-foreground hover:bg-accent"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCategory(category.id)}
                                className="h-4 w-4 rounded border-input"
                              />
                              <span>{category.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    {errors.categories && <p className="mt-1 text-xs text-destructive">{errors.categories}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Data</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="ex: furadeira, ferramentas, dicas"
                  />
                  {tagsInput && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tagsInput
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag, index) => (
                          <span key={index} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`space-y-4 ${isPublishedPost && !publishedGuardAccepted ? "pointer-events-none opacity-55" : ""}`}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Meta Title</label>
                  <input
                    type="text"
                    value={form.seo.metaTitle}
                    onChange={(e) => setForm((current) => ({ ...current, seo: { ...current.seo, metaTitle: e.target.value } }))}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={`${form.title} | Comercial JR`}
                    maxLength={70}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{(form.seo.metaTitle || `${form.title} | Comercial JR`).length}/70</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Meta Description</label>
                  <textarea
                    value={form.seo.metaDescription}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, seo: { ...current.seo, metaDescription: e.target.value } }))
                    }
                    rows={3}
                    className="w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={form.excerpt}
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{(form.seo.metaDescription || form.excerpt).length}/160</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">OG Image URL</label>
                  <input
                    type="url"
                    value={form.seo.ogImage || ""}
                    onChange={(e) => setForm((current) => ({ ...current, seo: { ...current.seo, ogImage: e.target.value } }))}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://..."
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 font-heading text-sm font-bold text-foreground">Preview Google</h3>
                  <div className="space-y-1">
                    <div className="line-clamp-1 text-base font-medium text-blue-600">
                      {form.seo.metaTitle || `${form.title} | Comercial JR`}
                    </div>
                    <div className="text-xs text-green-700">comercialjrltda.com.br/{form.slug}/</div>
                    <div className="line-clamp-2 text-sm text-muted-foreground">{form.seo.metaDescription || form.excerpt}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showPreview && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <h3 className="mb-3 font-heading text-sm font-bold text-foreground">Preview do Post</h3>
                <div className="max-h-[calc(100vh-8rem)] overflow-y-auto overflow-hidden rounded-xl border border-border bg-card">
                  {form.image && <img src={form.image} alt={form.title} className="h-48 w-full object-cover" />}
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {getCategoryLabel(form.category || "", categories)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {form.date ? new Date(form.date).toLocaleDateString("pt-BR") : ""}
                      </span>
                    </div>
                    <h1 className="mb-3 font-heading text-xl font-bold text-foreground">{form.title || "Título do post"}</h1>
                    <p className="mb-4 text-sm text-muted-foreground">{form.excerpt || "Resumo do post..."}</p>
                    {tagsInput && (
                      <div className="mb-4 flex flex-wrap gap-1">
                        {tagsInput
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                          .map((tag, index) => (
                            <span key={index} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              #{tag}
                            </span>
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
