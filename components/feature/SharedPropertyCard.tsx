'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import LoginModal from '@/components/feature/LoginModal';
import type { TransformedProperty } from '@/utils/propertyTransform';
import { supabase } from '@/lib/supabaseClient';
import { propertyFunctions } from '@/lib/supabaseFunctions';
import { getPropertyUrl, getPropertyPath } from '@/config/domain';
import { getPlaceholderImage } from '@/utils/placeholderImages';

interface SharedPropertyCardProps {
  property: TransformedProperty;
  inlineModals?: boolean; // When true, shows inline views instead of modals (for map popup)
}

// Base64 placeholder image as ultimate fallback
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDE1MFYyMDBIMjAwVjE1MFoiIGZpbGw9IiNEMTcyRTYiLz4KPHBhdGggZD0iTTMwMCAyMDBIMjUwVjI1MEgzMDBWMjAwWiIgZmlsbD0iI0M5QTg3NiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzUiIHI9IjMwIiBmaWxsPSIjRkEzRjJGIi8+CjxwYXRoIGQ9Ik0yMzAgMTgwSDI3ME0yNTAgMTYwVjIwMCIgc3Ryb2tlPSIjNUM0QjQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=';

// Enhanced Property Card Component
const SharedPropertyCard = ({ property, inlineModals = false }: SharedPropertyCardProps) => {
  const toast = useToast();
  const { user } = useAuth();
  const { isFavorite: checkIsFavorite, toggleFavorite, isProcessing } = useFavorites();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showScamReportModal, setShowScamReportModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentView, setCurrentView] = useState<'property' | 'contact' | 'share' | 'report' | 'login'>('property');
  const [linkCopied, setLinkCopied] = useState(false);
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const [shareLoading, setShareLoading] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const isFavorite = checkIsFavorite(property.id);
  const favoriteProcessing = isProcessing(property.id);

  // Reset currentView when property changes or when inlineModals is disabled
  useEffect(() => {
    if (!inlineModals) {
      setCurrentView('property');
    }
  }, [property.id, inlineModals]);

  // PERFORMANCE: Memoize image processing to avoid recalculation on every render
  const getPropertyImages = useCallback(() => {
    let allImages: string[] = [];
    
    // First, check if property has images array (from transformed properties)
    // Only process if array exists and has items
    if (property?.images && Array.isArray(property.images) && property.images.length > 0) {
      const validImages = property.images
        .filter((img: any) => {
          if (typeof img === 'string') return img && img.trim() !== '';
          if (img && typeof img === 'object' && img.image_url) return img.image_url && img.image_url.trim() !== '';
          return false;
        })
        .map((img: any) => typeof img === 'string' ? img : img.image_url);
      if (validImages.length > 0) {
        allImages.push(...validImages);
      }
    }
    
    // ALWAYS check property.property_images (raw Supabase format) regardless of allImages.length
    // This ensures we get ALL real images even if transformProperty already extracted some
    if (property?.property_images && Array.isArray(property.property_images) && property.property_images.length > 0) {
      try {
        const validImages = property.property_images
          .filter((img: any) => img !== null && img !== undefined)
          .sort((a: any, b: any) => {
            // Safe sorting - handle non-numeric display_order values
            const orderA = typeof a?.display_order === 'number' ? a.display_order : (typeof a?.display_order === 'string' ? parseInt(a.display_order) || 0 : 0);
            const orderB = typeof b?.display_order === 'number' ? b.display_order : (typeof b?.display_order === 'string' ? parseInt(b.display_order) || 0 : 0);
            return orderA - orderB;
          })
          .map((img: any) => {
            if (typeof img === 'string') return img;
            if (img?.image_url) return img.image_url;
            if (img?.url) return img.url;
            return null;
          })
          .filter((url: string | null): url is string => url !== null && url.trim() !== '');
        if (validImages.length > 0) {
          // Use property_images if it has more images, otherwise merge and deduplicate
          if (validImages.length > allImages.length) {
            allImages = validImages; // Replace with all real images from property_images
          } else {
            // Merge and deduplicate
            allImages.push(...validImages);
          }
        }
      } catch (error) {
        // If processing property_images fails, just use what we have from property.images
      }
    }
    
    // Remove duplicates
    allImages = [...new Set(allImages)];
    
    // If we have 2+ real images, return them (arrows will show)
    if (allImages.length >= 2) {
      return allImages;
    }
    
    // If we have 0-1 images, add working placeholder images to ensure arrows always show
    // Use PLACEHOLDER_IMAGE (base64) instead of failing readdy.ai URLs
    const images = [...allImages]; // Start with any real images we have (0 or 1)
    
    // Add working placeholder images to reach at least 5 total images
    // This guarantees arrows will always show (since arrows show when length > 1)
    const neededPlaceholders = 5 - images.length;
    if (neededPlaceholders > 0) {
      // Use the working base64 placeholder instead of failing readdy.ai URLs
      for (let i = 0; i < neededPlaceholders; i++) {
        images.push(PLACEHOLDER_IMAGE);
      }
    }
    
    // Always ensure at least 5 images exist for navigation arrows
    if (images.length === 0) {
      for (let i = 0; i < 5; i++) {
        images.push(PLACEHOLDER_IMAGE);
      }
    }
    
    return images;
  }, [property.id, property.images, property.property_images]);

  // Memoize propertyImages to prevent recalculation on every render
  // This ensures stable array reference and proper image navigation
  // Recalculate when property.id, property.images, or property.property_images change
  // This ensures propertyImages updates when image data changes
  const propertyImages = useMemo(() => {
    const result = getPropertyImages();
    return result;
  }, [
    property.id,
    property?.images,
    property?.property_images
  ]);
  
  // Reset image index when property changes (same as property detail page)
  useEffect(() => {
    if (property?.id) {
      setCurrentImageIndex(0);
      setImageError(new Set());
      setAllImagesFailed(false);
    }
  }, [property?.id]);

  // Track view when property card is displayed (debounced to avoid duplicates)
  useEffect(() => {
    if (!property?.id || property?.status !== 'approved') return;
    
    const trackView = async () => {
      try {
        await propertyFunctions.trackView(property.id);
      } catch (err) {
        // Silently fail - view tracking is not critical
      }
    };
    
    // Debounce view tracking to avoid multiple counts for same property
    const timeoutId = setTimeout(trackView, 500);
    return () => clearTimeout(timeoutId);
  }, [property?.id, property?.status]);

  // Get current image with fallback - use direct access like property detail page
  const imageErrorArray = useMemo(() => Array.from(imageError), [imageError]);
  const getCurrentImageUrl = () => {
    // If all images failed, return placeholder
    if (allImagesFailed || propertyImages.length === 0) {
      return PLACEHOLDER_IMAGE;
    }
    
    // If current image failed and not all failed, try next available
    const imageErrorSet = new Set(imageErrorArray);
    if (imageErrorSet.has(currentImageIndex) && !allImagesFailed) {
      const nextAvailableIndex = propertyImages.findIndex((_, idx) => !imageErrorSet.has(idx));
      if (nextAvailableIndex !== -1) {
        return propertyImages[nextAvailableIndex];
      }
    }
    
    return propertyImages[currentImageIndex] || PLACEHOLDER_IMAGE;
  };

  const handleImageError = useCallback(() => {
    // Mark current image as failed - use functional update to get latest index
    setImageError(prev => {
      const newSet = new Set(prev);
      setCurrentImageIndex(currentIdx => {
        newSet.add(currentIdx);
        
        // Check if all images have failed
        if (newSet.size >= propertyImages.length) {
          setAllImagesFailed(true);
          return currentIdx; // Stay on current index
        }
        
        // Don't auto-advance on error - just mark as failed
        // User can manually navigate if needed
        setAllImagesFailed(false);
        return currentIdx; // Stay on current index
      });
      
      return newSet;
    });
  }, [propertyImages]);

  const handleImageLoad = useCallback(() => {
    // Clear error for current image on successful load - use functional update to avoid stale closure
    setImageError(prev => {
      const newSet = new Set(prev);
      setCurrentImageIndex(currentIdx => {
        newSet.delete(currentIdx);
        if (newSet.size === 0) {
          setAllImagesFailed(false);
        }
        return currentIdx; // Return same index
      });
      return newSet;
    });
  }, []);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? (propertyImages.length || 1) - 1 : prev - 1);
  }, [propertyImages.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === ((propertyImages.length || 1) - 1) ? 0 : prev + 1);
  }, [propertyImages.length]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      if (inlineModals) {
        setCurrentView('login');
      } else {
        setShowLoginModal(true);
      }
      return;
    }
    
    // Store the current state BEFORE toggling
    const wasFavorite = isFavorite;
    
    try {
      await toggleFavorite(property.id);
      // Use the stored state to show correct message
      if (wasFavorite) {
        toast.success('Rimosso dai preferiti');
      } else {
        toast.success('Aggiunto ai preferiti');
      }
    } catch (error: any) {
      toast.error('Errore durante l\'operazione: ' + (error.message || ''));
    }
  };

  const formatPrice = (price: number, type: string) => {
    if (type === 'buy') {
      return `€${price.toLocaleString()}`;
    } else {
      return `€${price}/mese`;
    }
  };

  // Helper function to format WhatsApp number (remove all non-digits)
  const formatWhatsAppNumber = (whatsapp: string | undefined): string => {
    if (!whatsapp) return '';
    return whatsapp.replace(/[^0-9]/g, '');
  };

  // Helper function to format phone number for display
  const formatPhoneDisplay = (phone: string | undefined): string => {
    if (!phone) return '';
    // If already formatted with +, return as is
    if (phone.includes('+') && phone.includes(' ')) return phone;
    
    const digits = phone.replace(/[^0-9]/g, '');
    
    // Handle Italian phone numbers
    if (digits.startsWith('39')) {
      // Mobile: 39 + 3XX + 6 digits (11 digits total: 39 3XX XXX XXX)
      if (digits.length === 11) {
        return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      }
      // Landline: 39 + 0X + 6-8 digits (10-12 digits total)
      if (digits.length >= 10 && digits.length <= 12) {
        if (digits.length === 10) {
          // 39 0X XXX XXXX
          return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        } else if (digits.length === 11) {
          // 39 0X XXXX XXXX
          return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
        } else {
          // 39 0X XXXX XXXX (12 digits)
          return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
        }
      }
      // If starts with 39 but has 9 digits, format as mobile
      if (digits.length === 9) {
        // 39 234 234 3 - format the remaining 7 digits
        return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
      }
    } else if (digits.length >= 9 && digits.length <= 11) {
      // Number without country code - assume Italian and add +39
      if (digits.startsWith('3') && digits.length === 10) {
        // Mobile number: 3XX XXX XXXX
        return `+39 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      } else if (digits.startsWith('0') && digits.length >= 9) {
        // Landline: 0X XXX XXXX
        if (digits.length === 9) {
          return `+39 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        } else {
          return `+39 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        }
      } else if (digits.length === 9) {
        // 9 digits starting with 3 - format as mobile
        if (digits.startsWith('3')) {
          return `+39 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        } else {
          // Other 9-digit numbers
          return `+39 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        }
      } else if (digits.length === 10 && !digits.startsWith('0')) {
        // 10 digits not starting with 0 - likely mobile
        return `+39 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      }
    }
    
    // If number is too short or doesn't match patterns, try to add +39 prefix
    if (digits.length >= 7 && digits.length <= 9) {
      return `+39 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    
    // Return as-is if can't format
    return phone;
  };

  // Contact Modal Component
  const ContactModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [message, setMessage] = useState('');
    const [messageSent, setMessageSent] = useState(false);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setShowContactModal(false);
          setShowMessageForm(false);
          setMessageSent(false);
        }
      };

      if (showContactModal) {
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }, [showContactModal]);

    const handleSendMessage = async () => {
      if (messageLoading) return;
      
      if (!user) {
        setShowContactModal(false);
        setShowMessageForm(false);
        setShowLoginModal(true);
        return;
      }

      if (!message.trim()) {
        toast.error('Inserisci un messaggio');
        return;
      }

      setMessageLoading(true);

      try {
        // Get receiver_id - first try property.user_id, then find by owner email
        let receiverId: string | null = null;
        
        // First, check if property has a user_id (the owner who created it)
        if (property?.user_id) {
          receiverId = property.user_id;
        } else if (property?.owner?.email) {
          // If no user_id, try to find user by email using RPC function
          try {
            const { data: foundUserId, error: findError } = await supabase
              .rpc('find_user_by_email', { email_param: property.owner.email });
            
            if (findError) {
              // Silent fail - user lookup
            }
            
            if (!findError && foundUserId) {
              receiverId = foundUserId;
            }
          } catch (rpcError: any) {
            // Silent fail
          }
        }

        // If owner is not a registered user, show warning
        if (!receiverId) {
          toast.warning('Il proprietario non è registrato. Contattalo direttamente via email o WhatsApp.');
          setShowContactModal(false);
          setShowMessageForm(false);
          setMessage('');
          return;
        }

        // Validate receiver_id is a valid UUID
        if (!receiverId || receiverId === '' || receiverId === 'null') {
          throw new Error('ID destinatario non valido');
        }

        // Send message to Supabase
        const { data: messageData, error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            property_id: property.id,
            subject: `Richiesta informazioni: ${property.title}`,
            message: message.trim(),
          })
          .select()
          .single();

        // Check for errors and validate messageData exists
        if (error) {
          throw error;
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
              message: `Hai ricevuto un nuovo messaggio riguardo "${property.title}"`,
              link: `/messages`,
              is_read: false
            });
          } catch (notificationError) {
            // Silent fail - notification not critical
          }
        }

        // Only show success if message was actually saved
        toast.success('Messaggio inviato con successo!');
        setMessageSent(true);
        setTimeout(() => {
          setShowContactModal(false);
          setShowMessageForm(false);
          setMessageSent(false);
          setMessage('');
        }, 2000);
      } catch (error: any) {
        toast.error(`Errore durante l'invio del messaggio: ${error.message || 'Riprova.'}`);
        setMessageSent(false);
      } finally {
        setMessageLoading(false);
      }
    };

    if (!showContactModal) return null;

    // Get owner contact info - check if exists and is not empty after trimming
    const ownerWhatsApp = (property.owner?.whatsapp && String(property.owner.whatsapp).trim()) || '';
    const ownerPhone = (property.owner?.phone && String(property.owner.phone).trim()) || '';
    const ownerEmail = (property.owner?.email && String(property.owner.email).trim()) || '';

    // Format WhatsApp number for URL
    const whatsappNumber = formatWhatsAppNumber(ownerWhatsApp);
    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ciao, sono interessato all'immobile: ${property.title}`)}`
      : '';

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Contatta il Proprietario</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setShowMessageForm(false);
                  setMessageSent(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>
            
            <div className="bg-[#F9F6F3] rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] rounded-full text-white font-bold text-lg">
                  {property.owner?.name ? property.owner.name.charAt(0) : 'P'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{property.owner?.name || 'Proprietario'}</h4>
                  <p className="text-sm text-gray-600">Proprietario</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!showMessageForm ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center text-green-700">
                    <i className="ri-shield-check-line mr-2"></i>
                    <span className="text-sm font-medium">Contatto Diretto • 0% Commissioni</span>
                  </div>
                </div>

                {/* WhatsApp - Only show if owner provided WhatsApp */}
                {ownerWhatsApp && whatsappNumber && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-4 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center">
                      <i className="ri-whatsapp-line text-2xl mr-3"></i>
                      <div className="text-left">
                        <div className="font-semibold">WhatsApp</div>
                        <div className="text-sm opacity-90">{formatPhoneDisplay(ownerWhatsApp)}</div>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-xl"></i>
                  </a>
                )}

                {/* Phone - Only show if owner provided phone */}
                {ownerPhone && (
                  <a
                    href={`tel:${ownerPhone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center justify-between w-full p-4 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center">
                      <i className="ri-phone-line text-2xl mr-3"></i>
                      <div className="text-left">
                        <div className="font-semibold">Telefono</div>
                        <div className="text-sm opacity-90">{formatPhoneDisplay(ownerPhone)}</div>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-xl"></i>
                  </a>
                )}

                {/* Email - Only show if owner provided email */}
                {ownerEmail && (
                  <a
                    href={`mailto:${ownerEmail}`}
                    className="flex items-center justify-between w-full p-4 bg-[#C9A876] text-white rounded-lg hover:bg-[#B89766] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center">
                      <i className="ri-mail-line text-2xl mr-3"></i>
                      <div className="text-left">
                        <div className="font-semibold">Email</div>
                        <div className="text-sm opacity-90">{ownerEmail}</div>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-xl"></i>
                  </a>
                )}

                {/* Show message if no contact methods available */}
                {!ownerWhatsApp && !ownerPhone && !ownerEmail && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-800">
                      Informazioni di contatto non disponibili. Utilizza il messaggio.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowMessageForm(true)}
                  className="flex items-center justify-between w-full p-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center">
                    <i className="ri-message-3-line text-2xl mr-3"></i>
                    <div className="text-left">
                      <div className="font-semibold">Messaggio</div>
                      <div className="text-sm text-gray-600">Invia tramite MAULUNA</div>
                    </div>
                  </div>
                  <i className="ri-arrow-right-line text-xl"></i>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {messageSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
                      <i className="ri-check-line text-3xl text-green-600"></i>
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Messaggio Inviato!</h4>
                    <p className="text-gray-600">Il proprietario riceverà il tuo messaggio a breve.</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowMessageForm(false)}
                      className="flex items-center text-gray-600 hover:text-gray-800 cursor-pointer"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>
                      Torna indietro
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Il tuo messaggio
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent resize-none"
                        placeholder="Ciao, sono interessato a questo immobile..."
                      />
                    </div>

                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || messageLoading}
                      className="w-full px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {messageLoading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <i className="ri-send-plane-line"></i>
                          Messaggio
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // After login, try to add to favorites
    if (user) {
      toggleFavorite(property.id);
    }
  };

  // Share handlers - moved to main scope for use in both modal and inline view
  const propertyUrl = getPropertyUrl(property.id, { ...property, id: property.id });
  const shareTitle = `${property.title} - ${formatPrice(property.price, property.type)}`;
  const shareText = `Guarda questo immobile: ${property.title} in ${property.zone}, Roma. ${formatPrice(property.price, property.type)}`;

  const handleCopyLink = async () => {
    if (shareLoading === 'link') return;
    setShareLoading('link');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(propertyUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = propertyUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setLinkCopied(true);
      toast.success('Link copiato negli appunti!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err: any) {
      toast.error('Impossibile copiare il link');
    } finally {
      setShareLoading(null);
    }
  };

  const handleWhatsAppShare = async () => {
    if (shareLoading) return;
    setShareLoading('whatsapp');
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + propertyUrl)}`;
    const shareWindow = window.open(whatsappUrl, '_blank');
    if (!shareWindow) {
      toast.warning('Popup bloccato. Consenti i popup per condividere.');
      setShareLoading(null);
      return;
    }
    try {
      const { shareFunctions } = await import('@/lib/supabaseFunctions');
      shareFunctions.trackShare(property.id, 'whatsapp').catch(() => {});
    } catch (err: any) {
      // Silent fail
    } finally {
      setShareLoading(null);
    }
  };

  const handleFacebookShare = async () => {
    if (shareLoading) return;
    setShareLoading('facebook');
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
    const shareWindow = window.open(facebookUrl, '_blank', 'width=600,height=400');
    if (!shareWindow) {
      toast.warning('Popup bloccato. Consenti i popup per condividere.');
      setShareLoading(null);
      return;
    }
    try {
      const { shareFunctions } = await import('@/lib/supabaseFunctions');
      shareFunctions.trackShare(property.id, 'facebook').catch(() => {});
    } catch (err: any) {
      // Silent fail
    } finally {
      setShareLoading(null);
    }
  };

  const handleMessengerShare = async () => {
    if (shareLoading) return;
    setShareLoading('messenger');
    const messengerUrl = `fb-messenger://share/?link=${encodeURIComponent(propertyUrl)}`;
    const shareWindow = window.open(messengerUrl, '_blank');
    if (!shareWindow) {
      toast.warning('Popup bloccato. Consenti i popup per condividere.');
      setShareLoading(null);
      return;
    }
    try {
      const { shareFunctions } = await import('@/lib/supabaseFunctions');
      shareFunctions.trackShare(property.id, 'messenger').catch(() => {});
    } catch (err: any) {
      // Silent fail
    } finally {
      setShareLoading(null);
    }
  };

  const handleTelegramShare = async () => {
    if (shareLoading) return;
    setShareLoading('telegram');
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`;
    const shareWindow = window.open(telegramUrl, '_blank');
    if (!shareWindow) {
      toast.warning('Popup bloccato. Consenti i popup per condividere.');
      setShareLoading(null);
      return;
    }
    try {
      const { shareFunctions } = await import('@/lib/supabaseFunctions');
      shareFunctions.trackShare(property.id, 'telegram').catch(() => {});
    } catch (err: any) {
      // Silent fail
    } finally {
      setShareLoading(null);
    }
  };

  const handleEmailShare = async () => {
    if (shareLoading) return;
    setShareLoading('email');
    try {
      const emailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + propertyUrl)}`;
      window.location.href = emailUrl;
    } catch (err: any) {
      toast.error(`Errore durante la condivisione: ${err?.message || 'Riprova.'}`);
    } finally {
      setShareLoading(null);
    }
  };

  const handleSMSShare = async () => {
    if (shareLoading) return;
    setShareLoading('sms');
    try {
      const smsUrl = `sms:?body=${encodeURIComponent(shareText + ' ' + propertyUrl)}`;
      window.location.href = smsUrl;
    } catch (err: any) {
      toast.error(`Errore durante la condivisione: ${err?.message || 'Riprova.'}`);
    } finally {
      setShareLoading(null);
    }
  };

  const handleInstagramShare = async () => {
    if (shareLoading) return;
    await handleCopyLink();
    toast.info('Link copiato! Ora puoi incollarlo nella tua storia o messaggio Instagram.');
  };

  // Share Modal Component
  const ShareModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setShowShareModal(false);
          setLinkCopied(false);
        }
      };

      if (showShareModal) {
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }, [showShareModal]);

    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Condividi Immobile</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setLinkCopied(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>
            
            <div className="bg-[#F9F6F3] rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <img
                  src={propertyImages[0]}
                  alt={property.title}
                  className="w-20 h-16 object-cover object-top rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{property.title}</h4>
                  <p className="text-xs text-gray-600">{property.zone}, Roma</p>
                  <p className="text-sm font-bold text-[#D97860] mt-1">{formatPrice(property.price, property.type)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4 text-center">Condividi con i tuoi amici</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={handleWhatsAppShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#25D366] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'whatsapp' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-whatsapp-line text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">WhatsApp</span>
              </button>

              <button
                onClick={handleMessengerShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#0084FF] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'messenger' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-messenger-line text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">Messenger</span>
              </button>

              <button
                onClick={handleInstagramShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#E4405F] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'instagram' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-instagram-line text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">Instagram</span>
              </button>

              <button
                onClick={handleSMSShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#10B981] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'sms' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-message-3-line text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">SMS</span>
              </button>

              <button
                onClick={handleFacebookShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#1877F2] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'facebook' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-facebook-fill text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">Facebook</span>
              </button>

              <button
                onClick={handleEmailShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#EA4335] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'email' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-mail-line text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">Email</span>
              </button>

              <button
                onClick={handleTelegramShare}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#0088cc] rounded-full mb-2 group-hover:scale-110 transition-transform">
                  {shareLoading === 'telegram' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className="ri-telegram-line text-2xl text-white"></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">Telegram</span>
              </button>

              <button
                onClick={handleCopyLink}
                disabled={shareLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-2 group-hover:scale-110 transition-all ${
                  linkCopied ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {shareLoading === 'link' ? (
                    <i className="ri-loader-4-line text-2xl text-white animate-spin"></i>
                  ) : (
                    <i className={`${linkCopied ? 'ri-check-line' : 'ri-file-copy-line'} text-2xl text-white`}></i>
                  )}
                </div>
                <span className="text-xs text-gray-700 font-medium">
                  {linkCopied ? 'Copiato!' : 'Copia Link'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Scam Report Modal Component
  const ScamReportModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportSent, setReportSent] = useState(false);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setShowScamReportModal(false);
          setReportReason('');
          setReportDescription('');
          setReportSent(false);
        }
      };

      if (showScamReportModal) {
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }, [showScamReportModal]);

    const handleSubmitReport = async () => {
      if (reportLoading) return;
      
      if (!reportReason || !reportReason.trim()) {
        toast.error('Seleziona un motivo per la segnalazione');
        return;
      }

      setReportLoading(true);

      try {
        const reportText = `SEGNALAZIONE ABUSIVA\n\nAnnuncio: ${property.title}\nID: ${property.id}\nMotivo: ${reportReason}\nDescrizione: ${reportDescription || 'Nessuna descrizione aggiuntiva'}`;
        
        try {
          window.open(`mailto:info@mauluna-immobiliare.com?subject=Segnalazione Abusiva - Annuncio ${property.id}&body=${encodeURIComponent(reportText)}`);
        } catch (emailError) {
          // Silent fail
        }

        try {
          const whatsappWindow = window.open(`https://wa.me/393401234567?text=${encodeURIComponent(reportText)}`, '_blank');
          if (!whatsappWindow) {
            toast.warning('Popup bloccato. Consenti i popup per aprire WhatsApp.');
          }
        } catch (whatsappError) {
          // Silent fail
        }
        
        toast.success('Segnalazione inviata');
        setReportSent(true);
        setTimeout(() => {
          setReportSent(false);
          setReportReason('');
          setReportDescription('');
          setShowScamReportModal(false);
        }, 2000);
      } catch (error: any) {
        toast.error(`Errore durante l'invio della segnalazione: ${error?.message || 'Riprova.'}`);
      } finally {
        setReportLoading(false);
      }
    };

    if (!showScamReportModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Segnala Annuncio Abusivo</h3>
              <button
                onClick={() => {
                  setShowScamReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  setReportSent(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <i className="ri-error-warning-line text-red-500 mr-2 mt-0.5"></i>
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Segnala solo annunci sospetti</p>
                  <p className="text-xs">Le segnalazioni false possono comportare la sospensione dell'account.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {reportSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-4">
                  <i className="ri-check-line text-3xl text-green-600"></i>
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Segnalazione Inviata!</h4>
                <p className="text-gray-600">Grazie per aiutarci a mantenere la piattaforma sicura.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo della segnalazione *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione (opzionale)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="Fornisci maggiori dettagli sulla segnalazione..."
                  />
                </div>

                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason || reportLoading}
                  className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            )}
          </div>
        </div>
      </div>
    );
  };

  // Inline View Components (for map popup) - Only used when inlineModals is true
  const ContactInlineView = () => {
    if (!inlineModals) return null;
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [message, setMessage] = useState('');
    const [messageSent, setMessageSent] = useState(false);

    const ownerWhatsApp = (property.owner?.whatsapp && String(property.owner.whatsapp).trim()) || '';
    const ownerPhone = (property.owner?.phone && String(property.owner.phone).trim()) || '';
    const ownerEmail = (property.owner?.email && String(property.owner.email).trim()) || '';
    const whatsappNumber = formatWhatsAppNumber(ownerWhatsApp);
    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ciao, sono interessato all'immobile: ${property.title}`)}`
      : '';

    const handleSendMessageInline = async () => {
      if (messageLoading) return;
      
      if (!user) {
        if (inlineModals) {
          setCurrentView('login');
        } else {
          setShowLoginModal(true);
        }
        return;
      }

      if (!message.trim()) {
        toast.error('Inserisci un messaggio');
        return;
      }

      setMessageLoading(true);

      try {
        let receiverId: string | null = null;
        
        if (property?.user_id) {
          receiverId = property.user_id;
        } else if (property?.owner?.email) {
          try {
            const { data: foundUserId, error: findError } = await supabase
              .rpc('find_user_by_email', { email_param: property.owner.email });
            
            if (!findError && foundUserId) {
              receiverId = foundUserId;
            }
          } catch (rpcError: any) {
            // Silent fail
          }
        }

        if (!receiverId) {
          toast.warning('Il proprietario non è registrato. Contattalo direttamente via email o WhatsApp.');
          setMessage('');
          return;
        }

        if (!receiverId || receiverId === '' || receiverId === 'null') {
          throw new Error('ID destinatario non valido');
        }

        const { data: messageData, error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            property_id: property.id,
            subject: `Richiesta informazioni: ${property.title}`,
            message: message.trim(),
          })
          .select()
          .single();

        if (error) throw error;
        if (!messageData || !messageData.id) {
          throw new Error('Messaggio non salvato correttamente');
        }

        if (messageData && receiverId) {
          try {
            const { notificationFunctions } = await import('@/lib/supabaseFunctions');
            await notificationFunctions.create({
              user_id: receiverId,
              type: 'new_message',
              title: 'Nuovo Messaggio',
              message: `Hai ricevuto un nuovo messaggio riguardo "${property.title}"`,
              link: `/messages`,
              is_read: false
            });
          } catch (notificationError) {
            // Silent fail
          }
        }

        toast.success('Messaggio inviato con successo!');
        setMessageSent(true);
        setTimeout(() => {
          setMessageSent(false);
          setMessage('');
          setShowMessageForm(false);
        }, 2000);
      } catch (error: any) {
        toast.error(`Errore durante l'invio del messaggio: ${error.message || 'Riprova.'}`);
      } finally {
        setMessageLoading(false);
      }
    };

    return (
      <div className="space-y-3">
        <div className="bg-[#F9F6F3] rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center bg-[#D97860] rounded-full text-white font-bold text-sm">
              {property.owner?.name ? property.owner.name.charAt(0) : 'P'}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 text-sm">{property.owner?.name || 'Proprietario'}</h4>
              <p className="text-xs text-gray-600">Proprietario</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
          <div className="flex items-center text-green-700 text-xs">
            <i className="ri-shield-check-line mr-2"></i>
            <span className="font-medium">Contatto Diretto • 0% Commissioni</span>
          </div>
        </div>

        {!showMessageForm ? (
          <div className="space-y-2">
            {ownerWhatsApp && whatsappNumber && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full p-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors cursor-pointer text-sm"
              >
                <div className="flex items-center">
                  <i className="ri-whatsapp-line text-xl mr-2"></i>
                  <div className="text-left">
                    <div className="font-semibold text-xs">WhatsApp</div>
                    <div className="text-xs opacity-90">{formatPhoneDisplay(ownerWhatsApp)}</div>
                  </div>
                </div>
                <i className="ri-arrow-right-line"></i>
              </a>
            )}

            {ownerPhone && (
              <a
                href={`tel:${ownerPhone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center justify-between w-full p-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer text-sm"
              >
                <div className="flex items-center">
                  <i className="ri-phone-line text-xl mr-2"></i>
                  <div className="text-left">
                    <div className="font-semibold text-xs">Telefono</div>
                    <div className="text-xs opacity-90">{formatPhoneDisplay(ownerPhone)}</div>
                  </div>
                </div>
                <i className="ri-arrow-right-line"></i>
              </a>
            )}

            {ownerEmail && (
              <a
                href={`mailto:${ownerEmail}`}
                className="flex items-center justify-between w-full p-3 bg-[#C9A876] text-white rounded-lg hover:bg-[#B89766] transition-colors cursor-pointer text-sm"
              >
                <div className="flex items-center">
                  <i className="ri-mail-line text-xl mr-2"></i>
                  <div className="text-left">
                    <div className="font-semibold text-xs">Email</div>
                    <div className="text-xs opacity-90">{ownerEmail}</div>
                  </div>
                </div>
                <i className="ri-arrow-right-line"></i>
              </a>
            )}

            {!ownerWhatsApp && !ownerPhone && !ownerEmail && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-800">
                  Informazioni di contatto non disponibili. Utilizza il messaggio.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowMessageForm(true)}
              className="flex items-center justify-between w-full p-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm"
            >
              <div className="flex items-center">
                <i className="ri-message-3-line text-xl mr-2"></i>
                <div className="text-left">
                  <div className="font-semibold text-xs">Messaggio</div>
                  <div className="text-xs text-gray-600">Invia tramite MAULUNA</div>
                </div>
              </div>
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {messageSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-3">
                  <i className="ri-check-line text-2xl text-green-600"></i>
                </div>
                <h4 className="text-base font-bold text-gray-800 mb-1">Messaggio Inviato!</h4>
                <p className="text-xs text-gray-600">Il proprietario riceverà il tuo messaggio a breve.</p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="flex items-center text-gray-600 hover:text-gray-800 cursor-pointer text-xs"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Torna indietro
                </button>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Il tuo messaggio
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent resize-none text-xs"
                    placeholder="Ciao, sono interessato a questo immobile..."
                  />
                </div>

                <button
                  onClick={handleSendMessageInline}
                  disabled={!message.trim() || messageLoading}
                  className="w-full px-4 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors font-semibold cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {messageLoading ? (
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
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const ShareInlineView = () => {
    if (!inlineModals) return null;

    return (
      <div className="space-y-3">
        <div className="bg-[#F9F6F3] rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <img
              src={propertyImages && propertyImages.length > 0 ? propertyImages[0] : PLACEHOLDER_IMAGE}
              alt={property.title}
              className="w-16 h-12 object-cover object-top rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-xs mb-0.5 line-clamp-2">{property.title}</h4>
              <p className="text-[10px] text-gray-600">{property.zone}, Roma</p>
              <p className="text-xs font-bold text-[#D97860] mt-0.5">{formatPrice(property.price, property.type)}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center">Condividi con i tuoi amici</p>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleWhatsAppShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#25D366] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'whatsapp' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-whatsapp-line text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">WhatsApp</span>
          </button>

          <button
            onClick={handleMessengerShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#0084FF] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'messenger' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-messenger-line text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">Messenger</span>
          </button>

          <button
            onClick={handleInstagramShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#E4405F] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'instagram' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-instagram-line text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">Instagram</span>
          </button>

          <button
            onClick={handleSMSShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#10B981] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'sms' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-message-3-line text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">SMS</span>
          </button>

          <button
            onClick={handleFacebookShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#1877F2] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'facebook' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-facebook-fill text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">Facebook</span>
          </button>

          <button
            onClick={handleEmailShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#EA4335] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'email' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-mail-line text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">Email</span>
          </button>

          <button
            onClick={handleTelegramShare}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#0088cc] rounded-full mb-1 group-hover:scale-110 transition-transform">
              {shareLoading === 'telegram' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className="ri-telegram-line text-lg text-white"></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">Telegram</span>
          </button>

          <button
            onClick={handleCopyLink}
            disabled={shareLoading !== null}
            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-1 group-hover:scale-110 transition-all ${
              linkCopied ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              {shareLoading === 'link' ? (
                <i className="ri-loader-4-line text-lg text-white animate-spin"></i>
              ) : (
                <i className={`${linkCopied ? 'ri-check-line' : 'ri-file-copy-line'} text-lg text-white`}></i>
              )}
            </div>
            <span className="text-[10px] text-gray-700 font-medium">
              {linkCopied ? 'Copiato!' : 'Copia Link'}
            </span>
          </button>
        </div>
      </div>
    );
  };

  const ReportInlineView = () => {
    if (!inlineModals) return null;
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportSent, setReportSent] = useState(false);

    const handleSubmitReportInline = async () => {
      if (reportLoading) return;
      
      if (!reportReason || !reportReason.trim()) {
        toast.error('Seleziona un motivo per la segnalazione');
        return;
      }

      setReportLoading(true);

      try {
        const reportText = `SEGNALAZIONE ABUSIVA\n\nAnnuncio: ${property.title}\nID: ${property.id}\nMotivo: ${reportReason}\nDescrizione: ${reportDescription || 'Nessuna descrizione aggiuntiva'}`;
        
        try {
          window.open(`mailto:info@mauluna-immobiliare.com?subject=Segnalazione Abusiva - Annuncio ${property.id}&body=${encodeURIComponent(reportText)}`);
        } catch (emailError) {
          // Silent fail
        }

        try {
          const whatsappWindow = window.open(`https://wa.me/393401234567?text=${encodeURIComponent(reportText)}`, '_blank');
          if (!whatsappWindow) {
            toast.warning('Popup bloccato. Consenti i popup per aprire WhatsApp.');
          }
        } catch (whatsappError) {
          // Silent fail
        }
        
        toast.success('Segnalazione inviata');
        setReportSent(true);
        setTimeout(() => {
          setReportSent(false);
          setReportReason('');
          setReportDescription('');
        }, 2000);
      } catch (error: any) {
        toast.error(`Errore durante l'invio della segnalazione: ${error?.message || 'Riprova.'}`);
      } finally {
        setReportLoading(false);
      }
    };

    return (
      <div className="space-y-3">
        {reportSent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mx-auto mb-3">
              <i className="ri-check-line text-2xl text-green-600"></i>
            </div>
            <h4 className="text-base font-bold text-gray-800 mb-1">Segnalazione Inviata!</h4>
            <p className="text-xs text-gray-600">Grazie per aiutarci a mantenere la piattaforma sicura.</p>
          </div>
        ) : (
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <div className="flex items-start">
                <i className="ri-error-warning-line text-red-500 mr-2 mt-0.5 text-sm"></i>
                <div className="text-xs text-red-700">
                  <p className="font-medium mb-0.5">Segnala solo annunci sospetti</p>
                  <p className="text-[10px]">Le segnalazioni false possono comportare la sospensione dell'account.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Motivo della segnalazione *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-xs cursor-pointer"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descrizione (opzionale)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-xs"
                placeholder="Fornisci maggiori dettagli sulla segnalazione..."
              />
            </div>

            <button
              onClick={handleSubmitReportInline}
              disabled={!reportReason || reportLoading}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </>
        )}
      </div>
    );
  };

  // Login Inline View Component
  const LoginInlineView = () => {
    if (!inlineModals) return null;
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const { signIn, signInWithProvider } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        const { error: signInError } = await signIn(loginEmail, loginPassword);
        if (signInError) {
          setError(signInError.message.includes('Invalid') ? 'Email o password non validi.' : signInError.message);
          setLoading(false);
          return;
        }
        toast.success('Accesso effettuato!');
        setCurrentView('property');
      } catch (err: any) {
        setError('Errore durante l\'accesso');
        setLoading(false);
      }
    };

    const handleSocialAuth = async () => {
      setError('');
      setLoading(true);
      try {
        await signInWithProvider('google');
      } catch (err: any) {
        setError('Errore durante l\'accesso con Google');
        setLoading(false);
      }
    };

    return (
      <div className="space-y-3">
        <div className="bg-[#FFF5F0] rounded-lg p-3 border border-[#F0E6DC]">
          <div className="flex items-center justify-center gap-4 text-xs mb-2">
            <div className="flex items-center gap-1">
              <i className="ri-money-dollar-circle-line text-[#D97860]"></i>
              <span className="text-gray-600">0% Commissioni</span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-1">
              <i className="ri-map-pin-line text-[#D97860]"></i>
              <span className="text-gray-600">Solo Roma</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 text-center">
            Accedi per salvare nei preferiti
          </p>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <i className="ri-error-warning-line text-red-600 text-sm mt-0.5"></i>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleSocialAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-xs"
        >
          <i className="ri-google-fill text-base text-[#DB4437]"></i>
          <span className="font-medium text-gray-700">Continua con Google</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">oppure</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-2">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-xs"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#D97860] to-[#C9A876] text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer text-xs flex items-center justify-center gap-1"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Accesso...
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>

        <p className="text-[10px] text-gray-600 text-center">
          Non hai un account?{' '}
          <a href="/register" className="text-[#D97860] font-semibold hover:underline">
            Registrati Gratis
          </a>
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:border-[#D97860]/30 flex flex-col h-full w-full">
        <div className="flex flex-col gap-0 flex-1 min-h-0">
          {/* Image Section - Full Width, Vertical Layout - Fixed Height */}
          <div className="w-full relative flex-shrink-0">
            <div className="relative group bg-gray-100 overflow-hidden h-[160px] sm:h-[180px]">
              <Link href={getPropertyPath(property.id, property)} className="block relative">
                {propertyImages && propertyImages.length > 0 && currentImageIndex < propertyImages.length ? (
                  imageError.has(currentImageIndex) || allImagesFailed ? (
                    <img
                      src={PLACEHOLDER_IMAGE}
                      alt={property.title}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <img
                      key={`${property.id}-${currentImageIndex}`}
                      src={propertyImages[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  )
                ) : (
                  <img
                    src={PLACEHOLDER_IMAGE}
                    alt={property.title}
                    className="w-full h-full object-cover object-top"
                  />
                )}
              </Link>
              
              {/* Badges - Top Left */}
              <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-1 sm:gap-1.5 z-20 pointer-events-none">
                <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shadow-md ${
                  property.type === 'buy' || property.type === 'sale'
                    ? 'bg-[#C9A876] text-white' 
                    : 'bg-[#D97860] text-white'
                }`}>
                  {property.type === 'buy' || property.type === 'sale' ? 'Vendita' : 'Affitto'}
                </span>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-white/95 text-gray-800 backdrop-blur-sm shadow-md line-clamp-1">
                  {property.subSubCategory || property.subCategory || property.category || ''}
                </span>
              </div>

              {/* Image Navigation */}
              {propertyImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-100 transition-opacity shadow-lg cursor-pointer z-30"
                  >
                    <i className="ri-arrow-left-line text-gray-800 text-sm sm:text-base"></i>
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-100 transition-opacity shadow-lg cursor-pointer z-30"
                  >
                    <i className="ri-arrow-right-line text-gray-800 text-sm sm:text-base"></i>
                  </button>

                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black/70 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium backdrop-blur-sm z-20 pointer-events-none">
                    {currentImageIndex + 1}/{propertyImages.length}
                  </div>

                  <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-1.5 z-20">
                    {propertyImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                          index === currentImageIndex 
                            ? 'bg-white w-5 sm:w-6' 
                            : 'bg-white/50 hover:bg-white/75 w-1.5 sm:w-2'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* View Count - Bottom Left */}
              <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-white/95 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full shadow-md z-20 pointer-events-none">
                <div className="flex items-center text-[10px] sm:text-xs text-gray-700">
                  <i className="ri-eye-line mr-1 text-[10px]"></i>
                  <span className="font-medium">{(property.views || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section - Below Image */}
          <div className="w-full p-2.5 sm:p-3 flex flex-col flex-1 min-h-0">
            {currentView === 'property' ? (
              <div className="flex-1 flex flex-col">
                {/* Price and Title Row - Fixed Height */}
                <div className="mb-1.5 h-[48px] overflow-hidden">
                <Link href={getPropertyPath(property.id, property)} className="block">
                  <div className="text-base sm:text-lg font-bold text-[#D97860] mb-0.5 hover:text-[#C86B54] transition-colors cursor-pointer line-clamp-1">
                    {formatPrice(property.price, property.type)}
                  </div>
                </Link>
                <Link href={getPropertyPath(property.id, property)} className="block">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 hover:text-[#D97860] transition-colors leading-tight cursor-pointer line-clamp-1">
                    {property.title}
                  </h3>
                </Link>
              </div>

              {/* Zone and Location - Vertical Layout - Fixed Height */}
              <div className="mb-1.5 space-y-0.5 h-[40px] overflow-hidden flex flex-col justify-start">
                {/* Zone - Displayed First */}
                {property.zone && (
                  <div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[#C9A876]/10 text-[#C9A876] border border-[#C9A876]/20 line-clamp-1">
                      <i className="ri-map-pin-fill mr-1 text-[9px] flex-shrink-0"></i>
                      <span className="truncate">{property.zone}</span>
                    </span>
                  </div>
                )}
                
                {/* Address (Via) - Displayed Under Zone */}
                {property.address && (
                  <div className="text-xs sm:text-sm text-gray-500 flex items-center line-clamp-1">
                    <i className="ri-road-map-line mr-1 text-[#C9A876] text-sm flex-shrink-0"></i>
                    <span className="truncate">{property.address}</span>
                  </div>
                )}
              </div>

              {/* Specs - Compact Grid with Labels - Fixed Height */}
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-700 mb-1.5 pb-1.5 border-b border-gray-200 h-[52px] overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                  <i className="ri-home-4-line text-[#C9A876] text-xs sm:text-sm mb-0.5"></i>
                  <span className="font-medium text-center leading-tight">{property.sqm} m²</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <i className="ri-door-open-line text-[#C9A876] text-xs sm:text-sm mb-0.5"></i>
                  <span className="font-medium text-center leading-tight">{property.rooms}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">locali</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <i className="ri-drop-line text-[#C9A876] text-xs sm:text-sm mb-0.5"></i>
                  <span className="font-medium text-center leading-tight">{property.bathrooms}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">bagni</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <i className="ri-building-line text-[#C9A876] text-xs sm:text-sm mb-0.5"></i>
                  <span className="font-medium text-center leading-tight text-[9px] sm:text-[10px]">{property.floor}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">piano</span>
                </div>
              </div>

              {/* Actions - Two Rows for Better Organization */}
            <div className="flex flex-col gap-1.5 mt-auto pt-1.5 border-t border-gray-200">
              {/* Primary Actions Row */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inlineModals) {
                      setCurrentView('contact');
                    } else {
                      setShowContactModal(true);
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 bg-[#D97860] text-white rounded-md hover:bg-[#C86B54] transition-colors font-medium cursor-pointer text-xs sm:text-sm flex items-center justify-center"
                >
                  <i className="ri-message-3-line mr-1 text-xs"></i>
                  Contatta
                </button>
                
                <Link
                  href={getPropertyPath(property.id, property)}
                  className="flex-1 px-2.5 py-1.5 border border-[#D97860] text-[#D97860] rounded-md hover:bg-[#D97860]/5 transition-colors font-medium cursor-pointer text-center text-xs sm:text-sm"
                >
                  Dettagli
                </Link>
              </div>

              {/* Secondary Actions Row */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleFavoriteToggle}
                  disabled={favoriteProcessing}
                  className={`flex-1 px-2 py-1 border rounded-md transition-colors text-xs font-medium flex items-center justify-center ${
                    favoriteProcessing 
                      ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed' 
                      : isFavorite 
                        ? 'border-[#D97860] text-[#D97860] bg-[#D97860]/10 cursor-pointer' 
                        : 'border-gray-300 text-[#D97860] hover:bg-[#F9F6F3] hover:border-[#D97860] cursor-pointer'
                  }`}
                  title={favoriteProcessing ? 'Elaborazione...' : isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
                >
                  {favoriteProcessing ? (
                    <i className="ri-loader-4-line animate-spin mr-1 text-xs"></i>
                  ) : (
                    <i className={`${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'} mr-1 text-xs`}></i>
                  )}
                  Salva
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inlineModals) {
                      setCurrentView('share');
                    } else {
                      setShowShareModal(true);
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-xs font-medium flex items-center justify-center"
                  title="Condividi"
                >
                  <i className="ri-share-line mr-1 text-xs"></i>
                  Condividi
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (inlineModals) {
                      setCurrentView('report');
                    } else {
                      setShowScamReportModal(true);
                    }
                  }}
                  className="flex-1 px-2 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer text-xs font-medium flex items-center justify-center"
                  title="Segnala Abusivo"
                >
                  <i className="ri-flag-line mr-1"></i>
                  Segnala
                </button>
              </div>
            </div>

            {/* Free Platform Badge - Minimal */}
            <div className="mt-1.5 flex items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-green-700 font-medium">
                <i className="ri-shield-check-line mr-1"></i>
                0% Commissioni
              </span>
            </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Back Button */}
                <button
                  onClick={() => {
                    setCurrentView('property');
                  }}
                  className="flex items-center text-gray-600 hover:text-[#D97860] transition-colors mb-3 cursor-pointer"
                >
                  <i className="ri-arrow-left-line mr-2 text-lg"></i>
                  <span className="text-sm font-medium">Indietro</span>
                </button>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto">
                  {currentView === 'contact' && <ContactInlineView />}
                  {currentView === 'share' && <ShareInlineView />}
                  {currentView === 'report' && <ReportInlineView />}
                  {currentView === 'login' && <LoginInlineView />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactModal />
      <ScamReportModal />
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <ShareModal />
    </>
  );
};

export default SharedPropertyCard;
