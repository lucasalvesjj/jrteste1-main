/**
 * SchemaOrg — Componente utilitário para Schema.org JSON-LD
 *
 * Uso:
 *   <SchemaOrg type="breadcrumb" items={[{ name: "Início", url: "/" }, { name: "Blog", url: "/blog/" }]} />
 *   <SchemaOrg type="service" name="Irrigação Agrícola" description="..." url="/segmentos/irrigacao/" />
 *   <SchemaOrg type="webpage" name="..." description="..." url="..." />
 */

const SITE_URL = "https://comercialjrltda.com.br";
const ORG_ID   = `${SITE_URL}/#organization`;

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  type: "breadcrumb";
  items: BreadcrumbItem[];
}

interface ServiceSchemaProps {
  type: "service";
  name: string;
  description: string;
  url: string;
}

interface WebPageSchemaProps {
  type: "webpage";
  name: string;
  description: string;
  url: string;
}

type SchemaOrgProps = BreadcrumbSchemaProps | ServiceSchemaProps | WebPageSchemaProps;

// ── Builders ──────────────────────────────────────────────────────────────────

function buildBreadcrumb(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

function buildService(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "State", name: "Espírito Santo", addressCountry: "BR" },
    inLanguage: "pt-BR",
  };
}

function buildWebPage(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url.startsWith("http") ? url : `${SITE_URL}${url}`,
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    inLanguage: "pt-BR",
    publisher: { "@id": ORG_ID },
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function SchemaOrg(props: SchemaOrgProps) {
  let schema: object;

  switch (props.type) {
    case "breadcrumb":
      schema = buildBreadcrumb(props.items);
      break;
    case "service":
      schema = buildService(props.name, props.description, props.url);
      break;
    case "webpage":
      schema = buildWebPage(props.name, props.description, props.url);
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
