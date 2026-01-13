'use client';

import { useEffect } from 'react';
import { getBaseUrl, getPropertyUrl } from '@/config/domain';

interface PropertyMetaTagsProps {
  property: {
    id: string;
    title: string;
    description?: string;
    price: number;
    type: string;
    zone: string;
    images?: string[];
    address?: string;
    subSubCategory?: string;
    subCategory?: string;
    category?: string;
    city?: string;
    sqm?: number;
  };
}

export default function PropertyMetaTags({ property }: PropertyMetaTagsProps) {
  useEffect(() => {
    if (!property) return;

    const baseUrl = getBaseUrl();
    const propertyUrl = getPropertyUrl(property.id, {
      subSubCategory: property.subSubCategory,
      subCategory: property.subCategory,
      category: property.category,
      address: property.address,
      zone: property.zone,
      city: property.city,
      price: property.price,
      sqm: property.sqm,
      title: property.title,
      id: property.id
    });
    
    // Get the first property image or use a default
    // Ensure image URL is absolute
    let propertyImage = property.images && property.images.length > 0 
      ? property.images[0] 
      : `${baseUrl}/og-image.jpg`;
    
    // If image is relative, make it absolute
    if (propertyImage && !propertyImage.startsWith('http')) {
      propertyImage = propertyImage.startsWith('/') 
        ? `${baseUrl}${propertyImage}` 
        : `${baseUrl}/${propertyImage}`;
    }
    
    // Format price
    const priceText = property.type === 'sale' 
      ? `€${property.price.toLocaleString()}` 
      : `€${property.price}/mese`;
    
    // Create description - ensure it's not too long for social media
    let description = '';
    if (property.description && property.description.trim()) {
      const cleanDesc = property.description.trim();
      description = cleanDesc.length > 150 
        ? `${cleanDesc.substring(0, 147)}...` 
        : cleanDesc;
    } else {
      description = `${property.title} in ${property.zone || 'Roma'}, Roma. ${priceText}. Contatto diretto proprietario - 0% commissioni su MAULUNA IMMOBILIARE.`;
    }
    
    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update title
    document.title = `${property.title} - ${priceText} | MAULUNA IMMOBILIARE`;

    // Update description
    updateMetaTag('description', description, false);

    // Open Graph tags
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:url', propertyUrl);
    updateMetaTag('og:title', `${property.title} - ${priceText} | MAULUNA IMMOBILIARE - 0% Commissioni`);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', propertyImage);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', property.title);
    updateMetaTag('og:locale', 'it_IT');
    updateMetaTag('og:site_name', 'MAULUNA IMMOBILIARE');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', propertyUrl);
    updateMetaTag('twitter:title', `${property.title} - ${priceText}`);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', propertyImage);
    updateMetaTag('twitter:image:alt', property.title);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', propertyUrl);

    // Add JSON-LD structured data for better SEO and previews
    let jsonLdScript = document.querySelector('script[data-property-jsonld]');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      jsonLdScript.setAttribute('data-property-jsonld', 'true');
      document.head.appendChild(jsonLdScript);
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": ["Product", "Accommodation"],
      "name": property.title,
      "description": description,
      "image": propertyImage,
      "url": propertyUrl,
      "category": property.category || "Immobile",
      "brand": {
        "@type": "Brand",
        "name": "MAULUNA IMMOBILIARE"
      },
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "url": propertyUrl,
        "seller": {
          "@type": "Organization",
          "name": "MAULUNA IMMOBILIARE"
        },
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": property.price,
          "priceCurrency": "EUR",
          "unitCode": property.type === 'sale' ? "C62" : "MON"
        }
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": property.address || "",
        "addressLocality": property.zone || "Roma",
        "addressRegion": "Lazio",
        "addressCountry": "IT"
      },
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.sqm || 0,
        "unitCode": "MTK"
      }
    };
    
    jsonLdScript.textContent = JSON.stringify(structuredData);

    // Cleanup function
    return () => {
      // Reset to default meta tags when component unmounts
      document.title = 'MAULUNA IMMOBILIARE - Immobiliare Premium a Roma | 0% Commissioni';
      updateMetaTag('description', 'Trova la tua proprietà perfetta a Roma con MAULUNA IMMOBILIARE. Direttamente dai proprietari, 0% commissioni.', false);
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:url', baseUrl);
      updateMetaTag('og:title', 'MAULUNA IMMOBILIARE - Immobiliare Premium a Roma | 0% Commissioni');
      updateMetaTag('og:description', 'Trova la tua proprietà perfetta a Roma con MAULUNA IMMOBILIARE. Direttamente dai proprietari, 0% commissioni.');
      updateMetaTag('og:image', `${baseUrl}/og-image.jpg`);
      
      // Remove JSON-LD script
      const jsonLdScript = document.querySelector('script[data-property-jsonld]');
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    };
  }, [property]);

  return null; // This component doesn't render anything
}
