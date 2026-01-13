'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import LoginModal from '@/components/feature/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { propertyFunctions, notificationFunctions, whatsappLeadsFunctions } from '@/lib/supabaseFunctions';
import { romeZones } from '@/mocks/properties';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';

// Zone Selector Component - SINGLE SELECTION with Mobile Full-Screen
const ZoneSelector = ({ selectedZone, onZoneChange }: { selectedZone: string, onZoneChange: (zone: string) => void }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(selectedZone);
  const [zoneSearch, setZoneSearch] = useState('');
  const [expandedMacroZones, setExpandedMacroZones] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if current zone is in the predefined list
  const isCustomZone = () => {
    if (!selectedZone) return false;
    return !Object.keys(romeZones).some(macroZone => {
      const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
      return subZones.includes(selectedZone);
    });
  };

  const getFilteredMacroZones = () => {
    const searchTerm = isMobile && showMobileDrawer ? zoneSearch : inputValue;
    if (!searchTerm) return Object.keys(romeZones);
    
    return Object.keys(romeZones).filter(macroZone => {
      const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
      const macroMatches = macroZone.toLowerCase().includes(searchTerm.toLowerCase());
      const subZoneMatches = subZones.some(subZone => 
        subZone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return macroMatches || subZoneMatches;
    });
  };

  const getFilteredSubZones = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const searchTerm = isMobile && showMobileDrawer ? zoneSearch : inputValue;
    if (!searchTerm) return subZones;
    
    return subZones.filter(subZone =>
      subZone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleZoneSelect = (zone: string) => {
    setInputValue(zone);
    onZoneChange(zone);
    setShowDropdown(false);
    setShowMobileDrawer(false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onZoneChange(value);
    if (!showDropdown && value && !isMobile) {
      setShowDropdown(true);
    }
  };

  const handleInputClick = () => {
    if (isMobile) {
      setShowMobileDrawer(true);
    } else {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    if (!isMobile) {
      setTimeout(() => {
        setShowDropdown(false);
      }, 200);
    }
  };

  const toggleMacroZoneExpansion = (macroZone: string) => {
    setExpandedMacroZones(prev => 
      prev.includes(macroZone)
        ? prev.filter(zone => zone !== macroZone)
        : [...prev, macroZone]
    );
  };

  useEffect(() => {
    setInputValue(selectedZone);
  }, [selectedZone]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, isMobile]);

  // Auto-expand macro zones when searching for sub-zones
  useEffect(() => {
    const searchTerm = isMobile && showMobileDrawer ? zoneSearch : inputValue;
    if (searchTerm) {
      // Find all macro zones that have matching sub-zones
      const macroZonesToExpand = Object.keys(romeZones).filter(macroZone => {
        const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
        return subZones.some(subZone => 
          subZone.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setExpandedMacroZones(macroZonesToExpand);
    } else {
      // Clear expansion when search is cleared
      setExpandedMacroZones([]);
    }
  }, [zoneSearch, inputValue, isMobile, showMobileDrawer]);

  const hasMatches = getFilteredMacroZones().length > 0;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputClick}
            onClick={handleInputClick}
            onBlur={handleInputBlur}
            placeholder="Cerca o scrivi una zona..."
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors"
            readOnly={isMobile}
          />
          <i className={`ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform pointer-events-none ${showDropdown || showMobileDrawer ? 'rotate-180' : ''}`}></i>
          {isCustomZone() && selectedZone && (
            <span className="absolute -top-2 right-2 bg-[#14B8A6] text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              Zona personalizzata
            </span>
          )}
        </div>

        {/* Desktop Dropdown */}
        {!isMobile && showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-[350px] overflow-hidden">
          {hasMatches ? (
            <div className="overflow-y-auto max-h-[350px] scrollbar-hide">
              {getFilteredMacroZones().map((macroZone) => {
              const subZones = getFilteredSubZones(macroZone);
              const isExpanded = expandedMacroZones.includes(macroZone);
              const hasVisibleSubZones = subZones.length > 0;
              
              return (
                <div key={macroZone}>
                  <div className="flex items-center p-2 hover:bg-gray-50 border-l-4 border-[#D97860]">
                    <button
                      type="button"
                      onClick={() => toggleMacroZoneExpansion(macroZone)}
                      className="w-8 h-8 flex items-center justify-center mr-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      <i className={`ri-arrow-right-s-line text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}></i>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleZoneSelect(macroZone)}
                      className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 text-left"
                    >
                      <span className={`text-sm font-medium flex-1 truncate ${selectedZone === macroZone ? 'text-[#D97860]' : 'text-[#3D2817]'}`}>
                        {macroZone}
                      </span>
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        ({(romeZones[macroZone as keyof typeof romeZones] || []).length + 1})
                      </span>
                    </button>
                  </div>
                  
                  {isExpanded && hasVisibleSubZones && (
                    <div className="bg-gray-50">
                      {subZones.map((subZone) => (
                        <button
                          key={subZone}
                          type="button"
                          onClick={() => handleZoneSelect(subZone)}
                          className="flex items-center space-x-3 p-2 pl-12 hover:bg-gray-100 cursor-pointer min-w-0 w-full text-left"
                        >
                          <span className={`text-sm flex-1 truncate ${selectedZone === subZone ? 'text-[#D97860] font-medium' : 'text-[#3D2817]'}`}>
                            {subZone}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          ) : inputValue ? (
            <div className="p-6 text-center">
              <i className="ri-edit-line text-4xl text-[#14B8A6] mb-2"></i>
              <p className="text-sm font-medium text-[#3D2817] mb-1">
                Nessuna zona trovata
              </p>
              <p className="text-xs text-gray-600">
                La zona &quot;<span className="font-semibold text-[#D97860]">{inputValue}</span>&quot; verrà salvata come zona personalizzata
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              Digita per cercare o aggiungere una zona
            </div>
          )}
        </div>
        )}
      </div>

      {/* Mobile Full-Screen Drawer */}
      {isMobile && showMobileDrawer && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileDrawer(false)}></div>
          <div 
            className="absolute inset-0 bg-white flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              touchAction: 'auto',
              height: '100dvh'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-[#3D2817]">Seleziona Zona</h3>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            {/* Search - Sticky */}
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
                    onClick={() => setZoneSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    Cancella
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Zone List */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide"
              style={{ 
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {hasMatches ? (
                getFilteredMacroZones().map((macroZone) => {
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
                        
                        <button
                          type="button"
                          onClick={() => handleZoneSelect(macroZone)}
                          className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 text-left"
                        >
                          <span className={`font-semibold flex-1 truncate ${selectedZone === macroZone ? 'text-[#D97860]' : 'text-[#3D2817]'}`}>
                            {macroZone}
                          </span>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            ({(romeZones[macroZone as keyof typeof romeZones] || []).length + 1})
                          </span>
                        </button>
                      </div>
                      
                      {/* Sub Zones */}
                      {isExpanded && subZones.length > 0 && (
                        <div className="ml-12 mt-1 space-y-1">
                          {subZones.map((subZone) => (
                            <button
                              key={subZone}
                              type="button"
                              onClick={() => handleZoneSelect(subZone)}
                              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer min-h-[48px] w-full text-left"
                            >
                              <span className={`flex-1 ${selectedZone === subZone ? 'text-[#D97860] font-medium' : 'text-[#3D2817]'}`}>
                                {subZone}
                              </span>
                              {selectedZone === subZone && (
                                <i className="ri-check-line text-xl text-[#D97860]"></i>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : zoneSearch ? (
                <div className="p-6 text-center">
                  <i className="ri-edit-line text-4xl text-[#14B8A6] mb-2"></i>
                  <p className="text-sm font-medium text-[#3D2817] mb-1">
                    Nessuna zona trovata
                  </p>
                  <p className="text-xs text-gray-600">
                    La zona &quot;<span className="font-semibold text-[#D97860]">{zoneSearch}</span>&quot; verrà salvata come zona personalizzata
                  </p>
                  <button
                    onClick={() => {
                      handleZoneSelect(zoneSearch);
                    }}
                    className="mt-4 px-6 py-2 bg-[#14B8A6] text-white font-medium rounded-lg hover:bg-[#0F9B8E] transition-colors"
                  >
                    Usa questa zona
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Digita per cercare o aggiungere una zona
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-gray-200 bg-white">
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="w-full py-3.5 bg-gradient-to-r from-[#C47B5B] to-[#D97860] text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <i className="ri-check-line text-xl"></i>
                <span>Applica</span>
                {selectedZone && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                    {isCustomZone() ? 'Personalizzata' : '1 selezionata'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Business Activities Selector Component
const BusinessActivitiesSelector = ({ 
  selectedActivities, 
  onActivitiesChange 
}: { 
  selectedActivities: string[], 
  onActivitiesChange: (activities: string[]) => void 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredActivities = businessActivities.filter(activity =>
    activity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleActivityToggle = (activity: string) => {
    onActivitiesChange(
      selectedActivities.includes(activity)
        ? selectedActivities.filter(a => a !== activity)
        : [...selectedActivities, activity]
    );
  };

  const handleSelectAll = () => {
    onActivitiesChange(
      selectedActivities.length === filteredActivities.length && filteredActivities.length > 0
        ? []
        : [...filteredActivities]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors text-left flex items-center justify-between"
      >
        <span className="truncate">
          {selectedActivities.length === 0 
            ? 'Seleziona attività commerciali'
            : `${selectedActivities.length} attività selezionata${selectedActivities.length > 1 ? 'e' : ''}`
          }
        </span>
        <i className={`ri-arrow-down-s-line transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-[350px]">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Cerca attività..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="p-2 border-b border-gray-200">
            <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedActivities.length === filteredActivities.length && filteredActivities.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-[#D97860] border-gray-300 rounded focus:ring-[#D97860] focus:ring-2"
              />
              <span className="text-sm font-medium text-[#3D2817]">
                Seleziona tutte ({filteredActivities.length})
              </span>
            </label>
          </div>

          <div className="overflow-y-auto max-h-[200px]">
            {filteredActivities.map((activity) => (
              <label
                key={activity}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(activity)}
                  onChange={() => handleActivityToggle(activity)}
                  className="w-4 h-4 text-[#D97860] border-gray-300 rounded focus:ring-[#D97860] focus:ring-2"
                />
                <span className="text-sm text-[#3D2817] flex-1">
                  {activity}
                </span>
              </label>
            ))}
          </div>

          {selectedActivities.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedActivities.slice(0, 3).map((activity) => (
                  <span
                    key={activity}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#D97860] text-white"
                  >
                    {activity.length > 15 ? `${activity.substring(0, 15)}...` : activity}
                  </span>
                ))}
                {selectedActivities.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                    +{selectedActivities.length - 3} altre
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, onAddAnother }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAddAnother: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl animate-scaleIn border-2 border-gray-200">
        <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mx-auto mb-5 shadow-lg animate-bounce">
          <i className="ri-check-double-line text-4xl text-white"></i>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Proprietà Inviata!
        </h2>
        
        <p className="text-gray-700 mb-7 leading-relaxed font-medium">
          La tua proprietà è stata inviata per verifica e approvazione dell'amministratore. Sarà approvata a breve.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onAddAnother}
            className="group w-full px-6 py-4 bg-gradient-to-r from-[#D97860] to-[#C86B54] text-white rounded-xl hover:from-[#C86B54] hover:to-[#B85A44] transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 font-bold shadow-lg shadow-[#D97860]/30 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <i className="ri-add-line text-xl group-hover:rotate-90 transition-transform duration-300"></i>
            Aggiungi un'altra proprietà
          </button>
          
          <button
            onClick={onClose}
            className="group w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 cursor-pointer whitespace-nowrap font-semibold flex items-center justify-center gap-2"
          >
            <span>Torna al Profilo</span>
            <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform duration-300"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// Category-specific filter options - ENHANCED
const filterOptions = {
  condition: ['Nuovo', 'Eccellente', 'Buono', 'Ristrutturato', 'Da ristrutturare'],
  energyClass: ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
  
  // RESIDENTIAL FEATURES (Case-Appartamenti)
  residentialFeatures: [
    'Balcone',
    'Terrazza',
    'Giardino',
    'Parcheggio',
    'Ascensore',
    'Cantina',
    'Soffitta',
    'Camino',
    'Aria condizionata',
    'Riscaldamento autonomo',
    'Riscaldamento centralizzato',
    'Doppi vetri',
    'Porta blindata',
    'Videocitofono',
    'Allarme',
    'Fibra ottica',
    'Arredato',
    'Cucina abitabile',
    'Angolo cottura',
    'Ripostiglio',
    'Lavanderia',
    'Idromassaggio',
    'Sauna',
    'Palestra condominiale',
    'Piscina condominiale',
    'Portineria',
    'Parquet',
    'Marmo',
    'Caminetto',
    'Veranda',
    'Mansarda',
    'Taverna'
  ],
  
  // COMMERCIAL FEATURES (Commerciale)
  commercialFeatures: [
    'Vetrina',
    'Doppio ingresso',
    'Bagno per disabili',
    'Aria condizionata',
    'Riscaldamento',
    'Canna fumaria',
    'Impianto di aerazione',
    'Allarme',
    'Videosorveglianza',
    'Serranda elettrica',
    'Insegna luminosa',
    'Magazzino/Deposito',
    'Retrobottega',
    'Parcheggio clienti',
    'Carico/scarico merci',
    'Montacarichi',
    'Cella frigorifera',
    'Cucina professionale',
    'Licenza somministrazione',
    'Dehors/Plateatico',
    'Wi-Fi',
    'Impianto audio',
    'Climatizzazione'
  ],
  
  // OFFICE FEATURES (Ufficio)
  officeFeatures: [
    'Reception',
    'Sala riunioni',
    'Open space',
    'Uffici singoli',
    'Aria condizionata',
    'Riscaldamento',
    'Fibra ottica',
    'Cablaggio strutturato',
    'Centralino telefonico',
    'Allarme',
    'Videosorveglianza',
    'Controllo accessi',
    'Ascensore',
    'Montacarichi',
    'Parcheggio dipendenti',
    'Parcheggio visitatori',
    'Mensa/Area ristoro',
    'Bagni per disabili',
    'Archivio',
    'Server room',
    'Terrazza/Balcone',
    'Arredato',
    'Pavimento flottante',
    'Controsoffitto'
  ],
  
  // GARAGE FEATURES (Garage-Posti auto)
  garageFeatures: [
    'Box chiuso',
    'Posto auto coperto',
    'Posto auto scoperto',
    'Cancello automatico',
    'Videosorveglianza',
    'Illuminazione',
    'Presa elettrica',
    'Colonnina ricarica auto elettriche',
    'Accesso 24h',
    'Custode',
    'Altezza veicolo (per furgoni)',
    'Rampa accesso',
    'Montauto',
    'Doppio box',
    'Ripostiglio/Cantina annessa'
  ],
  
  // LAND FEATURES (Terreni)
  landFeatures: [
    'Edificabile',
    'Agricolo',
    'Pianeggiante',
    'Collinare',
    'Recintato',
    'Accesso carrabile',
    'Pozzo',
    'Irrigazione',
    'Elettricità',
    'Acqua',
    'Gas',
    'Fognature',
    'Vista panoramica',
    'Alberi da frutto',
    'Uliveto',
    'Vigneto',
    'Bosco',
    'Rudere da ristrutturare',
    'Progetto approvato'
  ],
  
  // WAREHOUSE FEATURES (Magazzini-Depositi)
  warehouseFeatures: [
    'Altezza soffitto (3-6m)',
    'Altezza soffitto (6-10m)',
    'Altezza soffitto (>10m)',
    'Portone carrabile',
    'Rampa carico/scarico',
    'Montacarichi',
    'Gru/Carroponte',
    'Pavimento industriale',
    'Uffici annessi',
    'Bagni/Spogliatoi',
    'Riscaldamento',
    'Illuminazione naturale',
    'Impianto antincendio',
    'Videosorveglianza',
    'Allarme',
    'Parcheggio mezzi pesanti',
    'Piazzale manovra',
    'Celle frigorifere',
    'Scaffalature'
  ],
  
  // INDUSTRIAL FEATURES (Capannoni)
  industrialFeatures: [
    'Altezza soffitto (6-10m)',
    'Altezza soffitto (10-15m)',
    'Altezza soffitto (>15m)',
    'Portoni industriali',
    'Banchina carico/scarico',
    'Carroponte',
    'Gru',
    'Pavimento industriale',
    'Uffici annessi',
    'Spogliatoi',
    'Mensa',
    'Riscaldamento',
    'Climatizzazione',
    'Impianto antincendio',
    'Impianto elettrico industriale',
    'Cabina elettrica',
    'Compressore',
    'Piazzale esterno',
    'Parcheggio dipendenti',
    'Recinzione',
    'Videosorveglianza',
    'Certificazioni (ISO, etc.)'
  ]
};

const AddListingPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeSection, setActiveSection] = useState('owner');
  
  // Refs for section scrolling
  const ownerSectionRef = useRef<HTMLDivElement>(null);
  const basicSectionRef = useRef<HTMLDivElement>(null);
  const categorySectionRef = useRef<HTMLDivElement>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  const descriptionSectionRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const imagesSectionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    sub_category: '',
    sub_sub_category: '',
    listing_type: 'buy',
    price: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    zone: '',
    condition: '',
    floor: '',
    energy_class: '',
    features: [] as string[],
    business_activities: [] as string[],
    visibility: '',
    commercial_type: '',
    office_type: '',
    services: [] as string[],
    garage_type: '',
    security: [] as string[],
    access: '',
    land_type: '',
    building_rights: [] as string[],
    utilities: [] as string[],
    available_from: new Date().toISOString().split('T')[0],
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_whatsapp: '',
  });

  const propertyCategories = {
    'Case-Appartamenti': {
      'Appartamento': ['Monolocale', 'Bilocale', 'Trilocale', 'Quadrilocale', '5 locali o più / Loft'],
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
    'Ufficio': {},
    'Garage-Posti auto': {},
    'Magazzini-Depositi': {},
    'Capannoni': {},
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

  const [_selectedMainCategory, setSelectedMainCategory] = useState('');
  const [_selectedSubCategory, setSelectedSubCategory] = useState('');
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressError, setAddressError] = useState<string>('');
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);

  // Initialize Google Places Autocomplete for address field using AutocompleteService
  useEffect(() => {
    if (!addressInputRef.current) return;

    let autocompleteService: google.maps.places.AutocompleteService | null = null;
    let placesService: google.maps.places.PlacesService | null = null;
    let suggestionsContainer: HTMLElement | null = null;
    let inputTimeout: NodeJS.Timeout;
    let isSelectingSuggestion = false;

    const initServices = async () => {
      try {
        // Load Google Maps API first
        await loadGoogleMaps();
        
        // Wait for Places API to be ready
        const waitForPlaces = () => {
          return new Promise<void>((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            const check = () => {
              if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                resolve();
              } else if (attempts >= maxAttempts) {
                reject(new Error('Google Places API failed to load'));
              } else {
                attempts++;
                setTimeout(check, 100);
              }
            };
            check();
          });
        };
        
        await waitForPlaces();

        autocompleteService = new google.maps.places.AutocompleteService();
        placesService = new google.maps.places.PlacesService(document.createElement('div'));
      } catch (error) {
        setAddressError('Errore nel caricamento del servizio di indirizzi. Riprova.');
      }
    };

    const validateAddress = async (address: string): Promise<boolean> => {
      if (!address || address.length < 3) {
        setAddressError('');
        return true;
      }

      if (!autocompleteService) {
        await new Promise(resolve => {
          const check = () => {
            if (typeof google !== 'undefined' && google.maps && google.maps.places) {
              autocompleteService = new google.maps.places.AutocompleteService();
              resolve(true);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      }

      return new Promise((resolve) => {
        if (!autocompleteService) {
          resolve(false);
          return;
        }

        setIsValidatingAddress(true);
        setAddressError('');

        autocompleteService.getPlacePredictions(
          {
            input: address,
            componentRestrictions: { country: 'it' },
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(41.7, 12.3),
              new google.maps.LatLng(42.0, 12.7)
            ),
          },
          (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
            setIsValidatingAddress(false);
            
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
              const romePredictions = predictions.filter((pred: google.maps.places.AutocompletePrediction) => 
                pred.description.toLowerCase().includes('roma') || 
                pred.description.toLowerCase().includes('rome')
              );
              
              if (romePredictions.length === 0) {
                setAddressError('L\'indirizzo deve essere a Roma. Seleziona un indirizzo valido a Roma.');
                resolve(false);
                return;
              }
              
              const addressLower = address.toLowerCase();
              const hasCloseMatch = romePredictions.some((pred: google.maps.places.AutocompletePrediction) => {
                const predLower = pred.description.toLowerCase();
                return predLower.includes(addressLower) || addressLower.includes(pred.description.split(',')[0].toLowerCase());
              });
              
              if (hasCloseMatch) {
                setAddressError('');
                resolve(true);
              } else {
                setAddressError('Indirizzo non trovato. Seleziona un suggerimento dalla lista.');
                resolve(false);
              }
            } else {
              setAddressError('Indirizzo non valido. Seleziona un suggerimento dalla lista.');
              resolve(false);
            }
          }
        );
      });
    };

    const showSuggestions = (input: string) => {
      if (!autocompleteService || !addressInputRef.current) return;
      
      if (suggestionsContainer) {
        suggestionsContainer.remove();
        suggestionsContainer = null;
      }
      
      if (input.length < 3) {
        setAddressError('');
        return;
      }
      
      autocompleteService.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: 'it' },
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(41.7, 12.3),
            new google.maps.LatLng(42.0, 12.7)
          ),
        },
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions || !addressInputRef.current) {
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setAddressError('Nessun indirizzo trovato. Prova con un altro indirizzo.');
            }
            return;
          }
          
          setAddressError('');
          
          suggestionsContainer = document.createElement('div');
          suggestionsContainer.id = 'address-suggestions';
          suggestionsContainer.className = 'absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto';
          suggestionsContainer.style.top = '100%';
          suggestionsContainer.style.left = '0';
          suggestionsContainer.style.width = '100%';
          
          predictions.slice(0, 5).forEach((prediction: google.maps.places.AutocompletePrediction) => {
            const item = document.createElement('div');
            item.className = 'px-4 py-3 hover:bg-[#14B8A6]/10 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors';
            item.innerHTML = `
              <div class="font-medium text-gray-900">${prediction.structured_formatting.main_text}</div>
              <div class="text-xs text-gray-500 mt-0.5">${prediction.structured_formatting.secondary_text}</div>
            `;
            
            const handleSelection = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              isSelectingSuggestion = true;
              
              const containerToClose = suggestionsContainer;
              if (containerToClose) {
                containerToClose.remove();
                suggestionsContainer = null;
              }
              
              if (!placesService || !prediction.place_id) {
                setTimeout(() => { isSelectingSuggestion = false; }, 300);
                return;
              }
              
              if (addressInputRef.current) {
                addressInputRef.current.disabled = true;
                addressInputRef.current.placeholder = 'Caricamento...';
              }
              
              placesService.getDetails(
                { placeId: prediction.place_id, fields: ['formatted_address', 'address_components', 'geometry', 'name'] },
                (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
                  if (addressInputRef.current) {
                    addressInputRef.current.disabled = false;
                    addressInputRef.current.placeholder = 'es. Via del Corso';
                  }
                  
                  if (status === google.maps.places.PlacesServiceStatus.OK && place && place.formatted_address) {
                    const addressComponents = (place.address_components ?? []) as NonNullable<google.maps.places.PlaceResult['address_components']>;
                    
                    const city = addressComponents.find((comp) =>
                      comp.types.includes('locality') || comp.types.includes('administrative_area_level_3')
                    )?.long_name || '';
                    
                    const isInRome = city.toLowerCase() === 'roma' || city.toLowerCase() === 'rome' || 
                                    place.formatted_address.toLowerCase().includes('roma') ||
                                    place.formatted_address.toLowerCase().includes('rome');
                    
                    if (!isInRome) {
                      setAddressError('L\'indirizzo deve essere a Roma. Seleziona un indirizzo valido a Roma.');
                      if (addressInputRef.current) {
                        addressInputRef.current.value = '';
                      }
                      setFormData(prev => ({ ...prev, address: '', latitude: null, longitude: null }));
                      setTimeout(() => { isSelectingSuggestion = false; }, 300);
                      return;
                    }
                    
                    let streetAddress = place.formatted_address;
                    
                    const streetNumber = addressComponents.find((comp) => 
                      comp.types.includes('street_number')
                    )?.long_name;
                    const route = addressComponents.find((comp) => 
                      comp.types.includes('route')
                    )?.long_name;
                    
                    if (route) {
                      streetAddress = streetNumber ? `${route} ${streetNumber}` : route;
                    } else {
                      streetAddress = streetAddress
                        .replace(/,?\s*Roma,?\s*/i, '')
                        .replace(/,?\s*Lazio,?\s*/i, '')
                        .replace(/,?\s*Italia,?\s*/i, '')
                        .replace(/,?\s*[0-9]{5},?\s*/i, '')
                        .trim();
                    }
                    
                    const lat = place.geometry?.location?.lat() || null;
                    const lng = place.geometry?.location?.lng() || null;
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      address: streetAddress,
                      latitude: lat,
                      longitude: lng
                    }));
                    setAddressError('');
                    
                    if (addressInputRef.current) {
                      addressInputRef.current.value = streetAddress;
                    }
                  }
                  
                  setTimeout(() => { isSelectingSuggestion = false; }, 300);
                }
              );
            };
            
            item.addEventListener('touchstart', handleSelection, { passive: false });
            item.addEventListener('mousedown', handleSelection);
            
            if (suggestionsContainer) {
              suggestionsContainer.appendChild(item);
            }
          });
          
          if (addressInputRef.current) {
            const parent = addressInputRef.current.parentElement;
            if (parent) {
              parent.style.position = 'relative';
              parent.appendChild(suggestionsContainer);
            }
          }
        }
      );
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        showSuggestions(target.value);
      }, 300);
    };

    const handleBlur = async (e: Event) => {
      if (isSelectingSuggestion) return;
      
      const target = e.target as HTMLInputElement;
      if (target.value.trim().length >= 3) {
        await validateAddress(target.value);
      }
    };

    initServices();
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (isSelectingSuggestion) return;
      
      const target = e.target as Node;
      
      if (suggestionsContainer && 
          !suggestionsContainer.contains(target) && 
          addressInputRef.current && 
          !addressInputRef.current.contains(target)) {
        setTimeout(() => {
          if (suggestionsContainer && !isSelectingSuggestion) {
            suggestionsContainer.remove();
            suggestionsContainer = null;
          }
        }, 150);
      }
    };
    
    if (addressInputRef.current) {
      addressInputRef.current.addEventListener('input', handleInput);
      addressInputRef.current.addEventListener('blur', handleBlur);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      clearTimeout(inputTimeout);
      if (suggestionsContainer) {
        suggestionsContainer.remove();
        suggestionsContainer = null;
      }
      if (addressInputRef.current) {
        addressInputRef.current.removeEventListener('input', handleInput);
        addressInputRef.current.removeEventListener('blur', handleBlur);
      }
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'property_type') {
      setFormData(prev => ({ 
        ...prev, 
        property_type: value,
        sub_category: '', 
        sub_sub_category: '',
        business_activities: []
      }));
      setSelectedMainCategory(value);
      setSelectedSubCategory('');
    }
    if (field === 'sub_category') {
      setFormData(prev => ({ 
        ...prev, 
        sub_category: value,
        sub_sub_category: ''
      }));
      setSelectedSubCategory(value);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allFiles = Array.from(files);
    setImages(prev => [...prev, ...allFiles].slice(0, 50));
    setError('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner_name.trim()) {
      setError('Il nome del proprietario è obbligatorio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.address.trim()) {
      setError('L\'indirizzo è obbligatorio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.address.trim().length < 5) {
      setError('Inserisci un indirizzo completo (es. Via del Corso 123)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (addressError) {
      setError('Per favore, seleziona un indirizzo valido dai suggerimenti');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const hasEmail = formData.owner_email.trim() !== '';
    const hasPhone = formData.owner_phone.trim() !== '';
    const hasWhatsApp = formData.owner_whatsapp.trim() !== '';

    if (!hasEmail && !hasPhone && !hasWhatsApp) {
      setError('Devi fornire almeno un metodo di contatto: Email, Telefono o WhatsApp');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.owner_email.trim())) {
        setError('Formato email non valido');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (hasPhone) {
      const cleaned = formData.owner_phone.replace(/[\s\-\(\)]/g, '');
      const digitsOnly = cleaned.replace(/\+/g, '');
      
      if (digitsOnly.length < 5 || digitsOnly.length > 20) {
        setError('Inserisci un numero di telefono valido');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (hasWhatsApp) {
      const cleaned = formData.owner_whatsapp.replace(/[\s\-\(\)]/g, '');
      const digitsOnly = cleaned.replace(/\+/g, '');
      
      if (digitsOnly.length < 5 || digitsOnly.length > 20) {
        setError('Inserisci un numero WhatsApp valido');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const priceNum = parseFloat(formData.price.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
    const minPrice = formData.listing_type === 'rent' ? 250 : 20000;
    const priceType = formData.listing_type === 'rent' ? 'affitto mensile' : 'vendita';
    
    if (isNaN(priceNum) || priceNum < minPrice) {
      setError(`Il prezzo minimo per ${priceType} è €${minPrice.toLocaleString('it-IT')}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (images.length < 3) {
      setError('Carica almeno 3 immagini della proprietà');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await submitProperty();
  };

  const submitProperty = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user) {
        setError('Devi essere autenticato per pubblicare un annuncio');
        setLoading(false);
        return;
      }

      const imageUrls: string[] = [];
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
          const filePath = fileName;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            imageUrls.push(urlData.publicUrl);
          }
        }
      }

      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        sub_category: formData.sub_category || null,
        sub_sub_category: formData.sub_sub_category || null,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        sqm: formData.area ? parseFloat(formData.area) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city: 'Roma',
        zone: formData.zone || null,
        floor: formData.floor || null,
        condition: formData.condition || null,
        energy_class: formData.energy_class || null,
        features: formData.features || [],
        business_activities: formData.business_activities || [],
        owner_name: formData.owner_name,
        owner_email: formData.owner_email || null,
        owner_phone: formData.owner_phone || null,
        owner_whatsapp: formData.owner_whatsapp || null,
        available_from: formData.available_from || null,
        images: imageUrls,
      };

      const property = await propertyFunctions.create(propertyData);

      if (!property || !property.id) {
        throw new Error('Errore: la proprietà non è stata creata correttamente');
      }

      try {
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('is_admin', true);

        if (admins && admins.length > 0) {
          const notifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'new_property',
            title: 'Nuova Proprietà In Attesa',
            message: `Una nuova proprietà "${property.title}" è in attesa di approvazione.`,
            link: `/admin`,
            is_read: false
          }));

          for (const notification of notifications) {
            await notificationFunctions.create(notification).catch(() => {});
          }
        }
      } catch (notificationError) {
        // Silent fail
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione dell\'annuncio');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setTimeout(() => {
      submitProperty();
    }, 100);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/profile');
  };

  const handleAddAnother = () => {
    setShowSuccessModal(false);
    setFormData({
      title: '',
      description: '',
      property_type: '',
      sub_category: '',
      sub_sub_category: '',
      listing_type: 'buy',
      price: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      address: '',
      latitude: null,
      longitude: null,
      zone: '',
      condition: '',
      floor: '',
      energy_class: '',
      features: [],
      business_activities: [],
      visibility: '',
      commercial_type: '',
      office_type: '',
      services: [],
      garage_type: '',
      security: [],
      access: '',
      land_type: '',
      building_rights: [],
      utilities: [],
      available_from: new Date().toISOString().split('T')[0],
      owner_name: '',
      owner_email: '',
      owner_phone: '',
      owner_whatsapp: '',
    });
    setImages([]);
    setError('');
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSubCategories = () => {
    if (!formData.property_type) return [];
    const category = propertyCategories[formData.property_type as keyof typeof propertyCategories];
    return typeof category === 'object' && Object.keys(category).length > 0 ? Object.keys(category) : [];
  };

  const getSubSubCategories = () => {
    if (!formData.property_type || !formData.sub_category) return [];
    const mainCat = propertyCategories[formData.property_type as keyof typeof propertyCategories];
    if (!mainCat || typeof mainCat !== 'object') return [];
    return (mainCat as any)[formData.sub_category] || [];
  };

  const shouldShowBusinessActivities = formData.property_type === 'Commerciale' && 
                                       formData.sub_category === 'Attività/Licenza commerciale';

  const handleWhatsAppContact = async () => {
    const message = "Ciao! Voglio pubblicare la mia proprietà GRATUITAMENTE su Mauluna Immobiliare. Ecco i dettagli della mia proprietà a Roma:";
    const whatsappUrl = `https://wa.me/393508818666?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    try {
      await whatsappLeadsFunctions.trackClick({
        context: 'add_listing',
        messagePreview: message,
      });
    } catch (err) {
      // Silent fail
    }
  };

  const calculateProgress = () => {
    const fields = [
      formData.owner_name,
      formData.title,
      formData.listing_type,
      formData.price,
      formData.property_type,
      formData.address,
      formData.zone,
      formData.area,
      images.length > 0
    ];
    const completed = fields.filter(field => field && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const scrollToSection = (sectionId: string) => {
    const refs: { [key: string]: React.RefObject<HTMLDivElement | null> } = {
      owner: ownerSectionRef,
      basic: basicSectionRef,
      category: categorySectionRef,
      location: locationSectionRef,
      details: detailsSectionRef,
      description: descriptionSectionRef,
      features: featuresSectionRef,
      images: imagesSectionRef,
    };
    
    const ref = refs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'owner', ref: ownerSectionRef },
        { id: 'basic', ref: basicSectionRef },
        { id: 'category', ref: categorySectionRef },
        { id: 'location', ref: locationSectionRef },
        { id: 'details', ref: detailsSectionRef },
        { id: 'description', ref: descriptionSectionRef },
        { id: 'features', ref: featuresSectionRef },
        { id: 'images', ref: imagesSectionRef },
      ];

      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const offsetTop = section.ref.current.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const progress = calculateProgress();
  
  const sections = [
    { id: 'owner', label: 'Proprietario', icon: 'ri-user-line', number: 1 },
    { id: 'basic', label: 'Informazioni Base', icon: 'ri-information-line', number: 2 },
    { id: 'category', label: 'Categoria', icon: 'ri-home-4-line', number: 3 },
    { id: 'location', label: 'Posizione', icon: 'ri-map-pin-line', number: 4 },
    { id: 'details', label: 'Dettagli', icon: 'ri-ruler-line', number: 5 },
    { id: 'description', label: 'Descrizione', icon: 'ri-file-text-line', number: 6 },
    { id: 'features', label: 'Caratteristiche', icon: 'ri-star-line', number: 7 },
    { id: 'images', label: 'Foto', icon: 'ri-image-line', number: 8 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Desktop Layout: Sidebar + Main Content */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-6">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <i className="ri-bar-chart-box-line text-[#D97860]"></i>
                      Progresso
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-[#D97860] via-[#C86B54] to-[#C9A876] h-4 rounded-full transition-all duration-500 shadow-md relative overflow-hidden"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600">{progress}% completato</p>
                      <span className="text-xs font-bold text-[#D97860] bg-[#D97860]/10 px-2 py-1 rounded-full">{progress}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <i className="ri-list-check text-[#D97860]"></i>
                      Sezioni
                    </h3>
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-[#D97860] to-[#C86B54] text-white shadow-lg shadow-[#D97860]/30 scale-105'
                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          activeSection === section.id
                            ? 'bg-white text-[#D97860] shadow-md'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                        }`}>
                          {section.number}
                        </div>
                        <i className={`${section.icon} text-lg ${activeSection === section.id ? 'text-white' : 'text-[#D97860]'}`}></i>
                        <span className="flex-1 text-left text-xs">{section.label}</span>
                        {activeSection === section.id && (
                          <i className="ri-check-double-line text-white text-lg"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-9">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Pubblica un Annuncio</h1>
                <p className="text-sm sm:text-base text-gray-600">Compila i dettagli del tuo immobile per pubblicarlo sulla piattaforma</p>
              </div>

              {/* WhatsApp Quick Contact Banner */}
              <div className="mb-6 sm:mb-8 bg-gradient-to-br from-[#25D366]/15 via-[#25D366]/10 to-[#25D366]/5 border-2 border-[#25D366] rounded-2xl p-5 sm:p-7 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#25D366]/10 rounded-full -ml-12 -mb-12"></div>
                
                <div className="relative z-10 flex flex-col items-start gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 w-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br from-[#25D366] to-[#20BA5A] rounded-2xl flex-shrink-0 shadow-lg animate-pulse">
                      <i className="ri-whatsapp-line text-2xl sm:text-3xl text-white"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-[#3D2817] mb-2 flex items-center gap-2">
                        Preferisci Inviare via WhatsApp?
                        <i className="ri-arrow-right-line text-[#25D366]"></i>
                      </h3>
                      <p className="text-[#5C4B42] text-xs sm:text-sm leading-relaxed font-medium">
                        Non vuoi compilare il modulo? Inviaci foto e dettagli della tua proprietà su WhatsApp e la pubblicheremo noi per te - <strong className="text-[#25D366]">100% GRATUITO!</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleWhatsAppContact}
                    className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white font-bold rounded-xl hover:from-[#20BA5A] hover:to-[#1DA851] transition-all duration-300 shadow-xl shadow-[#25D366]/30 hover:shadow-2xl hover:shadow-[#25D366]/40 cursor-pointer whitespace-nowrap text-sm sm:text-base hover:scale-105 active:scale-95"
                  >
                    <i className="ri-whatsapp-line text-xl sm:text-2xl group-hover:rotate-12 transition-transform duration-300"></i>
                    <span>Invia su WhatsApp</span>
                    <i className="ri-arrow-right-line text-lg group-hover:translate-x-1 transition-transform duration-300"></i>
                  </button>
                </div>
              </div>

              {/* Divider with "OR" */}
              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 sm:px-4 bg-gray-50 text-gray-500 font-medium text-sm sm:text-base">OPPURE</span>
                </div>
              </div>

              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-4 sm:px-5 py-3 sm:py-4 rounded-xl mb-4 sm:mb-6 flex items-start sm:items-center text-sm shadow-lg animate-shake">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-200 rounded-lg mr-3 flex-shrink-0">
                    <i className="ri-error-warning-fill text-red-600 text-lg"></i>
                  </div>
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Section 1: Owner Contact Information */}
                <div ref={ownerSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#D97860] to-[#C86B54] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      1
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-user-line text-[#D97860] text-2xl"></i>
                        Informazioni Proprietario
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Dati di contatto del proprietario</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-user-3-line text-[#D97860]"></i>
                        Nome Completo *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.owner_name}
                          onChange={(e) => handleChange('owner_name', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] transition-all duration-300 shadow-sm focus:shadow-md"
                          placeholder="Mario Rossi"
                          required
                        />
                        {formData.owner_name && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-mail-line text-[#14B8A6]"></i>
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={formData.owner_email}
                          onChange={(e) => handleChange('owner_email', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all duration-300 shadow-sm focus:shadow-md"
                          placeholder="mario.rossi@email.com"
                        />
                        {formData.owner_email && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-phone-line text-[#8B5CF6]"></i>
                        Telefono
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.owner_phone}
                          onChange={(e) => handleChange('owner_phone', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all duration-300 shadow-sm focus:shadow-md"
                          placeholder="es. +39 333 123 4567"
                        />
                        {formData.owner_phone && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-whatsapp-line text-[#25D366]"></i>
                        WhatsApp
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.owner_whatsapp}
                          onChange={(e) => handleChange('owner_whatsapp', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition-all duration-300 shadow-sm focus:shadow-md"
                          placeholder="es. +39 333 123 4567"
                        />
                        {formData.owner_whatsapp && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-600 flex items-center gap-1.5 bg-[#25D366]/10 px-3 py-2 rounded-lg">
                        <i className="ri-information-line text-[#25D366]"></i>
                        Accettiamo numeri internazionali e fissi
                      </p>
                    </div>

                    {/* Contact Method Indicator */}
                    <div className="sm:col-span-2 mt-3">
                      <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <i className="ri-checkbox-circle-line text-[#14B8A6]"></i>
                          Metodi di contatto forniti:
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${formData.owner_email ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                            <i className={`ri-mail-line text-sm ${formData.owner_email ? 'text-green-600' : ''}`}></i>
                            <span>Email</span>
                            {formData.owner_email && <i className="ri-check-line text-green-600"></i>}
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${formData.owner_phone ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                            <i className={`ri-phone-line text-sm ${formData.owner_phone ? 'text-green-600' : ''}`}></i>
                            <span>Telefono</span>
                            {formData.owner_phone && <i className="ri-check-line text-green-600"></i>}
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${formData.owner_whatsapp ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                            <i className={`ri-whatsapp-line text-sm ${formData.owner_whatsapp ? 'text-green-600' : ''}`}></i>
                            <span>WhatsApp</span>
                            {formData.owner_whatsapp && <i className="ri-check-line text-green-600"></i>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Basic Information */}
                <div ref={basicSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      2
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-information-line text-[#14B8A6] text-2xl"></i>
                        Informazioni Base
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Titolo, tipo operazione e prezzo</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-text text-[#14B8A6]"></i>
                        Titolo Annuncio *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all duration-300 shadow-sm focus:shadow-md"
                          required
                          placeholder="Es: Appartamento luminoso in centro"
                        />
                        {formData.title && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-exchange-line text-[#C9A876]"></i>
                        Tipo Operazione *
                      </label>
                      <select
                        value={formData.listing_type}
                        onChange={(e) => handleChange('listing_type', e.target.value)}
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-[#C9A876] cursor-pointer transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                        required
                      >
                        <option value="rent">Affitto</option>
                        <option value="buy">Vendita</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-money-euro-circle-line text-[#D97860]"></i>
                        Prezzo (€) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg pointer-events-none">€</span>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleChange('price', e.target.value)}
                          className="w-full pl-10 pr-4 sm:pr-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] transition-all duration-300 shadow-sm focus:shadow-md font-semibold"
                          required
                          placeholder="250000"
                        />
                        {formData.price && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Category Selection */}
                <div ref={categorySectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#C9A876] to-[#B89665] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      3
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-home-4-line text-[#C9A876] text-2xl"></i>
                        Categoria Immobile
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Seleziona il tipo di immobile</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-building-line text-[#C9A876]"></i>
                        Categoria Principale *
                      </label>
                      <select
                        value={formData.property_type}
                        onChange={(e) => handleChange('property_type', e.target.value)}
                        required
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-[#C9A876] cursor-pointer transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                      >
                        <option value="">Seleziona categoria</option>
                        {Object.keys(propertyCategories).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {getSubCategories().length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <i className="ri-home-line text-[#C9A876]"></i>
                          Tipologia
                        </label>
                        <select
                          value={formData.sub_category}
                          onChange={(e) => handleChange('sub_category', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-[#C9A876] cursor-pointer transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                        >
                          <option value="">Seleziona tipologia</option>
                          {getSubCategories().map((subCategory) => (
                            <option key={subCategory} value={subCategory}>
                              {subCategory}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {getSubSubCategories().length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <i className="ri-door-line text-[#C9A876]"></i>
                          Numero Locali
                        </label>
                        <select
                          value={formData.sub_sub_category}
                          onChange={(e) => handleChange('sub_sub_category', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-[#C9A876] cursor-pointer transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                        >
                          <option value="">Seleziona</option>
                          {getSubSubCategories().map((subSubCategory: string) => (
                            <option key={subSubCategory} value={subSubCategory}>
                              {subSubCategory}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Business Activities for Commercial */}
                    {shouldShowBusinessActivities && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Tipo di Attività *
                        </label>
                        <BusinessActivitiesSelector
                          selectedActivities={formData.business_activities}
                          onActivitiesChange={(activities) => 
                            handleChange('business_activities', activities)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Location */}
                <div ref={locationSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      4
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-map-pin-line text-[#14B8A6] text-2xl"></i>
                        Posizione
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Indirizzo e zona di Roma</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:gap-5">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-road-map-line text-[#14B8A6]"></i>
                        Indirizzo *
                      </label>
                      <div className="relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          value={formData.address}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setFormData(prev => ({ ...prev, address: newValue }));
                            setAddressError('');
                          }}
                          placeholder="Via del Corso 123"
                          required
                          className={`w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm focus:shadow-md font-medium ${
                            addressError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#14B8A6] focus:border-[#14B8A6]'
                          }`}
                        />
                        {formData.address && !addressError && !isValidatingAddress && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                      {isValidatingAddress && (
                        <p className="text-xs font-medium text-gray-600 mt-2 flex items-center gap-1.5 bg-blue-50 px-3 py-2 rounded-lg">
                          <i className="ri-loader-4-line animate-spin text-blue-500"></i>
                          Validazione indirizzo...
                        </p>
                      )}
                      {addressError && (
                        <p className="text-xs font-semibold text-red-700 mt-2 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                          <i className="ri-error-warning-line text-red-500"></i>
                          {addressError}
                        </p>
                      )}
                      {!addressError && !isValidatingAddress && (
                        <p className="text-xs font-medium text-gray-600 mt-2 flex items-start gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
                          <i className="ri-information-line text-[#14B8A6] flex-shrink-0 mt-0.5"></i>
                          <span>Inizia a digitare per vedere i suggerimenti. La via è obbligatoria. Il numero civico è facoltativo.</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-map-pin-line text-[#14B8A6]"></i>
                        Zona di Roma *
                      </label>
                      <ZoneSelector
                        selectedZone={formData.zone}
                        onZoneChange={(zone) => handleChange('zone', zone)}
                      />
                      <p className="mt-2 text-xs font-medium text-gray-600 flex items-start gap-1.5 bg-gray-50 px-3 py-2 rounded-lg">
                        <i className="ri-information-line text-[#14B8A6] flex-shrink-0 mt-0.5"></i>
                        <span>Seleziona una sola zona dove si trova l'immobile</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Property Details */}
                <div ref={detailsSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      5
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-ruler-line text-[#8B5CF6] text-2xl"></i>
                        Dettagli Immobile
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Superficie, locali, stato e classe energetica</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-ruler-2-line text-[#8B5CF6]"></i>
                        Superficie (m²) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.area}
                          onChange={(e) => handleChange('area', e.target.value)}
                          required
                          className="w-full px-4 sm:px-5 pr-12 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all duration-300 shadow-sm focus:shadow-md font-semibold"
                          placeholder="85"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none">m²</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-door-line text-[#8B5CF6]"></i>
                        Locali
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.bedrooms}
                          onChange={(e) => handleChange('bedrooms', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all duration-300 shadow-sm focus:shadow-md font-semibold"
                          placeholder="3"
                        />
                        {formData.bedrooms && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-drop-line text-[#14B8A6]"></i>
                        Bagni
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.bathrooms}
                          onChange={(e) => handleChange('bathrooms', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] transition-all duration-300 shadow-sm focus:shadow-md font-semibold"
                          placeholder="2"
                        />
                        {formData.bathrooms && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-building-2-line text-[#C9A876]"></i>
                        Piano
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={(e) => handleChange('floor', e.target.value)}
                          className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-[#C9A876] transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                          placeholder="es. 3, T, S1"
                        />
                        {formData.floor && (
                          <i className="ri-check-double-line absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg"></i>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-home-smile-line text-[#D97860]"></i>
                        Stato
                      </label>
                      <select
                        value={formData.condition}
                        onChange={(e) => handleChange('condition', e.target.value)}
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] cursor-pointer transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                      >
                        <option value="">Seleziona</option>
                        <option value="Nuovo">Nuovo</option>
                        <option value="Eccellente">Eccellente</option>
                        <option value="Buono">Buono</option>
                        <option value="Ristrutturato">Ristrutturato</option>
                        <option value="Da ristrutturare">Da ristrutturare</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="ri-leaf-line text-[#14B8A6]"></i>
                        Classe Energetica
                      </label>
                      <select
                        value={formData.energy_class}
                        onChange={(e) => handleChange('energy_class', e.target.value)}
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] cursor-pointer transition-all duration-300 shadow-sm focus:shadow-md font-medium"
                      >
                        <option value="">Seleziona</option>
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                        <option value="G">G</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 6: Description */}
                <div ref={descriptionSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#D97860] to-[#C86B54] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      6
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-file-text-line text-[#D97860] text-2xl"></i>
                        Descrizione
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Descrivi l'immobile in dettaglio</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={5}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] transition-all duration-300 shadow-sm focus:shadow-md resize-none"
                      placeholder="Descrivi l'immobile in dettaglio... (es. luminoso, ristrutturato, vista panoramica, vicinanze servizi, etc.)"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
                      <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-md shadow-sm">
                        {formData.description.length} caratteri
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 7: Features Section - Category Specific */}
                {formData.property_type && (
                  <div ref={featuresSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                      <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#C9A876] to-[#B89665] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                        7
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                          <i className="ri-star-line text-[#C9A876] text-2xl"></i>
                          Caratteristiche {formData.property_type === 'Case-Appartamenti' ? 'Residenziali' : 
                                          formData.property_type === 'Commerciale' ? 'Commerciali' :
                                          formData.property_type === 'Ufficio' ? 'Ufficio' :
                                          formData.property_type === 'Garage-Posti auto' ? 'Garage' :
                                          formData.property_type === 'Terreni' ? 'Terreno' :
                                          formData.property_type === 'Magazzini-Depositi' ? 'Magazzino' :
                                          formData.property_type === 'Capannoni' ? 'Industriali' : ''}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1 font-medium">Seleziona le caratteristiche dell'immobile</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-72 sm:max-h-96 overflow-y-auto p-4 sm:p-5 bg-gradient-to-br from-[#F9F6F3] to-white rounded-xl border-2 border-[#E8E4E0] shadow-inner">
                      {(() => {
                        let features: string[] = [];
                        switch (formData.property_type) {
                          case 'Case-Appartamenti':
                            features = filterOptions.residentialFeatures;
                            break;
                          case 'Commerciale':
                            features = filterOptions.commercialFeatures;
                            break;
                          case 'Ufficio':
                            features = filterOptions.officeFeatures;
                            break;
                          case 'Garage-Posti auto':
                            features = filterOptions.garageFeatures;
                            break;
                          case 'Terreni':
                            features = filterOptions.landFeatures;
                            break;
                          case 'Magazzini-Depositi':
                            features = filterOptions.warehouseFeatures;
                            break;
                          case 'Capannoni':
                            features = filterOptions.industrialFeatures;
                            break;
                          default:
                            features = [];
                        }
                        
                        return features.map((feature) => (
                          <label
                            key={feature}
                            className="group flex items-center space-x-2.5 cursor-pointer hover:bg-white p-2.5 sm:p-3 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-[#C9A876]/30 hover:shadow-sm"
                          >
                            <input
                              type="checkbox"
                              checked={formData.features?.includes(feature) || false}
                              onChange={(e) => {
                                const currentFeatures = formData.features || [];
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    features: [...currentFeatures, feature]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    features: currentFeatures.filter(f => f !== feature)
                                  });
                                }
                              }}
                              className="w-5 h-5 text-[#C9A876] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#C9A876] cursor-pointer flex-shrink-0 transition-all"
                            />
                            <span className="text-xs sm:text-sm text-[#3D2817] font-medium group-hover:text-[#C9A876] transition-colors">{feature}</span>
                          </label>
                        ));
                      })()}
                    </div>
                    {formData.features && formData.features.length > 0 && (
                      <div className="mt-3 sm:mt-4 p-4 bg-gradient-to-r from-[#14B8A6]/10 to-emerald-50 rounded-xl border border-[#14B8A6]/30">
                        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#14B8A6]">
                          <i className="ri-check-double-line text-lg"></i>
                          {formData.features.length} caratteristiche selezionate
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Section 8: Images */}
                <div ref={imagesSectionRef} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6 pb-5 border-b-2 border-gray-200">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl mr-4 flex-shrink-0 font-bold text-xl shadow-md">
                      8
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <i className="ri-image-line text-[#8B5CF6] text-2xl"></i>
                        Foto Immobile
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">Carica le foto dell'immobile</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-[#8B5CF6] hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
                      <i className="ri-image-add-line text-xl text-[#8B5CF6] group-hover:scale-110 transition-transform"></i>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-[#8B5CF6] transition-colors">
                        {images.length === 0 ? 'Aggiungi foto' : `Aggiungi altre foto (${images.length}/50)`}
                      </span>
                      <input
                        type="file"
                        accept="*/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <i className="ri-image-line text-[#8B5CF6]"></i>
                        {images.length} {images.length === 1 ? 'foto caricata' : 'foto caricate'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 group-hover:border-[#8B5CF6] transition-all duration-300 shadow-md group-hover:shadow-xl">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-28 sm:h-36 object-cover object-top group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300"></div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                            >
                              <i className="ri-close-line text-sm"></i>
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-2 left-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                                <i className="ri-star-fill"></i>
                                Principale
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full px-6 sm:px-8 py-4 sm:py-4.5 text-base sm:text-lg bg-gradient-to-r from-[#D97860] to-[#C86B54] text-white rounded-xl hover:from-[#C86B54] hover:to-[#B85A44] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3 font-bold shadow-xl shadow-[#D97860]/30 hover:shadow-2xl hover:shadow-[#D97860]/40 hover:scale-[1.02] active:scale-95"
                  >
                    {loading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-2xl"></i>
                        Pubblicazione in corso...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line text-2xl group-hover:scale-110 transition-transform"></i>
                        Pubblica annuncio
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onAddAnother={handleAddAnother}
      />
    </div>
  );
};

export default AddListingPage;