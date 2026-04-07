import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { RedirectRule, RedirectType } from "@/data/redirectTypes";
import { REDIRECT_TYPES } from "@/data/redirectTypes";

interface Props {
  rule?: RedirectRule | null;
  groups: string[];
  onSave: (rule: RedirectRule) => void;
  onCancel: () => void;
}

const emptyRule = (): Omit<RedirectRule, "id" | "createdAt" | "updatedAt"> => ({
  sourceUrl: "",
  targetUrl: "",
  type: 301,
  isRegex: false,
  group: "",
  enabled: true,
  hits: 0,
  lastHitAt: null,
  note: "",
});

const RedirectRuleEditor = ({ rule, groups, onSave, onCancel }: Props) => {
  const isEditing = Boolean(rule);
  const [form, setForm] = useState(emptyRule);
  const [regexError, setRegexError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setForm({
        sourceUrl: rule.sourceUrl,
        targetUrl: rule.targetUrl,
        type: rule.type,
        isRegex: rule.isRegex,
        group: rule.group,
        enabled: rule.enabled,
        hits: rule.hits,
        lastHitAt: rule.lastHitAt,
        note: rule.note,
      });
    } else {
      setForm(emptyRule());
    }
  }, [rule]);

  const validateRegex = useCallback((pattern: string) => {
    if (!pattern) { setRegexError(null); return; }
    try {
      new RegExp(`^${pattern}$`, "i");
      setRegexError(null);
    } catch (e) {
      setRegexError(e instanceof Error ? e.message : "Regex inválido");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceUrl.trim()) return;
    if (form.type !== 410 && !form.targetUrl.trim()) return;
    if (form.isRegex && regexError) return;

    const now = new Date().toISOString();
    const saved: RedirectRule = {
      id: rule?.id ?? crypto.randomUUID(),
      sourceUrl: form.sourceUrl.trim(),
      targetUrl: form.type === 410 ? "" : form.targetUrl.trim(),
      type: form.type,
      isRegex: form.isRegex,
      group: form.group.trim(),
      enabled: form.enabled,
      hits: rule?.hits ?? 0,
      lastHitAt: rule?.lastHitAt ?? null,
      note: form.note.trim(),
      createdAt: rule?.createdAt ?? now,
      updatedAt: now,
    };

    onSave(saved);
  };

  const is410 = form.type === 410;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {isEditing ? "Editar Regra" : "Nova Regra de Redirecionamento"}
          </h2>
          <button onClick={onCancel} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Source URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">URL de Origem</label>
            <input
              type="text"
              value={form.sourceUrl}
              onChange={(e) => {
                setForm((f) => ({ ...f, sourceUrl: e.target.value }));
                if (form.isRegex) validateRegex(e.target.value);
              }}
              placeholder="/url-antiga"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="checkbox"
                id="isRegex"
                checked={form.isRegex}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((f) => ({ ...f, isRegex: checked }));
                  if (checked) validateRegex(form.sourceUrl);
                  else setRegexError(null);
                }}
                className="h-3.5 w-3.5 rounded border-input"
              />
              <label htmlFor="isRegex" className="text-xs text-muted-foreground">Usar expressão regular (regex)</label>
            </div>
            {regexError && <p className="mt-1 text-xs text-destructive">{regexError}</p>}
          </div>

          {/* Target URL */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              URL de Destino {is410 && <span className="text-muted-foreground">(não aplicável para 410)</span>}
            </label>
            <input
              type="text"
              value={form.targetUrl}
              onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
              placeholder={is410 ? "—" : "/url-nova"}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={is410}
              required={!is410}
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: Number(e.target.value) as RedirectType }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {REDIRECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {REDIRECT_TYPES.find((t) => t.value === form.type)?.description}
            </p>
          </div>

          {/* Group */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Grupo</label>
            <input
              type="text"
              value={form.group}
              onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              placeholder="blog, paginas-legado..."
              list="redirect-groups"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <datalist id="redirect-groups">
              {groups.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Nota (opcional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Motivo do redirecionamento..."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="enabled" className="text-sm text-foreground">Regra ativada</label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={!form.sourceUrl.trim() || (!is410 && !form.targetUrl.trim()) || Boolean(regexError)}
            >
              {isEditing ? "Salvar Alterações" : "Criar Regra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RedirectRuleEditor;
