import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePublishedRedirects } from "@/hooks/usePublishedRedirects";
import { resolveTargetUrl } from "@/lib/redirectMatcher";

/**
 * Componente que intercepta navegação e aplica regras de redirect/410.
 * Lê apenas do JSON publicado (/data/redirects.json) — sem localStorage.
 * Deve ser posicionado dentro do BrowserRouter, antes do Routes.
 */
const RedirectGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rules, initialized, findMatch } = usePublishedRedirects();
  const processedRef = useRef<string | null>(null);

  // Invalida cache do processedRef quando regras mudam
  useEffect(() => {
    processedRef.current = null;
  }, [rules.length]);

  useEffect(() => {
    if (!initialized) return;

    // Evita loops: não processa /gone nem URLs do admin
    if (location.pathname === "/gone" || location.pathname.startsWith("/admin")) return;

    // Evita reprocessar a mesma URL
    if (processedRef.current === location.pathname) return;

    const rule = findMatch(location.pathname);
    if (!rule) return;

    processedRef.current = location.pathname;

    if (rule.type === 410) {
      navigate("/gone", { replace: true, state: { originalUrl: location.pathname } });
    } else {
      const target = resolveTargetUrl(location.pathname, rule);
      if (target && target !== location.pathname) {
        navigate(target, { replace: true });
      }
    }
  }, [location.pathname, initialized, findMatch, navigate, rules.length]);

  // Limpa ref quando muda de path (para permitir reprocessar em navegação futura)
  useEffect(() => {
    return () => { processedRef.current = null; };
  }, [location.pathname]);

  return null;
};

export default RedirectGuard;
