'use client';

import { useEffect, useRef, useState } from 'react';

interface Property {
  id: number;
  title: string;
  zone: string;
  price: number;
  type: string;
  sqm: number;
  surface?: number;
  rooms: number;
  bathrooms: number;
  category: string;
  image?: string;
}

interface InteractiveMapProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  highlightedPropertyId?: number;
}

// Modern minimalist map styles
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0e0e0' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9e6f0' }]
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  }
];

// Rome zone coordinates
const zoneCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Centro Storico': { lat: 41.8986, lng: 12.4768 },
  'Trastevere': { lat: 41.8890, lng: 12.4692 },
  'Prati': { lat: 41.9109, lng: 12.4581 },
  'Flaminio': { lat: 41.9194, lng: 12.4762 },
  'Parioli': { lat: 41.9194, lng: 12.4762 },
  'Trieste': { lat: 41.9267, lng: 12.5034 },
  'Nomentano': { lat: 41.9267, lng: 12.5156 },
  'Tiburtino': { lat: 41.9099, lng: 12.5343 },
  'Prenestino': { lat: 41.8889, lng: 12.5343 },
  'Appio Latino': { lat: 41.8667, lng: 12.5123 },
  'Ostiense': { lat: 41.8556, lng: 12.4789 },
  'Testaccio': { lat: 41.8778, lng: 12.4789 },
  'Monteverde': { lat: 41.8667, lng: 12.4567 },
  'Aurelio': { lat: 41.8889, lng: 12.4345 },
  'EUR': { lat: 41.8346, lng: 12.4734 },
  'Roma': { lat: 41.9028, lng: 12.4964 }
};

