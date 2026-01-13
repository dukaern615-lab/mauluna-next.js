/**
 * Main domain configuration
 * In production, always use the main domain (mauluna.it)
 * In development, use the current origin (localhost)
 */
export const MAIN_DOMAIN = 'https://mauluna.it';

/**
 * Get the base URL for the application
 * In production, always returns the main domain
 * In development, returns the current origin
 */
export const getBaseUrl = (): string => {
  // In production, always use the main domain
  if (process.env.NODE_ENV === 'production') {
    return MAIN_DOMAIN;
  }
  // In development, use current origin
  return typeof window !== 'undefined' ? window.location.origin : 'https://mauluna-immobiliare.com';
};

/**
 * Create a URL-friendly slug from property details
 * Format: PropertyType-Address-Zone-City-Price-Sqm-Category-ShortID
 * Example: Quadrilocale-via-Santa-Seconda-Casalotti-Roma-259000-120m2-commerciale-a1b2c3d4
 */
export const createPropertySlug = (property: {
  subSubCategory?: string;
  subCategory?: string;
  category?: string;
  address?: string;
  zone?: string;
  city?: string;
  price?: number;
  sqm?: number;
  id?: string; // Property ID to extract short ID
}): string => {
  const parts: string[] = [];
  
  // 1. Property type (subSubCategory > subCategory > category)
  const propertyType = property.subSubCategory || property.subCategory || property.category || '';
  if (propertyType) {
    const cleanType = propertyType
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\//g, '-') // Replace forward slashes with hyphens
      .replace(/[^a-z0-9\s-]+/g, '') // Remove special chars (keep hyphens now)
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single
    if (cleanType) {
      parts.push(cleanType);
    }
  }
  
  // 2. Address (clean and format)
  if (property.address) {
    const cleanAddress = property.address
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]+/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
    if (cleanAddress) {
      parts.push(cleanAddress);
    }
  }
  
  // 3. Zone
  if (property.zone) {
    const cleanZone = property.zone
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]+/g, '')
      .trim()
      .replace(/\s+/g, '-');
    if (cleanZone) {
      parts.push(cleanZone);
    }
  }
  
  // 4. City (default to Roma)
  const city = (property.city || 'Roma')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  parts.push(city);
  
  // 5. Price (no €, no commas, no decimals)
  if (property.price && property.price > 0) {
    const price = Math.floor(property.price).toString();
    parts.push(price);
  }
  
  // 6. Square meters
  if (property.sqm && property.sqm > 0) {
    parts.push(`${Math.floor(property.sqm)}m2`);
  }
  
  // 7. Category/subcategory (for commercial properties, etc.)
  if (property.category && property.category !== propertyType) {
    const cleanCategory = property.category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\//g, '-') // Replace forward slashes with hyphens
      .replace(/[^a-z0-9-]+/g, '-') // Keep hyphens, replace others
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    if (cleanCategory) {
      parts.push(cleanCategory);
    }
  }
  
  // Join all parts and clean up
  let slug = parts
    .filter(Boolean)
    .join('-')
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Append short ID (last 8 chars of UUID) if property ID is provided
  if (property.id) {
    const shortId = property.id.replace(/-/g, '').slice(-8); // Remove hyphens and get last 8 chars
    slug = `${slug}-${shortId}`;
  }
  
  return slug || 'annuncio'; // Fallback if no data
};

/**
 * Extract property ID from slug
 * Slugs now end with short ID (8 hex chars): ...-a1b2c3d4
 * For backward compatibility, still handle UUID format
 */
export const extractPropertyId = (slugOrId: string): string => {
  // If it's a full UUID format (contains hyphens and is 36 chars), return as-is
  if (slugOrId.length === 36 && slugOrId.includes('-')) {
    return slugOrId;
  }
  
  // Extract short ID from end of slug (last 8 chars after last hyphen)
  const parts = slugOrId.split('-');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    // If last part is 8 hex chars, it's the short ID
    if (lastPart.length === 8 && /^[0-9a-f]+$/i.test(lastPart)) {
      return lastPart; // Return short ID - backend will handle this
    }
  }
  
  // If it's just 8 chars, assume it's a short ID
  if (slugOrId.length === 8 && /^[0-9a-f]+$/i.test(slugOrId)) {
    return slugOrId;
  }
  
  // Fallback: return as-is (might be old format)
  return slugOrId;
};

/**
 * Get the property path (for React Router Links)
 * Returns just the path without domain: /annuncio/slug
 */
export const getPropertyPath = (propertyId: string, property?: {
  subSubCategory?: string;
  subCategory?: string;
  category?: string;
  address?: string;
  zone?: string;
  city?: string;
  price?: number;
  sqm?: number;
  title?: string;
  id?: string;
}): string => {
  let slug: string;
  
  if (property) {
    slug = createPropertySlug({ ...property, id: propertyId });
  } else {
    slug = propertyId;
  }
  
  return `/annuncio/${slug}`;
};

/**
 * Get the property URL for sharing
 * Always uses the main domain (even in dev) so shared links show the correct domain
 * Uses descriptive slug format: PropertyType-Address-Zone-City-Price-Sqm-Category-ShortID
 */
export const getPropertyUrl = (propertyId: string, property?: {
  subSubCategory?: string;
  subCategory?: string;
  category?: string;
  address?: string;
  zone?: string;
  city?: string;
  price?: number;
  sqm?: number;
  title?: string; // Fallback if no other data
  id?: string;
}): string => {
  const path = getPropertyPath(propertyId, property);
  // Always use main domain for sharing URLs so previews look correct
  return `${MAIN_DOMAIN}${path}`;
};

