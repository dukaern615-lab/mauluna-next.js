/**
 * Dynamically loads Google Maps API with the API key from environment variables
 */
export function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve();
      return;
    }

    if (typeof window === 'undefined') {
      reject(new Error('loadGoogleMaps can only be called in browser environment'));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment variables'));
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[data-google-maps]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps API')));
      return;
    }

    // Initialize callback
    (window as any).initGoogleMaps = () => {
      (window as any).googleMapsLoaded = true;
      window.dispatchEvent(new Event('google-maps-loaded'));
      resolve();
    };

    // Create and append script
    const script = document.createElement('script');
    script.setAttribute('data-google-maps', 'true');
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry,marker&loading=async&callback=initGoogleMaps`;
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    
    document.head.appendChild(script);
  });
}

// Extend Window interface
declare global {
  interface Window {
    initGoogleMaps?: () => void;
    googleMapsLoaded?: boolean;
  }
}
