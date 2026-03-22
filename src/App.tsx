import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "./components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const Segmentos = lazy(() => import("./pages/Segmentos"));
const IrrigacaoPage = lazy(() => import("./pages/segmentos/Irrigacao"));
const FerramentasPage = lazy(() => import("./pages/segmentos/Ferramentas"));
const MaquinasPage = lazy(() => import("./pages/segmentos/Maquinas"));
const NossaHistoria = lazy(() => import("./pages/NossaHistoria"));
const Contato = lazy(() => import("./pages/Contato"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminPage = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
    Carregando página...
  </div>
);

const App = () => (
  <HelmetProvider>
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
            <Route path="/nossa-historia" element={<NossaHistoria />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/:slug" element={<BlogPost />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;
