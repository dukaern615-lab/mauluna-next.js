'use client';

/**
 * Simple in-memory cache for property data
 * Reduces redundant API calls when navigating between pages
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Max cache entries to prevent memory bloat
const MAX_CACHE_ENTRIES = 50;

class PropertyCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Generate a cache key from filters object
   */
  private generateKey(filters: any): string {
    // Sort keys for consistent hashing
    const sortedFilters = Object.keys(filters || {})
      .sort()
      .reduce((acc, key) => {
        const value = filters[key];
        // Only include non-empty values
        if (value !== undefined && value !== null && value !== '' && 
            !(Array.isArray(value) && value.length === 0)) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
    
    return JSON.stringify(sortedFilters);
  }
  
  /**
   * Get cached data if valid
   */
  get<T>(filters: any): T | null {
    const key = this.generateKey(filters);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set cache data
   */
  set<T>(filters: any, data: T): void {
    const key = this.generateKey(filters);
    
    // Enforce max cache size (remove oldest entries)
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }
  
  /**
   * Invalidate all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const propertyCache = new PropertyCache();

// Export type for filters
export type PropertyFilters = {
  id?: string;
  type?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  zone?: string | string[];
  zones?: string[];
  priceMin?: string | number;
  priceMax?: string | number;
  minArea?: string | number;
  maxArea?: string | number;
  rooms?: string;
  bathrooms?: string;
  floor?: string;
  condition?: string;
  energyClass?: string;
  features?: string[];
  featured?: string | boolean;
  userId?: string;
  limit?: number;
  sortBy?: string;
  sort?: string;
  businessActivities?: string[];
  offset?: number;
  isAdmin?: boolean;
  fallbackToNewest?: boolean;
};
