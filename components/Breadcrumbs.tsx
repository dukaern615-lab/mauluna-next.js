'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  // Generate Schema.org BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(index < breadcrumbItems.length - 1 && { "item": `https://mauluna.it${item.href}` })
    }))
  };

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual breadcrumbs */}
      <nav aria-label="Breadcrumb" className={`mb-4 ${className}`}>
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbItems.map((item, index) => (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {index > 0 && (
                <i className="ri-arrow-right-s-line text-gray-400 mx-1"></i>
              )}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[#D97860] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Auto-generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  let currentPath = '';
  
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    
    // Map paths to readable labels
    const label = getLabelForPath(path, index === paths.length - 1);
    
    breadcrumbs.push({
      label,
      href: currentPath
    });
  });

  return breadcrumbs;
}

// Convert path segments to readable labels
function getLabelForPath(path: string, isLast: boolean): string {
  const labelMap: { [key: string]: string } = {
    'properties': 'Immobili',
    'annuncio': 'Annunci',
    'property': 'Immobili',
    'about': 'Chi Siamo',
    'contact': 'Contatti',
    'how-it-works': 'Come Funziona',
    'pubblica-annuncio': 'Pubblica Annuncio',
    'login': 'Accedi',
    'register': 'Registrati',
    'dashboard': 'Dashboard',
    'favorites': 'Preferiti',
    'messages': 'Messaggi',
    'profile': 'Profilo',
    'privacy': 'Privacy',
    'terms': 'Termini',
  };

  // If it's a known path, return the mapped label
  if (labelMap[path]) {
    return labelMap[path];
  }

  // If it's the last segment and looks like a slug, truncate it
  if (isLast && path.length > 30) {
    return path.substring(0, 30) + '...';
  }

  // Otherwise, capitalize and replace hyphens
  return path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
