import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { company } from "@/data/company";
import { loadSeoSettings } from "@/hooks/useSeoSettings";

const Footer = () => {
  const seoSettings = loadSeoSettings();
  // rel para links externos (exceto subdomínio da loja)
  const externalRel = seoSettings.externalLinksNofollow
    ? "noopener noreferrer nofollow"
    : "noopener noreferrer";

  return (
    <footer className="bg-primary text-primary-foreground dark:bg-[hsl(240_50%_12%)]">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-[1.2fr_auto_auto_auto]">
          <div className="flex flex-col items-start justify-center">
            <img
              src="/favicon.webp"
              alt="Comercial JR"
              className="h-12 w-12 rounded-full mb-4"
              loading="lazy"
              decoding="async"
              width="48"
              height="48"
            />
            <p className="text-sm leading-relaxed text-primary-foreground/80">{company.description}</p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2">
              {[
                { label: "Início", href: "/" },
                { label: "Segmentos", href: "/segmentos" },
                { label: "Nossa História", href: "/nossa-historia" },
                { label: "Blog", href: "/blog" },
                { label: "Contato", href: "/contato" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider">Segmentos</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { label: "Assist. STIHL", href: "/segmentos/assistencia-stihl" },
                { label: "Bombas e Motores", href: "/segmentos/bombas-e-motores" },
                { label: "Ferramentas", href: "/segmentos/ferramentas" },
                { label: "Irrigação", href: "/segmentos/irrigacao" },
                { label: "Locação", href: "/segmentos/locacao" },
                { label: "Máquinas", href: "/segmentos/maquinas" },
                { label: "Poços Artesianos", href: "/segmentos/pocos-artesianos" },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={company.store} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  Loja Online ↗
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 shrink-0" />
                {company.phone}
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 shrink-0" />
                {company.email}
              </li>
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={company.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">
                  {company.fullAddress}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              {[
                { href: company.social.facebook, label: "Facebook", icon: <Facebook className="h-5 w-5" /> },
                { href: company.social.instagram, label: "Instagram", icon: <Instagram className="h-5 w-5" /> },
                { href: company.social.tiktok, label: "TikTok", icon: (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.27 8.27 0 0 0 4.76 1.5V7.12a4.83 4.83 0 0 1-1-.43Z" /></svg>
                ) },
                { href: company.social.linkedin, label: "LinkedIn", icon: <Linkedin className="h-5 w-5" /> },
                { href: company.social.youtube, label: "YouTube", icon: <Youtube className="h-5 w-5" /> },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/20 pt-6 flex flex-col items-center gap-2 text-center text-xs text-primary-foreground/50 sm:flex-row sm:justify-between">
          <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
            <span>© {new Date().getFullYear()} <img src="/favicon.webp" alt="Comercial JR" className="inline h-5 w-5 rounded-full mx-1 align-middle" loading="lazy" decoding="async" width="20" height="20" />. Todos os direitos reservados.</span>
            <span className="sm:before:content-['·'] sm:before:mx-2">CNPJ 28.532.489/0001-61</span>
          </span>
          <Link
            to="/politica-de-privacidade"
            className="transition-colors hover:text-primary-foreground/80 underline underline-offset-2"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
