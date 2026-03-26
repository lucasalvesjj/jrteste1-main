import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";

const NotFound = () => (
  <Layout>
    <SEOHead title="Página não encontrada" robots="noindex,nofollow" />
    <div className="section-padding text-center min-h-[60vh] flex flex-col items-center justify-center">
      <span className="text-8xl mb-4">🔧</span>
      <h1 className="font-heading text-5xl font-black text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Ops! Página não encontrada.</p>
      <div className="flex gap-4">
        <Link to="/" className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
          Voltar ao Início
        </Link>
        <Link to="/blog" className="border border-border text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-accent transition-colors">
          Ver Blog
        </Link>
      </div>
    </div>
  </Layout>
);

export default NotFound;
