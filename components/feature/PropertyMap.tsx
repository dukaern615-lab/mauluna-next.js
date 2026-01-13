'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';

// Types
interface PropertyMapProps {
  properties: any[];
  onPropertyClick?: (property: any) => void;
  onPropertyHover?: (propertyId: string | null) => void;
  hoveredPropertyId?: string | null;
  selectedPropertyId?: string | null;
  onCircleFilter?: (center: { lat: number; lng: number }, radiusKm: number) => void;
  onClearCircle?: () => void;
  circleActive?: boolean;
  isFullScreen?: boolean;
  onClose?: () => void;
  onToggleFavorite?: (propertyId: string) => void;
  onContact?: (property: any) => void;
  favorites?: string[];
}

// Rome center coordinates
const ROME_CENTER = { lat: 41.9028, lng: 12.4964 };
const DEFAULT_ZOOM = 12;

// Zone coordinates for properties without exact location
const zoneCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Centro Storico': { lat: 41.8986, lng: 12.4768 },
  'Trastevere': { lat: 41.8890, lng: 12.4692 },
  'Prati': { lat: 41.9109, lng: 12.4581 },
  'Flaminio': { lat: 41.9194, lng: 12.4762 },
  'Parioli': { lat: 41.9283, lng: 12.4921 },
  'Trieste': { lat: 41.9267, lng: 12.5034 },
  'Nomentano': { lat: 41.9183, lng: 12.5156 },
  'Tiburtino': { lat: 41.9099, lng: 12.5343 },
  'Prenestino': { lat: 41.8889, lng: 12.5343 },
  'Appio Latino': { lat: 41.8667, lng: 12.5123 },
  'Ostiense': { lat: 41.8556, lng: 12.4789 },
  'Testaccio': { lat: 41.8778, lng: 12.4789 },
  'Monteverde': { lat: 41.8667, lng: 12.4567 },
  'Aurelio': { lat: 41.8889, lng: 12.4345 },
  'EUR': { lat: 41.8346, lng: 12.4734 },
  'Tuscolano': { lat: 41.8756, lng: 12.5234 },
  'San Giovanni': { lat: 41.8856, lng: 12.5089 },
  'Esquilino': { lat: 41.8945, lng: 12.5023 },
  'Termini': { lat: 41.9012, lng: 12.5001 },
  'Castro Pretorio': { lat: 41.9067, lng: 12.5078 },
  'Salario': { lat: 41.9178, lng: 12.4923 },
  'Portuense': { lat: 41.8567, lng: 12.4456 },
  'Magliana': { lat: 41.8434, lng: 12.4356 },
  'Cinecittà': { lat: 41.8512, lng: 12.5678 },
  'Tor Vergata': { lat: 41.8512, lng: 12.5989 },
  'Casilino': { lat: 41.8756, lng: 12.5567 },
  'Centocelle': { lat: 41.8823, lng: 12.5512 },
  'Alessandrino': { lat: 41.8867, lng: 12.5678 },
  'Torpignattara': { lat: 41.8789, lng: 12.5334 },
  'Quadraro': { lat: 41.8678, lng: 12.5423 },
  'Don Bosco': { lat: 41.8723, lng: 12.5278 },
  'Appio Claudio': { lat: 41.8612, lng: 12.5189 },
  'Ardeatino': { lat: 41.8534, lng: 12.4934 },
  'Garbatella': { lat: 41.8623, lng: 12.4878 },
  'San Paolo': { lat: 41.8567, lng: 12.4756 },
  'Marconi': { lat: 41.8512, lng: 12.4689 },
  'Portonaccio': { lat: 41.9012, lng: 12.5367 },
  'Pietralata': { lat: 41.9123, lng: 12.5489 },
  'Casal Bruciato': { lat: 41.9089, lng: 12.5534 },
  'Colli Aniene': { lat: 41.9212, lng: 12.5645 },
  'Montesacro': { lat: 41.9345, lng: 12.5234 },
  'Talenti': { lat: 41.9456, lng: 12.5345 },
  'Bufalotta': { lat: 41.9567, lng: 12.5234 },
  'Fidene': { lat: 41.9623, lng: 12.5123 },
  'Tor Sapienza': { lat: 41.8956, lng: 12.5712 },
  'Roma': { lat: 41.9028, lng: 12.4964 }
};

