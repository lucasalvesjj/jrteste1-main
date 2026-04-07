import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RedirectRule, NotFoundLogEntry, RedirectExportFile } from "@/data/redirectTypes";
import {
  createRedirectExportFile,
  fetchPublishedRedirects,
  type ParsedRedirectImport,
} from "@/lib/redirectContent";
import { findMatchingRule } from "@/lib/redirectMatcher";

type RedirectSource = "published-json" | "fallback-empty" | "local-draft";

const MAX_404_LOG_ENTRIES = 500;

interface RedirectStore {
  rules: RedirectRule[];
  notFoundLog: NotFoundLogEntry[];
  groups: string[];
  hydrated: boolean;
  initialized: boolean;
  loading: boolean;
  source: RedirectSource;
  lastLoadedAt?: string;

  init: () => Promise<void>;
  reloadPublished: () => Promise<void>;
  resetToPublished: () => Promise<void>;

  addRule: (rule: RedirectRule) => void;
  updateRule: (id: string, rule: RedirectRule) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  getActiveRules: () => RedirectRule[];
  findMatch: (pathname: string) => RedirectRule | null;
  incrementHit: (ruleId: string) => void;

  log404: (url: string, referrer: string, userAgent: string) => void;
  resolve404: (logId: string, ruleId?: string) => void;
  clear404Log: () => void;
  clearResolved404: () => void;

  addGroup: (group: string) => void;
  deleteGroup: (group: string) => void;

  importRules: (data: ParsedRedirectImport) => void;
  exportFile: () => RedirectExportFile;
}

const loadPublishedRedirects = async () => {
  try {
    const data = await fetchPublishedRedirects();
    return { ...data, source: "published-json" as const };
  } catch {
    return {
      rules: [] as RedirectRule[],
      notFoundLog: [] as NotFoundLogEntry[],
      groups: ["blog", "paginas-legado"],
      source: "fallback-empty" as const,
    };
  }
};

const normalizePersistedState = (
  persisted: Partial<Pick<RedirectStore, "rules" | "notFoundLog" | "groups" | "initialized" | "source" | "lastLoadedAt">> | undefined
) => ({
  rules: Array.isArray(persisted?.rules) ? persisted.rules : [],
  notFoundLog: Array.isArray(persisted?.notFoundLog) ? persisted.notFoundLog : [],
  groups: Array.isArray(persisted?.groups) ? persisted.groups : ["blog", "paginas-legado"],
  initialized: Boolean(persisted?.initialized),
  source: persisted?.source ?? "fallback-empty",
  lastLoadedAt: persisted?.lastLoadedAt,
});

