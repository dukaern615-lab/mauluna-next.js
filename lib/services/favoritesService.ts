import { apiClient } from '@/lib/api';

export const favoritesService = {
  async getAll() {
    const token = apiClient.getToken();
    if (!token && typeof window !== 'undefined') {
      // Fallback to localStorage if not authenticated
      const saved = localStorage.getItem('savedProperties');
      const propertyIds = saved ? JSON.parse(saved) : [];
      return propertyIds.map((id: string) => ({ id }));
    }

    // Try API call if endpoint exists, otherwise use localStorage
    try {
      // For now, use localStorage as the data source
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('savedProperties');
        const propertyIds = saved ? JSON.parse(saved) : [];
        return propertyIds.map((id: string) => ({ id }));
      }
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  async add(propertyId: string) {
    const token = apiClient.getToken();
    if (!token && typeof window !== 'undefined') {
      // Fallback to localStorage
      const saved = localStorage.getItem('savedProperties');
      const favorites = saved ? JSON.parse(saved) : [];
      if (!favorites.includes(propertyId)) {
        favorites.push(propertyId);
        localStorage.setItem('savedProperties', JSON.stringify(favorites));
      }
      return;
    }

    try {
      // Use localStorage for now
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('savedProperties');
        const favorites = saved ? JSON.parse(saved) : [];
        if (!favorites.includes(propertyId)) {
          favorites.push(propertyId);
          localStorage.setItem('savedProperties', JSON.stringify(favorites));
        }
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async remove(propertyId: string) {
    const token = apiClient.getToken();
    if (!token && typeof window !== 'undefined') {
      // Fallback to localStorage
      const saved = localStorage.getItem('savedProperties');
      const favorites = saved ? JSON.parse(saved) : [];
      const updated = favorites.filter((id: string) => id !== propertyId);
      localStorage.setItem('savedProperties', JSON.stringify(updated));
      return;
    }

    try {
      // Use localStorage for now
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('savedProperties');
        const favorites = saved ? JSON.parse(saved) : [];
        const updated = favorites.filter((id: string) => id !== propertyId);
        localStorage.setItem('savedProperties', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },
};




