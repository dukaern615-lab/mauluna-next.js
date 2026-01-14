'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabaseClient';
import { propertyFunctions, shareFunctions } from '@/lib/supabaseFunctions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { transformProperty } from '@/utils/propertyTransform';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getPropertyUrl, extractPropertyId } from '@/config/domain';

export default function PropertyDetailPage() {
  const pathname = usePathname();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isProcessing } = useFavorites();
  const toast = useToast();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Scroll detection for hiding/showing banner
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [showScamReportModal, setShowScamReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  
  // Refs for Google Maps
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Get property ID from URL - use wildcard route to capture full slug
  // Extract slug from pathname: /property/slug-here -> slug-here
  const pathnameSlug = pathname.replace(/^\/property\//, '').replace(/^\/annuncio\//, '');
  const idParam = Array.isArray(id) ? id[0] : id;
  const urlParam = pathnameSlug || idParam || searchParams.get('id') || '';
  
  const propertyId = extractPropertyId(urlParam);
  

  // Use ref to track if we've already fetched this property to prevent re-fetches
  const fetchedPropertyIdRef = useRef<string | null>(null);

  const fetchProperty = useCallback(async () => {
    
    if (!propertyId) {
      
      return;
    }
    
    // Prevent re-fetch if we've already loaded this property
    // Check ref BEFORE starting fetch to prevent race conditions
    if (fetchedPropertyIdRef.current === propertyId) {
      return;
    }
    
    // Mark as fetching IMMEDIATELY to prevent duplicate calls
    // This is critical for React StrictMode double renders
    fetchedPropertyIdRef.current = propertyId;
    
    try {
      setLoading(true);
      
      // Fetch property via Edge Function
      // Note: If propertyId is a short ID (8 chars from slug), the backend needs to support
      // searching by ID prefix. For now, it will try to match exact ID or short ID prefix.
      
      const data = await propertyFunctions.get({ id: propertyId });
      

      // Check for error response from Edge Function
      if (data && typeof data === 'object' && 'error' in data) {
        
        toast.error(data.error || 'Errore nel caricamento della proprietà');
        setProperty(null);
        setLoading(false);
        if (fetchedPropertyIdRef.current === propertyId) {
          fetchedPropertyIdRef.current = null;
        }
        return;
      }

      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        
        toast.error('Proprietà non trovata');
        setProperty(null);
        setLoading(false);
        if (fetchedPropertyIdRef.current === propertyId) {
          fetchedPropertyIdRef.current = null;
        }
        return;
      }

      // Handle both single object and array response
      const propertyData = Array.isArray(data) ? data[0] : data;
      
      
      // Validate propertyData is an object
      if (!propertyData || typeof propertyData !== 'object' || !propertyData.id) {
        toast.error('Dati della proprietà non validi');
        setProperty(null);
        setLoading(false);
        if (fetchedPropertyIdRef.current === propertyId) {
          fetchedPropertyIdRef.current = null;
        }
        return;
      }

      // Check if user is the owner - robust comparison with type safety
      // Access user directly from hook (no need for dependency)
      const currentUser = user;
      const userIsOwner = !!(currentUser?.id && propertyData.user_id && String(propertyData.user_id) === String(currentUser.id));
      
      // Only allow viewing if property is approved OR user is the owner
      if (propertyData.status !== 'approved' && !userIsOwner) {
        toast.error('Questa proprietà non è disponibile');
        setProperty(null); // Show error state instead of navigating
        setLoading(false);
        // Reset ref on error so it can be retried
        if (fetchedPropertyIdRef.current === propertyId) {
          fetchedPropertyIdRef.current = null;
        }
        return;
      }

      // Increment view count (only for approved properties)
      if (propertyData.status === 'approved' && propertyData.id) {
        try {
          // Use the full UUID from propertyData, not the short ID from URL
          await supabase.rpc('increment_property_view', { property_uuid: propertyData.id });
        } catch (viewError) {
          // Silently fail - view count is not critical
        }
      }

      // Property data fetched successfully

      // Transform Supabase data using standardized utility
      try {
        const transformedProperty = transformProperty(propertyData);
        setProperty(transformedProperty);
        
        // Set owner status
        setIsOwner(userIsOwner);
        setLoading(false); // Stop loading after successful transformation
        // Ref is already set at the start, so no need to set it again
      } catch (transformError) {
        toast.error('Errore nel formato dei dati della proprietà');
        setProperty(null); // Show error state instead of navigating
        setLoading(false);
        // Reset ref on error so it can be retried
        if (fetchedPropertyIdRef.current === propertyId) {
          fetchedPropertyIdRef.current = null;
        }
        return;
      }
    } catch (error) {
      toast.error('Errore nel caricamento della proprietà. Riprova più tardi.');
      setProperty(null); // Show error state instead of navigating
      setLoading(false);
      // Reset ref on error so it can be retried
      if (fetchedPropertyIdRef.current === propertyId) {
        fetchedPropertyIdRef.current = null;
    }
    }
  }, [propertyId, router, toast.error, user]);

  // Fetch property from Supabase - only when propertyId changes
  useEffect(() => {
    if (!propertyId) return;
    
    // Check ref BEFORE calling fetchProperty to prevent duplicate calls
    // This is critical for React StrictMode which causes double renders
    if (fetchedPropertyIdRef.current === propertyId) {
      return; // Already fetched or currently fetching, don't call again
    }
    
    // Reset ref when propertyId changes (new property)
    if (fetchedPropertyIdRef.current && fetchedPropertyIdRef.current !== propertyId) {
      fetchedPropertyIdRef.current = null;
    }
    
    // Only fetch if not already fetched/fetching
    fetchProperty();
  }, [propertyId, fetchProperty]);

  // Update owner status when user changes (without re-fetching property)
  useEffect(() => {
    if (property && user !== undefined) {
      const userIsOwner = !!(user?.id && property.user_id && String(property.user_id) === String(user.id));
      setIsOwner(userIsOwner);
    } else if (property && !user) {
      // User logged out - reset owner status
      setIsOwner(false);
    }
  }, [user, property]);

  // Reset image index when property changes
  useEffect(() => {
    if (property?.id) {
      setCurrentImageIndex(0);
      setImageLoading(true);
      setImageError(false);
    }
  }, [property?.id]);

  // Check if first image is already loaded (cached) after property loads
  useEffect(() => {
    if (property?.images && property.images.length > 0 && currentImageIndex === 0 && imageLoading) {
      // Small delay to allow image element to render
      const checkImage = setTimeout(() => {
        const img = document.querySelector(`img[src="${property.images[0]}"]`) as HTMLImageElement;
        if (img && img.complete && img.naturalWidth > 0) {
          setImageLoading(false);
          setImageError(false);
        }
      }, 50); // Small delay to ensure image element exists
      return () => clearTimeout(checkImage);
    }
  }, [property?.images, currentImageIndex, imageLoading]);

  // Image loading timeout - if image doesn't load within 5 seconds, show error
  useEffect(() => {
    if (imageLoading && property?.images && property.images.length > 0) {
      const timeout = setTimeout(() => {
        if (imageLoading) {
          setImageError(true);
          setImageLoading(false);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [imageLoading, property?.images, currentImageIndex]);

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') {
      return `€${price.toLocaleString('it-IT')}/mese`;
    }
    return `€${price.toLocaleString('it-IT')}`;
  };

  // Geocode address using Google Geocoding API - Rome only
  // Always geocodes fresh to ensure accuracy (like Google Maps link), updates database if coordinates differ
  const geocodeAddress = useCallback(async (address: string, zone?: string, propertyId?: string) => {
    if (!address) {
      setMapCoordinates(null);
      setMapLoading(false);
      return;
    }
    
    try {
      setMapLoading(true);
      
      // Wait for Google Maps API to load with timeout
      const waitForGoogle = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max (50 * 100ms)
          const check = () => {
            if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
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
      
      await waitForGoogle();
      
      const geocoder = new google.maps.Geocoder();
      const formattedAddress = address.trim();
      
      // NEVER include zone in geocoding - it causes wrong results
      // Always use just: address, city, Italia (like Google Maps link)
      // Zone should NEVER be used for maps - always use street address
      let fullAddress = `${formattedAddress}, Roma, Italia`;
      
      geocoder.geocode(
        {
          address: fullAddress,
          componentRestrictions: { country: 'it' },
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(41.7, 12.3),
            new google.maps.LatLng(42.0, 12.7)
          ),
        },
        async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const location = results[0].geometry.location;
            const coordinates = { lat: location.lat(), lng: location.lng() };
            
            // Check if stored coordinates are different from geocoded coordinates
            const storedLat = property?.latitude ? Number(property.latitude) : null;
            const storedLng = property?.longitude ? Number(property.longitude) : null;
            const coordinatesChanged = storedLat === null || storedLng === null || 
              Math.abs(storedLat - coordinates.lat) > 0.0001 || 
              Math.abs(storedLng - coordinates.lng) > 0.0001;
            
            setMapCoordinates(coordinates);
            setMapLoading(false);
            
            // SAVE COORDINATES TO DATABASE (update if changed or missing)
            if (propertyId && coordinatesChanged) {
              try {
                const { propertyFunctions } = await import('@/lib/supabaseFunctions');
                await propertyFunctions.updateCoordinates(propertyId, coordinates.lat, coordinates.lng);
              } catch (error) {
                // Silently fail - saving coordinates is not critical for display
              }
            }
          } else {
            // Try simpler format
            const simpleAddress = `${formattedAddress}, Roma, Italia`;
            geocoder.geocode(
              {
                address: simpleAddress,
                componentRestrictions: { country: 'it' },
              },
              async (retryResults: google.maps.GeocoderResult[] | null, retryStatus: google.maps.GeocoderStatus) => {
                if (retryStatus === google.maps.GeocoderStatus.OK && retryResults && retryResults.length > 0) {
                  const location = retryResults[0].geometry.location;
                  const coords = { lat: location.lat(), lng: location.lng() };
                  
                  // Check if stored coordinates are different from geocoded coordinates
                  const storedLat = property?.latitude ? Number(property.latitude) : null;
                  const storedLng = property?.longitude ? Number(property.longitude) : null;
                  const coordinatesChanged = storedLat === null || storedLng === null || 
                    Math.abs(storedLat - coords.lat) > 0.0001 || 
                    Math.abs(storedLng - coords.lng) > 0.0001;
                  
                  setMapCoordinates(coords);
                  setMapLoading(false);
                  
                  // SAVE COORDINATES TO DATABASE (update if changed or missing)
                  if (propertyId && coordinatesChanged) {
                    try {
                      const { propertyFunctions } = await import('@/lib/supabaseFunctions');
                      await propertyFunctions.updateCoordinates(propertyId, coords.lat, coords.lng);
                    } catch (error) {
                      // Silent fail
                    }
                  }
                } else {
                  // Geocoding failed - use stored coordinates as fallback
                  const storedLat = property?.latitude ? Number(property.latitude) : null;
                  const storedLng = property?.longitude ? Number(property.longitude) : null;
                  if (storedLat !== null && storedLng !== null && 
                      !isNaN(storedLat) && !isNaN(storedLng) && 
                      storedLat !== 0 && storedLng !== 0) {
                    setMapCoordinates({ lat: storedLat, lng: storedLng });
                    setMapLoading(false);
                  } else {
                    setMapCoordinates(null);
                    setMapLoading(false);
                  }
                }
              }
            );
          }
        }
      );
    } catch (error) {
      // On error, try stored coordinates as fallback
      const storedLat = property?.latitude ? Number(property.latitude) : null;
      const storedLng = property?.longitude ? Number(property.longitude) : null;
      if (storedLat !== null && storedLng !== null && 
          !isNaN(storedLat) && !isNaN(storedLng) && 
          storedLat !== 0 && storedLng !== 0) {
        setMapCoordinates({ lat: storedLat, lng: storedLng });
        setMapLoading(false);
      } else {
        setMapCoordinates(null);
        setMapLoading(false);
      }
    }
  }, [property]);

  // Geocode address when property is loaded
  useEffect(() => {
    if (property?.address) {
      const timer = setTimeout(() => {
        geocodeAddress(property.address, property.zone, property.id);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setMapCoordinates(null);
      setMapLoading(false);
    }
  }, [property?.address, property?.zone, property?.id, geocodeAddress]);

  // Initialize Google Map when coordinates are available
  useEffect(() => {
    // Clear previous map instance when coordinates change
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    
    if (!mapCoordinates || !mapRef.current) return;

    const initMap = async () => {
      try {
        // Load Google Maps API (same approach as PropertyMap component)
        const { loadGoogleMaps } = await import('@/utils/loadGoogleMaps');
        await loadGoogleMaps();
        
      // Wait for Google Maps API to load with timeout
      const waitForGoogle = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max
          const check = () => {
            if (typeof google !== 'undefined' && google.maps) {
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

        await waitForGoogle();
        
          if (!mapRef.current) return;
          
          // Clear any existing map instance
          if (mapInstanceRef.current) {
            mapInstanceRef.current = null;
          }

          const map = new google.maps.Map(mapRef.current, {
            zoom: 15,
            center: { lat: mapCoordinates.lat, lng: mapCoordinates.lng },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          // Add marker
          new google.maps.Marker({
            position: { lat: mapCoordinates.lat, lng: mapCoordinates.lng },
            map: map,
            title: property?.address || 'Posizione'
          });

          mapInstanceRef.current = map;
          setMapLoading(false);
      } catch (error) {
          setMapLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [mapCoordinates, property?.address]);

  const handleShare = async (platform: string) => {
    if (!property) {
      toast.error('Errore: proprietà non disponibile');
      return;
    }
    
    if (shareLoading) return; // Prevent double clicks
    
    setShareLoading(platform);
    
    try {
      const url = getPropertyUrl(property.id, { ...property, id: property.id });
      const text = `${property?.title || 'Proprietà'} - ${formatPrice(property?.price || 0, property?.type || 'rent')}`;
      
      const shareUrls: { [key: string]: string } = {
        whatsapp: `https://wa.me/393508818666?text=${encodeURIComponent(text + ' ' + url)}`,
        messenger: `fb-messenger://share/?link=${encodeURIComponent(url)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        instagram: `https://www.instagram.com/`,
        sms: `sms:?body=${encodeURIComponent(text + ' ' + url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
      };

      if (!shareUrls[platform]) {
        toast.error('Piattaforma di condivisione non supportata');
        setShareLoading(null);
        return;
      }

      // Open share URL FIRST (synchronously, directly from user action)
      if (platform === 'email' || platform === 'sms') {
        window.location.href = shareUrls[platform];
        // Track share and view in background
        shareFunctions.trackShare(property.id, platform).catch(() => {
          // Silently fail - tracking is not critical
        });
        propertyFunctions.trackView(property.id).catch(() => {
          // Silently fail - view tracking is not critical
        });
      } else if (platform === 'instagram') {
        // Instagram doesn't support direct sharing, copy link instead
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copiato! Incollalo nella tua storia Instagram.');
          // Track share in background
          shareFunctions.trackShare(property.id, platform).catch(() => {
            // Silently fail - tracking is not critical
          });
        } catch (clipError) {
          toast.error('Impossibile copiare il link');
          setShareLoading(null);
          return;
        }
      } else {
        // Open popup FIRST (synchronously)
        const shareWindow = window.open(shareUrls[platform], '_blank');
        
        if (!shareWindow) {
          toast.warning('Popup bloccato. Consenti i popup per condividere.');
          setShareLoading(null);
          return;
        }
        
        // Track share in background (don't await before window.open)
        shareFunctions.trackShare(property.id, platform).catch(() => {
          // Silently fail - tracking is not critical
        });
      }
    } catch (error: any) {
      toast.error(`Errore durante la condivisione: ${error?.message || 'Riprova.'}`);
    } finally {
      setShareLoading(null);
    }
  };

  const handleCopyLink = async () => {
    if (!property) {
      toast.error('Errore: proprietà non disponibile');
      return;
    }
    
    if (shareLoading === 'link') return; // Prevent double clicks
    
    setShareLoading('link');
    
    try {
      // Track share (notification will be created automatically by database trigger)
      try {
        await shareFunctions.trackShare(property.id, 'link');
      } catch (trackError) {
        // Don't fail the copy if tracking fails
      }

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(getPropertyUrl(property.id, { ...property, id: property.id }));
        setLinkCopied(true);
        toast.success('Link copiato negli appunti!');
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = getPropertyUrl(property.id, { ...property, id: property.id });
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setLinkCopied(true);
          toast.success('Link copiato negli appunti!');
          setTimeout(() => setLinkCopied(false), 2000);
        } catch (fallbackError) {
          toast.error('Impossibile copiare il link');
        }
        document.body.removeChild(textArea);
      }
    } catch (error: any) {
      toast.error(`Errore durante la copia: ${error?.message || 'Riprova.'}`);
    } finally {
      setShareLoading(null);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    // Track view when contact button is clicked
    if (property?.id) {
      propertyFunctions.trackView(property.id).catch(() => {
        // Silently fail - view tracking is not critical
      });
    }
    e.preventDefault();
    
    if (contactLoading) return; // Prevent double submits
    
    if (!user) {
      toast.warning('Devi essere loggato per inviare un messaggio');
      router.push('/accedi');
      return;
    }

    if (!property) {
      toast.error('Errore: proprietà non disponibile');
      return;
    }

    // Validation
    if (!contactForm.name || !contactForm.name.trim()) {
      toast.error('Inserisci il tuo nome');
      return;
    }

    if (!contactForm.email || !contactForm.email.trim()) {
      toast.error('Inserisci la tua email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      toast.error('Inserisci un indirizzo email valido');
      return;
    }

    if (!contactForm.message || !contactForm.message.trim()) {
      toast.error('Inserisci un messaggio');
      return;
    }

    setContactLoading(true);

    try {
      // Find owner's user_id by email (if they're a registered user)
      let receiverId: string | null = null;
      
      if (property?.owner?.email) {
        try {
          const { data: ownerUser, error: ownerError } = await supabase
            .from('users')
            .select('id')
            .eq('email', property?.owner?.email)
            .single();
          
          if (ownerError && ownerError.code !== 'PGRST116') { // PGRST116 = no rows returned
            // Silently fail - owner lookup is not critical
          } else if (ownerUser) {
            receiverId = ownerUser.id;
          }
        } catch (findError) {
          // Silently fail - owner lookup is not critical
        }
      }

      // If owner is not a registered user, we can't send a message through the system
      if (!receiverId) {
        toast.warning('Il proprietario non è registrato. Contattalo direttamente via email o WhatsApp.');
        setShowContactModal(false);
        setContactLoading(false);
        return;
      }

      // Send message
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          property_id: property?.id,
          subject: `Richiesta informazioni: ${property?.title || 'Proprietà'}`,
          message: `Messaggio da ${contactForm.name.trim()} (${contactForm.email.trim()}${contactForm.phone ? ', ' + contactForm.phone.trim() : ''}):\n\n${contactForm.message.trim()}`,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Errore durante l\'invio del messaggio');
      }

      if (!messageData || !messageData.id) {
        throw new Error('Messaggio non salvato correttamente');
      }

      // Create notification for receiver
      if (messageData && receiverId) {
        try {
          const { notificationFunctions } = await import('@/lib/supabaseFunctions');
          await notificationFunctions.create({
            user_id: receiverId,
            type: 'new_message',
            title: 'Nuovo Messaggio',
            message: `Hai ricevuto un nuovo messaggio riguardo "${property?.title || 'una proprietà'}"`,
            link: `/messaggi`,
            is_read: false
          });
        } catch (notificationError) {
          // Don't fail if notification creation fails
        }
      }

      toast.success('Messaggio inviato con successo!');
      setShowContactModal(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error: any) {
      toast.error(`Errore durante l'invio del messaggio: ${error?.message || 'Riprova.'}`);
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-4 py-4 sm:py-6 lg:py-8 pt-12 sm:pt-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
          </div>
        ) : !property ? (
          <div className="text-center py-12">
            <i className="ri-error-warning-line text-6xl text-red-300 mb-4"></i>
            <p className="text-red-600 mb-2">Immobile non trovato</p>
            <button
              onClick={() => router.push('/properties')}
              className="mt-4 px-4 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors"
            >
              Torna agli immobili
            </button>
          </div>
        ) : (
          <>
            {/* Structured Data Schema for Google Search Results */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "RealEstateListing",
                  "name": property.title,
                  "description": property.description || `${property.title} in ${property.zone}, Roma`,
                  "url": `https://mauluna.it/annuncio/${property.id}`,
                  "image": property.images || [],
                  "offers": {
                    "@type": "Offer",
                    "price": property.price,
                    "priceCurrency": "EUR",
                    "availability": "https://schema.org/InStock",
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": property.price,
                      "priceCurrency": "EUR",
                      "unitText": property.type === 'rent' ? 'MONTH' : 'TOTAL'
                    }
                  },
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Roma",
                    "addressRegion": "Lazio",
                    "addressCountry": "IT",
                    "streetAddress": property.address || property.zone
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": property.latitude || 41.9028,
                    "longitude": property.longitude || 12.4964
                  },
                  "numberOfRooms": property.rooms || 1,
                  "numberOfBathroomsTotal": property.bathrooms || 1,
                  "floorSize": {
                    "@type": "QuantitativeValue",
                    "value": property.sqm || 0,
                    "unitCode": "MTK"
                  },
                  "datePosted": property.created_at,
                  "dateModified": property.updated_at
                })
              }}
            />

        {/* Breadcrumbs for SEO */}
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Immobili', href: '/properties' },
            { label: property.zone || 'Roma', href: `/properties?zone=${encodeURIComponent(property.zone || 'Roma')}` },
            { label: property.title, href: '#' }
          ]}
        />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-3 sm:mb-6 flex items-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i>
          <span>Torna ai risultati</span>
        </button>

            {/* Status Badge for Pending/Rejected Properties */}
            {property?.status === 'pending' && isOwner && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="ri-time-line text-yellow-600 text-xl"></i>
                  <div>
                    <p className="font-semibold text-yellow-800">Proprietà in attesa di approvazione</p>
                    <p className="text-sm text-yellow-700">La tua proprietà è in revisione. Riceverai una notifica quando sarà approvata.</p>
                  </div>
                </div>
              </div>
            )}

            {property?.status === 'rejected' && isOwner && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="ri-close-circle-line text-red-600 text-xl"></i>
                  <div>
                    <p className="font-semibold text-red-800">Proprietà rifiutata</p>
                    <p className="text-sm text-red-700">La tua proprietà è stata rifiutata. Contatta l'amministratore per maggiori informazioni.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hero Header Section - Reduced size for desktop - Hides on scroll down */}
            <div className={`bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-xl shadow-lg p-4 sm:p-5 lg:p-4 mb-4 lg:mb-5 text-white transition-transform duration-300 ${
              isBannerVisible ? 'translate-y-0' : '-translate-y-full opacity-0'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-md ${
                      property?.type === 'buy' || property?.type === 'sale'
                        ? 'bg-white/20 text-white backdrop-blur-sm' 
                        : 'bg-white/20 text-white backdrop-blur-sm'
                    }`}>
                      {property?.type === 'buy' || property?.type === 'sale' ? 'Vendita' : 'Affitto'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      {property?.subSubCategory || property?.subCategory || property?.category || ''}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 leading-tight">{property?.title || 'Proprietà'}</h1>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">
                    {formatPrice(property?.price || 0, property?.type || 'rent')}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-white/90 text-xs sm:text-sm">
                    {property?.zone && (
                      <div className="flex items-center">
                        <i className="ri-map-pin-fill mr-1.5 text-xs"></i>
                        <span className="truncate">{property.zone}</span>
                      </div>
                    )}
                    {property?.address && (
                      <div className="flex items-center min-w-0">
                        <i className="ri-road-map-line mr-1.5 flex-shrink-0 text-xs"></i>
                        <span className="truncate text-xs sm:text-sm">{property.address}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <i className="ri-eye-line mr-1.5 text-xs"></i>
                      <span className="text-xs sm:text-sm">{(property?.views || 0).toLocaleString()} visualizzazioni</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap"
                  >
                    <i className="ri-share-line text-sm text-white"></i>
                    <span className="text-white">Condividi</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!property?.id || isProcessing(property.id)) return;
                      
                      // Store the current state BEFORE toggling
                      const wasFavorite = isFavorite(property.id);
                      
                      try {
                        await toggleFavorite(property.id);
                        // Use the stored state to show correct message
                        if (wasFavorite) {
                          toast.success('Rimosso dai preferiti');
                        } else {
                          toast.success('Aggiunto ai preferiti');
                        }
                      } catch (error: any) {
                        toast.error(`Errore: ${error?.message || 'Riprova.'}`);
                      }
                    }}
                    disabled={isProcessing(property.id) || !property?.id}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing(property.id) ? (
                      <i className="ri-loader-4-line text-white text-sm animate-spin"></i>
                    ) : (
                      <i className={`${property?.id && isFavorite(property.id) ? 'ri-heart-fill text-red-300' : 'ri-heart-line text-white'} text-sm`}></i>
                    )}
                    <span className="text-white">Salva</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Always allow reporting - only disable if user is the actual owner
                      // Admin properties (user_id = null or admin ID) can be reported by anyone
                      setShowScamReportModal(true);
                    }}
                    className={`px-3 py-2 backdrop-blur-sm rounded-lg transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap ${
                      isOwner 
                        ? 'bg-white/10 text-white/50 cursor-not-allowed opacity-50' 
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                    disabled={isOwner}
                    title={isOwner ? 'Non puoi segnalare la tua proprietà' : 'Segnala Abuso'}
                  >
                    <i className={`ri-flag-line text-sm ${isOwner ? 'text-white/50' : 'text-white'}`}></i>
                    <span className={isOwner ? 'text-white/50' : 'text-white'}>Segnala</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Dettagli Immobile */}
              <div className="lg:col-span-3 order-3 lg:order-1 hidden lg:block">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#D97860] to-[#C9A876] px-5 py-4">
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <i className="ri-information-line mr-2 text-xl"></i>
                        Dettagli Immobile
                      </h2>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-home-4-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Superficie</p>
                          <p className="text-lg font-bold text-gray-900">{property?.sqm || 0} m²</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-door-open-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Locali</p>
                          <p className="text-lg font-bold text-gray-900">{property?.rooms || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-drop-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bagni</p>
                          <p className="text-lg font-bold text-gray-900">{property?.bathrooms || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-building-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Piano</p>
                          <p className="text-lg font-bold text-gray-900">{property?.floor || '-'}</p>
                        </div>
                      </div>
                      
                      {property?.energyClass && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                          <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                            <i className="ri-leaf-line text-[#C9A876] text-xl"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Classe Energetica</p>
                            <p className="text-lg font-bold text-gray-900">{property.energyClass}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              {/* Middle Column - Image Gallery + Description + Caratteristiche + Location Map */}
              <div className="lg:col-span-6 lg:order-2 space-y-6">
                {/* Image Gallery */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  {/* Main Image - Clickable */}
                  <div 
                    className="relative h-[400px] sm:h-[500px] lg:h-[400px] bg-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => {
                      if (property?.images && property.images.length > 0) {
                        setCurrentImageIndex(0); // Reset to first image
                        setImageLoading(true);
                        setImageError(false);
                        setShowImageModal(true);
                      }
                    }}
                  >
                    {imageLoading && !imageError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
                      </div>
                    )}
                    {!imageError && property?.images && property.images.length > 0 && currentImageIndex < property.images.length ? (
                    <img
                        key={`${property?.id}-${currentImageIndex}-${property?.images?.[currentImageIndex]}`}
                        src={property?.images?.[currentImageIndex]}
                      alt={property?.title || 'Proprietà'}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => {
                        setImageLoading(false);
                        setImageError(false);
                      }}
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                      onLoadStart={() => {
                        setImageLoading(true);
                      }}
                      ref={(img) => {
                        // Check if image is already loaded (cached images)
                        if (img && img.complete && img.naturalWidth > 0) {
                          setImageLoading(false);
                          setImageError(false);
                        }
                      }}
                    />
                    ) : null}
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                    <div className="text-center">
                      <i className="ri-image-line text-4xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500">Immagine non disponibile</p>
                    </div>
                  </div>
                )}
                
                    {/* Gradient Overlay - only show if image is loaded */}
                    {!imageError && !imageLoading && property?.images && property.images.length > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-0"></div>
                    )}

                    {/* Image Navigation - Modern Style - Visible on mobile, hover on desktop */}
                    {property?.images && property.images.length > 1 && !imageError && (
                      <>
                        <div className="absolute inset-0 group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => prev === 0 ? (property?.images?.length || 1) - 1 : prev - 1);
                            setImageLoading(true);
                            setImageError(false);
                          }}
                            className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-md hover:bg-white hover:scale-110 active:scale-95 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer z-30"
                        >
                            <i className="ri-arrow-left-s-line text-gray-800 text-xl sm:text-2xl"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => prev === ((property?.images?.length || 1) - 1) ? 0 : prev + 1);
                            setImageLoading(true);
                            setImageError(false);
                          }}
                            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-md hover:bg-white hover:scale-110 active:scale-95 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer z-30"
                        >
                            <i className="ri-arrow-right-s-line text-gray-800 text-xl sm:text-2xl"></i>
                        </button>
                        </div>
                        
                        {/* Image Counter - Bottom Right */}
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm z-30">
                          {currentImageIndex + 1}/{property?.images?.length || 0}
                        </div>
                        
                        {/* Image Dots - Bottom Center */}
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-30">
                          {property?.images?.map((_: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => {
                                setCurrentImageIndex(index);
                                setImageLoading(true);
                                setImageError(false);
                              }}
                              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                                index === currentImageIndex 
                                  ? 'bg-white w-6' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
              </div>

                  {/* Thumbnail Gallery */}
                  {property?.images && property.images.length > 0 && (
                    <div className="p-3 sm:p-4 border-t border-gray-200">
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 overflow-x-auto">
                        {property?.images?.map((image: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setImageLoading(true);
                            setImageError(false);
                          }}
                          className={`aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                            currentImageIndex === index 
                              ? 'ring-2 ring-[#D97860] opacity-100' 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${property?.title || 'Proprietà'} - ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDE1MFYyMDBIMjAwVjE1MFoiIGZpbGw9IiNEMTcyRTYiLz4KPHBhdGggZD0iTTMwMCAyMDBIMjUwVjI1MEgzMDBWMjAwWiIgZmlsbD0iI0M5QTg3NiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzUiIHI9IjMwIiBmaWxsPSIjRkEzRjJGIi8+CjxwYXRoIGQ9Ik0yMzAgMTgwSDI3ME0yNTAgMTYwVjIwMCIgc3Ryb2tlPSIjNUM0QjQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=';
                            }}
                          />
                        </button>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description - Under Image */}
                {property?.description && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D97860] to-[#C9A876] flex items-center justify-center flex-shrink-0">
                        <i className="ri-file-text-line text-white text-xl"></i>
                </div>
                      <h2 className="text-xl font-bold text-gray-900">Descrizione</h2>
                    </div>
                    <div className="prose prose-sm sm:prose-base max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {property.description}
                </p>
              </div>
                  </div>
                )}

                {/* Dettagli Immobile - Mobile Only */}
                <div className="lg:hidden">
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#D97860] to-[#C9A876] px-5 py-4">
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <i className="ri-information-line mr-2 text-xl"></i>
                        Dettagli Immobile
                      </h2>
              </div>

                    {/* Details Grid */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-home-4-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Superficie</p>
                          <p className="text-lg font-bold text-gray-900">{property?.sqm || 0} m²</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-door-open-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Locali</p>
                          <p className="text-lg font-bold text-gray-900">{property?.rooms || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-drop-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bagni</p>
                          <p className="text-lg font-bold text-gray-900">{property?.bathrooms || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                        <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                          <i className="ri-building-line text-[#C9A876] text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Piano</p>
                          <p className="text-lg font-bold text-gray-900">{property?.floor || '-'}</p>
                        </div>
                      </div>

                      {property?.energyClass && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] transition-colors">
                          <div className="w-12 h-12 rounded-full bg-[#C9A876]/10 flex items-center justify-center flex-shrink-0">
                            <i className="ri-leaf-line text-[#C9A876] text-xl"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Classe Energetica</p>
                            <p className="text-lg font-bold text-gray-900">{property.energyClass}</p>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>

                {/* Caratteristiche Immobile */}
                {property?.features && property.features.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A876] to-[#D97860] flex items-center justify-center flex-shrink-0">
                        <i className="ri-star-line text-white text-xl"></i>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Caratteristiche</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {property?.features?.map((feature: string, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#C9A876] hover:bg-[#C9A876]/5 transition-all"
                        >
                          <i className="ri-checkbox-circle-fill text-[#C9A876] text-base flex-shrink-0"></i>
                          <span className="text-sm text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Location Map - Enhanced OpenStreetMap */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0D9488] flex items-center justify-center flex-shrink-0">
                      <i className="ri-map-pin-line text-white text-xl"></i>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Posizione</h2>
                  </div>
                  {property?.address && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-2">
                        <i className="ri-road-map-line text-[#14B8A6] mt-0.5"></i>
              <div>
                          <p className="text-sm font-medium text-gray-900">{property.address}</p>
                          {property?.zone && (
                            <p className="text-xs text-gray-600 mt-0.5">{property.zone}, Roma</p>
                          )}
              </div>
            </div>
              </div>
                  )}
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-inner border-2 border-gray-300 relative">
                    {mapLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <div className="text-center">
                          <i className="ri-loader-4-line text-4xl text-[#14B8A6] animate-spin mb-2"></i>
                          <p className="text-sm text-gray-600">Caricamento mappa...</p>
                        </div>
                      </div>
                    ) : mapCoordinates ? (
                      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }}></div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <i className="ri-map-pin-line text-4xl text-gray-400 mb-2"></i>
                          <p className="text-sm text-gray-500">Mappa non disponibile</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {(property?.address || property?.zone) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          property?.address 
                            ? `${property.address}, ${property.zone || ''}, Roma, Italia`.replace(/,\s*,/g, ',').replace(/^,\s*|\s*,$/g, '')
                            : property?.zone 
                              ? `${property.zone}, Roma, Italia`
                              : 'Roma, Italia'
                        )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                      >
                        <i className="ri-map-pin-line"></i>
                        <span>Apri in Google Maps</span>
                        </a>
                      )}
              </div>
            </div>
          </div>

              {/* Right Column - Contact Card */}
              <div className="lg:col-span-3 lg:order-3">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#D97860] to-[#C9A876] p-6 text-white text-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                        <i className="ri-user-line text-3xl text-white"></i>
                  </div>
                      <h3 className="text-xl font-bold mb-1" title={property?.owner?.name || 'Proprietario'}>
                        {property?.owner?.name || 'Proprietario'}
                      </h3>
                      <p className="text-white/90 text-sm">Proprietario</p>
                </div>

                    {/* Contact Actions */}
                    <div className="p-5 space-y-3">
                      {property?.owner?.whatsapp && String(property.owner.whatsapp).trim() !== '' && (
                        <a
                          href={`https://wa.me/${String(property.owner.whatsapp).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-md"
                        >
                          <i className="ri-whatsapp-line text-xl"></i>
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {property?.owner?.phone && property.owner.phone.trim() !== '' && (
                        <a
                          href={`tel:${property.owner.phone}`}
                          className="w-full px-4 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-md"
                        >
                          <i className="ri-phone-line text-xl"></i>
                          <span>Chiama Ora</span>
                        </a>
                      )}
                      {property?.owner?.email && property.owner.email.trim() !== '' && (
                        <a
                          href={`mailto:${property.owner.email}`}
                          className="w-full px-4 py-3 bg-[#C9A876] text-white rounded-lg hover:bg-[#B89968] transition-colors font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-md"
                        >
                          <i className="ri-mail-line text-xl"></i>
                          <span>Email</span>
                        </a>
                      )}

                      {/* Messaggio Button */}
                    {!isOwner && (
                      <button
                        onClick={() => setShowContactModal(true)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-[#D97860] to-[#C9A876] text-white rounded-lg hover:from-[#C86B54] hover:to-[#B89968] transition-all font-semibold cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2"
                      >
                          <i className="ri-message-3-line text-xl"></i>
                          <span>Messaggio</span>
                      </button>
                    )}
                    {isOwner && (
                        <div className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-center font-medium text-sm border border-gray-200">
                        Questa è la tua proprietà
                      </div>
                    )}
              </div>

                    {/* Free Platform Badge */}
                    <div className="bg-gray-50 px-5 py-4 border-t border-gray-200">
                      <div className="flex items-center justify-center text-gray-700 text-sm">
                        <i className="ri-shield-check-line mr-2 text-[#14B8A6] text-lg"></i>
                        <span className="font-semibold">Contatto Diretto • 0% Commissioni</span>
                      </div>
                    </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>

      <Footer />

      {/* Image Lightbox Modal - Modern Design */}
      {showImageModal && property?.images && property.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
            >
              <i className="ri-close-line text-2xl sm:text-3xl"></i>
            </button>

            {/* Main Image */}
            <img
              src={property.images[currentImageIndex]}
              alt={`${property?.title || 'Proprietà'} - ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDE1MFYyMDBIMjAwVjE1MFoiIGZpbGw9IiNEMTcyRTYiLz4KPHBhdGggZD0iTTMwMCAyMDBIMjUwVjI1MEgzMDBWMjAwWiIgZmlsbD0iI0M5QTg3NiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzUiIHI9IjMwIiBmaWxsPSIjRkEzRjJGIi8+CjxwYXRoIGQ9Ik0yMzAgMTgwSDI3ME0yNTAgMTYwVjIwMCIgc3Ryb2tlPSIjNUM0QjQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=';
              }}
            />

            {/* Navigation Buttons - Modern Style */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => prev === 0 ? property.images.length - 1 : prev - 1);
                  }}
                  className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line text-3xl sm:text-4xl"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => prev === property.images.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line text-3xl sm:text-4xl"></i>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-sm sm:text-base font-medium backdrop-blur-md shadow-xl">
                  {currentImageIndex + 1} / {property.images.length}
                </div>

                {/* Thumbnail Gallery - Bottom */}
                <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 max-w-full overflow-x-auto px-4 pb-2 scrollbar-hide">
                  {property.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 ${
                        currentImageIndex === index 
                          ? 'ring-2 ring-white opacity-100 scale-110' 
                          : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDE1MFYyMDBIMjAwVjE1MFoiIGZpbGw9IiNEMTcyRTYiLz4KPHBhdGggZD0iTTMwMCAyMDBIMjUwVjI1MEgzMDBWMjAwWiIgZmlsbD0iI0M5QTg3NiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzUiIHI9IjMwIiBmaWxsPSIjRkEzRjJGIi8+CjxwYXRoIGQ9Ik0yMzAgMTgwSDI3ME0yNTAgMTYwVjIwMCIgc3Ryb2tlPSIjNUM0QjQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Property Info Overlay */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg shadow-xl">
              <p className="text-sm sm:text-base font-semibold">{property?.title || 'Proprietà'}</p>
              <p className="text-xs sm:text-sm opacity-90">{property?.zone || 'Roma'}, Roma</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal - Modern Design */}
      {showShareModal && property && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform animate-slideUp" onClick={(e) => e.stopPropagation()}>
            {/* Modern Header with Gradient */}
            <div className="relative p-6 bg-gradient-to-br from-[#C47B5B] to-[#D97860] rounded-t-2xl">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
              >
                <i className="ri-close-line text-xl text-white"></i>
              </button>
              
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-share-line text-3xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-1">Condividi</h3>
                <p className="text-sm text-white/90">Trova il perfetto coinquilino</p>
              </div>
            </div>

            {/* Enhanced Property Preview Card */}
            <div className="p-6 border-b border-gray-100">
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={property.images && property.images.length > 0 ? property.images[0] : ''}
                      alt={property.title}
                      className="w-24 h-20 object-cover rounded-lg shadow-md"
                    />
                    {/* Property Type Badge */}
                    <div className="absolute -top-2 -right-2 bg-[#C47B5B] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                      {property.type === 'rent' ? 'Affitto' : 'Vendita'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                      {property.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <i className="ri-map-pin-line text-[#D97860]"></i>
                      <span>{property.zone}, Roma</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-[#D97860]">
                        {formatPrice(property.price, property.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Share Options with Better Design */}
            <div className="p-6">
              <p className="text-sm font-medium text-gray-700 mb-4 text-center">
                Scegli come condividere
              </p>
              
              <div className="grid grid-cols-4 gap-3 mb-5">
                <button
                  onClick={() => handleShare('whatsapp')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#20BA5A] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'whatsapp' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-whatsapp-line text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShare('messenger')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0084FF] to-[#0066CC] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'messenger' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-messenger-line text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">Messenger</span>
                </button>

                <button
                  onClick={() => handleShare('instagram')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#E1306C] via-[#C13584] to-[#833AB4] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'instagram' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-instagram-line text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">Instagram</span>
                </button>

                <button
                  onClick={() => handleShare('sms')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'sms' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-message-3-line text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">SMS</span>
                </button>

                <button
                  onClick={() => handleShare('facebook')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1877F2] to-[#0C5FCD] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'facebook' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-facebook-fill text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">Facebook</span>
                </button>

                <button
                  onClick={() => handleShare('email')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#EA4335] to-[#C5221F] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'email' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-mail-line text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">Email</span>
                </button>

                <button
                  onClick={() => handleShare('telegram')}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0088CC] to-[#006699] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                    {shareLoading === 'telegram' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className="ri-telegram-line text-2xl text-white"></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">Telegram</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  disabled={shareLoading !== null}
                  className="group flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all ${
                    linkCopied 
                      ? 'bg-gradient-to-br from-green-500 to-green-600' 
                      : 'bg-gradient-to-br from-gray-700 to-gray-900'
                  }`}>
                    {shareLoading === 'link' ? (
                      <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                    ) : (
                      <i className={`${linkCopied ? 'ri-check-line' : 'ri-link'} text-2xl text-white`}></i>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {linkCopied ? 'Copiato!' : 'Copia'}
                  </span>
                </button>
              </div>

              {/* Or Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs font-medium text-gray-500">
                    oppure
                  </span>
                </div>
              </div>

              {/* Copy Link Button - More Prominent */}
              <button
                onClick={handleCopyLink}
                disabled={shareLoading !== null}
                className={`w-full p-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  linkCopied
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-[#C47B5B] to-[#D97860] hover:from-[#B36A4A] hover:to-[#C86B54] text-white'
                }`}
              >
                {linkCopied ? (
                  <>
                    <i className="ri-check-double-line text-xl"></i>
                    <span>Link Copiato!</span>
                  </>
                ) : (
                  <>
                    <i className="ri-link text-xl"></i>
                    <span>Copia Link Proprietà</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && property && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#3D2817]">Contatta il Proprietario</h3>
              <button onClick={() => setShowContactModal(false)} className="text-[#5C4B42] hover:text-[#3D2817] cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="mb-4 p-3 bg-[#F9F6F3] rounded-lg">
              <p className="font-semibold text-[#3D2817]">{property?.title || 'Proprietà'}</p>
              <p className="text-sm text-[#5C4B42]">{formatPrice(property?.price || 0, property?.type || 'rent')}</p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-1">Nome</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-1">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-1">Telefono (opzionale)</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Optional validation - only if provided
                    setContactForm({...contactForm, phone: value});
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-1">Messaggio</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="w-full px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C9A876] transition-colors font-medium cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {contactLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    Invia Messaggio
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scam Report Modal */}
      {showScamReportModal && property && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowScamReportModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#3D2817]">Segnala Annuncio Abusivo</h3>
              <button onClick={() => setShowScamReportModal(false)} className="text-[#5C4B42] hover:text-[#3D2817] cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="mb-4 p-3 bg-[#F9F6F3] rounded-lg">
              <p className="font-semibold text-[#3D2817] text-sm">{property?.title || 'Proprietà'}</p>
              <p className="text-xs text-[#5C4B42]">{formatPrice(property?.price || 0, property?.type || 'rent')}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="ri-error-warning-line text-red-500 mr-2 mt-0.5"></i>
                  <div className="text-sm text-red-700">
                    <p className="font-medium mb-1">Segnala solo annunci sospetti</p>
                    <p>Le segnalazioni false possono comportare la sospensione dell'account.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">Motivo della segnalazione *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20"
                >
                  <option value="">Seleziona un motivo</option>
                  <option value="fake_listing">Annuncio falso</option>
                  <option value="wrong_info">Informazioni errate</option>
                  <option value="suspicious_contact">Contatto sospetto</option>
                  <option value="duplicate">Annuncio duplicato</option>
                  <option value="scam_attempt">Tentativo di truffa</option>
                  <option value="other">Altro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">Descrizione (opzionale)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20"
                  placeholder="Fornisci maggiori dettagli sulla segnalazione..."
                />
              </div>

              <button
                onClick={async () => {
                  if (reportLoading) return;
                  
                  if (!reportReason || !reportReason.trim()) {
                    toast.error('Seleziona un motivo per la segnalazione');
                    return;
                  }

                  if (!property) {
                    toast.error('Errore: proprietà non disponibile');
                    return;
                  }

                  setReportLoading(true);

                  try {
                    const reportText = `SEGNALAZIONE ABUSIVA\n\nAnnuncio: ${property?.title || 'Proprietà'}\nID: ${property?.id || ''}\nMotivo: ${reportReason}\nDescrizione: ${reportDescription || 'Nessuna descrizione aggiuntiva'}`;
                    
                    // Try to open email and WhatsApp
                    try {
                      window.open(`mailto:info@mauluna.it?subject=Segnalazione Abusiva - Annuncio ${property?.id || ''}&body=${encodeURIComponent(reportText)}`);
                    } catch (emailError) {
                      // Silently fail - email opening is not critical
                    }

                    try {
                      const whatsappWindow = window.open(`https://wa.me/393508818666?text=${encodeURIComponent(reportText)}`, '_blank');
                      if (!whatsappWindow) {
                        toast.warning('Popup bloccato. Consenti i popup per aprire WhatsApp.');
                      }
                      
                      // Track WhatsApp click
                      try {
                        const { whatsappLeadsFunctions } = await import('@/lib/supabaseFunctions');
                        await whatsappLeadsFunctions.trackClick({
                          context: 'property_detail_scam_report',
                          messagePreview: reportText,
                        });
                      } catch (err) {
                        // Silent fail
                      }
                    } catch (whatsappError) {
                      // Silently fail - WhatsApp opening is not critical
                    }

                    toast.success('Segnalazione inviata');
                    setShowScamReportModal(false);
                    setReportReason('');
                    setReportDescription('');
                  } catch (error: any) {
                    toast.error(`Errore durante l'invio della segnalazione: ${error?.message || 'Riprova.'}`);
                  } finally {
                    setReportLoading(false);
                  }
                }}
                disabled={!reportReason || reportLoading}
                className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {reportLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    Invia Segnalazione
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
