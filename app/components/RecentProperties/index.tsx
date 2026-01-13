'use client';

import { useState, useEffect } from 'react';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';
import Button from '@/components/base/Button';
import { propertyFunctions } from '@/lib/supabaseFunctions';
import { transformProperties } from '@/utils/propertyTransform';
import { useToast } from '@/hooks/useToast';

export default function RecentProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchRecentProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch latest 12 approved properties via Edge Function
        // Note: requireAuth is false, so this works without authentication
        const data = await propertyFunctions.get({ 
          limit: 12,
          sortBy: 'newest'
        });

        // Handle both array and single object responses
        if (data) {
          const dataArray = Array.isArray(data) ? data : [data];
          if (dataArray.length > 0) {
            const transformedProperties = transformProperties(dataArray);
            setProperties(transformedProperties);
          } else {
            setProperties([]);
          }
        } else {
          setProperties([]);
        }
      } catch (err: any) {
        // Silently handle errors
        void ({
          error: err,
          message: err?.message,
          stack: err?.stack,
          response: err?.response,
          status: err?.status
        });
        
        // More detailed error message
        const errorMessage = err?.message || 'Errore nel caricamento delle proprietà recenti';
        setError(errorMessage);
        
        // Only show toast in development or if it's not a network error
        if (process.env.NODE_ENV === 'development' || !errorMessage.includes('fetch')) {
          toast.error(`Errore: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProperties();
  }, [toast]);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
          </div>
        </div>
      </section>
    );
  }

  // Only hide section if there's an error, not if properties array is empty (which could be valid)
  if (error) {
    return null; // Don't show section if there's an error
  }

  // If no properties, still show section but with empty state message
  if (properties.length === 0) {
    return null; // Don't show section if no properties (this is valid - no recent properties)
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2817] mb-2">
                Proprietà Recenti
              </h2>
              <p className="text-[#5C4B42] text-sm sm:text-base">
                Scopri le ultime proprietà aggiunte alla piattaforma
              </p>
            </div>
          </div>
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" style={{ gridAutoRows: '1fr' }}>
            {properties.map((property) => (
              <div key={property.id} className="flex h-full w-full">
                <SharedPropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#5C4B42]">Nessuna proprietà recente disponibile</p>
          </div>
        )}

        {properties.length >= 12 && (
          <div className="mt-8 sm:mt-12 text-center">
            <Button
              to="/immobili"
              variant="primary"
              className="px-8 py-3 text-base sm:text-lg"
            >
              Vedi Tutte le Proprietà
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
