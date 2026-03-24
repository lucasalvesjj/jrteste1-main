import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ExternalLink } from "lucide-react";
import { navLinks, company } from "@/data/company";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container-custom flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center">
          <img src="/logo.webp" alt="Comercial JR" className="h-6 md:h-8 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <div key={link.label} className="relative group">
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground hover:text-primary hover:bg-accent"
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3 h-3 transition-transform duration-150 group-hover:rotate-180" />}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  to={link.href}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(link.href) ? "text-primary bg-accent" : "text-foreground hover:text-primary hover:bg-accent"
                  }`}
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3 h-3 transition-transform duration-150 group-hover:rotate-180" />}
                </Link>
              )}

              {/* Dropdown CSS puro — abre instantaneamente no hover, sem state/delay */}
              {link.children && (
                <div
                  className={`
                    invisible opacity-0 group-hover:visible group-hover:opacity-100
                    absolute top-full left-0 mt-0 z-50
                    bg-background border border-border rounded-lg shadow-lg py-2
                    transition-opacity duration-100
                    ${link.children.length > 5 ? "grid grid-cols-2 gap-x-1 min-w-[22rem]" : "min-w-48"}
                  `}
                >
                  {link.children.map((child) =>
                    child.external ? (
                      <a
                        key={child.label}
                        href={child.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors"
                      >
                        {child.label}
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                      </a>
                    ) : (
                      <Link
                        key={child.label}
                        to={child.href}
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-primary transition-colors"
                      >
                        {child.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-foreground"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container-custom py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    className={`block px-4 py-3 text-sm font-medium rounded-md ${
                      isActive(link.href) ? "text-primary bg-accent" : "text-foreground hover:bg-accent"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
                {link.children && link.label === "Nossa História" ? (
                  /* Submenu sempre visível para "Nossa História" */
                  <div className="ml-4 space-y-1">
                    {link.children.map((child) =>
                      child.external ? (
                        <a
                          key={child.label}
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.label}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          key={child.label}
                          to={child.href}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.label}
                        </Link>
                      )
                    )}
                  </div>
                ) : link.children ? (
                  <>
                    <button
                      className="flex items-center gap-1 w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                      onClick={() => setOpenMobileSubmenu(openMobileSubmenu === link.label ? null : link.label)}
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${openMobileSubmenu === link.label ? "rotate-180" : ""}`} />
                      {openMobileSubmenu === link.label ? "Fechar categorias" : "Ver categorias"}
                    </button>
                    {openMobileSubmenu === link.label && (
                      <div className="ml-4 space-y-1 max-h-64 overflow-y-auto">
                        {link.children.map((child) =>
                          child.external ? (
                            <a
                              key={child.label}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary"
                              onClick={() => setIsOpen(false)}
                            >
                              {child.label}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <Link
                              key={child.label}
                              to={child.href}
                              className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary"
                              onClick={() => setIsOpen(false)}
                            >
                              {child.label}
                            </Link>
                          )
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
