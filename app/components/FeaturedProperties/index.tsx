'use client';

import { useState, useEffect } from 'react';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';
import Button from '@/components/base/Button';
import { propertyFunctions } from '@/lib/supabaseFunctions';
import { transformProperties } from '@/utils/propertyTransform';
import { useToast } from '@/hooks/useToast';

export default function FeaturedProperties() {
  const toast = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      setLoading(true);
      // OPTIMIZED: Single API call - get newest properties (avoids double-fetch)
      // Featured properties will naturally appear first if they exist
      const data = await propertyFunctions.get({ 
        limit: 6,
        sortBy: 'newest'
      });

      // Transform Supabase data using standardized utility
      const transformedProperties = transformProperties(Array.isArray(data) ? data : []);
      setProperties(transformedProperties);
      setError(null);
    } catch (error: any) {
      setError('Errore nel caricamento delle proprietà in evidenza');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2817] mb-4 sm:mb-5">
            Immobili in Evidenza a Roma
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#5C4B42] max-w-3xl mx-auto leading-relaxed">
            Scopri la nostra selezione di immobili premium disponibili in affitto e vendita
          </p>
        </div>

        {/* Property Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center">
              <i className="ri-loader-4-line text-5xl text-[#D97860] animate-spin mb-4"></i>
              <p className="text-[#5C4B42] text-sm sm:text-base">Caricamento immobili...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 sm:py-20">
            <i className="ri-error-warning-line text-6xl text-red-300 mb-4"></i>
            <p className="text-red-600 mb-2 text-base sm:text-lg">{error}</p>
            <button
              onClick={fetchFeaturedProperties}
              className="mt-6 px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              Riprova
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <i className="ri-home-4-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-base sm:text-lg">Nessun immobile in evidenza al momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-10 sm:mb-12 lg:mb-16" style={{ gridAutoRows: '1fr' }}>
            {properties.map((property) => (
              <div key={property.id} className="flex h-full w-full">
                <SharedPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {properties.length > 0 && (
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              to="/immobili"
              className="whitespace-nowrap px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Vedi Tutti gli Immobili
              <i className="ri-arrow-right-line ml-2"></i>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
