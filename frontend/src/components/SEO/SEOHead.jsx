import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  schema,
  children
}) => {
  const defaultTitle = "Sabiteck Limited - Premier Technology Solutions in Sierra Leone";
  const defaultDescription = "Sierra Leone's leading technology company offering software development, tech training, business consultancy, photography, and digital solutions since 2020.";
  const defaultKeywords = "Sierra Leone technology company, software development Bo, tech training Sierra Leone, business consultancy Sabiteck, photography services Bo, web development Sierra Leone, mobile app development, digital solutions, Emmanuel Koroma CEO";
  const defaultImage = "https://sabiteck.com/src/assets/icons/Sabitek Logo.png";
  const baseUrl = "https://sabiteck.com";

  const seoTitle = title ? `${title} | Sabiteck Limited` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoImage = image || defaultImage;
  const seoUrl = url ? `${baseUrl}${url}` : baseUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <link rel="canonical" href={seoUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content="Sabiteck Limited" />
      <meta property="og:locale" content="en_SL" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Schema.org structured data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}

      {children}
    </Helmet>
  );
};

export default SEOHead;