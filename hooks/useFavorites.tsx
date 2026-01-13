'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { favoriteFunctions } from '@/lib/supabaseFunctions';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  isProcessing: (propertyId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Track if favorites have been loaded globally to prevent multiple loads
let globalFavoritesLoaded = false;

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const processingRef = useRef<Set<string>>(new Set());
  const loadingRef = useRef(false); // Prevent concurrent loads

  const loadFavorites = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setFavorites([]);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      // Fetch from Supabase Edge Function - ONLY ONCE
      const data = await favoriteFunctions.get();
      const propertyIds = (data || []).map((fav: any) => fav.properties?.id || fav.property_id).filter(Boolean);
      setFavorites(propertyIds);
      globalFavoritesLoaded = true;
    } catch (error) {
      // Silently fail - user might not be logged in
      setFavorites([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Load favorites once on mount
  useEffect(() => {
    loadFavorites();
    
    // Listen for auth state changes to reload favorites
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        globalFavoritesLoaded = false;
        loadFavorites();
      } else if (event === 'SIGNED_OUT') {
        setFavorites([]);
        globalFavoritesLoaded = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (propertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Return early - user needs to log in first
        return;
      }

      // Prevent duplicate requests - check if already processing this property
      if (processingRef.current.has(propertyId)) {
        return;
      }

      // Mark as processing
      processingRef.current.add(propertyId);
      setProcessingIds(new Set(processingRef.current));

      // OPTIMISTIC UPDATE - update state BEFORE API call for instant UI feedback
      const currentlyFavorite = favorites.includes(propertyId);
      
      if (currentlyFavorite) {
        // Optimistically remove from favorites
        setFavorites(prev => prev.filter(id => id !== propertyId));
        
        try {
          await favoriteFunctions.remove(propertyId);
        } catch (error: any) {
          // Rollback on error - restore to favorites
          console.error('Error removing favorite, rolling back:', error);
          setFavorites(prev => [...prev, propertyId]);
          throw error;
        }
      } else {
        // Optimistically add to favorites
        setFavorites(prev => [...prev, propertyId]);
        
        try {
          await favoriteFunctions.add(propertyId);
        } catch (error: any) {
          // Handle duplicate key error gracefully - it means it's already added
          if (error.message?.includes('duplicate key') || 
              error.message?.includes('favorites_user_property_unique')) {
            // Keep the optimistic update since it's already in the database
          } else {
            // Rollback on other errors - remove from favorites
            console.error('Error adding favorite, rolling back:', error);
            setFavorites(prev => prev.filter(id => id !== propertyId));
            throw error;
          }
        }
      }
    } finally {
      // Remove from processing set after a small delay to prevent rapid re-clicks
      setTimeout(() => {
        processingRef.current.delete(propertyId);
        setProcessingIds(new Set(processingRef.current));
      }, 300);
    }
  }, [favorites]);

  const isFavorite = useCallback((propertyId: string) => favorites.includes(propertyId), [favorites]);
  
  const isProcessing = useCallback((propertyId: string) => processingIds.has(propertyId), [processingIds]);

  const refreshFavorites = useCallback(async () => {
    globalFavoritesLoaded = false;
    await loadFavorites();
  }, [loadFavorites]);

  const value: FavoritesContextType = {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    isProcessing,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
