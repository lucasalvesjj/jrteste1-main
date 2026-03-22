import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Segmentos from "./pages/Segmentos";
import IrrigacaoPage from "./pages/segmentos/Irrigacao";
import FerramentasPage from "./pages/segmentos/Ferramentas";
import MaquinasPage from "./pages/segmentos/Maquinas";
import NossaHistoria from "./pages/NossaHistoria";
import Contato from "./pages/Contato";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminPage from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