export default function InteractiveMap({
  properties,
  onPropertyClick,
  highlightedPropertyId
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [currentShape, setCurrentShape] = useState<google.maps.Circle | google.maps.Polygon | google.maps.Rectangle | null>(null);
  const [filteredCount, setFilteredCount] = useState(properties.length);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get property coordinates with slight randomization
  const getPropertyCoordinates = (property: Property) => {
    const baseCoords = zoneCoordinates[property.zone] || zoneCoordinates['Roma'];
    const offset = 0.002;
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * offset,
      lng: baseCoords.lng + (Math.random() - 0.5) * offset
    };
  };

  // Format price
  const formatPrice = (price: number, type: string) => {
    if (type === 'buy') {
      if (price >= 1000000) {
        return `€${(price / 1000000).toFixed(1)}M`;
      } else if (price >= 1000) {
        return `€${(price / 1000).toFixed(0)}k`;
      }
      return `€${price.toLocaleString('it-IT')}`;
    }
    return `€${price.toLocaleString('it-IT')}/mese`;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        if (typeof google === 'undefined' || !google.maps) {
          throw new Error('Google Maps API not loaded');
        }

        const romeCenter = { lat: 41.9028, lng: 12.4964 };

        const mapInstance = new google.maps.Map(mapRef.current!, {
          zoom: 12,
          center: romeCenter,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          gestureHandling: 'cooperative',
          mapId: 'DEMO_MAP_ID'
        });

        setMap(mapInstance);

        // Initialize Search Box
        if (searchInputRef.current && google.maps.places) {
          const searchBoxInstance = new google.maps.places.SearchBox(searchInputRef.current);
          setSearchBox(searchBoxInstance);

          searchBoxInstance.addListener('places_changed', () => {
            const places = searchBoxInstance.getPlaces();
            if (places && places.length > 0) {
              const place = places[0];
              if (place.geometry && place.geometry.location) {
                mapInstance.setCenter(place.geometry.location);
                mapInstance.setZoom(15);
              }
            }
          });
        }

        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    // Wait for Google Maps to be ready
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.marker) {
        initMap();
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, []);

  // Create markers
  useEffect(() => {
    if (!map || properties.length === 0 || typeof google === 'undefined') return;

    // Clear existing markers
    markers.forEach(marker => {
      marker.map = null;
    });

    // Create new markers
    const newMarkers = properties.map(property => {
      const position = getPropertyCoordinates(property);

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.innerHTML = `
        <div style="
          width: 12px;
          height: 12px;
          background: #D97860;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        "></div>
      `;

      // Hover effect
      markerElement.addEventListener('mouseenter', () => {
        const dot = markerElement.querySelector('div') as HTMLElement;
        if (dot) {
          dot.style.transform = 'scale(1.3)';
          dot.style.background = '#C9A876';
        }
      });

      markerElement.addEventListener('mouseleave', () => {
        const dot = markerElement.querySelector('div') as HTMLElement;
        if (dot) {
          dot.style.transform = 'scale(1)';
          dot.style.background = '#D97860';
        }
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: markerElement,
        title: property.title
      });

      // Click listener
      marker.addListener('click', () => {
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }

        const imageUrl = property.image || `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28%60Modern%20property%20interior%20in%20Rome%20$%7Bproperty.zone%7D%60%29%7D&width=280&height=180&seq=${property.id}&orientation=landscape`;

        const propertyUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${property.id}` : `/property/${property.id}`;

        const content = `
          <div style="padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 280px; border-radius: 12px; overflow: hidden;">
            <img 
              src="${imageUrl}"
              alt="${property.title}"
              style="width: 100%; height: 180px; object-fit: cover; display: block;"
            />
            <div style="padding: 16px;">
              <div style="font-size: 20px; font-weight: 700; color: #D97860; margin-bottom: 8px;">
                ${formatPrice(property.price, property.type)}
              </div>
              <div style="font-size: 15px; font-weight: 600; color: #3D2817; margin-bottom: 6px; line-height: 1.4;">
                ${property.title}
              </div>
              <div style="font-size: 13px; color: #5C4B42; margin-bottom: 12px; display: flex; align-items: center;">
                <span style="margin-right: 4px;">📍</span> ${property.zone}, Roma
              </div>
              <div style="display: flex; gap: 16px; font-size: 13px; color: #5C4B42; margin-bottom: 16px; padding: 12px; background: #F9F6F3; border-radius: 8px;">
                <span><strong>${property.sqm || property.surface}</strong> m²</span>
                <span><strong>${property.rooms}</strong> locali</span>
                <span><strong>${property.bathrooms}</strong> bagni</span>
              </div>
              <button 
                onclick="window.location.href='${propertyUrl}'" 
                style="
                  width: 100%; 
                  padding: 12px; 
                  background: #D97860; 
                  color: white; 
                  border: none; 
                  border-radius: 8px; 
                  cursor: pointer; 
                  font-weight: 600;
                  font-size: 14px;
                  transition: all 0.2s;
                "
                onmouseover="this.style.background='#C86B54'"
                onmouseout="this.style.background='#D97860'"
              >
                Visualizza Dettagli
              </button>
            </div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
          content,
          maxWidth: 280
        });

        infoWindow.open(map, marker);
        setActiveInfoWindow(infoWindow);
        onPropertyClick(property);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, properties]);

  // Center map on properties
  const centerMap = () => {
    if (!map || properties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    properties.forEach(property => {
      const position = getPropertyCoordinates(property);
      bounds.extend(new google.maps.LatLng(position.lat, position.lng));
    });

    map.fitBounds(bounds, {
      top: 80,
      right: 80,
      bottom: 80,
      left: 80
    });
  };

  if (error) {
    return (
      <div className="h-full relative bg-white rounded-2xl overflow-hidden border border-[#E8E4E0] flex items-center justify-center">
        <div className="text-center p-8">
          <i className="ri-error-warning-line text-5xl text-red-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-[#3D2817] mb-2">Map Loading Error</h3>
          <p className="text-sm text-[#5C4B42] mb-4">{error}</p>
          <button
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-white rounded-2xl overflow-hidden border border-[#E8E4E0] shadow-lg">
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#D97860] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-base text-[#5C4B42] font-medium">Caricamento mappa...</p>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-6">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="🔍 Cerca luoghi a Roma..."
          className="w-full px-5 py-4 bg-white border-2 border-[#E8E4E0] rounded-2xl shadow-xl text-[#3D2817] placeholder-[#5C4B42]/50 focus:border-[#D97860] focus:ring-4 focus:ring-[#D97860]/20 transition-all text-base font-medium"
        />
      </div>

      {/* Center Button */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={centerMap}
          className="px-5 py-4 bg-white text-[#3D2817] rounded-2xl shadow-xl hover:shadow-2xl border-2 border-[#E8E4E0] font-medium text-base cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 hover:border-[#D97860]"
          title="Centra mappa"
        >
          <i className="ri-focus-3-line text-xl"></i>
          <span>Centra</span>
        </button>
      </div>

      {/* Property Counter */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="px-8 py-4 bg-white text-[#3D2817] rounded-2xl shadow-xl border-2 border-[#E8E4E0] font-semibold text-base flex items-center gap-3">
          <i className="ri-home-4-line text-[#D97860] text-2xl"></i>
          <span>
            <span className="text-[#D97860] text-lg">{properties.length.toLocaleString()}</span>
            <span className="text-[#5C4B42]"> immobili</span>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-[#E8E4E0] p-4">
          <div className="flex items-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#D97860] rounded-full border-2 border-white shadow-md"></div>
              <span className="text-[#3D2817]">Immobili</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











