import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  FolderPlus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  LogOut,
  FileText,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Server,
  Laptop,
  Copy,
  Check,
  HardDriveUpload,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useBlogStore } from "@/stores/blogStore";
import type { BlogPost } from "@/data/blogTypes";
import { BLOG_DATA_PATH, parseBlogImport } from "@/lib/blogContent";
import { getCategoryLabel, getCategoryTone, getPostCategories } from "@/lib/blogCategories";
import JRLoader from "@/components/JRLoader";

const AdminPostEditor = lazy(() => import("@/components/admin/AdminPostEditor"));
const AdminSeoEditor = lazy(() => import("@/components/admin/AdminSeoEditor"));

const ADMIN_PASS = "0";
const ADMIN_AUTH_KEY = "comercial-jr-admin-authenticated";
const POSTS_PAGE_SIZE = 20;

type SortField = "date" | "status" | "title" | "category";
type SortDirection = "asc" | "desc";

const sourceMeta = {
  "published-json": {
    label: "Lendo arquivo publicado do servidor",
    tone: "bg-brand-green/10 text-brand-green",
    icon: Server,
  },
  "fallback-code": {
    label: "Arquivo publicado não encontrado",
    tone: "bg-primary/10 text-primary",
    icon: FileText,
  },
  "local-draft": {
    label: "Cópia local em edição",
    tone: "bg-brand-orange/10 text-brand-orange",
    icon: Laptop,
  },
} as const;

const formatExportDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${minutes}`;
};

const buildDuplicateSlug = (slug: string, existingSlugs: string[]) => {
  let counter = 1;
  let candidate = `${slug}-${counter}`;

  while (existingSlugs.includes(candidate)) {
    counter += 1;
    candidate = `${slug}-${counter}`;
  }

  return candidate;
};

const buildDuplicateTitle = (title: string, existingTitles: string[]) => {
  let counter = 1;
  let candidate = `${title} -${counter}`;

  while (existingTitles.includes(candidate)) {
    counter += 1;
    candidate = `${title} -${counter}`;
  }

  return candidate;
};

const AdminViewFallback = ({ label }: { label: string }) => (
  <JRLoader size="lg" label={`Carregando ${label}...`} />
);

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const {
    categories,
    posts,
    source,
    loading,
    init,
    addCategory,
    addPost,
    updatePost,
    deletePost,
    getPost,
    importPosts,
    exportFile,
    isSlugUnique,
    resetToPublished,
    toggleCategoryVisibility,
  } = useBlogStore();

  const [view, setView] = useState<"list" | "edit" | "seo-global">(
    () => (sessionStorage.getItem("admin-view") as "list" | "edit" | "seo-global") || "list"
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(
    () => sessionStorage.getItem("admin-editing-slug")
  );

  useEffect(() => {
    sessionStorage.setItem("admin-view", view);
    if (editingSlug) {
      sessionStorage.setItem("admin-editing-slug", editingSlug);
    } else {
      sessionStorage.removeItem("admin-editing-slug");
    }
  }, [view, editingSlug]);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedItem, setCopiedItem] = useState<"path" | "filename" | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(POSTS_PAGE_SIZE);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [publicationGuideOpen, setPublicationGuideOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Estabiliza o nome do backup para evitar stale closure nos botões de cópia
  const stableExportName = useMemo(() => `blog-posts-backup_${formatExportDate()}.json`, []);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    setVisibleCount(POSTS_PAGE_SIZE);
  }, [search, filterCat, filterStatus, sortField, sortDirection, posts.length]);

  const filtered = useMemo(
    () =>
      posts
        .filter((post) => filterCat === "all" || post.categories.includes(filterCat))
        .filter((post) => filterStatus === "all" || post.status === filterStatus)
        .filter((post) => !search || post.title.toLowerCase().includes(search.toLowerCase()) || post.slug.includes(search.toLowerCase())),
    [posts, search, filterCat, filterStatus]
  );

  const sortedPosts = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortField === "date") {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
      }

      if (sortField === "status") {
        const statusOrder = { published: 1, draft: 0 };
        return (statusOrder[a.status] - statusOrder[b.status]) * direction;
      }

      if (sortField === "category") {
        const categoryA = getPostCategories(a).map((categoryId) => getCategoryLabel(categoryId, categories)).join(", ");
        const categoryB = getPostCategories(b).map((categoryId) => getCategoryLabel(categoryId, categories)).join(", ");
        return categoryA.localeCompare(categoryB, "pt-BR", { sensitivity: "base" }) * direction;
      }

      return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }) * direction;
    });
  }, [categories, filtered, sortDirection, sortField]);

  const visiblePosts = useMemo(() => sortedPosts.slice(0, visibleCount), [sortedPosts, visibleCount]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= sortedPosts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + POSTS_PAGE_SIZE, sortedPosts.length));
        }
      },
      { rootMargin: "160px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [sortedPosts.length, visibleCount]);

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((post) => post.status === "published").length,
      draft: posts.filter((post) => post.status === "draft").length,
      categories: categories.length,
    }),
    [categories.length, posts]
  );

  const exportName = stableExportName;

  const copyText = async (value: string, type: "path" | "filename") => {
    const markCopied = () => {
      setCopiedItem(type);
      toast.success("Copiado para a área de transferência");
      window.setTimeout(() => setCopiedItem(null), 1800);
    };

    // Tenta clipboard moderno (requer HTTPS ou localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        markCopied();
        return;
      } catch {
        // cai no fallback abaixo
      }
    }

    // Fallback via execCommand (funciona em HTTP e ambientes sem permissão de clipboard)
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        markCopied();
      } else {
        toast.error("Não consegui copiar automaticamente");
      }
    } catch {
      toast.error("Não consegui copiar automaticamente");
    }
  };

  const handleDelete = (slug: string) => {
    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      deletePost(slug);
      toast.success("Post excluído com sucesso");
    }
  };

  const handleDuplicate = (post: BlogPost) => {
    const duplicatedPost: BlogPost = {
      ...post,
      slug: buildDuplicateSlug(post.slug, posts.map((item) => item.slug)),
      title: buildDuplicateTitle(post.title, posts.map((item) => item.title)),
      status: "draft",
    };

    try {
      addPost(duplicatedPost);
      toast.success("Post duplicado com sucesso");
    } catch {
      toast.error("Não foi possível duplicar o post porque o slug já existe");
    }
  };

  const downloadJson = (filename: string) => {
    const data = JSON.stringify(exportFile(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedContent = parseBlogImport(event.target?.result as string);
          importPosts(importedContent);
          toast.success(`${importedContent.posts.length} posts e ${importedContent.categories.length} categorias carregados na sua cópia local`);
        } catch {
          toast.error("Arquivo JSON inválido para o blog");
        }
      };

      reader.readAsText(file);
    };
    input.click();
  };

  const handleAddCategory = () => {
    try {
      const created = addCategory(newCategoryLabel);
      setNewCategoryLabel("");
      toast.success(`Categoria "${created.label}" criada com sucesso`);
    } catch (error) {
      if (error instanceof Error && (error.message === "duplicate-category" || error.message === "empty-category")) {
        toast.error(error.message === "duplicate-category" ? "Já existe uma categoria com esse nome" : "Digite um nome para criar a categoria");
        return;
      }

      toast.error("Não foi possível criar a categoria");
    }
  };

  const handleSave = (post: BlogPost, isNew: boolean) => {
    try {
      if (isNew) {
        addPost(post);
        toast.success("Post criado com sucesso");
      } else if (editingSlug) {
        updatePost(editingSlug, post);
        toast.success("Post atualizado com sucesso");
      }
    } catch {
      toast.error("Não foi possível salvar. Esta URL já existe em outro post.");
      return;
    }

    setView("list");
    setEditingSlug(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "title" || field === "category" ? "asc" : "desc");
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const active = sortField === field;

    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
      >
        <span>{label}</span>
        <span className="inline-flex items-center rounded border border-border bg-background/80 px-1 py-0.5">
          {active && sortDirection === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-primary" />
          ) : active && sortDirection === "desc" ? (
            <ChevronDown className="h-3.5 w-3.5 text-primary" />
          ) : (
            <span className="inline-flex flex-col text-muted-foreground/70">
              <ChevronUp className="h-3 w-3" />
              <ChevronDown className="-mt-1 h-3 w-3" />
            </span>
          )}
        </span>
      </button>
    );
  };

  if (view === "edit") {
    const post = editingSlug ? getPost(editingSlug) : undefined;
    return (
      <Suspense fallback={<AdminViewFallback label="editor" />}>
        <AdminPostEditor
          post={post}
          categories={categories}
          onSave={handleSave}
          onDelete={(slug) => {
            handleDelete(slug);
            setView("list");
            setEditingSlug(null);
          }}
          onCancel={() => {
            setView("list");
            setEditingSlug(null);
          }}
          isSlugUnique={(slug) => isSlugUnique(slug, editingSlug || undefined)}
        />
      </Suspense>
    );
  }

  if (view === "seo-global") {
    return (
      <Suspense fallback={<AdminViewFallback label="SEO" />}>
        <AdminSeoEditor onBack={() => setView("list")} />
      </Suspense>
    );
  }

  const currentSource = sourceMeta[source];
  const SourceIcon = currentSource.icon;

  return (
    <div className="dark admin-dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container-custom flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded bg-primary-foreground px-2 py-0.5 font-heading text-sm font-black text-primary">JR</span>
            <span className="font-heading text-sm font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <Eye className="h-4 w-4" />
              Ver Site
            </Link>
            <button onClick={onLogout} className="ml-3 flex items-center gap-1 text-sm text-primary-foreground/70 hover:text-primary-foreground">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-custom py-6">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${currentSource.tone}`}>
                <SourceIcon className="h-4 w-4" />
                {currentSource.label}
              </div>
              <h1 className="mt-3 font-heading text-2xl font-bold text-foreground">Gestão de Posts</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Edite aqui na sua máquina, exporte o JSON e substitua esse mesmo arquivo no servidor.
                O site publicado vai ler sempre de <code className="ml-1 rounded bg-muted px-1.5 py-0.5">{BLOG_DATA_PATH}</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setEditingSlug(null); setView("edit"); }} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Post
              </button>
              <button onClick={() => setView("seo-global")} className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/80">
                <BarChart3 className="h-4 w-4" />
                SEO Global
              </button>
              <button onClick={() => { downloadJson("blog-posts.json"); toast.success("Arquivo principal pronto para envio ao servidor"); }} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <Download className="h-4 w-4" />
                Exportar Publicação
              </button>
              <button onClick={handleImport} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" />
                Importar JSON
              </button>
              <button onClick={() => void resetToPublished().then(() => toast.success("Cópia local recarregada a partir da versão publicada"))} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Recarregar Publicado
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <button
              type="button"
              onClick={() => setPublicationGuideOpen((prev) => !prev)}
              className="mb-1 flex w-full items-center gap-2 text-left"
            >
              <HardDriveUpload className="h-5 w-5 text-primary" />
              <h2 className="flex-1 font-heading text-lg font-bold text-foreground">Publicação Guiada</h2>
              {publicationGuideOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            {publicationGuideOpen && (
              <>
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  {[
                    "1. Edite ou revise os posts na sua cópia local.",
                    "2. Clique em Exportar Publicação para baixar o arquivo oficial.",
                    "3. Envie o arquivo para o servidor substituindo o JSON atual.",
                    "4. Atualize o site ou limpe cache se necessário para ver a nova versão.",
                  ].map((step) => (
                    <div key={step} className="rounded-xl bg-muted/60 p-4 text-sm text-foreground">{step}</div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => void copyText(BLOG_DATA_PATH, "path")} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                    {copiedItem === "path" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copiar Caminho do Servidor
                  </button>
                  <button onClick={() => { downloadJson(exportName); toast.success("Backup local exportado com data e hora"); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                    <Download className="h-4 w-4" />
                    Exportar Backup com Data
                  </button>
                  <button onClick={() => void copyText(exportName, "filename")} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                    {copiedItem === "filename" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copiar Nome do Backup
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <button
              type="button"
              onClick={() => setPublicationGuideOpen((prev) => !prev)}
              className="mb-1 flex w-full items-center gap-2 text-left"
            >
              <h2 className="flex-1 font-heading text-lg font-bold text-foreground">Resumo do Arquivo</h2>
              {publicationGuideOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            {publicationGuideOpen && (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-muted/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Arquivo de publicação</div>
                  <div className="mt-1 font-mono text-foreground">blog-posts.json</div>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destino no servidor</div>
                  <div className="mt-1 font-mono text-foreground">{BLOG_DATA_PATH}</div>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Backup sugerido</div>
                  <div className="mt-1 font-mono break-all text-foreground">{exportName}</div>
                </div>
                <div className="rounded-xl bg-muted/60 p-4 text-muted-foreground">
                  O JSON exportado leva posts e categorias juntos. Publique sempre com o nome fixo <code className="mx-1 rounded bg-background px-1 py-0.5">blog-posts.json</code>.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
            { label: "Publicados", value: stats.published, icon: CheckCircle, color: "text-brand-green" },
            { label: "Rascunhos", value: stats.draft, icon: Clock, color: "text-brand-orange" },
            { label: "Categorias", value: stats.categories, icon: FolderPlus, color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <item.icon className={`h-8 w-8 ${item.color}`} />
              <div>
                <div className="font-heading text-2xl font-black text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <button
            type="button"
            onClick={() => setCategoriesOpen((prev) => !prev)}
            className="flex w-full items-center gap-2 text-left"
          >
            <FolderPlus className="h-5 w-5 text-primary" />
            <h2 className="flex-1 font-heading text-lg font-bold text-foreground">Categorias do Blog</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {categories.length}
            </span>
            {categoriesOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          {categoriesOpen && (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Crie novas categorias aqui. Elas passam a valer no admin, no blog e no JSON exportado.</p>
              <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder="Ex: Jardinagem, Construção Civil..."
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={handleAddCategory} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <FolderPlus className="h-4 w-4" />
                  Criar Categoria
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1.5 text-sm font-medium transition-opacity ${
                      getCategoryTone(category.id, categories)
                    } ${category.hidden ? "opacity-50" : ""}`}
                  >
                    <span>{category.label}</span>
                    <span className="opacity-60 text-xs">/{category.id}</span>
                    <button
                      type="button"
                      onClick={() => toggleCategoryVisibility(category.id)}
                      title={category.hidden ? "Categoria oculta — clique para tornar visível" : "Categoria visível — clique para ocultar"}
                      className="ml-1 rounded-full p-1 transition-colors hover:bg-black/10"
                    >
                      {category.hidden ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">Todas categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="all">Todos status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1">
              Ordem atual: {sortField === "date" ? (sortDirection === "desc" ? "Mais recentes" : "Mais antigos") : sortField === "status" ? (sortDirection === "desc" ? "Publicados primeiro" : "Rascunhos primeiro") : sortField === "category" ? (sortDirection === "asc" ? "Categoria A-Z" : "Categoria Z-A") : sortDirection === "asc" ? "Título A-Z" : "Título Z-A"}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">Exibindo {Math.min(visiblePosts.length, sortedPosts.length)} de {sortedPosts.length}</span>
          </div>
          {visiblePosts.length < sortedPosts.length && <span>Role para carregar mais posts</span>}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-foreground"><SortButton field="title" label="Título" /></th>
                  <th className="hidden min-w-[210px] px-4 py-3 text-left font-heading font-semibold text-foreground md:table-cell"><SortButton field="category" label="Categoria" /></th>
                  <th className="hidden px-4 py-3 text-left font-heading font-semibold text-foreground lg:table-cell"><SortButton field="date" label="Data" /></th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-foreground"><SortButton field="status" label="Status" /></th>
                  <th className="px-4 py-3 text-right font-heading font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiblePosts.map((post) => {
                  const postCategories = getPostCategories(post);
                  return (
                    <tr key={post.slug} className="border-b border-border transition-colors hover:bg-muted/30 last:border-0">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => { setEditingSlug(post.slug); setView("edit"); }} className="line-clamp-1 text-left font-medium text-foreground transition-colors hover:text-primary" title="Abrir para editar">
                          {post.title}
                        </button>
                        <div className="mt-0.5 text-xs text-muted-foreground">/{post.slug}/</div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {postCategories.map((categoryId) => (
                            <span key={categoryId} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getCategoryTone(categoryId, categories)}`}>
                              {getCategoryLabel(categoryId, categories)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{new Date(post.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.status === "published" ? "bg-brand-green/10 text-brand-green" : "bg-brand-orange/10 text-brand-orange"}`}>
                          {post.status === "published" ? "Publicado" : "Rascunho"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/${post.slug}/`} target="_blank" className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Ver"><Eye className="h-4 w-4" /></Link>
                          <button onClick={() => handleDuplicate(post)} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Duplicar"><Copy className="h-4 w-4" /></button>
                          <button onClick={() => { setEditingSlug(post.slug); setView("edit"); }} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Editar"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(post.slug)} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedPosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhum post encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {visiblePosts.length < sortedPosts.length && (
          <div ref={loadMoreRef} className="mt-4 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
            Carregando mais posts ao rolar...
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">{sortedPosts.length} de {posts.length} posts encontrados</p>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  });
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    window.localStorage.setItem(ADMIN_AUTH_KEY, "true");
    setAuthenticated(true);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div className="dark admin-dark flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <span className="rounded bg-primary px-3 py-1.5 font-heading text-lg font-black text-primary-foreground">JR</span>
            <h1 className="mt-4 font-heading text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Digite a senha para acessar</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              password === ADMIN_PASS ? handleLogin() : toast.error("Senha incorreta");
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="mb-4 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default AdminPage;