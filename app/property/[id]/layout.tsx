import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { extractPropertyId, getPropertyUrl } from '@/config/domain';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const propertyId = extractPropertyId(params.id);
    
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

    // Query property - handle both full UUID and short ID (8 chars from slug)
    let property = null;
    let error = null;
    
    // If it's a full UUID (36 chars with hyphens), use exact match
    if (propertyId.length === 36 && propertyId.includes('-')) {
      const result = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      property = result.data;
      error = result.error;
    } else {
      // Short ID (8 chars) - find UUID ending with this ID
      const result = await supabase
        .from('properties')
        .select('*')
        .ilike('id', `%${propertyId}`)
        .single();
      property = result.data;
      error = result.error;
    }

    if (error || !property) {
      return {
        title: 'Proprietà non trovata | MAULUNA IMMOBILIARE',
        description: 'La proprietà che stai cercando non è disponibile.',
      };
    }

    // Format price
    const priceText = property.type === 'sale' 
      ? `€${property.price.toLocaleString('it-IT')}` 
      : `€${property.price.toLocaleString('it-IT')}/mese`;

    // Get property image or fallback
    const imageUrl = property.images && property.images.length > 0
      ? property.images[0]
      : 'https://mauluna.it/og-image.jpg';

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
