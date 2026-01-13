'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/base/Button';
import { romeZones } from '@/mocks/properties';

export default function HeroSection() {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<'rent' | 'buy' | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchData, setSearchData] = useState({
    location: '',
    zones: [] as string[],
    mainCategory: '',
    subCategory: '',
    subSubCategory: '',
    businessActivities: [] as string[]
  });

  // Business activities list
  const businessActivities = [
    'Agenzia di viaggi e turismo',
    'Agenzia immobiliare',
    'Agenzia mediazione creditizia',
    'Agriturismo',
    'Alimentari – Gastronomia',
    'Armeria',
    'Autolavaggio',
    'Autorimessa',
    'Azienda agricola',
    'Banco mercato',
    'Bar',
    'Bed & Breakfast',
    'Birreria – Pub',
    'Campeggio',
    'Cartoleria – Copisteria',
    'Centro benessere',
    'Centro estetico',
    'Centro massaggi',
    'Centro riparazioni',
    'Cocktail bar',
    'Colorificio – Prodotti edili',
    'Concessionaria',
    'Coworking space',
    'Discoteca – Night club',
    'Edicola',
    'Enoteca – Wine bar',
    'Erboristeria',
    'Escape room',
    'Falegnameria',
    'Farmacia',
    'Ferramenta – Bricolage',
    'Fioraio',
    'Gelateria',
    'Gioielleria – Orologeria',
    'Gommista',
    'Hotel',
    'Idraulica',
    'Impianto sportivo',
    'Internet point – Phone center',
    'Lavanderia – Tintoria',
    'Libreria',
    'Ludoteca – Asilo nido',
    'Macelleria',
    'Merceria',
    'Minimarket',
    'Negozio di CBD – Cannabis light',
    'Negozio di Musica – Strumenti',
    'Negozio di Ricambi e accessori',
    'Negozio di abbigliamento',
    'Negozio di animali – Pet shop',
    'Negozio di articoli da regalo',
    'Negozio di articoli sanitari',
    'Negozio di biciclette',
    'Negozio di caccia e pesca',
    'Negozio di calzature',
    'Negozio di casalinghi',
    'Negozio di cellulari e telefonia',
    'Negozio di elettronica – Informatica',
    'Negozio di frutta e verdura',
    'Negozio di giocattoli – Videogames',
    'Negozio di mobili e arredamento',
    'Negozio di profumi e cosmetica',
    'Negozio di tatuaggi e piercing',
    'Negozio di tè e infusi',
    'Negozio di toelettatura',
    'Officina – Carrozzeria',
    'Ottica – Foto',
    'Palestra',
    'Panificio',
    'Paninoteca – Burger bar',
    'Parrucchiere – Barbiere',
    'Pasticceria',
    'Pastificio',
    'Pescheria',
    'Pizzeria',
    'Ristorante',
    'Rimozione tatuaggi – Tattoo removal',
    'Rosticceria – Pizza al taglio',
    'Sala da tè – Tea room',
    'Sala giochi e scommesse',
    'Sala prove musicali',
    'Sala realtà virtuale – VR',
    'Salone per unghie – Nail salon',
    'Scuola – Corsi',
    'Stabilimento balneare',
    'Stazione di servizio',
    'Studio di yoga e pilates',
    'Studio fotografico',
    'Supermercato',
    'Tabaccheria',
    'Tavola calda',
    'Altro'
  ];

  const [businessSearch, setBusinessSearch] = useState('');
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const businessDropdownRef = useRef<HTMLDivElement>(null);

  // Zone selection state
  const [zoneSearch, setZoneSearch] = useState('');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [expandedMacroZones, setExpandedMacroZones] = useState<string[]>([]);
  const zoneDropdownRef = useRef<HTMLDivElement>(null);

  const propertyCategories = {
    // Main categories with subcategories - MOST IMPORTANT FIRST
    'Case-Appartamenti': {
      'Appartamento': [
        'Monolocale',
        'Bilocale', 
        'Trilocale',
        'Quadrilocale',
        '5 locali o più / Loft'
      ],
      'Villa': [],
      'Villetta': [],
      'Casa indipendente': [],
      'Rustico / Casale': [],
      'Palazzo / Stabile': [],
      'Attico / Mansarda': [],
      'Loft / Open space': []
    },
    'Commerciale': {
      'Negozio commerciale': [],
      'Laboratorio': [],
      'Attività/Licenza commerciale': []
    },
    
    // Standalone main categories (no subcategories)
    'Ufficio': {},
    'Garage-Posti auto': {},
    'Magazzini-Depositi': {},
    'Capannoni': {},
    
    // Other categories with subcategories
    'Terreni': {
      'Terreno edificabile': [],
      'Terreno agricolo': [],
      'Terreno industriale': [],
      'Terreno commerciale': []
    },
    'Nuove Costruzioni': {
      'Appartamento': [],
      'Villa': [],
      'Villetta': [],
      'Ufficio': [],
      'Negozio': []
    }
  };

  const handleActionClick = (action: 'rent' | 'buy') => {
    setSelectedAction(action);
    setShowDropdown(false);
  };

  const handleAddProperty = () => {
    router.push('/pubblica-annuncio');
  };

  // Mobile drawer state
  const [mobileDrawer, setMobileDrawer] = useState<'zone' | 'business' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form ref for scrolling
  const formRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent section scroll when dropdown opens
  useEffect(() => {
    if (sectionRef.current) {
      if (showDropdown && !selectedAction) {
        // Save current scroll position
        const scrollTop = sectionRef.current.scrollTop;
        // Temporarily disable scrolling
        sectionRef.current.style.overflow = 'hidden';
        // Restore scroll position to prevent jump
        sectionRef.current.scrollTop = scrollTop;
        
        return () => {
          sectionRef.current!.style.overflow = 'auto';
        };
      }
    }
  }, [showDropdown, selectedAction]);

  // Auto-expand macro zones when searching for sub-zones
  useEffect(() => {
    if (zoneSearch) {
      // Find all macro zones that have matching sub-zones
      const macroZonesToExpand = Object.keys(romeZones).filter(macroZone => {
        const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
        return subZones.some(subZone => 
          subZone.toLowerCase().includes(zoneSearch.toLowerCase())
        );
      });
      setExpandedMacroZones(macroZonesToExpand);
    } else {
      // Clear expansion when search is cleared
      setExpandedMacroZones([]);
    }
  }, [zoneSearch]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && mobileDrawer) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      // Unlock body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMobile, mobileDrawer]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMainCategoryChange = (category: string) => {
    setSearchData({
      ...searchData,
      mainCategory: category,
      subCategory: '', // Reset subcategory when main category changes
      subSubCategory: '', // Reset subSubCategory when main category changes
      businessActivities: [] // Reset business activities
    });
  };

  const handleSubCategoryChange = (subCategory: string) => {
    setSearchData({
      ...searchData,
      subCategory: subCategory,
      subSubCategory: '', // Reset subSubCategory when subCategory changes
      businessActivities: subCategory === 'Attività/Licenza commerciale' ? businessActivities : [] // Auto-select all when this subcategory is chosen
    });
  };

  const handleSubSubCategoryChange = (subSubCategory: string) => {
    setSearchData(prev => ({
      ...prev,
      subSubCategory
    }));
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!selectedAction) return;
    
    // Build search URL with parameters
    const params = new URLSearchParams();
    // Map English to Italian: rent → affitto, buy → vendita
    const tipoValue = selectedAction === 'rent' ? 'affitto' : 'vendita';
    params.set('tipo', tipoValue);
    
    if (searchData.zones.length > 0) {
      params.set('zones', searchData.zones.join(','));
    }
    
    if (searchData.mainCategory) {
      params.set('mainCategory', searchData.mainCategory);
    }
    
    if (searchData.subCategory) {
      params.set('subCategory', searchData.subCategory);
    }

    if (searchData.subSubCategory) {
      params.set('subSubCategory', searchData.subSubCategory);
    }

    if (searchData.businessActivities.length > 0) {
      params.set('businessActivities', searchData.businessActivities.join(','));
    }
    
    router.push(`/risultati-ricerca?${params.toString()}`);
  };

  const getSubCategories = () => {
    if (!searchData.mainCategory) return [];
    const category = propertyCategories[searchData.mainCategory as keyof typeof propertyCategories];
    return typeof category === 'object' && Object.keys(category).length > 0 ? Object.keys(category) : [];
  };

  const getSubSubCategories = () => {
    if (!searchData.mainCategory || !searchData.subCategory) return [];
    const mainCat = propertyCategories[searchData.mainCategory as keyof typeof propertyCategories];
    if (!mainCat) return [];
    return mainCat[searchData.subCategory as keyof typeof mainCat] || [];
  };

  const filteredBusinessActivities = businessActivities.filter(activity =>
    activity.toLowerCase().includes(businessSearch.toLowerCase())
  );

  const handleBusinessActivityToggle = (activity: string) => {
    setSearchData(prev => ({
      ...prev,
      businessActivities: prev.businessActivities.includes(activity)
        ? prev.businessActivities.filter(a => a !== activity)
        : [...prev.businessActivities, activity]
    }));
  };

  const handleSelectAllBusiness = () => {
    setSearchData(prev => ({
      ...prev,
      businessActivities: prev.businessActivities.length === filteredBusinessActivities.length && filteredBusinessActivities.length > 0
        ? []
        : [...filteredBusinessActivities]
    }));
  };

  const getAllZones = () => {
    const allZones: string[] = [];
    Object.entries(romeZones).forEach(([macroZone, subZones]) => {
      allZones.push(macroZone);
      allZones.push(...subZones);
    });
    return allZones;
  };

  const handleZoneToggle = (zone: string) => {
    setSearchData(prev => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter(z => z !== zone)
        : [...prev.zones, zone]
    }));
  };

  const handleSelectAllZones = () => {
    const allZones = getAllZones();
    setSearchData(prev => ({
      ...prev,
      zones: prev.zones.length === allZones.length ? [] : [...allZones]
    }));
  };

  const handleMacroZoneToggle = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allZonesInMacro = [macroZone, ...subZones];

    const allSelected = allZonesInMacro.every(zone => searchData.zones.includes(zone));

    if (allSelected) {
      setSearchData(prev => ({
        ...prev,
        zones: prev.zones.filter(zone => !allZonesInMacro.includes(zone))
      }));
    } else {
      setSearchData(prev => ({
        ...prev,
        zones: [...new Set([...prev.zones, ...allZonesInMacro])]
      }));
    }
  };

  const toggleMacroZoneExpansion = (macroZone: string) => {
    setExpandedMacroZones(prev =>
      prev.includes(macroZone)
        ? prev.filter(zone => zone !== macroZone)
        : [...prev, macroZone]
    );
  };

  const isMacroZoneSelected = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allZonesInMacro = [macroZone, ...subZones];
    return allZonesInMacro.every(zone => searchData.zones.includes(zone));
  };

  const isMacroZonePartiallySelected = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allZonesInMacro = [macroZone, ...subZones];
    const selectedCount = allZonesInMacro.filter(zone => searchData.zones.includes(zone)).length;
    return selectedCount > 0 && selectedCount < allZonesInMacro.length;
  };

  const getFilteredMacroZones = () => {
    if (!zoneSearch) return Object.keys(romeZones);

    return Object.keys(romeZones).filter(macroZone => {
      const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
      const macroMatches = macroZone.toLowerCase().includes(zoneSearch.toLowerCase());
      const subZoneMatches = subZones.some(subZone =>
        subZone.toLowerCase().includes(zoneSearch.toLowerCase())
      );
      return macroMatches || subZoneMatches;
    });
  };

  const getFilteredSubZones = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    if (!zoneSearch) return subZones;

    return subZones.filter(subZone =>
      subZone.toLowerCase().includes(zoneSearch.toLowerCase())
    );
  };

  // Check if we should show business activity dropdown
  const shouldShowBusinessActivity = searchData.mainCategory === 'Commerciale' && 
                                   searchData.subCategory === 'Attività/Licenza commerciale';

  // Fix iOS Safari viewport height issue - calculate once on mount and don't recalculate
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    // Intentionally NOT listening to resize - we want the height to stay fixed
    // to prevent zoom effect when iOS Safari address bar hides/shows
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
      }
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target as Node)) {
        setShowZoneDropdown(false);
      }
    };

    if (showBusinessDropdown || showZoneDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBusinessDropdown, showZoneDropdown]);

  return (
    <section 
      ref={sectionRef}
      className={`relative flex justify-center overflow-y-auto transition-all duration-500 ${
        selectedAction ? 'items-start' : 'items-center'
      }`}
      style={{
        height: 'calc(var(--vh, 1vh) * 100)',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        maxHeight: 'calc(var(--vh, 1vh) * 100)'
      }}
      aria-labelledby="hero-heading"
    >
      {/* Fixed Background Layer - Using fixed viewport height to prevent iOS Safari zoom */}
      <div 
        className="absolute inset-0 w-full"
        style={{
          height: 'calc(var(--vh, 1vh) * 100)',
          backgroundImage: `linear-gradient(rgba(61, 40, 23, 0.3), rgba(61, 40, 23, 0.4)), url('https://readdy.ai/api/search-image?query=Elegant%20luxury%20apartment%20interior%20in%20Rome%20with%20classical%20architecture%20features%2C%20high%20ceilings%2C%20marble%20floors%2C%20and%20warm%20natural%20lighting%20streaming%20through%20large%20windows%2C%20sophisticated%20Italian%20design%20with%20neutral%20warm%20tones%2C%20minimalist%20modern%20furniture%2C%20creating%20an%20inviting%20atmosphere%20perfect%20for%20real%20estate%20photography&width=1200&height=600&seq=hero-bg-1&orientation=landscape')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          willChange: 'transform',
          zIndex: 0
        }}
      />
      {/* Structured Data for Property Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://mauluna.it/properties?action={action}&location={location}&type={type}",
              "actionPlatform": [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform"
              ]
            },
            "query-input": [
              "required name=action description=Choose rent or buy",
              "required name=location description=Location in Rome",
              "required name=type description=Property type"
            ],
            "object": {
              "@type": "RealEstateListing",
              "name": "Rome Real Estate Search",
              "description": "Search for apartments, houses, and villas for sale or rent in Rome"
            }
          })
        }}
      />
      
      {/* Content Layer - Above background */}
      <div className={`relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
        selectedAction 
          ? 'pt-[100px] pb-4 sm:pt-[120px] sm:pb-12' 
          : 'pt-8 pb-12 sm:pt-12 sm:pb-16'
      }`}>
        {/* Hero Title Section - Enhanced for initial view */}
        <div className={`text-center transition-all duration-500 ${
          selectedAction ? 'mb-3 sm:mb-8' : 'mb-6 sm:mb-10'
        }`}>
          <h1 className={`font-bold text-white leading-tight transition-all duration-500 ${
            selectedAction 
              ? 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-4' 
              : 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6'
          }`}>
            Prima Piattaforma 100% Gratuita a Roma
          </h1>
          
          {/* Subtitle - Only show in initial state */}
          {!selectedAction && (
            <div className="animate-in fade-in duration-500">
              <p className="text-white/90 text-lg sm:text-xl md:text-2xl font-light mb-3 sm:mb-4">
                Trova o Aggiungi il tuo immobile
              </p>
              <div className="flex items-center justify-center gap-3 text-white/80 text-sm sm:text-base">
                <span className="flex items-center gap-1.5">
                  <i className="ri-home-heart-line text-lg"></i>
                  Case
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <i className="ri-store-2-line text-lg"></i>
                  Attività
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-lg"></i>
                  Roma
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Enhanced */}
        <div className={`flex flex-col sm:flex-row justify-center transition-all duration-500 ${
          selectedAction 
            ? 'gap-2 mb-3 sm:mb-6' 
            : 'gap-3 sm:gap-4 mb-6 sm:mb-8'
        }`} role="group" aria-label="Property actions">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddProperty}
            className={`w-full sm:w-auto whitespace-nowrap transition-all duration-500 ${
              selectedAction 
                ? 'sm:min-w-[160px] text-base py-2 sm:py-3' 
                : 'sm:min-w-[200px] text-lg py-3 sm:py-4 shadow-lg hover:shadow-xl'
            }`}
            aria-label="Add your property to our listings"
          >
            <i className="ri-add-circle-line mr-2"></i>
            Aggiungi
          </Button>
          
          {/* Dropdown Button for Affitta/Acquista */}
          <div className="relative w-full sm:w-auto">
            <Button
              variant="cta"
              size="lg"
              onClick={toggleDropdown}
              className={`w-full sm:w-auto whitespace-nowrap transition-all duration-500 ${
                selectedAction 
                  ? 'sm:min-w-[160px] text-base py-2 sm:py-3' 
                  : 'sm:min-w-[200px] text-lg py-3 sm:py-4 shadow-lg hover:shadow-xl'
              } ${selectedAction ? 'ring-2 ring-white' : ''}`}
              aria-label="Choose to search for rental or purchase properties"
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              <i className="ri-search-line mr-2"></i>
              {selectedAction === 'rent' ? 'Affitta' : selectedAction === 'buy' ? 'Vendita' : 'Affitta/Vendita'}
              <i className={`ri-arrow-down-s-line ml-2 transition-transform ${showDropdown ? 'rotate-180' : ''}`} aria-hidden="true"></i>
            </Button>
            
            {/* Dropdown Menu - Compact */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-[60]">
                <button
                  onClick={() => handleActionClick('rent')}
                  className="w-full px-4 py-3 text-left text-[#3D2817] hover:bg-[#F9F6F3] transition-colors border-b border-gray-100 text-sm"
                  aria-label="Search for rental properties in Rome"
                >
                  Affitta
                </button>
                <button
                  onClick={() => handleActionClick('buy')}
                  className="w-full px-4 py-3 text-left text-[#3D2817] hover:bg-[#F9F6F3] transition-colors text-sm"
                  aria-label="Search for properties to buy in Rome"
                >
                  Vendita
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar - Compact Modern Design */}
        {selectedAction && (
          <div ref={formRef} className="animate-in slide-in-from-top-4 duration-300">
            {/* Compact Search Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 sm:p-5 shadow-2xl max-w-2xl mx-auto">
              <form onSubmit={handleSearch} role="search" aria-label={`Search for properties to ${selectedAction === 'rent' ? 'rent' : 'buy'} in Rome`}>
                <div className="space-y-1.5 sm:space-y-3">
                  {/* Top Row: Zone + Main Category */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2.5">
                    {/* Zone Selection - Compact */}
                    <div className="relative" ref={zoneDropdownRef}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#C47B5B] to-[#D97860] flex items-center justify-center flex-shrink-0">
                          <i className="ri-map-pin-line text-white text-sm"></i>
                        </div>
                        <span className="text-xs font-bold text-gray-700">Dove cerchi?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => isMobile ? setMobileDrawer('zone') : setShowZoneDropdown(!showZoneDropdown)}
                        className="w-full px-3 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all text-left flex items-center justify-between font-medium text-sm"
                        aria-expanded={isMobile ? false : showZoneDropdown}
                        aria-haspopup="true"
                      >
                        <span className="truncate">
                          {searchData.zones.length === 0 
                            ? 'Seleziona zona...'
                            : `${searchData.zones.length} zona${searchData.zones.length > 1 ? 'e' : ''}`
                          }
                        </span>
                        <i className={`ri-arrow-down-s-line text-lg text-[#D97860] transition-transform flex-shrink-0 ${!isMobile && showZoneDropdown ? 'rotate-180' : ''}`}></i>
                      </button>

                      {/* Dropdown Content - Desktop Only */}
                      {!isMobile && showZoneDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 bg-white border-2 border-gray-100 rounded-xl shadow-xl z-50 w-full sm:w-[450px] max-h-[190px] sm:max-h-[350px] overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-[#E8E4E0]">
                          <input
                            type="text"
                            placeholder="Cerca zone..."
                            value={zoneSearch}
                            onChange={(e) => setZoneSearch(e.target.value)}
                            className="w-full px-2.5 py-1 border border-[#E8E4E0] rounded-lg text-[#3D2817] focus:border-[#D97860] focus:ring-1 focus:ring-[#D97860]/20 transition-colors text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Select All Option */}
                        <div className="p-1 border-b border-[#E8E4E0]">
                          <label className="flex items-center space-x-2 p-1 hover:bg-[#F9F6F3] rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={searchData.zones.length === getAllZones().length}
                              onChange={handleSelectAllZones}
                              className="w-4 h-4 text-[#D97860] border-[#E8E4E0] rounded focus:ring-[#D97860] focus:ring-2"
                            />
                            <span className="text-xs font-medium text-[#3D2817]">
                              Tutta Roma ({getAllZones().length} zone)
                            </span>
                          </label>
                        </div>

                        {/* Hierarchical Zones List - Much smaller on mobile */}
                        <div className="overflow-y-auto h-[80px] sm:h-[200px]">
                          {getFilteredMacroZones().map((macroZone) => {
                            const subZones = getFilteredSubZones(macroZone);
                            const isExpanded = expandedMacroZones.includes(macroZone);
                            const hasVisibleSubZones = subZones.length > 0;

                            return (
                              <div key={macroZone}>
                                {/* Macro Zone */}
                                <div className="flex items-center px-2 py-1.5 hover:bg-[#F9F6F3] border-l-4 border-[#D97860]">
                                  {/* Expand/Collapse Button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleMacroZoneExpansion(macroZone)}
                                    className="w-7 h-7 flex items-center justify-center mr-1.5 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <i className={`ri-arrow-right-s-line text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}></i>
                                  </button>
                                  
                                  {/* Macro Zone Checkbox */}
                                  <label className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isMacroZoneSelected(macroZone)}
                                      ref={(el) => {
                                        if (el) {
                                          el.indeterminate = isMacroZonePartiallySelected(macroZone);
                                        }
                                      }}
                                      onChange={() => handleMacroZoneToggle(macroZone)}
                                      className="w-4 h-4 text-[#D97860] border-[#E8E4E0] rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                                    />
                                    <span className="text-sm font-medium text-[#3D2817] flex-1 truncate">
                                      {macroZone}
                                    </span>
                                    <span className="text-xs text-[#5C4B42] flex-shrink-0">
                                      ({(romeZones[macroZone as keyof typeof romeZones] || []).length + 1})
                                    </span>
                                  </label>
                                </div>
                                
                                {/* Sub Zones - Only show when expanded */}
                                {isExpanded && hasVisibleSubZones && (
                                  <div className="bg-gray-50">
                                    {subZones.map((subZone) => (
                                      <label
                                        key={subZone}
                                        className="flex items-center space-x-2 px-2 py-1.5 pl-10 hover:bg-[#F9F6F3] cursor-pointer min-w-0"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={searchData.zones.includes(subZone)}
                                          onChange={() => handleZoneToggle(subZone)}
                                          className="w-4 h-4 text-[#D97860] border-[#E8E4E0] rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                                        />
                                        <span className="text-sm text-[#3D2817] flex-1 truncate">
                                          {subZone}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Selected Count - Ultra Compact */}
                        {searchData.zones.length > 0 && (
                          <div className="p-1.5 border-t border-[#E8E4E0] bg-[#F9F6F3]">
                            <div className="flex flex-wrap gap-1">
                              {searchData.zones.slice(0, 2).map((zone) => (
                                <span
                                  key={zone}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-[#D97860] text-white"
                                >
                                  {zone.length > 10 ? `${zone.substring(0, 10)}...` : zone}
                                </span>
                              ))}
                              {searchData.zones.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                                  +{searchData.zones.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      )}
                    </div>

                    {/* Main Category - Compact */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#C47B5B] to-[#D97860] flex items-center justify-center flex-shrink-0">
                          <i className="ri-building-line text-white text-sm"></i>
                        </div>
                        <span className="text-xs font-bold text-gray-700">Cosa cerchi?</span>
                      </div>
                      <select
                        value={searchData.mainCategory}
                        onChange={(e) => handleMainCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all font-medium appearance-none cursor-pointer text-sm"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23D97860' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="">Tutte le categorie</option>
                        {Object.keys(propertyCategories).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subcategories - Compact */}
                  {searchData.mainCategory && (
                    <div className="p-3 bg-gradient-to-br from-[#FFF8F5] to-[#FAF7F2] rounded-lg border border-[#D97860]/20 space-y-2.5">
                      {/* Sub Category */}
                      {getSubCategories().length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <i className="ri-home-4-line text-[#D97860] text-base"></i>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tipo</span>
                          </div>
                          <select
                            value={searchData.subCategory}
                            onChange={(e) => handleSubCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all font-medium appearance-none cursor-pointer text-sm"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23D97860' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="">Tutti i tipi</option>
                            {getSubCategories().map((subCategory) => (
                              <option key={subCategory} value={subCategory}>
                                {subCategory}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Sub-Sub Category (Locali) */}
                      {searchData.subCategory && getSubSubCategories().length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <i className="ri-layout-grid-line text-[#D97860] text-base"></i>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Locali</span>
                          </div>
                          <select
                            value={searchData.subSubCategory}
                            onChange={(e) => handleSubSubCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all font-medium appearance-none cursor-pointer text-sm"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23D97860' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="">Tutti</option>
                            {getSubSubCategories().map((subSubCategory) => (
                              <option key={subSubCategory} value={subSubCategory}>
                                {subSubCategory}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Business Activities */}
                      {shouldShowBusinessActivity && (
                        <div className="relative" ref={businessDropdownRef}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <i className="ri-store-2-line text-[#D97860] text-base"></i>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Attività</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => isMobile ? setMobileDrawer('business') : setShowBusinessDropdown(!showBusinessDropdown)}
                            className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all text-left flex items-center justify-between font-medium text-sm"
                            aria-expanded={isMobile ? false : showBusinessDropdown}
                            aria-haspopup="true"
                          >
                            <span className="truncate">
                              {searchData.businessActivities.length === 0 
                                ? 'Seleziona attività...'
                                : `${searchData.businessActivities.length} selezionate`
                              }
                            </span>
                            <i className={`ri-arrow-down-s-line text-lg text-[#D97860] transition-transform flex-shrink-0 ${!isMobile && showBusinessDropdown ? 'rotate-180' : ''}`}></i>
                          </button>

                          {/* Dropdown Content - Desktop Only */}
                          {!isMobile && showBusinessDropdown && (
                            <div className="absolute top-full left-0 mt-1.5 bg-white border-2 border-gray-100 rounded-xl shadow-xl z-50 w-full sm:w-[380px] max-h-[180px] sm:max-h-[350px] overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-[#E8E4E0]">
                            <input
                              type="text"
                              placeholder="Cerca attività..."
                              value={businessSearch}
                              onChange={(e) => setBusinessSearch(e.target.value)}
                              className="w-full px-2.5 py-1 border border-[#E8E4E0] rounded-lg text-[#3D2817] focus:border-[#D97860] focus:ring-1 focus:ring-[#D97860]/20 transition-colors text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Select All Option */}
                          <div className="p-1 border-b border-[#E8E4E0]">
                            <label className="flex items-center space-x-2 p-1 hover:bg-[#F9F6F3] rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={searchData.businessActivities.length === filteredBusinessActivities.length && filteredBusinessActivities.length > 0}
                                onChange={handleSelectAllBusiness}
                                className="w-4 h-4 text-[#D97860] border-[#E8E4E0] rounded focus:ring-[#D97860] focus:ring-2"
                              />
                              <span className="text-xs font-medium text-[#3D2817]">
                                Seleziona Tutti ({filteredBusinessActivities.length})
                              </span>
                            </label>
                          </div>

                          {/* Business Activities List - Much smaller on mobile */}
                          <div className="overflow-y-auto h-[70px] sm:h-[180px]">
                            {filteredBusinessActivities.map((activity) => (
                              <label
                                key={activity}
                                className="flex items-center space-x-2 px-2 py-1 hover:bg-[#F9F6F3] cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={searchData.businessActivities.includes(activity)}
                                  onChange={() => handleBusinessActivityToggle(activity)}
                                  className="w-4 h-4 text-[#D97860] border-[#E8E4E0] rounded focus:ring-[#D97860] focus:ring-2"
                                />
                                <span className="text-xs text-[#3D2817] flex-1">
                                  {activity}
                                </span>
                              </label>
                            ))}
                          </div>

                          {/* Selected Count - Ultra Compact */}
                          {searchData.businessActivities.length > 0 && (
                            <div className="p-1.5 border-t border-[#E8E4E0] bg-[#F9F6F3]">
                              <div className="flex flex-wrap gap-1">
                                {searchData.businessActivities.slice(0, 2).map((activity) => (
                                  <span
                                    key={activity}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-[#D97860] text-white"
                                  >
                                    {activity.length > 10 ? `${activity.substring(0, 10)}...` : activity}
                                  </span>
                                ))}
                                {searchData.businessActivities.length > 2 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                                    +{searchData.businessActivities.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search Button - Compact */}
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#C47B5B] to-[#D97860] hover:from-[#B36A4A] hover:to-[#C86B54] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
                    aria-label={`Search for properties to ${selectedAction} in selected zones`}
                  >
                    <i className="ri-search-line text-lg sm:text-xl" aria-hidden="true"></i>
                    <span>Cerca Immobili</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Drawer - Zone Selection */}
      {isMobile && mobileDrawer === 'zone' && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDrawer(null)}></div>
          <div 
            className="absolute inset-0 bg-white flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ 
              touchAction: 'none',
              height: '100dvh'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#3D2817]">Dove cerchi?</h3>
              <button
                onClick={() => setMobileDrawer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            {/* Search - Sticky to prevent jumping */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cerca zone..."
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 pr-24 border-2 border-gray-200 rounded-xl text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors"
                  style={{ fontSize: '16px' }}
                />
                {zoneSearch && (
                  <button
                    onClick={() => {
                      setZoneSearch('');
                      const input = document.activeElement as HTMLElement;
                      input?.blur();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    Cancella
                  </button>
                )}
              </div>
            </div>

            {/* Select All */}
            <div className="px-4 py-3 border-b border-gray-100">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchData.zones.length === getAllZones().length}
                  onChange={handleSelectAllZones}
                  className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2"
                />
                <span className="text-sm font-semibold text-[#3D2817]">
                  Tutta Roma ({getAllZones().length} zone)
                </span>
              </label>
            </div>

            {/* Scrollable Zone List */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-2"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ 
                touchAction: 'pan-y',
                overscrollBehavior: 'none',
                WebkitOverflowScrolling: 'touch',
                position: 'relative'
              }}
            >
              {getFilteredMacroZones().map((macroZone) => {
                const subZones = getFilteredSubZones(macroZone);
                const isExpanded = expandedMacroZones.includes(macroZone);
                
                return (
                  <div key={macroZone} className="mb-2">
                    {/* Macro Zone */}
                    <div className="flex items-center min-h-[52px] px-3 py-2 rounded-lg hover:bg-gray-50 border-l-4 border-[#D97860]">
                      <button
                        type="button"
                        onClick={() => toggleMacroZoneExpansion(macroZone)}
                        className="w-10 h-10 flex items-center justify-center mr-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <i className={`ri-arrow-right-s-line text-xl transition-transform ${isExpanded ? 'rotate-90' : ''}`}></i>
                      </button>
                      
                      <label className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isMacroZoneSelected(macroZone)}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isMacroZonePartiallySelected(macroZone);
                            }
                          }}
                          onChange={() => handleMacroZoneToggle(macroZone)}
                          className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                        />
                        <span className="font-semibold text-[#3D2817] flex-1 truncate">
                          {macroZone}
                        </span>
                        <span className="text-sm text-gray-500 flex-shrink-0">
                          ({(romeZones[macroZone as keyof typeof romeZones] || []).length + 1})
                        </span>
                      </label>
                    </div>
                    
                    {/* Sub Zones */}
                    {isExpanded && subZones.length > 0 && (
                      <div className="ml-12 mt-1 space-y-1">
                        {subZones.map((subZone) => (
                          <label
                            key={subZone}
                            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer min-h-[48px]"
                          >
                            <input
                              type="checkbox"
                              checked={searchData.zones.includes(subZone)}
                              onChange={() => handleZoneToggle(subZone)}
                              className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                            />
                            <span className="text-[#3D2817] flex-1">
                              {subZone}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-gray-200 bg-white">
              <button
                onClick={() => setMobileDrawer(null)}
                className="w-full py-3.5 bg-gradient-to-r from-[#C47B5B] to-[#D97860] text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <i className="ri-check-line text-xl"></i>
                <span>Applica</span>
                {searchData.zones.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-white/30 rounded-full text-sm font-bold">
                    {searchData.zones.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Drawer - Business Activities */}
      {isMobile && mobileDrawer === 'business' && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDrawer(null)}></div>
          <div 
            className="absolute inset-0 bg-white flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ 
              touchAction: 'none',
              height: '100dvh'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#3D2817]">Seleziona Attività</h3>
              <button
                onClick={() => setMobileDrawer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            {/* Search - Sticky to prevent jumping */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cerca attività..."
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 pr-24 border-2 border-gray-200 rounded-xl text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors"
                  style={{ fontSize: '16px' }}
                />
                {businessSearch && (
                  <button
                    onClick={() => {
                      setBusinessSearch('');
                      const input = document.activeElement as HTMLElement;
                      input?.blur();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    Cancella
                  </button>
                )}
              </div>
            </div>

            {/* Select All */}
            <div className="px-4 py-3 border-b border-gray-100">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchData.businessActivities.length === filteredBusinessActivities.length && filteredBusinessActivities.length > 0}
                  onChange={handleSelectAllBusiness}
                  className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2"
                />
                <span className="text-sm font-semibold text-[#3D2817]">
                  Seleziona Tutti ({filteredBusinessActivities.length})
                </span>
              </label>
            </div>

            {/* Scrollable Activity List */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-2"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ 
                touchAction: 'pan-y',
                overscrollBehavior: 'none',
                WebkitOverflowScrolling: 'touch',
                position: 'relative'
              }}
            >
              {filteredBusinessActivities.map((activity) => (
                <label
                  key={activity}
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer min-h-[52px]"
                >
                  <input
                    type="checkbox"
                    checked={searchData.businessActivities.includes(activity)}
                    onChange={() => handleBusinessActivityToggle(activity)}
                    className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-[#3D2817] flex-1">
                    {activity}
                  </span>
                </label>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-gray-200 bg-white">
              <button
                onClick={() => setMobileDrawer(null)}
                className="w-full py-3.5 bg-gradient-to-r from-[#C47B5B] to-[#D97860] text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <i className="ri-check-line text-xl"></i>
                <span>Applica</span>
                {searchData.businessActivities.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-white/30 rounded-full text-sm font-bold">
                    {searchData.businessActivities.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
