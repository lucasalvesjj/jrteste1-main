import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
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
} from "lucide-react";
import { useBlogStore } from "@/stores/blogStore";
import { BlogPost, categories } from "@/data/blogPosts";
import { BLOG_DATA_PATH, parseBlogImport } from "@/lib/blogContent";
import AdminPostEditor from "@/components/admin/AdminPostEditor";
import AdminSeoEditor from "@/components/admin/AdminSeoEditor";
import { toast } from "sonner";

const ADMIN_PASS = "comercialjr2024";

const sourceMeta = {
  "published-json": {
    label: "Lendo arquivo do servidor",
    tone: "bg-brand-green/10 text-brand-green",
    icon: Server,
  },
  "fallback-code": {
    label: "Usando posts padrão do projeto",
    tone: "bg-primary/10 text-primary",
    icon: FileText,
  },
  "local-draft": {
    label: "Cópia local em edição",
    tone: "bg-brand-orange/10 text-brand-orange",
    icon: Laptop,
  },
} as const;

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <span className="rounded bg-primary px-3 py-1.5 font-heading text-lg font-black text-primary-foreground">JR</span>
            <h1 className="mt-4 font-heading text-xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Digite a senha para acessar</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              password === ADMIN_PASS ? setAuthenticated(true) : toast.error("Senha incorreta");
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

  return <AdminDashboard onLogout={() => setAuthenticated(false)} />;
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const {
    posts,
    source,
    loading,
    init,
    addPost,
    updatePost,
    deletePost,
    getPost,
    importPosts,
    exportFile,
    isSlugUnique,
    resetToPublished,
  } = useBlogStore();

  const [view, setView] = useState<"list" | "edit" | "seo-global">("list");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    void init();
  }, [init]);

  const filtered = useMemo(() => {
    return posts
      .filter((post) => filterCat === "all" || post.category === filterCat)
      .filter((post) => filterStatus === "all" || post.status === filterStatus)
      .filter(
        (post) =>
          !search ||
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.slug.includes(search.toLowerCase())
      );
  }, [posts, search, filterCat, filterStatus]);

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((post) => post.status === "published").length,
      draft: posts.filter((post) => post.status === "draft").length,
    }),
    [posts]
  );

  const handleDelete = (slug: string) => {
    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      deletePost(slug);
      toast.success("Post excluído com sucesso");
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(exportFile(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blog-posts.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo pronto para envio ao servidor");
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
          const importedPosts = parseBlogImport(event.target?.result as string);
          importPosts(importedPosts);
          toast.success(`${importedPosts.length} posts carregados na sua cópia local`);
        } catch {
          toast.error("Arquivo JSON inválido para o blog");
        }
      };

      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = async () => {
    await resetToPublished();
    toast.success("Cópia local recarregada a partir da versão publicada");
  };

  const handleSave = (post: BlogPost, isNew: boolean) => {
    if (isNew) {
      addPost(post);
      toast.success("Post criado com sucesso");
    } else if (editingSlug) {
      updatePost(editingSlug, post);
      toast.success("Post atualizado com sucesso");
    }

    setView("list");
    setEditingSlug(null);
  };

  if (view === "edit") {
    const post = editingSlug ? getPost(editingSlug) : undefined;
    return (
      <AdminPostEditor
        post={post}
        onSave={handleSave}
        onCancel={() => {
          setView("list");
          setEditingSlug(null);
        }}
        isSlugUnique={(slug) => isSlugUnique(slug, editingSlug || undefined)}
      />
    );
  }

  if (view === "seo-global") {
    return <AdminSeoEditor onBack={() => setView("list")} />;
  }

  const currentSource = sourceMeta[source];
  const SourceIcon = currentSource.icon;

  return (
    <div className="min-h-screen bg-muted">
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
                Fluxo recomendado: edite aqui na sua máquina, use <strong>Exportar</strong> para gerar o arquivo
                <code className="ml-1 rounded bg-muted px-1.5 py-0.5">blog-posts.json</code> e envie esse arquivo para
                <code className="ml-1 rounded bg-muted px-1.5 py-0.5">{BLOG_DATA_PATH}</code> no servidor.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditingSlug(null);
                  setView("edit");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Novo Post
              </button>
              <button onClick={() => setView("seo-global")} className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/80">
                <BarChart3 className="h-4 w-4" />
                SEO Global
              </button>
              <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button onClick={handleImport} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" />
                Importar
              </button>
              <button onClick={() => void handleReset()} className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Recarregar Publicado
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
            { label: "Publicados", value: stats.published, icon: CheckCircle, color: "text-brand-green" },
            { label: "Rascunhos", value: stats.draft, icon: Clock, color: "text-brand-orange" },
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
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todas categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-foreground">Título</th>
                  <th className="hidden px-4 py-3 text-left font-heading font-semibold text-foreground md:table-cell">Categoria</th>
                  <th className="hidden px-4 py-3 text-left font-heading font-semibold text-foreground lg:table-cell">Data</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-heading font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => {
                  const category = categories.find((item) => item.id === post.category);
                  return (
                    <tr key={post.slug} className="border-b border-border transition-colors hover:bg-muted/30 last:border-0">
                      <td className="px-4 py-3">
                        <div className="line-clamp-1 font-medium text-foreground">{post.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">/{post.slug}/</div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            post.category === "irrigacao"
                              ? "bg-brand-green/10 text-brand-green"
                              : post.category === "ferramentas"
                                ? "bg-brand-orange/10 text-brand-orange"
                                : "bg-primary/10 text-primary"
                          }`}
                        >
                          {category?.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {new Date(post.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            post.status === "published"
                              ? "bg-brand-green/10 text-brand-green"
                              : "bg-brand-orange/10 text-brand-orange"
                          }`}
                        >
                          {post.status === "published" ? "Publicado" : "Rascunho"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/${post.slug}/`} target="_blank" className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary" title="Ver">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingSlug(post.slug);
                              setView("edit");
                            }}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(post.slug)} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhum post encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {filtered.length} de {posts.length} posts
        </p>
      </div>
    </div>
  );
};

export default AdminPage;