// Format price for marker display - accurate with proper decimals
const formatPrice = (price: number, type: string): string => {
  if (price >= 1000000) {
    return `€${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 1000) {
    return `€${(price / 1000).toFixed(1)}K`;
  }
  return `€${price}`;
};


// Generate stable offset from property ID (same ID = same offset always)
// Used as fallback for properties without coordinates
const getStableOffset = (propertyId: string, range: number): number => {
  let hash = 0;
  for (let i = 0; i < propertyId.length; i++) {
    hash = ((hash << 5) - hash) + propertyId.charCodeAt(i);
    hash = hash & hash;
  }
  return ((hash % 10000) / 10000 - 0.5) * range;
};

// Flower Bloom: Spread duplicate addresses based on zoom level
// At low zoom: overlap (clean view)
// At high zoom: spread 1-6 meters apart for clickability
const applyFlowerBloom = (
  properties: any[],
  coordCache: Map<string, { lat: number; lng: number }>,
  zoom: number
): Map<string, { lat: number; lng: number }> => {
  // FIRST: Group by normalized address (same address = same group, regardless of coordinate differences)
  const addressGroups = new Map<string, any[]>();
  
  properties.forEach(property => {
    const normalizedAddress = (property.address || '').trim().toLowerCase();
    if (!addressGroups.has(normalizedAddress)) {
      addressGroups.set(normalizedAddress, []);
    }
    addressGroups.get(normalizedAddress)!.push(property);
  });
  
  // Calculate spread radius based on zoom
  // 1 meter ≈ 0.000009 degrees at Rome's latitude
  // 6 meters ≈ 0.000054 degrees
  const maxSpread = 0.000054; // 6 meters in degrees
  const minZoom = 16; // Start spreading at zoom 16
  const maxZoom = 20; // Max spread at zoom 20
  
  let spreadRadius = 0;
  if (zoom >= maxZoom) {
    spreadRadius = maxSpread; // 6 meters
  } else if (zoom >= minZoom) {
    // Linear interpolation between minZoom and maxZoom
    const progress = (zoom - minZoom) / (maxZoom - minZoom);
    spreadRadius = maxSpread * progress; // 0 to 6 meters
  }
  // If zoom < minZoom, spreadRadius = 0 (overlap)
  
  // Create bloomed coordinates map
  const bloomedCoords = new Map<string, { lat: number; lng: number }>();
  
  addressGroups.forEach((groupProps) => {
    // Calculate average coordinates for this address group
    // This ensures all properties with same address use the same base coordinates
    let totalLat = 0;
    let totalLng = 0;
    let validCoords = 0;
    
    groupProps.forEach(property => {
      const coords = getPropertyCoordinates(property, coordCache);
      if (coords) {
        totalLat += coords.lat;
        totalLng += coords.lng;
        validCoords++;
      }
    });
    
    if (validCoords === 0) return; // Skip if no valid coordinates
    
    // Use average coordinates as base for this address group
    const baseCoords = {
      lat: totalLat / validCoords,
      lng: totalLng / validCoords
    };
    
    if (groupProps.length === 1) {
      // Single property - use base coordinates
      bloomedCoords.set(String(groupProps[0].id), baseCoords);
    } else {
      // Multiple properties with same address
      if (spreadRadius === 0) {
        // Low zoom: overlap at same location
        groupProps.forEach((property) => {
          bloomedCoords.set(String(property.id), baseCoords);
        });
      } else {
        // High zoom: spread in a circle for clickability
      const angleStep = (2 * Math.PI) / groupProps.length;
      
      groupProps.forEach((property, index) => {
        const angle = index * angleStep;
          const offsetLat = Math.cos(angle) * spreadRadius;
          const offsetLng = Math.sin(angle) * spreadRadius;
        
        bloomedCoords.set(String(property.id), {
          lat: baseCoords.lat + offsetLat,
          lng: baseCoords.lng + offsetLng
        });
      });
      }
    }
  });
  
  return bloomedCoords;
};

// Get property coordinates - ONLY use exact coordinates (stored or geocoded)
// NO zone fallback - properties without coordinates return null
const getPropertyCoordinates = (
  property: any,
  cache: Map<string, { lat: number; lng: number }>
): { lat: number; lng: number } | null => {
  const propertyAddress = property.address || '';
  const propertyId = String(property?.id || '');
  
  // Check cache FIRST (geocoded coordinates are more accurate and fresh)
  // Cache contains freshly geocoded coordinates WITHOUT zone - these are correct
  // Stored coordinates might be wrong (geocoded with zone before)
  const cacheKey = `${propertyAddress.trim().toLowerCase()}_${propertyId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  // Check stored coordinates SECOND (as fallback - they might be wrong)
  // DO NOT cache stored coordinates - only cache geocoded coordinates (which are correct)
  // This ensures geocoding always happens and correct coordinates are cached
  const lat = property.latitude;
  const lng = property.longitude;
  
  if (lat != null && lng != null && 
      lat !== '' && lng !== '' && 
      !isNaN(Number(lat)) && !isNaN(Number(lng)) && 
      Number(lat) !== 0 && Number(lng) !== 0) {
    const coords = { lat: Number(lat), lng: Number(lng) };
    // Return stored coordinates but DON'T cache them
    // Geocoding will happen and cache correct coordinates
    return coords;
  }
  
  // If no stored coordinates AND no address, return null (don't show)
  if (!propertyAddress || propertyAddress.trim() === '') {
    return null;  // NO ZONE FALLBACK - property won't show until geocoded
  }
  
  // Address exists but no coordinates yet - return null
  // Geocoding will happen async and update cache
  return null;  // Property will appear after geocoding completes
};

// SIMPLIFIED marker - small, fast, optimized for thousands of properties
const createPriceMarkerHTML = (
  price: number,
  type: string,
  isHovered: boolean,
  isSelected: boolean,
  isViewed: boolean = false,
  scale: number = 1.0 // Scale for same-address properties at high zoom
): string => {
  const priceText = formatPrice(price, type);
  
  // Simple, small styling - optimized for performance
  let bgColor: string;
  let textColor: string;
  let borderColor: string;
  
  if (isSelected) {
    bgColor = '#D97860';
    textColor = '#ffffff';
    borderColor = '#ffffff';
  } else if (isHovered) {
    bgColor = '#3D2817';
    textColor = '#ffffff';
    borderColor = '#ffffff';
  } else if (isViewed) {
    bgColor = '#f3f4f6';
    textColor = '#6b7280';
    borderColor = '#d1d5db';
  } else {
    bgColor = '#ffffff';
    textColor = '#3D2817';
    borderColor = '#D97860';
  }
  
  const opacity = isViewed && !isSelected && !isHovered ? '0.7' : '1';
  
  // MUCH smaller sizes - optimized for thousands of markers
  const fontSize = isSelected ? '10px' : isHovered ? '9px' : '8px';
  const padding = isSelected ? '3px 6px' : isHovered ? '2px 5px' : '2px 4px';
  const borderRadius = '6px';
  const borderWidth = isSelected ? '2px' : '1.5px';
  
  return `
    <div style="
      background: ${bgColor};
      color: ${textColor};
      padding: ${padding};
      border-radius: ${borderRadius};
      font-weight: ${isSelected ? '600' : '500'};
      font-size: ${fontSize};
      font-family: -apple-system, sans-serif;
      border: ${borderWidth} solid ${borderColor};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      opacity: ${opacity};
      transition: transform 0.15s ease, opacity 0.15s ease;
      cursor: pointer;
      white-space: nowrap;
      transform: ${isSelected ? `scale(${1.1 * scale})` : isHovered ? `scale(${1.05 * scale})` : `scale(${scale})`};
    ">
      ${priceText}
    </div>
  `;
};

// SIMPLIFIED cluster marker - small, fast, no animations
const createClusterMarkerHTML = (count: number): string => {
  // Much smaller clusters - optimized for performance
  const size = count < 10 ? 28 : count < 100 ? 32 : 36;
  const fontSize = count < 10 ? '11px' : count < 100 ? '10px' : '9px';
  
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: #D97860;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;
    " class="cluster-hover">
      <span style="
        color: white;
        font-weight: 600;
        font-size: ${fontSize};
        font-family: -apple-system, sans-serif;
      ">${count}</span>
    </div>
  `;
};


export default function PropertyMap({
  properties,
  onPropertyClick: _onPropertyClick,
  onPropertyHover,
  hoveredPropertyId,
  selectedPropertyId,
  onCircleFilter,
  onClearCircle,
  circleActive: _circleActive = false,
  isFullScreen = false,
  onClose,
  onToggleFavorite: _onToggleFavorite,
  onContact: _onContact,
  favorites: _favorites = []
}: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const markerDivsRef = useRef<Map<string, HTMLDivElement>>(new Map()); // Store divs for fast updates
  const markerPropertiesRef = useRef<Map<string, any>>(new Map()); // Store property data
  const markerCoordsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const clustersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing
  const bloomedCoordsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map()); // Cache bloomed coords
  
  // STABLE coordinate cache - persists across renders
  const coordinateCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);
  const [isDrawingModeReady, setIsDrawingModeReady] = useState(false); // Ready to draw but not drawing yet
  const [circleRadius, setCircleRadius] = useState<number | null>(null);
  const [showRadiusLabel, setShowRadiusLabel] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [hasCircle, setHasCircle] = useState(false); // Track if circle/polygon exists
  const [viewedProperties, setViewedProperties] = useState<Set<string>>(new Set());
  const [geocodedCount, setGeocodedCount] = useState(0); // Force re-render after geocoding
  const geocodingInProgressRef = useRef<Set<string>>(new Set()); // Track addresses being geocoded
  const geocodedAddressesRef = useRef<Set<string>>(new Set()); // Track addresses that have been geocoded (successfully or failed)
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Geocode addresses and update cache - save coordinates to database
  useEffect(() => {
    if (!isMapLoaded || !window.google?.maps?.Geocoder) return;
    if (properties.length === 0) return;

    const geocoder = new google.maps.Geocoder();
    
    properties.forEach(property => {
      const address = property.address || '';
      const propertyId = String(property?.id || '');
      
      if (!address || address.trim() === '') return;  // No address = can't geocode
      
      // Use property-specific cache key (address + property ID)
      // This ensures each property geocodes independently
      const cacheKey = `${address.trim().toLowerCase()}_${propertyId}`;
      
      // Skip if already geocoded or in progress
      if (geocodedAddressesRef.current.has(cacheKey) || 
          geocodingInProgressRef.current.has(cacheKey)) {
        return;
      }
      
      geocodingInProgressRef.current.add(cacheKey);
      
      // Don't include zone in geocoding - it can cause wrong results
      // Use same format as Google Maps link: address, city, Italia
      const city = property.city || 'Roma';
      const fullAddress = `${address.trim()}, ${city}, Italia`;
      
      geocoder.geocode(
        {
          address: fullAddress,
          componentRestrictions: { country: 'it' },
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(41.6, 12.0),
            new google.maps.LatLng(42.2, 13.0)
          ),
        },
        async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          geocodingInProgressRef.current.delete(cacheKey);
          
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const location = results[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            
            // Check if stored coordinates are different from geocoded coordinates
            const storedLat = property.latitude ? Number(property.latitude) : null;
            const storedLng = property.longitude ? Number(property.longitude) : null;
            const coordinatesChanged = storedLat === null || storedLng === null || 
              Math.abs(storedLat - coords.lat) > 0.0001 || 
              Math.abs(storedLng - coords.lng) > 0.0001;
            
            // Update cache
                  coordinateCacheRef.current.set(cacheKey, coords);
            geocodedAddressesRef.current.add(cacheKey);
                  setGeocodedCount(prev => prev + 1);
            
            // SAVE TO DATABASE (update if changed or missing)
            if (propertyId && coordinatesChanged) {
              try {
                const { propertyFunctions } = await import('@/lib/supabaseFunctions');
                await propertyFunctions.updateCoordinates(propertyId, coords.lat, coords.lng);
              } catch (error) {
                // Silently fail - saving is not critical for display
                console.error('Failed to save coordinates:', error);
              }
            }
          } else {
            // Geocoding failed - use stored coordinates as fallback
            const storedLat = property.latitude ? Number(property.latitude) : null;
            const storedLng = property.longitude ? Number(property.longitude) : null;
            if (storedLat !== null && storedLng !== null && 
                !isNaN(storedLat) && !isNaN(storedLng) && 
                storedLat !== 0 && storedLng !== 0) {
              // Use stored coordinates as fallback
              coordinateCacheRef.current.set(cacheKey, { lat: storedLat, lng: storedLng });
            }
          }
        }
      );
    });
  }, [properties, isMapLoaded]);

  // Track viewed properties when selected AND track view in database
  useEffect(() => {
    if (selectedProperty) {
      setViewedProperties(prev => new Set([...prev, selectedProperty.id]));
      
      // Track view when property is shown in map pop-up
      const trackView = async () => {
        try {
          const { propertyFunctions } = await import('@/lib/supabaseFunctions');
          await propertyFunctions.trackView(selectedProperty.id);
        } catch (err) {
          // Silently fail - view tracking is not critical
          console.error('Error tracking map view:', err);
        }
      };
      
      // Debounce view tracking to avoid multiple counts for same property
      const timeoutId = setTimeout(trackView, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedProperty]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (mapRef.current) return;

    const initMap = async () => {
      try {
        // Load Google Maps API first (same as 111.com main.tsx)
        await loadGoogleMaps();
        
        // Wait for Google Maps API to be fully loaded (with marker library)
        const waitForGoogleMaps = () => {
          return new Promise<void>((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max
            const check = () => {
              if (typeof window !== 'undefined' && 
                  window.google?.maps && 
                  window.google.maps.Map &&
                  window.google.maps.marker?.AdvancedMarkerElement) {
                resolve();
              } else if (attempts >= maxAttempts) {
                reject(new Error('Google Maps API failed to load'));
              } else {
                attempts++;
                setTimeout(check, 100);
              }
            };
            check();
          });
        };

        await waitForGoogleMaps();

        if (!mapContainerRef.current) return;

        // 2025 Modern Map Styles - Muted & Clean
        const mapStyles: google.maps.MapTypeStyle[] = [
          // Muted colors for all elements
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }, { lightness: 10 }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ visibility: 'off' }]
          },
          // Roads - light gray
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#E8E8E8' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#DADADA' }]
          },
          // Parks - soft green
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#E8F5E8' }]
          },
          // Water - light blue
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#E3F2FD' }]
          },
          // Buildings - very light
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            stylers: [{ visibility: 'simplified' }]
          },
          // Landscape
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#F5F5F5' }]
          }
        ];

        const map = new google.maps.Map(mapContainerRef.current!, {
          center: ROME_CENTER,
          zoom: DEFAULT_ZOOM,
          mapId: 'bcc6ee988513602cfcafad39',
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          keyboardShortcuts: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          minZoom: 10,
          maxZoom: 22, // Google Maps maximum zoom for street-level detail
          restriction: {
            latLngBounds: {
              north: 42.2,
              south: 41.6,
              west: 12.0,
              east: 13.0
            },
            strictBounds: true
          }
        });

        mapRef.current = map;
        setIsMapLoaded(true);

        // Close bottom sheet when clicking on map
        map.addListener('click', () => {
          setSelectedProperty(null);
          if (onPropertyHover) onPropertyHover(null);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setIsMapLoaded(false);
      }
    };

    // Start initialization (loadGoogleMaps handles the loading)
    initMap();
  }, [onPropertyHover]);

  // Calculate clusters based on zoom level
  // DISABLED CLUSTERING: Always show individual properties
  const calculateClusters = useCallback((
    props: any[], 
    zoom: number, 
    coordCache: Map<string, { lat: number; lng: number }>
  ) => {
    // Always return individual markers - no clustering
      return props.map(p => ({ type: 'marker' as const, properties: [p] }));
  }, []);

  // Point-in-polygon check (Ray casting algorithm)
  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: google.maps.Polygon): boolean => {
    const paths = polygon.getPath();
    const polygonPath = paths.getArray();
    
    if (polygonPath.length < 3) return false;
    
    let inside = false;
    const x = point.lng;
    const y = point.lat;
    
    for (let i = 0, j = polygonPath.length - 1; i < polygonPath.length; j = i++) {
      const xi = polygonPath[i].lng();
      const yi = polygonPath[i].lat();
      const xj = polygonPath[j].lng();
      const yj = polygonPath[j].lat();
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Filter properties to show based on polygon and drawing state
  const propertiesToShow = useMemo(() => {
    // If in ready mode OR drawing, show nothing - clean map
    if (isDrawingCircle || isDrawingModeReady) {
      return [];
    }
    
    // If polygon is drawn, only show properties inside it
    if (hasCircle && circleRef.current && circleRef.current instanceof google.maps.Polygon) {
      const polygon = circleRef.current as google.maps.Polygon;
      
      return properties.filter(property => {
        const coords = getPropertyCoordinates(property, coordinateCacheRef.current);
        if (!coords) return false;
        
        // Check if point is inside polygon
        return isPointInPolygon(coords, polygon);
      });
    }
    
    // Otherwise show all properties
    return properties;
  }, [properties, isDrawingCircle, isDrawingModeReady, hasCircle]);

  // Auto-fit bounds ref
  const hasAutoFittedRef = useRef(false);
  const lastPropertiesLengthRef = useRef(0);
  const lastPropertyIdsRef = useRef<Set<string>>(new Set());

  // EFFECT 1: Create/Update markers when properties change (NOT on hover!)
  // This is the expensive operation - only run when absolutely necessary
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    const map = mapRef.current;
    const zoom = map.getZoom() || DEFAULT_ZOOM;
    
    // Use filtered properties instead of all properties
    const propertiesWithCoords = propertiesToShow.filter(property => {
      const coords = getPropertyCoordinates(property, coordinateCacheRef.current);
      return coords !== null || (property.address && property.address.trim() !== '');
    });
    
    // Track same-address groups for different marker sizes at high zoom
    const addressGroups = new Map<string, any[]>();
    propertiesWithCoords.forEach(property => {
      const normalizedAddress = (property.address || '').trim().toLowerCase();
      if (!addressGroups.has(normalizedAddress)) {
        addressGroups.set(normalizedAddress, []);
      }
      addressGroups.get(normalizedAddress)!.push(property);
    });
    
    // Apply flower bloom FIRST to spread duplicates (zoom-based)
    const bloomedCoords = applyFlowerBloom(propertiesWithCoords, coordinateCacheRef.current, zoom);
    bloomedCoordsRef.current = bloomedCoords;
    
    const clusters = calculateClusters(propertiesWithCoords, zoom, coordinateCacheRef.current);

    // Get current viewport bounds for filtering
    const bounds = map.getBounds();
    
    // Build set of property IDs we need
    const neededPropertyIds = new Set<string>();
    clusters.forEach(cluster => {
      if (cluster.type === 'marker') {
        const property = cluster.properties[0];
        const propertyId = String(property?.id || '');
        const coords = bloomedCoords.get(propertyId) || getPropertyCoordinates(property, coordinateCacheRef.current);
        
        if (!coords) return;
        
        if (!bounds || !hasAutoFittedRef.current || bounds.contains(new google.maps.LatLng(coords.lat, coords.lng))) {
          neededPropertyIds.add(propertyId);
        }
      }
    });

    // Remove markers that are no longer needed
    markersRef.current.forEach((marker, propertyId) => {
      if (!neededPropertyIds.has(propertyId)) {
        marker.map = null;
        markersRef.current.delete(propertyId);
        markerDivsRef.current.delete(propertyId);
        markerPropertiesRef.current.delete(propertyId);
        markerCoordsRef.current.delete(propertyId);
      }
    });

    // Clear existing clusters
    clustersRef.current.forEach(marker => {
      marker.map = null;
    });
    clustersRef.current = [];

    // Create/update markers
    let markerIndex = 0;
    clusters.forEach((cluster) => {
      if ((cluster.type as string) === 'cluster' && cluster.properties.length > 1) {
        const propsWithCoords = cluster.properties.filter((p: any) => {
          const coords = getPropertyCoordinates(p, coordinateCacheRef.current);
          return coords !== null;
        });
        
        if (propsWithCoords.length === 0) return;
        
        const avgLat = propsWithCoords.reduce((sum: number, p: any) => {
          const coords = getPropertyCoordinates(p, coordinateCacheRef.current);
          return sum + (coords?.lat || 0);
        }, 0) / propsWithCoords.length;
        const avgLng = propsWithCoords.reduce((sum: number, p: any) => {
          const coords = getPropertyCoordinates(p, coordinateCacheRef.current);
          return sum + (coords?.lng || 0);
        }, 0) / propsWithCoords.length;

        const clusterDiv = document.createElement('div');
        clusterDiv.innerHTML = createClusterMarkerHTML(cluster.properties.length);

        const clusterMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: avgLat, lng: avgLng },
          content: clusterDiv,
          zIndex: 100
        });

        clusterMarker.addListener('click', () => {
          setSelectedProperty(null);
          const currentZoom = map.getZoom() || DEFAULT_ZOOM;
          const newZoom = Math.min(currentZoom + 3, 18);
          map.panTo({ lat: avgLat, lng: avgLng });
          setTimeout(() => {
            map.setZoom(newZoom);
          }, 150);
        });
        
        clusterDiv.addEventListener('mouseenter', () => {
          const hoverDiv = clusterDiv.querySelector('.cluster-hover') as HTMLElement;
          if (hoverDiv) {
            hoverDiv.style.transform = 'scale(1.1)';
          }
        });
        
        clusterDiv.addEventListener('mouseleave', () => {
          const hoverDiv = clusterDiv.querySelector('.cluster-hover') as HTMLElement;
          if (hoverDiv) {
            hoverDiv.style.transform = 'scale(1)';
          }
        });

        clustersRef.current.push(clusterMarker);
      } else {
        const property = cluster.properties[0];
        const propertyId = String(property?.id || '');
        const coords = bloomedCoords.get(propertyId) || getPropertyCoordinates(property, coordinateCacheRef.current);
        
        if (!coords) return;
        
        if (bounds && hasAutoFittedRef.current && !bounds.contains(new google.maps.LatLng(coords.lat, coords.lng))) {
          return;
        }
        
        const existingMarker = markersRef.current.get(propertyId);
        
        if (existingMarker) {
          const existingCoords = markerCoordsRef.current.get(propertyId);
          if (!existingCoords || existingCoords.lat !== coords.lat || existingCoords.lng !== coords.lng) {
            existingMarker.position = coords;
            markerCoordsRef.current.set(propertyId, coords);
          }
          markerPropertiesRef.current.set(propertyId, property);
        } else {
          const isViewed = viewedProperties.has(propertyId);
          const markerDiv = document.createElement('div');
          
          const cascadeDelay = Math.min(markerIndex * 40, 800);
          markerDiv.style.opacity = '0';
          markerDiv.style.animation = `marker-cascade 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${cascadeDelay}ms forwards`;
          
          const normalizedAddress = (property.address || '').trim().toLowerCase();
          const sameAddressGroup = addressGroups.get(normalizedAddress) || [];
          let markerScale = 1.0;
          if (sameAddressGroup.length > 1 && zoom >= 16) {
            const indexInGroup = sameAddressGroup.findIndex(p => String(p.id) === propertyId);
            markerScale = indexInGroup === 0 ? 1.2 : 1.0;
          }
          
          markerDiv.innerHTML = createPriceMarkerHTML(
            property.price || 0,
            property.type || 'sale',
            false,
            false,
            isViewed,
            markerScale
          );

          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: coords,
            content: markerDiv,
            zIndex: markerIndex
          });

          marker.addListener('click', () => {
            setSelectedProperty(property);
          });

          markersRef.current.set(propertyId, marker);
          markerDivsRef.current.set(propertyId, markerDiv);
          markerPropertiesRef.current.set(propertyId, property);
          markerCoordsRef.current.set(propertyId, coords);
        }
        
        markerIndex++;
      }
    });

    const zoomListener = map.addListener('zoom_changed', () => {
      setSelectedProperty(null);
    });

    return () => {
      if (window.google?.maps) {
        google.maps.event.removeListener(zoomListener);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [propertiesToShow, isMapLoaded, calculateClusters, viewedProperties, geocodedCount, isDrawingCircle]);

  // EFFECT 2: Update marker styling on hover/selection (FAST - no recreation!)
  useEffect(() => {
    if (!isMapLoaded) return;

    markersRef.current.forEach((marker, propertyId) => {
      const markerDiv = markerDivsRef.current.get(propertyId);
      const property = markerPropertiesRef.current.get(propertyId);
      
      if (!markerDiv || !property) return;
      
      const isHovered = hoveredPropertyId === propertyId;
      const isSelected = selectedPropertyId === propertyId || (selectedProperty && String(selectedProperty.id) === propertyId);
      const isViewed = viewedProperties.has(propertyId);
      
      const needsUpdate = isHovered || isSelected || 
                          (hoveredPropertyId && !isHovered) || 
                          (selectedPropertyId && !isSelected);
      
      if (needsUpdate) {
        markerDiv.innerHTML = createPriceMarkerHTML(
          property.price || 0,
          property.type || 'sale',
          isHovered,
          isSelected,
          isViewed
        );
        
        marker.zIndex = isHovered || isSelected ? 1000 : 1;
      }
    });
  }, [hoveredPropertyId, selectedPropertyId, selectedProperty, viewedProperties, isMapLoaded]);

  // EFFECT 3: Update markers when viewport changes (pan/zoom)
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    
    const boundsChangedListener = map.addListener('bounds_changed', () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      hoverTimeoutRef.current = setTimeout(() => {
        setGeocodedCount(prev => prev + 1);
      }, 300);
    });

    return () => {
      if (window.google?.maps) {
        google.maps.event.removeListener(boundsChangedListener);
      }
    };
  }, [isMapLoaded]);

  // Ready mode: Zoom to Rome and clear markers
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    if (isDrawingModeReady && !isDrawingCircle) {
      markersRef.current.forEach(marker => marker.map = null);
      markersRef.current.clear();
      markerDivsRef.current.clear();
      markerPropertiesRef.current.clear();
      clustersRef.current.forEach(cluster => cluster.map = null);
      clustersRef.current = [];
      
      mapRef.current.setCenter({ lat: 41.9028, lng: 12.4964 });
      mapRef.current.setZoom(11);
    }
  }, [isDrawingModeReady, isDrawingCircle, isMapLoaded]);

  // Modern smooth freehand drawing with canvas overlay
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    if (isDrawingCircle) {
      const mapDiv = mapRef.current.getDiv();
      let canvas = mapDiv.querySelector('.drawing-canvas') as HTMLCanvasElement;
      
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'drawing-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'crosshair';
        canvas.style.zIndex = '1000';
        canvas.style.touchAction = 'none';
        mapDiv.appendChild(canvas);
      }
      
      const resizeCanvas = () => {
        const rect = mapDiv.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };
      resizeCanvas();
      
      const ctx = canvas.getContext('2d')!;
      ctx.strokeStyle = '#D97860';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      let isDrawing = false;
      let points: { x: number; y: number }[] = [];
      let lastPoint: { x: number; y: number } | null = null;
      
      const smoothDraw = (x: number, y: number) => {
        if (!lastPoint) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          lastPoint = { x, y };
          points.push({ x, y });
          return;
        }
        
        const midX = (lastPoint.x + x) / 2;
        const midY = (lastPoint.y + y) / 2;
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
        ctx.stroke();
        
        lastPoint = { x, y };
        points.push({ x, y });
      };
      
      const getCanvasPoint = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };
      
      const startDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDrawing = true;
        const point = getCanvasPoint(e);
        points = [point];
        lastPoint = point;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      };
      
      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const point = getCanvasPoint(e);
        smoothDraw(point.x, point.y);
      };
      
      const endDrawing = () => {
        if (!isDrawing || points.length < 10) {
          isDrawing = false;
          lastPoint = null;
          return;
        }
        isDrawing = false;
        
        if (lastPoint && points.length > 0) {
          ctx.lineTo(points[0].x, points[0].y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(217, 120, 96, 0.2)';
          ctx.fill();
        }
        
        const mapBounds = mapRef.current!.getBounds()!;
        const mapNe = mapBounds.getNorthEast();
        const mapSw = mapBounds.getSouthWest();
        
        const latLngPoints = points.map(point => {
          const lng = mapSw.lng() + (point.x / canvas.width) * (mapNe.lng() - mapSw.lng());
          const lat = mapNe.lat() - (point.y / canvas.height) * (mapNe.lat() - mapSw.lat());
          return new google.maps.LatLng(lat, lng);
        });
        
        if (circleRef.current) {
          (circleRef.current as any).setMap(null);
        }

        const polygon = new google.maps.Polygon({
          paths: latLngPoints,
          strokeColor: '#D97860',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#D97860',
          fillOpacity: 0.2,
          editable: false,
          draggable: false,
          clickable: false,
          map: mapRef.current || undefined
        });
        
        circleRef.current = polygon as any;
        setHasCircle(true);
        setIsDrawingCircle(false);
        
        const polygonBounds = new google.maps.LatLngBounds();
        latLngPoints.forEach(point => polygonBounds.extend(point));
        const center = polygonBounds.getCenter();
        const polygonNe = polygonBounds.getNorthEast();
        
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(polygonNe.lat() - center.lat());
        const dLng = toRad(polygonNe.lng() - center.lng());
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(center.lat())) * Math.cos(toRad(polygonNe.lat())) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const radiusMeters = R * c;
        const radiusKm = radiusMeters / 1000;

        setCircleRadius(radiusKm);
        setShowRadiusLabel(true);

        if (onCircleFilter) {
          onCircleFilter({ lat: center.lat(), lng: center.lng() }, radiusKm);
        }
        
        canvas.remove();
        lastPoint = null;
      };
      
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', endDrawing);
      canvas.addEventListener('mouseleave', endDrawing);
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', endDrawing);
      canvas.addEventListener('touchcancel', endDrawing);
      
      const resizeListener = mapRef.current.addListener('bounds_changed', () => {
        resizeCanvas();
        if (isDrawing && points.length > 0) {
          ctx.strokeStyle = '#D97860';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const midX = (prev.x + curr.x) / 2;
            const midY = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
          }
          ctx.stroke();
        }
      });
      
      return () => {
        canvas.remove();
        if (window.google?.maps) {
          google.maps.event.removeListener(resizeListener);
        }
        lastPoint = null;
      };
    } else {
      const mapDiv = mapRef.current.getDiv();
      const canvas = mapDiv.querySelector('.drawing-canvas');
      if (canvas) canvas.remove();
    }
  }, [isDrawingCircle, isMapLoaded, onCircleFilter]);

  // Clear circle
  const handleClearCircle = useCallback(() => {
    if (circleRef.current) {
      (circleRef.current as any).setMap(null);
      circleRef.current = null;
    }
    setHasCircle(false);
    setCircleRadius(null);
    setShowRadiusLabel(false);
    setIsDrawingCircle(false);
    setIsDrawingModeReady(false);
    if (onClearCircle) onClearCircle();
  }, [onClearCircle]);

  // Fit bounds to properties
  const fitBoundsToProperties = useCallback(() => {
    if (!mapRef.current || properties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    properties.forEach(property => {
      const coords = getPropertyCoordinates(property, coordinateCacheRef.current);
      if (coords) bounds.extend(coords);
    });

    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [properties]);

  // Auto-fit bounds when properties first load
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || properties.length === 0) {
      hasAutoFittedRef.current = false;
      lastPropertyIdsRef.current.clear();
      return;
    }

    const currentPropertyIds = new Set(properties.map(p => String(p?.id || '')));
    const lengthChanged = properties.length !== lastPropertiesLengthRef.current;
    const idsChanged = currentPropertyIds.size !== lastPropertyIdsRef.current.size ||
      Array.from(currentPropertyIds).some(id => !lastPropertyIdsRef.current.has(id));
    
    const propertiesChanged = lengthChanged || idsChanged;
    
    if (propertiesChanged || !hasAutoFittedRef.current) {
      hasAutoFittedRef.current = false;
      
      const timeoutId = setTimeout(() => {
        if (mapRef.current && properties.length > 0) {
          fitBoundsToProperties();
          hasAutoFittedRef.current = true;
          lastPropertiesLengthRef.current = properties.length;
          lastPropertyIdsRef.current = currentPropertyIds;
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [properties, isMapLoaded, fitBoundsToProperties]);

  // Close bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50' : 'w-full h-full'}`}>
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full [&_.gm-style-cc]:!hidden [&_a[href^='https://maps.google.com/maps']]:!hidden [&_.gmnoprint]:!hidden [&_.gm-style>div:last-child]:!hidden"
        style={{ minHeight: isFullScreen ? '100vh' : '400px' }}
      />

      {/* Premium Loading Overlay with Skeleton */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[#D97860] 
                              border-r-[#E89A85] rounded-full animate-spin"
                   style={{ animationDuration: '1s' }}></div>
              <div className="absolute inset-3 bg-gradient-to-br from-[#D97860] to-[#C9A876] 
                              rounded-full opacity-20 animate-pulse"></div>
            </div>
            
            <div className="text-center">
              <span className="text-gray-700 font-semibold text-lg">Caricamento mappa</span>
              <div className="flex gap-1 justify-center mt-2">
                <div className="w-2 h-2 bg-[#D97860] rounded-full animate-bounce" 
                     style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#D97860] rounded-full animate-bounce" 
                     style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#D97860] rounded-full animate-bounce" 
                     style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            
            <div className="mt-6 w-64 h-48 bg-white/50 backdrop-blur-sm rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Property Card */}
      {selectedProperty && (
        <div 
          className="absolute bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto"
          style={{
            maxWidth: '380px',
            width: '90vw'
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 relative"
            style={{ 
              borderColor: 'rgba(217, 120, 96, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)'
            }}
          >
            <button
              onClick={handleCloseBottomSheet}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg hover:scale-110"
              style={{ border: '1px solid rgba(217, 120, 96, 0.2)' }}
            >
              <i className="ri-close-line text-gray-700 text-lg"></i>
            </button>
            
            <SharedPropertyCard property={selectedProperty} inlineModals={true} />
          </div>
        </div>
      )}

      {/* Close Button - Top Right */}
      {isFullScreen && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 group bg-white/95 backdrop-blur-xl rounded-full 
                     shadow-lg hover:shadow-xl border border-gray-100
                     transition-all duration-300 hover:scale-105 active:scale-95
                     px-4 py-2.5 flex items-center gap-2"
        >
          <i className="ri-close-line text-lg text-gray-700 group-hover:text-[#D97860] 
                        transition-colors"></i>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-[#D97860] 
                         transition-colors">
            Chiudi
          </span>
        </button>
      )}

      {/* Draw Area Button */}
      {!isDrawingCircle && !isDrawingModeReady && !hasCircle && !selectedProperty && (
        <div className="absolute right-4 md:right-6 bottom-28 md:bottom-6 z-50 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setSelectedProperty(null);
              setIsDrawingModeReady(true);
            }}
            className="group rounded-full shadow-lg hover:shadow-xl 
                       border transition-all duration-300 hover:scale-105 active:scale-95
                       px-3 py-2 flex items-center gap-2
                       bg-white/95 backdrop-blur-xl border-gray-100"
          >
            <i className="ri-pencil-line text-base text-gray-700 group-hover:text-[#D97860] 
                          transition-colors"></i>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#D97860] 
                           transition-colors whitespace-nowrap">
              Disegna Area
            </span>
          </button>
        </div>
      )}

      {/* Cancella Area Button */}
      {hasCircle && !isDrawingCircle && !selectedProperty && (
        <div className="absolute right-4 md:right-6 bottom-28 md:bottom-6 z-50 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setSelectedProperty(null);
              handleClearCircle();
            }}
            className="group rounded-full shadow-lg hover:shadow-xl 
                       border transition-all duration-300 hover:scale-105 active:scale-95
                       px-4 py-2.5 flex items-center gap-2.5
                       bg-[#D97860] border-[#D97860] shadow-[#D97860]/30"
          >
            <i className="ri-close-circle-fill text-lg text-white"></i>
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              Cancella Area
            </span>
          </button>
        </div>
      )}

      {/* Circle Radius Label */}
      {showRadiusLabel && circleRadius && !selectedProperty && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xl px-5 py-3 
                        rounded-xl shadow-lg z-10 border border-gray-200/50
                        animate-[slideIn_0.3s_ease-out]"
             style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D97860] to-[#E89A85] 
                            flex items-center justify-center shadow-md">
              <i className="ri-ruler-line text-white text-lg"></i>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Raggio ricerca</p>
              <span className="text-lg font-bold text-gray-900">
              {circleRadius < 1 
                ? `${Math.round(circleRadius * 1000)} m` 
                : `${circleRadius.toFixed(1)} km`}
            </span>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Indicator - Clickable "Disegna" Button */}
      {isDrawingModeReady && (
        <div className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setIsDrawingCircle(true);
              setIsDrawingModeReady(false);
            }}
            className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl 
                       border border-gray-200 flex items-center gap-3 animate-[slideUp_0.3s_ease-out]
                       hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300
                       cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D97860] to-[#E89A85] 
                            flex items-center justify-center">
              <i className="ri-pencil-line text-white text-sm"></i>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              Disegna
            </span>
          </button>
        </div>
      )}

      {/* Drawing Active Indicator */}
      {isDrawingCircle && (
        <div className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl 
                          border border-gray-200 flex items-center gap-3 animate-[slideUp_0.3s_ease-out]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D97860] to-[#E89A85] 
                            flex items-center justify-center">
              <i className="ri-pencil-line text-white text-sm"></i>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Disegna
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
