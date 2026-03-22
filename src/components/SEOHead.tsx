import { Helmet } from "react-helmet-async";
import { company } from "@/data/company";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  type?: string;
  article?: {
    publishedTime?: string;
    section?: string;
    tags?: string[];
  };
}

const SEOHead = ({ title, description, canonical, ogImage, type = "website", article }: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${company.shortName}` : company.seo.title;
  const desc = description || company.seo.description;
  const url = canonical ? `${company.siteUrl}${canonical}` : company.siteUrl;
  const image = ogImage || `${company.siteUrl}${company.seo.image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />

      {article && (
        <>
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
    </Helmet>
  );
};

export default SEOHead;
