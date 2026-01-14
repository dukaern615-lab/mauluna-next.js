import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { extractPropertyId, getPropertyUrl } from '@/config/domain';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const propertyId = extractPropertyId(id);
    
    if (!propertyId) {
      return {
        title: 'Proprietà non trovata | MAULUNA IMMOBILIARE',
        description: 'La proprietà che stai cercando non è disponibile.',
      };
    }

    // Initialize Supabase client for server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query property WITH images using nested select
    let property = null;
    let error = null;
    
    // Select property with its images from property_images table
    const selectQuery = `
      *,
      property_images (
        image_url,
        is_primary,
        display_order
      )
    `;
    
    // If it's a full UUID (36 chars with hyphens), use exact match
    if (propertyId.length === 36 && propertyId.includes('-')) {
      const result = await supabase
        .from('properties')
        .select(selectQuery)
        .eq('id', propertyId)
        .single();
      property = result.data;
      error = result.error;
    } else {
      // Short ID (8 chars) - fetch all properties and find matching one
      // Supabase JS doesn't support id::text casting, so we filter in code
      const result = await supabase
        .from('properties')
        .select(selectQuery);
      
      if (result.data && Array.isArray(result.data)) {
        // Find property where UUID ends with the short ID
        property = result.data.find((p: any) => 
          p.id && p.id.replace(/-/g, '').endsWith(propertyId.toLowerCase())
        ) || null;
      }
      error = result.error;
    }

    if (error || !property) {
      return {
        title: 'Proprietà non trovata | MAULUNA IMMOBILIARE',
        description: 'La proprietà che stai cercando non è disponibile.',
      };
    }

    // Format price - database uses 'listing_type' (buy/rent)
    const listingType = property.listing_type || 'rent';
    const priceText = listingType === 'buy' 
      ? `€${Number(property.price).toLocaleString('it-IT')}` 
      : `€${Number(property.price).toLocaleString('it-IT')}/mese`;

    // Get property image from property_images table
    // Sort by display_order and get primary image or first image
    let imageUrl = 'https://mauluna.it/og-image.jpg';
    
    if (property.property_images && Array.isArray(property.property_images) && property.property_images.length > 0) {
      // Sort by display_order
      const sortedImages = property.property_images
        .filter((img: any) => img && img.image_url)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      
      // Prefer primary image, otherwise use first image
      const primaryImage = sortedImages.find((img: any) => img.is_primary);
      const firstImage = sortedImages[0];
      
      if (primaryImage?.image_url) {
        imageUrl = primaryImage.image_url;
      } else if (firstImage?.image_url) {
        imageUrl = firstImage.image_url;
      }
    }

    // Create description
    const description = property.description 
      ? property.description.substring(0, 155) + '...'
      : `${property.title} in ${property.zone || 'Roma'}, Roma. ${priceText}. Contatto diretto - 0% commissioni su MAULUNA IMMOBILIARE.`;

    // Get property URL
    const propertyUrl = getPropertyUrl(property.id, property);

    return {
      title: `${property.title} - ${priceText} | MAULUNA IMMOBILIARE`,
      description,
      alternates: {
        canonical: propertyUrl,
      },
      openGraph: {
        title: `${property.title} - ${priceText} | MAULUNA IMMOBILIARE - 0% Commissioni`,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: property.title,
          },
        ],
        url: propertyUrl,
        type: 'website',
        locale: 'it_IT',
        siteName: 'MAULUNA IMMOBILIARE',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${property.title} - ${priceText}`,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for property:', error);
    return {
      title: 'Errore nel caricamento della proprietà | MAULUNA IMMOBILIARE',
      description: 'Si è verificato un errore nel caricamento della proprietà.',
    };
  }
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
