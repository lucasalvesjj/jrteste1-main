/**
 * SchemaOrg — Componente utilitário para Schema.org JSON-LD
 * Delega a construção dos objetos para src/lib/seo/schemas.ts (fonte única de verdade).
 *
 * Uso:
 *   <SchemaOrg type="breadcrumb" items={[{ name: "Início", url: "/" }]} />
 *   <SchemaOrg type="service" name="Irrigação Agrícola" description="..." url="/segmentos/irrigacao/" />
 *   <SchemaOrg type="webpage" name="..." description="..." url="..." />
 *   <SchemaOrg type="localBusiness" />
 *   <SchemaOrg type="website" />
 *   <SchemaOrg type="article" article={{ headline, description, datePublished, url, ... }} />
 */

import {
  buildBreadcrumb,
  buildService,
  buildWebPage,
  buildWebSite,
  buildLocalBusiness,
  buildArticle,
  buildFAQPage,
  type BreadcrumbItem,
  type ServiceData,
  type WebPageData,
  type ArticleData,
  type FAQItem,
} from "@/lib/seo/schemas";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface BreadcrumbSchemaProps {
  type: "breadcrumb";
  items: BreadcrumbItem[];
}

interface ServiceSchemaProps extends ServiceData {
  type: "service";
}

interface WebPageSchemaProps extends WebPageData {
  type: "webpage";
}

interface LocalBusinessSchemaProps {
  type: "localBusiness";
  descriptionOverride?: string;
}

interface WebSiteSchemaProps {
  type: "website";
}

interface ArticleSchemaProps {
  type: "article";
  article: ArticleData;
}

interface FAQPageSchemaProps {
  type: "faqPage";
  items: FAQItem[];
}

type SchemaOrgProps =
  | BreadcrumbSchemaProps
  | ServiceSchemaProps
  | WebPageSchemaProps
  | LocalBusinessSchemaProps
  | WebSiteSchemaProps
  | ArticleSchemaProps
  | FAQPageSchemaProps;

// ── Componente ────────────────────────────────────────────────────────────────

export default function SchemaOrg(props: SchemaOrgProps) {
  let schema: object;

  switch (props.type) {
    case "breadcrumb":
      schema = buildBreadcrumb(props.items);
      break;
    case "service":
      schema = buildService({ name: props.name, description: props.description, url: props.url });
      break;
    case "webpage":
      schema = buildWebPage({ name: props.name, description: props.description, url: props.url });
      break;
    case "localBusiness":
      schema = buildLocalBusiness(props.descriptionOverride);
      break;
    case "website":
      schema = buildWebSite();
      break;
    case "article":
      schema = buildArticle(props.article);
      break;
    case "faqPage":
      schema = buildFAQPage(props.items);
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
