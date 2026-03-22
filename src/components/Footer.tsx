import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { company } from "@/data/company";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-heading text-lg font-bold">{company.shortName}</h3>
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
            <ul className="space-y-2">
              <li>
                <Link to="/segmentos/irrigacao" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  Irrigação
                </Link>
              </li>
              <li>
                <Link to="/segmentos/ferramentas" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  Ferramentas
                </Link>
              </li>
              <li>
                <Link to="/segmentos/maquinas" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  Máquinas
                </Link>
              </li>
              <li>
                <a href={company.store} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  Loja Online -
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
                {company.fullAddress}
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href={company.social.facebook} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={company.social.instagram} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 transition-colors hover:text-primary-foreground" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} {company.name}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
