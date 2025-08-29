import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const SEOHead = ({ 
  title = "Gala DEX - Trade Your Favorite Gala Ecosystem Tokens",
  description = "Trade your favorite Gala ecosystem tokens with lightning speed and minimal fees. Secure, fast, and user-friendly decentralized exchange.",
  keywords = "Gala, DEX, decentralized exchange, crypto trading, blockchain, DeFi, tokens, swap",
  image = "/og-image.jpg",
  url = window.location.href
}: SEOHeadProps) => {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper function to set or update meta tags
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', description, true);
    setMetaTag('keywords', keywords, true);
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0', true);
    setMetaTag('robots', 'index, follow', true);
    setMetaTag('author', 'Gala DEX', true);

    // Open Graph tags
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:image', image);
    setMetaTag('og:url', url);
    setMetaTag('og:type', 'website');
    setMetaTag('og:site_name', 'Gala DEX');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Additional SEO tags
    setMetaTag('theme-color', '#000000', true);
    setMetaTag('apple-mobile-web-app-capable', 'yes', true);
    setMetaTag('apple-mobile-web-app-status-bar-style', 'default', true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Gala DEX",
      "description": description,
      "url": url,
      "applicationCategory": "Finance",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };

    let jsonLd = document.querySelector('#structured-data') as HTMLScriptElement;
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.id = 'structured-data';
      jsonLd.type = 'application/ld+json';
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, url]);

  return null; // This component doesn't render anything
};

export default SEOHead;