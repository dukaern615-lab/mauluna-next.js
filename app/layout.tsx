import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import I18nInit from "@/components/I18nInit";

export const metadata: Metadata = {
  title: "MAULUNA IMMOBILIARE - Immobiliare Premium a Roma | 0% Commissioni",
  description: "Trova la tua proprietà perfetta a Roma con MAULUNA IMMOBILIARE. Direttamente dai proprietari, 0% commissioni. Appartamenti, case, ville in vendita e affitto in tutte le zone di Roma.",
  keywords: "immobiliare Roma, appartamenti Roma, case Roma, ville Roma, proprietà Roma, affitto Roma, vendita Roma",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: "https://mauluna.it/",
  },
  openGraph: {
    type: "website",
    url: "https://mauluna.it/",
    title: "MAULUNA IMMOBILIARE - Immobiliare Premium a Roma | 0% Commissioni",
    description: "Trova la tua proprietà perfetta a Roma con MAULUNA IMMOBILIARE. Direttamente dai proprietari, 0% commissioni. Appartamenti, case, ville in vendita e affitto in tutte le zone di Roma.",
    images: ["https://mauluna.it/og-image.jpg"],
    locale: "it_IT",
    siteName: "MAULUNA IMMOBILIARE",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAULUNA IMMOBILIARE - Immobiliare Premium a Roma | 0% Commissioni",
    description: "Trova la tua proprietà perfetta a Roma con MAULUNA IMMOBILIARE. Direttamente dai proprietari, 0% commissioni. Appartamenti, case, ville in vendita e affitto in tutte le zone di Roma.",
    images: ["https://mauluna.it/og-image.jpg"],
  },
  other: {
    "geo.region": "IT-RM",
    "geo.placename": "Roma, Italia",
    "geo.position": "41.9028;12.4964",
    "last-modified": "2024-01-15",
  },
};

const realEstateBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "MAULUNA IMMOBILIARE",
  "url": "https://mauluna.it",
  "logo": "https://mauluna.it/logo.png",
  "description": "Agenzia immobiliare premium a Roma che offre appartamenti, case e ville in vendita e affitto con 0% di commissioni",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Roma",
    "addressRegion": "Lazio",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "41.9028",
    "longitude": "12.4964"
  },
  "areaServed": {
    "@type": "City",
    "name": "Roma",
    "addressCountry": "IT"
  },
  "serviceType": [
    "Vendita Immobili",
    "Affitto Immobili",
    "Consulenza Immobiliare",
    "Servizi di Annunci Immobiliari"
  ],
  "priceRange": "€€€",
  "telephone": "+39 350 881 8666",
  "email": "info@mauluna.it",
  "sameAs": [
    "https://www.facebook.com/maulunaimmobiliare",
    "https://www.instagram.com/maulunaimmobiliare"
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MAULUNA IMMOBILIARE",
  "url": "https://mauluna.it",
  "description": "Sito immobiliare premium per proprietà a Roma",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://mauluna.it/properties?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Servizi Immobiliari a Roma",
  "description": "Servizi immobiliari completi inclusi vendita, affitto e annunci di proprietà a Roma con 0% di commissioni",
  "provider": {
    "@type": "RealEstateAgent",
    "name": "MAULUNA IMMOBILIARE"
  },
  "areaServed": {
    "@type": "City",
    "name": "Roma",
    "addressCountry": "IT"
  },
  "serviceType": [
    "Affitto Appartamenti Roma",
    "Vendita Case Roma",
    "Affitto Ville Roma",
    "Servizi di Annunci Immobiliari",
    "Consulenza Immobiliare"
  ],
  "offers": {
    "@type": "Offer",
    "description": "0% di commissioni su tutte le transazioni immobiliari"
  }
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "MAULUNA IMMOBILIARE",
  "image": "https://mauluna.it/logo.png",
  "@id": "https://mauluna.it",
  "url": "https://mauluna.it",
  "telephone": "+39 350 881 8666",
  "email": "info@mauluna.it",
  "priceRange": "€€€",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Roma",
    "addressRegion": "Lazio",
    "postalCode": "00100",
    "addressCountry": "IT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 41.9028,
    "longitude": 12.4964
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/maulunaimmobiliare",
    "https://www.instagram.com/maulunaimmobiliare"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>
        <I18nInit />
        <Providers>
          {children}
        </Providers>
        {/* Google Maps API will be loaded dynamically via PropertyMap component (same as 111.com) */}
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SMCPZDC2RK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SMCPZDC2RK');
          `}
        </Script>

        {/* Meta Pixel Code */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '891952590054262');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=891952590054262&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
