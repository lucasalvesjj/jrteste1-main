import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const Gone = () => {
  const location = useLocation();
  const originalUrl = (location.state as { originalUrl?: string })?.originalUrl;

  return (
    <Layout>
      <SEOHead title="Conteúdo Removido" robots="noindex,nofollow" />
      <div className="section-padding text-center min-h-[60vh] flex flex-col items-center justify-center">
        <span className="text-8xl mb-4">🚫</span>
        <h1 className="font-heading text-5xl font-black text-foreground mb-4">410</h1>
        <p className="text-xl text-muted-foreground mb-2">
          Este conteúdo foi removido permanentemente.
        </p>
        {originalUrl && (
          <p className="text-sm text-muted-foreground mb-8">
            URL: <code className="bg-muted px-2 py-0.5 rounded text-xs">{originalUrl}</code>
          </p>
        )}
        {!originalUrl && <div className="mb-8" />}
        <div className="flex gap-4">
          <Link
            to="/"
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Voltar ao Início
          </Link>
          <Link
            to="/blog"
            className="border border-border text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-accent transition-colors"
          >
            Ver Blog
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Gone;
