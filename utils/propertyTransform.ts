/**
 * Standardized property transformation utility
 * Converts Supabase property data to frontend format
 */

interface SupabaseProperty {
  id?: string | number;
  title?: string;
  price?: number | string;
  listing_type?: string;
  type?: string;
  property_type?: string;
  category?: string;
  sub_category?: string;
  subCategory?: string;
  sub_sub_category?: string;
  subSubCategory?: string;
  sqm?: number | string;
  bedrooms?: number | string;
  rooms?: number | string;
  bathrooms?: number | string;
  floor?: string | number;
  condition?: string;
  energy_class?: string;
  energyClass?: string;
  zone?: string;
  address?: string;
  city?: string;
  description?: string;
  features?: any[] | string[];
  business_activities?: any[] | string[];
  views_count?: number | string;
  views?: number | string;
  created_at?: string;
  status?: string;
  user_id?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_whatsapp?: string;
  owner?: {
    name?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  property_images?: any[];
  _transformed?: {
    postedDays?: number;
    imageUrls?: string[];
  };
}

export interface TransformedProperty {
  id: string;
  title: string;
  price: number;
  type: string; // 'buy' | 'rent'
  category: string;
  subCategory: string;
  subSubCategory: string;
  sqm: number;
  rooms: number; // mapped from bedrooms
  bathrooms: number;
  floor: string;
  condition: string;
  energyClass: string;
  zone: string;
  address: string;
  city: string;
  description: string;
  features: string[];
  businessActivities: string[];
  images: string[];
  property_images?: any[]; // Preserve raw property_images for fallback in SharedPropertyCard
  views: number;
  postedDays: number;
  status?: string; // 'pending' | 'approved' | 'rejected'
  user_id?: string; // For ownership checks
  owner: {
    name: string;
    phone: string;
    email: string;
    whatsapp: string;
  };
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Transform a single property from Supabase format to frontend format
 */
export function transformProperty(prop: SupabaseProperty | null | undefined): TransformedProperty {
  // Safety check - return a default property instead of throwing
  if (!prop || typeof prop !== 'object') {
    console.warn('Invalid property data:', prop);
    // Return a minimal valid property object instead of throwing
    return {
      id: '',
      title: 'Proprietà non disponibile',
      price: 0,
      type: 'rent',
      category: '',
      subCategory: '',
      subSubCategory: '',
      sqm: 0,
      rooms: 0,
      bathrooms: 0,
      floor: '',
      condition: '',
      energyClass: '',
      zone: '',
      address: '',
      city: 'Roma',
      description: 'Dati non disponibili',
      features: [],
      businessActivities: [],
      images: [],
      views: 0,
      postedDays: 0,
      status: 'pending',
      user_id: '',
      owner: {
        name: '',
        phone: '',
        email: '',
        whatsapp: '',
      },
    };
  }

  // Handle images - sort by display_order, default to 0 if missing
  // Filter out null/undefined/empty image_urls
  // Handle both array format and nested object format
  let images: string[] = [];
  try {
    if (Array.isArray(prop.property_images)) {
      images = prop.property_images
        .filter((img: any) => img !== null && img !== undefined)
        .sort((a: any, b: any) => (a?.display_order || 0) - (b?.display_order || 0))
        .map((img: any) => {
          if (typeof img === 'string') return img;
          if (img?.image_url) return img.image_url;
          return null;
        })
        .filter((url: string | null): url is string => url !== null && url.trim() !== '');
    }
  } catch (imageError) {
    console.warn('Error processing property images:', imageError);
    images = [];
  }

  // Calculate posted days - handle invalid dates gracefully
  let postedDays = 0;
  try {
    const createdDate = prop.created_at ? new Date(prop.created_at) : new Date();
    if (!isNaN(createdDate.getTime())) {
      postedDays = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  } catch (dateError) {
    console.warn('Error calculating posted days:', dateError);
    postedDays = 0;
  }

  // Safely extract all fields with proper fallbacks
  const result = {
    id: String(prop.id || ''),
    title: String(prop.title || ''),
    price: Number(prop.price) || 0,
    type: String(prop.listing_type || prop.type || 'rent'),
    category: String(prop.property_type || prop.category || ''),
    subCategory: String(prop.sub_category || prop.subCategory || ''),
    subSubCategory: String(prop.sub_sub_category || prop.subSubCategory || ''),
    sqm: Number(prop.sqm) || 0,
    rooms: Number(prop.bedrooms || prop.rooms) || 0, // Map bedrooms to rooms
    bathrooms: Number(prop.bathrooms) || 0,
    floor: String(prop.floor || ''),
    condition: String(prop.condition || ''),
    energyClass: String(prop.energy_class || prop.energyClass || ''),
    zone: String(prop.zone || ''),
    address: String(prop.address || ''),
    city: String(prop.city || 'Roma'),
    description: String(prop.description || ''),
    features: Array.isArray(prop.features) 
      ? prop.features.filter((f: any) => f !== null && f !== undefined).map((f: any) => String(f))
      : [],
    businessActivities: Array.isArray(prop.business_activities)
      ? prop.business_activities.filter((b: any) => b !== null && b !== undefined).map((b: any) => String(b))
      : [],
    images: images, // Can be empty array - SharedPropertyCard will handle it
    property_images: Array.isArray(prop.property_images) ? prop.property_images : undefined, // Preserve raw property_images for fallback in SharedPropertyCard
    views: Number(prop.views_count || prop.views || 0) || 0,
    postedDays: postedDays,
    status: String(prop.status || 'approved'), // Preserve status for property detail page
    user_id: String(prop.user_id || ''), // Preserve user_id for ownership checks
    owner: {
      name: String(prop.owner_name || prop.owner?.name || ''),
      phone: String(prop.owner_phone || prop.owner?.phone || ''),
      email: String(prop.owner_email || prop.owner?.email || ''),
      whatsapp: String(prop.owner_whatsapp || prop.owner?.whatsapp || ''),
    },
    latitude: ((prop as any).latitude != null && (prop as any).latitude !== '' && !isNaN(Number((prop as any).latitude))) ? Number((prop as any).latitude) : null,
    longitude: ((prop as any).longitude != null && (prop as any).longitude !== '' && !isNaN(Number((prop as any).longitude))) ? Number((prop as any).longitude) : null,
  };
  
  // Debug logging removed - was causing connection errors
  
  return result;
}

/**
 * Transform an array of properties from Supabase format to frontend format
 */
export function transformProperties(properties: any[]): TransformedProperty[] {
  return properties.map(transformProperty);
}
