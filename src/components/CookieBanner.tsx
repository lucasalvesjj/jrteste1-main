import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "comercial-jr-cookie-consent";

const CookieBanner = ({ appReady }: { appReady: boolean }) => {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!appReady) return;
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, [appReady]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible || pathname === "/admin") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-lg">
      <div className="container-custom flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-primary-foreground leading-relaxed">
          Utilizamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa{" "}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors"
          >
            Política de Privacidade
          </a>
          .
        </p>

        <div className="shrink-0">
          <button
            onClick={handleAccept}
            className="rounded-md bg-white px-6 py-2 text-sm font-bold text-[hsl(240_60%_25%)] transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
