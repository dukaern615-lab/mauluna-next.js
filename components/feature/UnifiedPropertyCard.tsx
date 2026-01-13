'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Property {
  id: number;
  title: string;
  price: number;
  type: string;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  surface?: number;
  sqm: number;
  rooms: number;
  bathrooms: number;
  floor: string;
  condition: string;
  energyClass: string;
  features?: string[];
  zone: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  images?: string[];
  description?: string;
  agent?: {
    name: string;
    phone: string;
    email: string;
  };
  forSale?: boolean;
  commission?: string;
  energy?: string;
  businessActivities?: string[];
  visibility?: string;
  commercialType?: string;
  officeType?: string;
  services?: string[];
  garageType?: string;
  security?: string[];
  access?: string;
  landType?: string;
  buildingRights?: string[];
  utilities?: string[];
}

interface UnifiedPropertyCardProps {
  property: Property;
  onContactClick?: (property: Property) => void;
  viewType?: 'grid' | 'list';
}

export default function UnifiedPropertyCard({ 
  property, 
  onContactClick,
  viewType = 'list' 
}: UnifiedPropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Check if property is saved on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      setIsFavorite(savedProperties.includes(property.id));
    }
  }, [property.id]);

  // Toggle favorite status
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof window === 'undefined') return;
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('userToken') || localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    const savedProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
    
    if (isFavorite) {
      // Remove from favorites
      const updatedProperties = savedProperties.filter((id: number) => id !== property.id);
      localStorage.setItem('savedProperties', JSON.stringify(updatedProperties));
      setIsFavorite(false);
    } else {
      // Add to favorites
      const updatedProperties = [...savedProperties, property.id];
      localStorage.setItem('savedProperties', JSON.stringify(updatedProperties));
      setIsFavorite(true);
    }
  };

  const formatPrice = (price: number, type: string) => {
    if (type === 'buy') {
      return `€${price.toLocaleString()}`;
    } else {
      return `€${price}/mese`;
    }
  };

  const getPropertyImages = () => {
    const images = [];
    
    // Add existing images if available
    if (property.images && property.images.length > 0) {
      images.push(...property.images);
    }
    
    // Generate additional images based on property type and category
    let baseImagePrompt = '';
    
    if (property.category === 'Case-Appartamenti') {
      if (property.subSubCategory === 'Monolocale') {
        baseImagePrompt = `Modern studio apartment interior in Rome ${property.zone} with compact design, contemporary furniture, efficient space usage, bright natural light, minimalist Italian style`;
      } else if (property.subSubCategory === 'Bilocale') {
        baseImagePrompt = `Elegant two-room apartment interior in Rome ${property.zone} with sophisticated design, marble floors, designer furniture, luxury finishes, Italian elegance`;
      } else if (property.subSubCategory === 'Trilocale') {
        baseImagePrompt = `Three-room apartment with terrace in Rome ${property.zone} neighborhood, historic building, modern interior, rooftop terrace with city views, cozy atmosphere`;
      } else if (property.subSubCategory === 'Quadrilocale') {
        baseImagePrompt = `Luxury four-room apartment in Rome ${property.zone} with elegant interior, high ceilings, period details, modern amenities, sophisticated Italian design`;
      } else if (property.subCategory === 'Villa') {
        baseImagePrompt = `Luxury villa with garden in Rome ${property.zone} district, modern architecture, swimming pool, manicured landscaping, elegant facade, premium materials`;
      } else if (property.subCategory === 'Attico / Mansarda') {
        baseImagePrompt = `Luxury penthouse with panoramic terrace in Rome ${property.zone}, modern interior, floor-to-ceiling windows, rooftop garden, stunning city views`;
      } else {
        baseImagePrompt = `Beautiful residential apartment interior in Rome ${property.zone} with modern design, natural lighting, elegant furnishing, Italian style`;
      }
    } else if (property.category === 'Commerciale') {
      if (property.businessActivities?.includes('Farmacia')) {
        baseImagePrompt = `Professional pharmacy interior in Rome ${property.zone} with modern shelving, consultation area, medical equipment, clean white design, professional lighting`;
      } else if (property.businessActivities?.includes('Ristorante')) {
        baseImagePrompt = `Traditional Italian restaurant interior in Rome ${property.zone} with rustic decor, dining tables, professional kitchen, warm atmosphere, authentic Roman style`;
      } else if (property.businessActivities?.includes('Parrucchiere – Barbiere')) {
        baseImagePrompt = `Modern hair salon interior in Rome ${property.zone} with styling stations, mirrors, professional equipment, contemporary design, clean aesthetic`;
      } else if (property.subCategory === 'Laboratorio') {
        baseImagePrompt = `Artisan workshop space in Rome ${property.zone} with high ceilings, work benches, industrial lighting, creative workspace, raw industrial aesthetic`;
      } else {
        baseImagePrompt = `Modern commercial space interior in Rome ${property.zone} with large windows, display areas, contemporary retail design, professional environment`;
      }
    } else if (property.category === 'Ufficio') {
      if (property.officeType === 'Singolo') {
        baseImagePrompt = `Professional single office space in Rome ${property.zone} with modern furniture, natural lighting, business environment, elegant design, executive workspace`;
      } else if (property.officeType === 'Open space') {
        baseImagePrompt = `Modern open space office in Rome ${property.zone} with collaborative workspace, contemporary design, natural light, flexible seating, professional environment`;
      } else {
        baseImagePrompt = `Shared office space in Rome ${property.zone} with coworking desks, collaborative environment, modern amenities, professional atmosphere`;
      }
    } else if (property.category === 'Garage-Posti auto') {
      if (property.garageType === 'Box singolo') {
        baseImagePrompt = `Clean single car garage box in Rome ${property.zone} with automatic door, good lighting, security features, well-maintained underground parking`;
      } else if (property.garageType === 'Box doppio') {
        baseImagePrompt = `Double car garage box in Rome ${property.zone} with space for two vehicles, automatic doors, security system, modern underground parking facility`;
      } else {
        baseImagePrompt = `Covered parking space in Rome ${property.zone} with roof protection, marked parking spot, secure access, residential building garage`;
      }
    } else if (property.category === 'Terreni') {
      if (property.subCategory === 'Terreno edificabile') {
        baseImagePrompt = `Building land plot in Rome ${property.zone} with clear boundaries, access road, utilities available, suitable for residential development, open landscape`;
      } else if (property.subCategory === 'Terreno agricolo') {
        baseImagePrompt = `Agricultural land in Roman countryside with fertile soil, rural landscape, farming potential, natural environment, peaceful setting`;
      } else {
        baseImagePrompt = `Commercial land plot in Rome ${property.zone} district with urban location, development potential, infrastructure access, business district setting`;
      }
    } else {
      baseImagePrompt = `Modern property interior in Rome ${property.zone} with contemporary design, natural lighting, elegant furnishing, Italian architectural style`;
    }

    // Add main image if not already present
    if (images.length === 0) {
      images.push(`https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28baseImagePrompt%29%7D&width=500&height=350&seq=${property.id}&orientation=landscape`);
    }

    // Generate additional images for gallery
    const additionalImages = [
      `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28baseImagePrompt%20%20%20%2C%20kitchen%20area%20with%20modern%20appliances%2C%20marble%20countertops%2C%20elegant%20design%2C%20Italian%20style%2C%20premium%20materials%29%7D&width=500&height=350&seq=${property.id}a&orientation=landscape`,
      `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28baseImagePrompt%20%20%20%2C%20bathroom%20with%20luxury%20fixtures%2C%20modern%20design%2C%20marble%20surfaces%2C%20sophisticated%20Italian%20style%29%7D&width=500&height=350&seq=${property.id}b&orientation=landscape`,
      `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28baseImagePrompt%20%20%20%2C%20bedroom%20with%20comfortable%20furniture%2C%20natural%20light%2C%20elegant%20design%2C%20Italian%20style%20decor%29%7D&width=500&height=350&seq=${property.id}c&orientation=landscape`,
      `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28baseImagePrompt%20%20%20%2C%20living%20area%20with%20modern%20furniture%2C%20large%20windows%2C%20contemporary%20design%2C%20Italian%20elegance%29%7D&width=500&height=350&seq=${property.id}d&orientation=landscape`
    ];

    // Add additional images up to 5 total
    images.push(...additionalImages.slice(0, 5 - images.length));

    return images;
  };

  const propertyImages = getPropertyImages();

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === 0 ? propertyImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === propertyImages.length - 1 ? 0 : prev + 1
    );
  };

  const getPropertyDescription = () => {
    if (property.description) {
      return property.description;
    }
    
    // Generate description based on property type
    if (property.category === 'Case-Appartamenti') {
      return `Splendido ${property.subSubCategory || property.subCategory} situato nel cuore di ${property.zone}. L'immobile si presenta in ${property.condition.toLowerCase()} condizioni e offre ampi spazi luminosi con finiture di pregio.`;
    } else if (property.category === 'Commerciale') {
      return `Locale commerciale strategicamente posizionato in ${property.zone}, ideale per attività commerciali. Ottima visibilità e passaggio pedonale garantito.`;
    } else if (property.category === 'Ufficio') {
      return `Ufficio moderno e funzionale in ${property.zone}, perfetto per attività professionali. Spazi luminosi e ben distribuiti con servizi inclusi.`;
    } else {
      return `Immobile di qualità situato in ${property.zone}, Roma. Ottima opportunità di investimento in zona strategica e ben servita.`;
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContactClick) {
      onContactClick(property);
    }
  };

  // Login Modal Component
  const LoginModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setShowLoginModal(false);
        }
      };

      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowLoginModal(false);
        }
      };

      if (showLoginModal) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }, [showLoginModal]);

    if (!showLoginModal) return null;

    const handleLogin = () => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userToken', 'demo-token-' + Date.now());
      setShowLoginModal(false);
      
      const savedProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      const updatedProperties = [...savedProperties, property.id];
      localStorage.setItem('savedProperties', JSON.stringify(updatedProperties));
      setIsFavorite(true);
    };

    const handleRegister = () => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userToken', 'demo-token-' + Date.now());
      setShowLoginModal(false);
      
      const savedProperties = JSON.parse(localStorage.getItem('savedProperties') || '[]');
      const updatedProperties = [...savedProperties, property.id];
      localStorage.setItem('savedProperties', JSON.stringify(updatedProperties));
      setIsFavorite(true);
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="bg-white rounded-xl max-w-md w-full shadow-2xl"
        >
          <div className="p-4 sm:p-6 border-b border-[#E8E4E0] text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#D97860]/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="ri-heart-line text-xl sm:text-2xl text-[#D97860]"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#3D2817] mb-2">Save Your Favorite Properties</h2>
            <p className="text-xs sm:text-sm text-[#5C4B42]">
              Create an account to save properties and access them from any device
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-[#F9F6F3] border-b border-[#E8E4E0]">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={`https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28%60Modern%20property%20interior%20in%20Rome%20$%7Bproperty.zone%7D%20with%20contemporary%20design%2C%20natural%20lighting%2C%20elegant%20furnishing%2C%20Italian%20architectural%20style%60%29%7D&width=60&height=45&seq=${property.id}&orientation=landscape`}
                alt={property.title}
                className="w-10 h-8 sm:w-12 sm:h-9 object-cover object-top rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#3D2817] text-xs sm:text-sm truncate">
                  {property.title}
                </h3>
                <p className="text-xs text-[#5C4B42]">
                  {property.zone}, Roma
                </p>
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#D97860]">
                {formatPrice(property.price, property.type)}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
            <button
              onClick={handleLogin}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors font-semibold cursor-pointer text-sm sm:text-base whitespace-nowrap"
            >
              Login to Save
            </button>
            
            <button
              onClick={handleRegister}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 border border-[#D97860] text-[#D97860] rounded-lg hover:bg-[#D97860]/5 transition-colors font-semibold cursor-pointer text-sm sm:text-base whitespace-nowrap"
            >
              Create Account
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full px-4 sm:px-6 py-2 text-[#5C4B42] hover:text-[#3D2817] transition-colors text-xs sm:text-sm cursor-pointer whitespace-nowrap"
            >
              Maybe Later
            </button>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-[#F9F6F3] rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-[#3D2817] text-xs sm:text-sm mb-2">Why create an account?</h4>
              <ul className="space-y-1 text-xs text-[#5C4B42]">
                <li className="flex items-center">
                  <i className="ri-check-line text-[#C9A876] mr-1.5 sm:mr-2"></i>
                  Save unlimited properties
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-[#C9A876] mr-1.5 sm:mr-2"></i>
                  Access from any device
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-[#C9A876] mr-1.5 sm:mr-2"></i>
                  Get property alerts
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-[#C9A876] mr-1.5 sm:mr-2"></i>
                  Direct owner contact
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Share Modal Component
  const ShareModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setShowShareModal(false);
        }
      };

      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowShareModal(false);
        }
      };

      if (showShareModal) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }, [showShareModal]);

    if (!showShareModal) return null;

    const propertyUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${property.id}` : `/property/${property.id}`;
    const shareTitle = `${property.title} - ${property.zone}, Roma`;
    const shareText = `Guarda questo immobile: ${property.title} in ${property.zone}, Roma - ${formatPrice(property.price, property.type)}`;

    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(propertyUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    };

    const shareOptions = [
      {
        name: 'WhatsApp',
        icon: 'ri-whatsapp-line',
        color: '#25D366',
        action: () => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + propertyUrl)}`, '_blank');
        }
      },
      {
        name: 'Messenger',
        icon: 'ri-messenger-line',
        color: '#0084FF',
        action: () => {
          window.open(`fb-messenger://share/?link=${encodeURIComponent(propertyUrl)}`, '_blank');
        }
      },
      {
        name: 'Telegram',
        icon: 'ri-telegram-line',
        color: '#0088cc',
        action: () => {
          window.open(`https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        }
      },
      {
        name: 'Instagram',
        icon: 'ri-instagram-line',
        color: '#E4405F',
        action: () => {
          handleCopyLink();
          alert('Link copiato! Ora puoi incollarlo nella tua storia o messaggio Instagram.');
        }
      },
      {
        name: 'Facebook',
        icon: 'ri-facebook-circle-line',
        color: '#1877F2',
        action: () => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`, '_blank');
        }
      },
      {
        name: 'Email',
        icon: 'ri-mail-line',
        color: '#EA4335',
        action: () => {
          window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + propertyUrl)}`;
        }
      }
    ];

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="bg-white rounded-xl max-w-md w-full shadow-2xl"
        >
          <div className="p-6 border-b border-[#E8E4E0] text-center">
            <div className="w-16 h-16 bg-[#C9A876]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-share-line text-2xl text-[#C9A876]"></i>
            </div>
            <h2 className="text-xl font-bold text-[#3D2817] mb-2">Condividi Immobile</h2>
            <p className="text-sm text-[#5C4B42]">
              Condividi questo immobile con i tuoi amici
            </p>
          </div>

          <div className="p-4 bg-[#F9F6F3] border-b border-[#E8E4E0]">
            <div className="flex items-center space-x-3">
              <img
                src={propertyImages[0]}
                alt={property.title}
                className="w-16 h-12 object-cover object-top rounded"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#3D2817] text-sm truncate">
                  {property.title}
                </h3>
                <p className="text-xs text-[#5C4B42]">
                  {property.zone}, Roma
                </p>
              </div>
              <div className="text-sm font-bold text-[#D97860]">
                {formatPrice(property.price, property.type)}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-[#F9F6F3] transition-all cursor-pointer group"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    <i 
                      className={`${option.icon} text-2xl`}
                      style={{ color: option.color }}
                    ></i>
                  </div>
                  <span className="text-xs font-medium text-[#3D2817]">{option.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyLink}
              className={`w-full px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all ${
                linkCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-[#C9A876] text-white hover:bg-[#B8976A]'
              }`}
            >
              {linkCopied ? (
                <>
                  <i className="ri-check-line mr-2"></i>
                  Link Copiato!
                </>
              ) : (
                <>
                  <i className="ri-file-copy-line mr-2"></i>
                  Copia Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Professional mobile-optimized card layout - EXACTLY like search results
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-[#E8E4E0] overflow-hidden transition-all duration-300 hover:border-[#D97860]/30">
        {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6">
          {/* Image Section - Mobile Optimized */}
          <div className="w-full lg:w-[40%] flex-shrink-0">
            <div className="relative group">
              <img
                src={propertyImages[currentImageIndex]}
                alt={`${property.title} in ${property.zone}, Rome`}
                className="w-full h-48 sm:h-56 lg:h-72 object-cover object-top rounded-lg"
              />
              
              {/* Property Type Badge */}
              <div className="absolute top-3 lg:top-4 left-3 lg:left-4">
                <span className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-full text-xs lg:text-sm font-semibold shadow-sm ${
                  property.type === 'buy' 
                    ? 'bg-[#C9A876] text-white' 
                    : 'bg-[#D97860] text-white'
                }`}>
                  {property.type === 'buy' ? 'Vendita' : 'Affitto'}
                </span>
              </div>
              
              {/* Property Category Badge */}
              <div className="absolute top-3 lg:top-4 right-3 lg:right-4">
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/90 text-[#3D2817] backdrop-blur-sm">
                  {property.subSubCategory || property.subCategory || property.category}
                </span>
              </div>

              {/* Image Navigation - Mobile Optimized */}
              {propertyImages.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-7 h-7 lg:w-8 lg:h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm"
                  >
                    <i className="ri-arrow-left-line text-sm lg:text-base text-[#3D2817]"></i>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 lg:w-8 lg:h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm"
                  >
                    <i className="ri-arrow-right-line text-sm lg:text-base text-[#3D2817]"></i>
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-3 lg:bottom-4 right-3 lg:right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {currentImageIndex + 1}/{propertyImages.length}
                  </div>

                  {/* Image Dots Indicator */}
                  <div className="absolute bottom-3 lg:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {propertyImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full transition-colors duration-200 cursor-pointer ${
                          index === currentImageIndex 
                            ? 'bg-white' 
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info Section - Mobile Optimized */}
          <div className="w-full lg:w-[60%] flex flex-col justify-between">
            {/* Top Section: Price and Title */}
            <div>
              {/* Price - Mobile Optimized - Now Clickable */}
              <Link href={`/property/${property.id}`} className="block">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#D97860] mb-2 lg:mb-3 leading-tight hover:text-[#C86B54] transition-colors cursor-pointer">
                  {formatPrice(property.price, property.type)}
                </div>
              </Link>

              {/* Title - Mobile Optimized - Now Clickable */}
              <Link href={`/property/${property.id}`} className="block mb-2 lg:mb-3">
                <h3 className="text-lg sm:text-xl font-semibold text-[#3D2817] leading-tight hover:text-[#D97860] transition-colors cursor-pointer">
                  {property.title}
                </h3>
              </Link>

              {/* Address/Zone - Mobile Optimized */}
              <p className="text-sm text-[#5C4B42] mb-3 lg:mb-4 flex items-center">
                <i className="ri-map-pin-line mr-2 text-[#C9A876]"></i>
                {property.address || `${property.zone}, Roma`}
              </p>

              {/* Specs Row - Mobile Optimized */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-sm text-[#5C4B42] mb-3 lg:mb-4">
                <div className="flex items-center">
                  <i className="ri-home-4-line mr-2 text-[#C9A876] w-4 h-4 flex items-center justify-center"></i>
                  <span className="font-medium">{property.sqm} m²</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-door-open-line mr-2 text-[#C9A876] w-4 h-4 flex items-center justify-center"></i>
                  <span className="font-medium">{property.rooms} locali</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-drop-line mr-2 text-[#C9A876] w-4 h-4 flex items-center justify-center"></i>
                  <span className="font-medium">{property.bathrooms} bagni</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-building-line mr-2 text-[#C9A876] w-4 h-4 flex items-center justify-center"></i>
                  <span className="font-medium">Piano {property.floor}</span>
                </div>
              </div>

              {/* Description - Mobile Optimized */}
              <p className="text-sm text-[#5C4B42] mb-4 lg:mb-6 line-clamp-2 leading-relaxed">
                {getPropertyDescription()}
              </p>
            </div>

            {/* Bottom Section: Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button 
                onClick={handleContactClick}
                className="w-full sm:flex-1 lg:w-auto lg:flex-none px-4 lg:px-6 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Contatta Proprietario
              </button>
              
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={handleFavoriteToggle}
                  className={`flex-1 sm:flex-none p-2.5 border rounded-lg transition-colors cursor-pointer ${
                    isFavorite 
                      ? 'border-[#D97860] text-[#D97860] bg-[#D97860]/10' 
                      : 'border-[#E8E4E0] text-[#D97860] hover:bg-[#F9F6F3] hover:border-[#D97860]'
                  }`}
                >
                  <i className={`${isFavorite ? 'ri-heart-fill' : 'ri-heart-line'} w-5 h-5 flex items-center justify-center`}></i>
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 sm:flex-none px-3 lg:px-4 py-2.5 border border-[#E8E4E0] text-[#5C4B42] rounded-lg hover:bg-[#F9F6F3] transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-share-line mr-1 lg:mr-2"></i>
                  <span className="hidden sm:inline">Condividi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal />
      
      {/* Share Modal */}
      <ShareModal />
    </>
  );
}











