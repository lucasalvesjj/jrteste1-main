import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Search, Trash2, Download, Upload, Power, PowerOff,
  ExternalLink, ArrowLeftRight, AlertTriangle, FileDown, FileUp,
  BarChart3, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRedirectStore } from "@/stores/redirectStore";
import type { RedirectRule, NotFoundLogEntry, RedirectType } from "@/data/redirectTypes";
import { REDIRECT_TYPES } from "@/data/redirectTypes";
import { parseRedirectImport } from "@/lib/redirectContent";
import RedirectRuleEditor from "./RedirectRuleEditor";

type ActiveTab = "rules" | "404-log";
type TypeFilter = RedirectType | "all";

const TYPE_BADGE_COLORS: Record<RedirectType, string> = {
  301: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  302: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  307: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  410: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ── Aba: Regras ─────────────────────────────────
function RulesTab() {
  const store = useRedirectStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRules = useMemo(() => {
    let result = store.rules;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.sourceUrl.toLowerCase().includes(q) || r.targetUrl.toLowerCase().includes(q) || r.note.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") result = result.filter((r) => r.type === typeFilter);
    if (groupFilter !== "all") result = result.filter((r) => r.group === groupFilter);
    return result;
  }, [store.rules, search, typeFilter, groupFilter]);

  const handleSave = useCallback((rule: RedirectRule) => {
    try {
      if (editingRule) {
        store.updateRule(rule.id, rule);
        toast.success("Regra atualizada");
      } else {
        store.addRule(rule);
        toast.success("Regra criada");
      }
      setEditorOpen(false);
      setEditingRule(null);
    } catch (err) {
      toast.error(err instanceof Error && err.message === "duplicate-source-url"
        ? "Já existe uma regra para esta URL de origem"
        : "Erro ao salvar regra"
      );
    }
  }, [editingRule, store]);

  const handleDelete = useCallback((id: string) => {
    store.deleteRule(id);
    toast.success("Regra removida");
  }, [store]);

  const handleExport = useCallback(() => {
    const data = store.exportFile();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redirects-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo exportado");
  }, [store]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseRedirectImport(reader.result as string);
        store.importRules(data);
        toast.success(`${data.rules.length} regras importadas`);
      } catch {
        toast.error("Arquivo JSON inválido");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [store]);

  const openEditor = useCallback((rule?: RedirectRule) => {
    setEditingRule(rule ?? null);
    setEditorOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => openEditor()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> Adicionar Regra
        </button>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por URL..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value === "all" ? "all" : (Number(e.target.value) as RedirectType))}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos os tipos</option>
          {REDIRECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {store.groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos os grupos</option>
            {store.groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent" title="Exportar JSON">
          <FileDown className="h-4 w-4" /> Exportar
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent" title="Importar JSON">
          <FileUp className="h-4 w-4" /> Importar
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{store.rules.length} regra{store.rules.length !== 1 ? "s" : ""} total</span>
        <span>{store.rules.filter((r) => r.enabled).length} ativa{store.rules.filter((r) => r.enabled).length !== 1 ? "s" : ""}</span>
        <span>{filteredRules.length} exibida{filteredRules.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {filteredRules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ArrowLeftRight className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">{store.rules.length === 0 ? "Nenhuma regra criada ainda" : "Nenhuma regra encontrada com os filtros atuais"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5">URL Origem</th>
                <th className="px-3 py-2.5">URL Destino</th>
                <th className="px-3 py-2.5 text-center">Tipo</th>
                <th className="px-3 py-2.5">Grupo</th>
                <th className="px-3 py-2.5 text-center">Hits</th>
                <th className="px-3 py-2.5 text-center">Ativo</th>
                <th className="px-3 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className={`transition-colors hover:bg-muted/30 ${!rule.enabled ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2.5 font-mono text-xs max-w-[220px] truncate" title={rule.sourceUrl}>
                    {rule.isRegex && <span className="mr-1 text-[10px] font-semibold text-purple-500">regex</span>}
                    {rule.sourceUrl}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs max-w-[220px] truncate text-muted-foreground" title={rule.targetUrl}>
                    {rule.type === 410 ? <span className="italic">— removido —</span> : rule.targetUrl}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_BADGE_COLORS[rule.type]}`}>
                      {rule.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{rule.group || "—"}</td>
                  <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">{rule.hits}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => store.toggleRule(rule.id)} title={rule.enabled ? "Desativar" : "Ativar"}>
                      {rule.enabled
                        ? <Power className="mx-auto h-4 w-4 text-green-500" />
                        : <PowerOff className="mx-auto h-4 w-4 text-muted-foreground" />
                      }
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditor(rule)}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen && (
        <RedirectRuleEditor
          rule={editingRule}
          groups={store.groups}
          onSave={handleSave}
          onCancel={() => { setEditorOpen(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}

// ── Aba: Log de 404 ────────────────────────────
function NotFoundLogTab() {
  const store = useRedirectStore();
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState("");

  const filtered = useMemo(() => {
    let result = store.notFoundLog;
    if (!showResolved) result = result.filter((e) => !e.resolved);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.url.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.count - a.count);
  }, [store.notFoundLog, search, showResolved]);

  const handleCreateRedirect = useCallback((url: string) => {
    setPrefillUrl(url);
    setEditorOpen(true);
  }, []);

  const handleSaveFromLog = useCallback((rule: RedirectRule) => {
    try {
      store.addRule(rule);
      // Resolve o 404 correspondente
      const logEntry = store.notFoundLog.find((e) => e.url === rule.sourceUrl);
      if (logEntry) store.resolve404(logEntry.id, rule.id);
      toast.success("Regra criada e 404 resolvido");
      setEditorOpen(false);
      setPrefillUrl("");
    } catch (err) {
      toast.error(err instanceof Error && err.message === "duplicate-source-url"
        ? "Já existe uma regra para esta URL"
        : "Erro ao criar regra"
      );
    }
  }, [store]);

  const prefillRule: RedirectRule | null = prefillUrl ? {
    id: "",
    sourceUrl: prefillUrl,
    targetUrl: "",
    type: 301,
    isRegex: false,
    group: "",
    enabled: true,
    hits: 0,
    lastHitAt: null,
    note: `Criado a partir do log de 404`,
    createdAt: "",
    updatedAt: "",
  } : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar URL..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="h-3.5 w-3.5 rounded border-input" />
          Mostrar resolvidos
        </label>

        <button
          onClick={() => { store.clearResolved404(); toast.success("Resolvidos removidos"); }}
          className="flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          disabled={!store.notFoundLog.some((e) => e.resolved)}
        >
          Limpar Resolvidos
        </button>

        <button
          onClick={() => { store.clear404Log(); toast.success("Log limpo"); }}
          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          disabled={store.notFoundLog.length === 0}
        >
          <Trash2 className="h-4 w-4" /> Limpar Tudo
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{store.notFoundLog.length} entrada{store.notFoundLog.length !== 1 ? "s" : ""}</span>
        <span>{store.notFoundLog.filter((e) => !e.resolved).length} pendente{store.notFoundLog.filter((e) => !e.resolved).length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckCircle2 className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">{store.notFoundLog.length === 0 ? "Nenhum erro 404 registrado" : "Nenhum 404 pendente"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2.5">URL</th>
                <th className="px-3 py-2.5 text-center">Hits</th>
                <th className="px-3 py-2.5">Última vez</th>
                <th className="px-3 py-2.5">Referrer</th>
                <th className="px-3 py-2.5 text-center">Resposta</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((entry) => (
                <tr key={entry.id} className={`transition-colors hover:bg-muted/30 ${entry.resolved ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2.5 font-mono text-xs max-w-[280px] truncate" title={entry.url}>
                    {entry.url}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${entry.count >= 10 ? "text-red-500" : entry.count >= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                      <BarChart3 className="h-3 w-3" /> {entry.count}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(entry.timestamp)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate" title={entry.referrer}>
                    {entry.referrer || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {(() => {
                      const linkedRule = entry.resolvedWithRuleId
                        ? store.rules.find((r) => r.id === entry.resolvedWithRuleId)
                        : store.rules.find((r) => r.enabled && r.sourceUrl === entry.url);
                      if (linkedRule) {
                        return (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_BADGE_COLORS[linkedRule.type]}`}>
                            {linkedRule.type}
                          </span>
                        );
                      }
                      return (
                        <span className="inline-block rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 text-[10px] font-bold">
                          404
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {entry.resolved
                      ? <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                      : <XCircle className="mx-auto h-4 w-4 text-amber-500" />
                    }
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!entry.resolved && (
                        <>
                          <button
                            onClick={() => handleCreateRedirect(entry.url)}
                            className="rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                            title="Criar redirecionamento para esta URL"
                          >
                            Criar Redirect
                          </button>
                          <button
                            onClick={() => { store.resolve404(entry.id); toast.success("Marcado como resolvido"); }}
                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            title="Marcar como resolvido"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen && prefillRule && (
        <RedirectRuleEditor
          rule={prefillRule}
          groups={store.groups}
          onSave={handleSaveFromLog}
          onCancel={() => { setEditorOpen(false); setPrefillUrl(""); }}
        />
      )}
    </div>
  );
}

// ── Componente Principal ────────────────────────
const AdminRedirects = () => {
  const [tab, setTab] = useState<ActiveTab>("rules");
  const store = useRedirectStore();
  const notFoundCount = store.notFoundLog.filter((e) => !e.resolved).length;

  useEffect(() => { useRedirectStore.getState().init(); }, []);

  if (!store.initialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground">Carregando redirecionamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setTab("rules")}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "rules" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" /> Regras de Redirecionamento
        </button>
        <button
          onClick={() => setTab("404-log")}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "404-log" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Log de 404
          {notFoundCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {notFoundCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {tab === "rules" ? <RulesTab /> : <NotFoundLogTab />}
    </div>
  );
};

export default AdminRedirects;
