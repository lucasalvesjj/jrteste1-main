import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRedirectStore } from "@/stores/redirectStore";
import { resolveTargetUrl } from "@/lib/redirectMatcher";

/**
 * Componente que intercepta navegação e aplica regras de redirect/410.
 * Deve ser posicionado dentro do BrowserRouter, antes do Routes.
 */
const RedirectGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hydrated = useRedirectStore((s) => s.hydrated);
  const initialized = useRedirectStore((s) => s.initialized);
  const findMatch = useRedirectStore((s) => s.findMatch);
  const incrementHit = useRedirectStore((s) => s.incrementHit);
  const init = useRedirectStore((s) => s.init);
  const rulesVersion = useRedirectStore((s) => s.rules.length);
  const processedRef = useRef<string | null>(null);

  // Inicializa o store somente após hidratação do localStorage
  useEffect(() => {
    if (hydrated) init();
  }, [hydrated, init]);

  // Invalida cache do processedRef quando regras mudam
  useEffect(() => {
    processedRef.current = null;
  }, [rulesVersion]);

  useEffect(() => {
    if (!hydrated || !initialized) return;

    // Evita loops: não processa /gone nem URLs do admin
    if (location.pathname === "/gone" || location.pathname.startsWith("/admin")) return;

    // Evita reprocessar a mesma URL
    if (processedRef.current === location.pathname) return;

    const rule = findMatch(location.pathname);
    if (!rule) return;

    processedRef.current = location.pathname;
    incrementHit(rule.id);

    if (rule.type === 410) {
      navigate("/gone", { replace: true, state: { originalUrl: location.pathname } });
    } else {
      const target = resolveTargetUrl(location.pathname, rule);
      if (target && target !== location.pathname) {
        navigate(target, { replace: true });
      }
    }
  }, [location.pathname, hydrated, initialized, findMatch, incrementHit, navigate, rulesVersion]);

  // Limpa ref quando muda de path (para permitir reprocessar em navegação futura)
  useEffect(() => {
    return () => { processedRef.current = null; };
  }, [location.pathname]);

  return null;
};

export default RedirectGuard;
