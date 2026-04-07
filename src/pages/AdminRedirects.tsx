// ──────────────────────────────────────────────
// AdminRedirects — Página de gerenciamento de Redirecionamentos e HTTP 410
// Rota: /admin/redirects
// ──────────────────────────────────────────────

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { useRedirectStore } from "@/stores/redirectStore";
import {
  loadGitHubConfig,
  publishToGitHub,
} from "@/lib/githubPublish";
import AdminRedirects from "@/components/admin/AdminRedirects";

const ADMIN_AUTH_KEY = "comercial-jr-admin-authenticated";
const ADMIN_PASS = "0";

const AdminRedirectsPage = () => {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem(ADMIN_AUTH_KEY) === "true"
  );
  const [password, setPassword] = useState("");
  const [publishing, setPublishing] = useState(false);
  const store = useRedirectStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      localStorage.setItem(ADMIN_AUTH_KEY, "true");
      setAuthenticated(true);
    } else {
      toast.error("Senha incorreta");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthenticated(false);
  };

  const handlePublish = async () => {
    const config = loadGitHubConfig();
    if (!config) {
      toast.error("Configure o GitHub primeiro em Admin > Blog");
      return;
    }

    setPublishing(true);
    try {
      const data = store.exportFile();
      const json = JSON.stringify(data, null, 2);
      const result = await publishToGitHub(json, {
        ...config,
        filePath: "public/data/redirects.json",
      });

      if (result.ok) {
        // Sincronizar disco local em DEV após publicar no GitHub
        if (import.meta.env.DEV) {
          fetch("/api/redirects", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: json,
          }).catch(() => {});
        }
        toast.success("Regras publicadas no GitHub!");
      } else {
        toast.error(result.error ?? "Erro ao publicar");
      }
    } catch {
      toast.error("Erro ao publicar no GitHub");
    } finally {
      setPublishing(false);
    }
  };

  if (!authenticated) {
    return (
      <>
        <Helmet>
          <title>Admin — Redirects | Login</title>
          <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noodp,noimageindex,noai" />
          <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex" />
          <meta name="bingbot" content="noindex,nofollow,noarchive,nosnippet" />
          <meta name="referrer" content="no-referrer" />
        </Helmet>
        <div className="dark admin-dark flex min-h-screen items-center justify-center bg-background p-4">
          <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4 rounded-xl border border-border bg-card p-6 shadow-lg">
            <h1 className="text-center font-heading text-lg font-bold text-foreground">Admin — Redirects</h1>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Entrar
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin — Redirecionamentos</title>
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noodp,noimageindex,noai" />
        <meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet,noimageindex" />
        <meta name="bingbot" content="noindex,nofollow,noarchive,nosnippet" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>

      <div className="dark admin-dark flex min-h-screen flex-col bg-background text-foreground">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-primary-foreground/10">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <div className="h-5 w-px bg-primary-foreground/20" />
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="font-heading text-sm font-bold">Redirecionamentos</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 rounded-md bg-primary-foreground/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-foreground/20 disabled:opacity-50"
            >
              {publishing ? "Publicando..." : "Publicar no GitHub"}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AdminRedirects />
        </main>
      </div>
    </>
  );
};

export default AdminRedirectsPage;
