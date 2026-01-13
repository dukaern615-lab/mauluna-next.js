'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { favoriteFunctions } from '@/lib/supabaseFunctions';
import { transformProperties } from '@/utils/propertyTransform';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';
import { useToast } from '@/hooks/useToast';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toggleFavorite } = useFavorites();
  const toast = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch favorites using Edge Function
      const data = await favoriteFunctions.get();

      // Transform properties data and filter out deleted/rejected properties
      const properties = (data || [])
        .map((fav: any) => fav.properties || fav)
        .filter((prop: any) => 
          prop !== null && 
          prop !== undefined && 
          prop.status === 'approved' &&
          prop.id // Ensure property has valid ID
        );

      const transformedProperties = transformProperties(properties);
      setFavorites(transformedProperties);
    } catch (err: any) {
      const errorMessage = err?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (err?.status === 401 && errorMessage.includes('expired'))) {
        setLoading(false);
        router.push('/accedi');
        return;
      }
      
      setError('Errore nel caricamento dei preferiti. Riprova.');
      toast.error('Errore nel caricamento dei preferiti: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [user, toast, router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/accedi');
        return;
      }
      loadFavorites();
    }
  }, [user, authLoading, router, loadFavorites]);

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      await toggleFavorite(propertyId);
      // Reload favorites to update the list
      await loadFavorites();
      toast.success('Rimosso dai preferiti');
    } catch (err: any) {
      const errorMessage = err?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (err?.status === 401 && errorMessage.includes('expired'))) {
        router.push('/accedi');
        return;
      }
      toast.error('Errore durante la rimozione: ' + (err.message || ''));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
            <p className="mt-4 text-[#5C4B42]">Caricamento preferiti...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3D2817] mb-4">I Miei Preferiti</h1>
          <p className="text-[#5C4B42]">
            {favorites.length} {favorites.length === 1 ? 'immobile salvato' : 'immobili salvati'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            <i className="ri-error-warning-line mr-2"></i>
            {error}
            <button
              onClick={loadFavorites}
              className="ml-4 text-red-800 underline hover:no-underline"
            >
              Riprova
            </button>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-heart-line text-6xl text-[#C9A876] mb-4"></i>
            <h3 className="text-xl font-semibold text-[#3D2817] mb-2">Nessun preferito ancora</h3>
            <p className="text-[#5C4B42] mb-6">Inizia a salvare gli immobili che ti piacciono!</p>
            <button
              onClick={() => router.push('/properties')}
              className="px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap"
            >
              Sfoglia Immobili
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <div key={property.id} className="relative">
                <SharedPropertyCard property={property} />
                <button
                  onClick={() => handleRemoveFavorite(property.id)}
                  className="absolute top-4 right-4 z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Rimuovi dai preferiti"
                >
                  <i className="ri-heart-fill"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