export const useRedirectStore = create<RedirectStore>()(
  persist(
    (set, get) => ({
      rules: [],
      notFoundLog: [],
      groups: ["blog", "paginas-legado"],
      hydrated: false,
      initialized: false,
      loading: false,
      source: "fallback-empty",
      lastLoadedAt: undefined,

      init: async () => {
        if (get().initialized) return;

        // Preservar rascunhos locais do localStorage (já hidratados)
        const current = get();
        if (current.source === "local-draft" && current.rules.length > 0) {
          set({ initialized: true, loading: false });
          return;
        }

        set({ loading: true });
        const loaded = await loadPublishedRedirects();

        // Re-verificar após await — hidratação pode ter completado durante o fetch
        if (get().initialized) {
          set({ loading: false });
          return;
        }

        set({
          rules: loaded.rules,
          notFoundLog: loaded.notFoundLog,
          groups: loaded.groups,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },

      reloadPublished: async () => {
        set({ loading: true });
        const loaded = await loadPublishedRedirects();
        set({
          rules: loaded.rules,
          notFoundLog: loaded.notFoundLog,
          groups: loaded.groups,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },

      resetToPublished: async () => {
        set({ loading: true });
        const loaded = await loadPublishedRedirects();
        set({
          rules: loaded.rules,
          notFoundLog: loaded.notFoundLog,
          groups: loaded.groups,
          source: loaded.source,
          initialized: true,
          loading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      },

      addRule: (rule) =>
        set((state) => {
          const duplicate = state.rules.some(
            (r) => r.sourceUrl === rule.sourceUrl && r.id !== rule.id
          );
          if (duplicate) throw new Error("duplicate-source-url");

          return {
            rules: [rule, ...state.rules],
            source: "local-draft",
            initialized: true,
          };
        }),

      updateRule: (id, rule) =>
        set((state) => {
          const duplicate = state.rules.some(
            (r) => r.sourceUrl === rule.sourceUrl && r.id !== id
          );
          if (duplicate) throw new Error("duplicate-source-url");

          return {
            rules: state.rules.map((r) => (r.id === id ? { ...rule, updatedAt: new Date().toISOString() } : r)),
            source: "local-draft",
            initialized: true,
          };
        }),

      deleteRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
          source: "local-draft",
          initialized: true,
        })),

      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r
          ),
          source: "local-draft",
          initialized: true,
        })),

      getActiveRules: () => get().rules.filter((r) => r.enabled),

      findMatch: (pathname) => findMatchingRule(pathname, get().rules.filter((r) => r.enabled)),

      incrementHit: (ruleId) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId ? { ...r, hits: r.hits + 1, lastHitAt: new Date().toISOString() } : r
          ),
        })),

      log404: (url, referrer, userAgent) =>
        set((state) => {
          const existing = state.notFoundLog.find((e) => e.url === url);
          if (existing) {
            return {
              notFoundLog: state.notFoundLog.map((e) =>
                e.url === url
                  ? { ...e, count: e.count + 1, timestamp: new Date().toISOString(), referrer, userAgent }
                  : e
              ),
            };
          }

          const entry: NotFoundLogEntry = {
            id: crypto.randomUUID(),
            url,
            referrer,
            userAgent,
            timestamp: new Date().toISOString(),
            count: 1,
            resolved: false,
          };

          const updated = [entry, ...state.notFoundLog];
          return {
            notFoundLog: updated.length > MAX_404_LOG_ENTRIES ? updated.slice(0, MAX_404_LOG_ENTRIES) : updated,
          };
        }),

      resolve404: (logId, ruleId) =>
        set((state) => ({
          notFoundLog: state.notFoundLog.map((e) =>
            e.id === logId ? { ...e, resolved: true, resolvedWithRuleId: ruleId } : e
          ),
        })),

      clear404Log: () => set({ notFoundLog: [] }),

      clearResolved404: () =>
        set((state) => ({
          notFoundLog: state.notFoundLog.filter((e) => !e.resolved),
        })),

      addGroup: (group) =>
        set((state) => {
          const trimmed = group.trim();
          if (!trimmed || state.groups.includes(trimmed)) return state;
          return { groups: [...state.groups, trimmed], source: "local-draft" as const, initialized: true };
        }),

      deleteGroup: (group) =>
        set((state) => ({
          groups: state.groups.filter((g) => g !== group),
          source: "local-draft" as const,
          initialized: true,
        })),

      importRules: (data) =>
        set({
          rules: data.rules,
          notFoundLog: data.notFoundLog,
          groups: data.groups,
          source: "local-draft",
          initialized: true,
          lastLoadedAt: new Date().toISOString(),
        }),

      exportFile: () => createRedirectExportFile(get().rules, get().notFoundLog, get().groups),
    }),
    {
      name: "comercial-jr-redirects-working-copy",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
      merge: (persistedState, currentState) => {
        const normalized = normalizePersistedState(
          (persistedState as Partial<Pick<RedirectStore, "rules" | "notFoundLog" | "groups" | "initialized" | "source" | "lastLoadedAt">>) || undefined
        );
        return { ...currentState, ...normalized };
      },
      partialize: (state) => ({
        rules: state.rules,
        notFoundLog: state.notFoundLog,
        groups: state.groups,
        initialized: state.initialized,
        source: state.source,
        lastLoadedAt: state.lastLoadedAt,
      }),
    }
  )
);

// Auto-sync para disco no DEV — grava redirects.json sempre que rules/groups/notFoundLog mudam
if (import.meta.env.DEV) {
  let syncTimeout: ReturnType<typeof setTimeout> | null = null;

  useRedirectStore.subscribe((state, prevState) => {
    if (
      state.rules !== prevState.rules ||
      state.groups !== prevState.groups ||
      state.notFoundLog !== prevState.notFoundLog
    ) {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        const exportData = createRedirectExportFile(state.rules, state.notFoundLog, state.groups);
        fetch("/api/redirects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exportData),
        }).catch((err) => {
          console.warn("[redirectStore] disk sync failed:", err);
        });
      }, 300);
    }
  });
}
