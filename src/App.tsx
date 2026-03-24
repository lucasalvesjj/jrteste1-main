import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import JRLoader from "./components/JRLoader";

const Index = lazy(() => import("./pages/Index"));
const Segmentos = lazy(() => import("./pages/Segmentos"));
const IrrigacaoPage = lazy(() => import("./pages/segmentos/Irrigacao"));
const FerramentasPage = lazy(() => import("./pages/segmentos/Ferramentas"));
const MaquinasPage = lazy(() => import("./pages/segmentos/Maquinas"));
const BombasMotoresPage = lazy(() => import("./pages/segmentos/BombasMotores"));
const LocacaoPage = lazy(() => import("./pages/segmentos/Locacao"));
const AssistenciaStihlPage = lazy(() => import("./pages/segmentos/AssistenciaStihl"));
const PocosArtesianosPage = lazy(() => import("./pages/segmentos/PocosArtesianos"));
const NossaHistoria = lazy(() => import("./pages/NossaHistoria"));
const NossaMissao = lazy(() => import("./pages/NossaMissao"));
const Contato = lazy(() => import("./pages/Contato"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminPage = lazy(() => import("./pages/Admin"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => <JRLoader size="lg" label="Carregando página..." />;

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="jr-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/segmentos" element={<Segmentos />} />
              <Route path="/segmentos/irrigacao" element={<IrrigacaoPage />} />
              <Route path="/segmentos/ferramentas" element={<FerramentasPage />} />
              <Route path="/segmentos/maquinas" element={<MaquinasPage />} />
              <Route path="/segmentos/bombas-e-motores" element={<BombasMotoresPage />} />
              <Route path="/segmentos/locacao" element={<LocacaoPage />} />
              <Route path="/segmentos/assistencia-stihl" element={<AssistenciaStihlPage />} />
              <Route path="/segmentos/pocos-artesianos" element={<PocosArtesianosPage />} />
              <Route path="/nossa-historia" element={<NossaHistoria />} />
              <Route path="/nossa-missao" element={<NossaMissao />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/:slug" element={<BlogPost />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
