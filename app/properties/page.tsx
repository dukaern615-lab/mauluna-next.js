'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { romeZones } from '@/mocks/properties';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';
import ZoneFilter from '@/components/feature/ZoneFilter';
import CategoryFilter from '@/components/feature/CategoryFilter';
import { supabase } from '@/lib/supabaseClient';
import { propertyFunctions } from '@/lib/supabaseFunctions';
import { transformProperties } from '@/utils/propertyTransform';

// Property categories – same as search results
const propertyCategories = {
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

// Advanced Filters Modal Component
const AdvancedFiltersModal = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  selectedMainCategory
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onApplyFilters: (filters: any) => void;
  selectedMainCategory: string;
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (!isOpen) return null;

  // Category‑specific features
  const getCategoryFeatures = () => {
    const filterOptions = {
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
        'Wi‑Fi',
        'Impianto audio',
        'Climatizzazione'
      ],
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
      warehouseFeatures: [
        'Altezza soffitto (3‑6m)',
        'Altezza soffitto (6‑10m)',
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
      industrialFeatures: [
        'Altezza soffitto (6‑10m)',
        'Altezza soffitto (10‑15m)',
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

    switch (selectedMainCategory) {
      case 'Case-Appartamenti':
        return filterOptions.residentialFeatures;
      case 'Commerciale':
        return filterOptions.commercialFeatures;
      case 'Ufficio':
        return filterOptions.officeFeatures;
      case 'Garage-Posti auto':
        return filterOptions.garageFeatures;
      case 'Terreni':
        return filterOptions.landFeatures;
      case 'Magazzini-Depositi':
        return filterOptions.warehouseFeatures;
      case 'Capannoni':
        return filterOptions.industrialFeatures;
      default:
        return filterOptions.residentialFeatures;
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      rooms: '',
      bathrooms: '',
      floor: '',
      condition: '',
      energyClass: '',
      features: [] as string[]
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-[#3D2817]">Filtri Avanzati</h2>
            <p className="text-sm text-gray-500 mt-1">Affina la tua ricerca immobiliare</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <i className="ri-close-line text-2xl text-gray-600"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
          <div className="space-y-8">
            {/* Price Range */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#3D2817] flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <i className="ri-money-euro-circle-line text-xl text-[#C47B5B]"></i>
                </div>
                Fascia di Prezzo
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">DA</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">€</span>
                    <input
                      type="number"
                      value={localFilters.minPrice}
                      onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                      placeholder="50.000"
                      className="w-full h-12 pl-8 pr-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium transition-all duration-200 focus:border-[#C47B5B] focus:ring-2 focus:ring-[#C47B5B] focus:ring-opacity-20 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">A</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">€</span>
                    <input
                      type="number"
                      value={localFilters.maxPrice}
                      onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                      placeholder="500.000"
                      className="w-full h-12 pl-8 pr-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium transition-all duration-200 focus:border-[#C47B5B] focus:ring-2 focus:ring-[#C47B5B] focus:ring-opacity-20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Area Range */}
            <div className="space-y-3 mt-6 pt-6 border-t-2 border-gray-100">
              <h3 className="text-base font-bold text-[#3D2817] flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <i className="ri-ruler-line text-xl text-[#C47B5B]"></i>
                </div>
                Superficie
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">DA</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={localFilters.minArea}
                      onChange={(e) => setLocalFilters({ ...localFilters, minArea: e.target.value })}
                      placeholder="50"
                      className="w-full h-12 pl-4 pr-12 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium transition-all duration-200 focus:border-[#C47B5B] focus:ring-2 focus:ring-[#C47B5B] focus:ring-opacity-20 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">m²</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">A</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={localFilters.maxArea}
                      onChange={(e) => setLocalFilters({ ...localFilters, maxArea: e.target.value })}
                      placeholder="200"
                      className="w-full h-12 pl-4 pr-12 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium transition-all duration-200 focus:border-[#C47B5B] focus:ring-2 focus:ring-[#C47B5B] focus:ring-opacity-20 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">m²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rooms, Bathrooms, Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  <i className="ri-hotel-bed-line text-base text-[#C47B5B]"></i>
                  Locali
                </label>
                <select
                  value={localFilters.rooms}
                  onChange={(e) => setLocalFilters({ ...localFilters, rooms: e.target.value })}
                  className="modern-select cursor-pointer h-12"
                >
                  <option value="">Tutti</option>
                  <option value="1">1 locale</option>
                  <option value="2">2 locali</option>
                  <option value="3">3 locali</option>
                  <option value="4">4 locali</option>
                  <option value="5+">5+ locali</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  <i className="ri-drop-line text-base text-[#C47B5B]"></i>
                  Bagni
                </label>
                <select
                  value={localFilters.bathrooms}
                  onChange={(e) => setLocalFilters({ ...localFilters, bathrooms: e.target.value })}
                  className="modern-select cursor-pointer h-12"
                >
                  <option value="">Tutti</option>
                  <option value="1">1 bagno</option>
                  <option value="2">2 bagni</option>
                  <option value="3">3 bagni</option>
                  <option value="4+">4+ bagni</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  <i className="ri-building-line text-base text-[#C47B5B]"></i>
                  Piano
                </label>
                <input
                  type="text"
                  value={localFilters.floor}
                  onChange={(e) => setLocalFilters({ ...localFilters, floor: e.target.value })}
                  placeholder="es. 3, T, S1"
                  className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 font-medium transition-all duration-200 focus:border-[#C47B5B] focus:ring-2 focus:ring-[#C47B5B] focus:ring-opacity-20 focus:outline-none"
                />
              </div>
            </div>

            {/* Condition and Energy Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  <i className="ri-home-smile-line text-base text-[#C47B5B]"></i>
                  Stato
                </label>
                <select
                  value={localFilters.condition}
                  onChange={(e) => setLocalFilters({ ...localFilters, condition: e.target.value })}
                  className="modern-select cursor-pointer h-12"
                >
                  <option value="">Tutti gli stati</option>
                  <option value="Nuovo">Nuovo</option>
                  <option value="Eccellente">Eccellente</option>
                  <option value="Buono">Buono</option>
                  <option value="Ristrutturato">Ristrutturato</option>
                  <option value="Da ristrutturare">Da ristrutturare</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  <i className="ri-leaf-line text-base text-[#C47B5B]"></i>
                  Energia
                </label>
                <select
                  value={localFilters.energyClass}
                  onChange={(e) => setLocalFilters({ ...localFilters, energyClass: e.target.value })}
                  className="modern-select cursor-pointer h-12"
                >
                  <option value="">Tutte le classi</option>
                  <option value="A+">A+ (Massima)</option>
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

            {/* Category‑Specific Features */}
            {selectedMainCategory && (
              <div className="space-y-3 mt-6 pt-6 border-t-2 border-gray-100">
                <h3 className="text-base font-bold text-[#3D2817] flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <i className="ri-star-line text-xl text-[#C47B5B]"></i>
                  </div>
                  <div>
                    <div className="leading-tight">Caratteristiche{' '}
                    {selectedMainCategory === 'Case-Appartamenti'
                      ? 'Residenziali'
                      : selectedMainCategory === 'Commerciale'
                      ? 'Commerciali'
                      : selectedMainCategory === 'Ufficio'
                      ? 'Ufficio'
                      : selectedMainCategory === 'Garage-Posti auto'
                      ? 'Garage'
                      : selectedMainCategory === 'Terreni'
                      ? 'Terreno'
                      : selectedMainCategory === 'Magazzini-Depositi'
                      ? 'Magazzino'
                      : selectedMainCategory === 'Capannoni'
                      ? 'Industriali'
                      : ''}</div>
                    {localFilters.features && localFilters.features.length > 0 && (
                      <div className="text-xs text-[#14B8A6] font-bold mt-0.5">
                        ✓ {localFilters.features.length} selezionate
                      </div>
                    )}
                  </div>
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100">
                  {getCategoryFeatures().map((feature) => (
                    <label
                      key={feature}
                      className="custom-checkbox group min-h-[44px] flex items-center p-3 rounded-xl border-2 border-transparent hover:border-[#C47B5B]/20 hover:bg-white cursor-pointer transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.features?.includes(feature) || false}
                        onChange={(e) => {
                          const current = localFilters.features || [];
                          if (e.target.checked) {
                            setLocalFilters({
                              ...localFilters,
                              features: [...current, feature]
                            });
                          } else {
                            setLocalFilters({
                              ...localFilters,
                              features: current.filter((f: string) => f !== feature)
                            });
                          }
                        }}
                      />
                      <div className="custom-checkbox-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="ml-3 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Enhanced Button Hierarchy */}
        <div className="px-6 py-5 border-t border-gray-100 bg-white shadow-lg flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 h-12 px-6 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 font-semibold flex items-center justify-center gap-1.5"
          >
            <i className="ri-refresh-line text-base"></i>
            <span>Cancella</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-[2] h-12 px-8 bg-[#C47B5B] text-white rounded-xl hover:bg-[#B36A4A] active:scale-[0.98] transition-all duration-200 font-bold shadow-lg shadow-[#C47B5B]/30 flex items-center justify-center gap-2"
          >
            <span>Applica Filtri</span>
            <i className="ri-check-line text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PropertiesPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSortModal, setShowMobileSortModal] = useState(false);
  
  // Mobile drawer state for full-screen zone/business selection
  const [mobileDrawer, setMobileDrawer] = useState<'zone' | 'business' | null>(null);
  const [zoneSearch, setZoneSearch] = useState('');
  const [expandedMacroZones, setExpandedMacroZones] = useState<string[]>([]);

  // Basic filters (top bar)
  const [selectedType, setSelectedType] = useState('all');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState('');

  // Business activities state - must be declared before fetchProperties that uses it
  const [businessSearch, setBusinessSearch] = useState('');
  const [selectedBusinessActivities, setSelectedBusinessActivities] = useState<string[]>([]);

  // Sort state
  const [sortBy, setSortBy] = useState('newest');

  // Advanced filters (modal)
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    condition: '',
    energyClass: '',
    features: [] as string[]
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Properties state
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false); // Prevent duplicate concurrent requests

  // Lock body scroll when mobile filter modal is open
  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [showMobileFilters]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawer) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [mobileDrawer]);

  // Auto-expand macro zones when searching for sub-zones
  useEffect(() => {
    if (zoneSearch) {
      const macroZonesToExpand = Object.keys(romeZones).filter(macroZone => {
        const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
        return subZones.some(subZone => 
          subZone.toLowerCase().includes(zoneSearch.toLowerCase())
        );
      });
      setExpandedMacroZones(macroZonesToExpand);
    } else {
      setExpandedMacroZones([]);
    }
  }, [zoneSearch]);

  // AbortController for cancelling in-flight requests (like search-results page)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch properties from Supabase via Edge Function
  const fetchProperties = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prevent duplicate concurrent requests
    if (fetchingRef.current) {
      
      return;
    }

    try {
      const fetchStartTime = performance.now();
      fetchingRef.current = true;
      setLoading(true);
      
      
      
      // Build filters object for Edge Function
      const filters: any = {
        limit: 100,
        sortBy: sortBy,
      };

      // Type filter
      if (selectedType !== 'all') {
        filters.type = selectedType;
      }

      // Zone filter
      if (selectedZones.length > 0) {
        filters.zones = selectedZones;
      }

      // Category filters
      if (selectedMainCategory && selectedMainCategory.trim() !== '') {
        filters.category = selectedMainCategory;
      }
      if (selectedSubCategory && selectedSubCategory.trim() !== '') {
        filters.subCategory = selectedSubCategory;
      }
      if (selectedSubSubCategory && selectedSubSubCategory.trim() !== '') {
        filters.subSubCategory = selectedSubSubCategory;
      }

      // Business activities filter
      if (selectedBusinessActivities.length > 0) {
        filters.businessActivities = selectedBusinessActivities;
      }

      // console.log('🔎 [Properties] Fetching properties with filters:', filters);

      // Advanced filters
      if (advancedFilters.minPrice) {
        filters.priceMin = advancedFilters.minPrice;
      }
      if (advancedFilters.maxPrice) {
        filters.priceMax = advancedFilters.maxPrice;
      }
      if (advancedFilters.minArea) {
        filters.minArea = advancedFilters.minArea;
      }
      if (advancedFilters.maxArea) {
        filters.maxArea = advancedFilters.maxArea;
      }
      if (advancedFilters.rooms) {
        filters.rooms = advancedFilters.rooms;
      }
      if (advancedFilters.bathrooms) {
        filters.bathrooms = advancedFilters.bathrooms;
      }
      if (advancedFilters.floor) {
        filters.floor = advancedFilters.floor;
      }
      if (advancedFilters.condition) {
        filters.condition = advancedFilters.condition;
      }
      if (advancedFilters.energyClass) {
        filters.energyClass = advancedFilters.energyClass;
      }
      if (advancedFilters.features.length > 0) {
        filters.features = advancedFilters.features;
      }

      
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Fetch via Edge Function
      const data = await propertyFunctions.get(filters);
      
      // Check if request was aborted after fetch
      if (abortController.signal.aborted) {
        return;
      }
      
      

      // console.log(`📊 [Properties] Fetched ${Array.isArray(data) ? data.length : 0} properties from database`);

      if (!data) {
        // console.log('⚠️ [Properties] No data returned');
        setFilteredProperties([]);
        return;
      }

      
      
      // Transform Supabase data using standardized utility
      const transformedProperties = transformProperties(Array.isArray(data) ? data : []);
      
      
      
      // console.log(`✨ [Properties] Transformed ${transformedProperties.length} properties`);
      // console.log('📈 [Properties] Property type breakdown:', {
      //   rent: transformedProperties.filter(p => p.type === 'rent').length,
      //   buy: transformedProperties.filter(p => p.type === 'buy').length
      // });
      setFilteredProperties(transformedProperties);
    } catch (error: any) {
      // Don't log abort errors
      if (error?.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      setFilteredProperties([]);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [selectedType, selectedZones, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedBusinessActivities, advancedFilters, sortBy]);

  // Apply filters function - now fetches from Supabase
  const applyFilters = () => {
    fetchProperties();
  };

  // Debounced filter changes - prevents rapid API calls
  // This handles both initial load and filter changes
  useEffect(() => {
    // Debounce refetch to prevent excessive queries
    let refetchTimeout: NodeJS.Timeout | null = null;
    const DEBOUNCE_DELAY = 300; // 300ms debounce delay
    
    const debouncedFetch = () => {
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
      refetchTimeout = setTimeout(() => {
        // Only refetch if not already fetching
        if (!fetchingRef.current) {
          fetchProperties();
        }
      }, DEBOUNCE_DELAY);
    };
    
    debouncedFetch();
    
    // Refetch when page becomes visible (with debounce)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedFetch();
      }
    };
    
    // Refetch on window focus (with debounce)
    const handleFocus = () => {
      debouncedFetch();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedType, selectedZones, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedBusinessActivities, advancedFilters, sortBy, fetchProperties]);


  // Category functions
  const getSubCategories = () => {
    if (!selectedMainCategory) return [];
    const category = propertyCategories[selectedMainCategory as keyof typeof propertyCategories];
    return typeof category === 'object' && Object.keys(category).length > 0 ? Object.keys(category) : [];
  };

  const getSubSubCategories = () => {
    if (!selectedMainCategory || !selectedSubCategory) return [];
    const mainCat = propertyCategories[selectedMainCategory as keyof typeof propertyCategories];
    if (!mainCat || typeof mainCat !== 'object') return [];
    return (mainCat as any)[selectedSubCategory] || [];
  };

  const handleMainCategoryChange = (category: string) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory('');
    setSelectedSubSubCategory('');
  };

  const handleSubCategoryChange = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setSelectedSubSubCategory('');
  };

  // Check if we should show business activity dropdown
  const shouldShowBusinessActivity = selectedMainCategory === 'Commerciale' && selectedSubCategory === 'Attività/Licenza commerciale';

  // Zone selection helpers
  const getAllZones = () => {
    const allZones: string[] = [];
    Object.entries(romeZones).forEach(([macro, subs]) => {
      allZones.push(macro);
      allZones.push(...subs);
    });
    return allZones;
  };

  const handleZoneToggle = (zone: string) => {
    setSelectedZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]));
  };

  const handleSelectAllZones = () => {
    const all = getAllZones();
    setSelectedZones((prev) => (prev.length === all.length ? [] : [...all]));
  };

  const handleMacroZoneToggle = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allInMacro = [macroZone, ...subZones];
    const allSelected = allInMacro.every((z) => selectedZones.includes(z));

    if (allSelected) {
      setSelectedZones((prev) => prev.filter((z) => !allInMacro.includes(z)));
    } else {
      setSelectedZones((prev) => [...new Set([...prev, ...allInMacro])]);
    }
  };

  const toggleMacroZoneExpansion = (macroZone: string) => {
    setExpandedMacroZones((prev) =>
      prev.includes(macroZone) ? prev.filter((z) => z !== macroZone) : [...prev, macroZone]
    );
  };

  const isMacroZoneSelected = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allInMacro = [macroZone, ...subZones];
    return allInMacro.every((z) => selectedZones.includes(z));
  };

  const isMacroZonePartiallySelected = (macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allInMacro = [macroZone, ...subZones];
    const selectedCount = allInMacro.filter((z) => selectedZones.includes(z)).length;
    return selectedCount > 0 && selectedCount < allInMacro.length;
  };

  // Business activities helpers
  const filteredBusinessActivities = businessActivities.filter((a) =>
    a.toLowerCase().includes(businessSearch.toLowerCase())
  );

  // Helper functions for full-screen zone drawer
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

  const handleBusinessActivityToggle = (activity: string) => {
    setSelectedBusinessActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  };

  const handleSelectAllBusiness = () => {
    setSelectedBusinessActivities((prev) =>
      prev.length === filteredBusinessActivities.length && filteredBusinessActivities.length > 0
        ? []
        : [...filteredBusinessActivities]
    );
  };

  // Count of active filters inside the modal (for badge)
  const getActiveAdvancedFiltersCount = () => {
    let count = 0;
    if (advancedFilters.minPrice) count++;
    if (advancedFilters.maxPrice) count++;
    if (advancedFilters.minArea) count++;
    if (advancedFilters.maxArea) count++;
    if (advancedFilters.rooms) count++;
    if (advancedFilters.bathrooms) count++;
    if (advancedFilters.floor) count++;
    if (advancedFilters.condition) count++;
    if (advancedFilters.energyClass) count++;
    if (advancedFilters.features.length > 0) count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Spacer for fixed header - Height matches header (top banner + main nav) */}
      <div className="h-[100px] lg:h-[104px]"></div>
      
      {/* Desktop Filter Bar - Full-width edge-to-edge sticky below fixed header */}
      <div className="hidden lg:block w-full bg-white border-b border-gray-200 shadow-sm sticky top-[104px] z-40">
        <div className="w-full px-8 py-4">
          {/* Single Row - All filters + Sort inline */}
          <div className="flex items-end gap-3">
            {/* Tipo */}
            <div className="w-[110px] flex-shrink-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] cursor-pointer"
              >
                <option value="all">Tutti</option>
                <option value="sale">Vendita</option>
                <option value="rent">Affitto</option>
              </select>
            </div>

            {/* Zona */}
            <div className="w-[150px] flex-shrink-0">
              <ZoneFilter
                selectedZones={selectedZones}
                onZonesChange={setSelectedZones}
                romeZones={romeZones}
                zoneSearch={zoneSearch}
                setZoneSearch={setZoneSearch}
                expandedMacroZones={expandedMacroZones}
                toggleMacroZoneExpansion={toggleMacroZoneExpansion}
                handleZoneToggle={handleZoneToggle}
                handleMacroZoneToggle={handleMacroZoneToggle}
                isMacroZoneSelected={isMacroZoneSelected}
                isMacroZonePartiallySelected={isMacroZonePartiallySelected}
                getFilteredMacroZones={getFilteredMacroZones}
                getFilteredSubZones={getFilteredSubZones}
                handleSelectAllZones={handleSelectAllZones}
              />
            </div>

            {/* Categoria - takes remaining space */}
            <div className="flex-1 min-w-0">
              <CategoryFilter
                selectedMainCategory={selectedMainCategory}
                selectedSubCategory={selectedSubCategory}
                selectedSubSubCategory={selectedSubSubCategory}
                onMainCategoryChange={handleMainCategoryChange}
                onSubCategoryChange={handleSubCategoryChange}
                onSubSubCategoryChange={setSelectedSubSubCategory}
                getSubCategories={getSubCategories}
                getSubSubCategories={getSubSubCategories}
                propertyCategories={propertyCategories}
                shouldShowBusinessActivity={shouldShowBusinessActivity}
                businessActivities={businessActivities}
                filteredBusinessActivities={filteredBusinessActivities}
                selectedBusinessActivities={selectedBusinessActivities}
                businessSearch={businessSearch}
                setBusinessSearch={setBusinessSearch}
                handleBusinessActivityToggle={handleBusinessActivityToggle}
                handleSelectAllBusiness={handleSelectAllBusiness}
              />
            </div>

            {/* Altri Filtri */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="h-10 px-4 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 text-sm font-medium flex-shrink-0 relative"
            >
              <i className="ri-filter-3-line"></i>
              <span>Altri Filtri</span>
              {getActiveAdvancedFiltersCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-[#14B8A6] text-white text-xs font-bold rounded-full">
                  {getActiveAdvancedFiltersCount()}
                </span>
              )}
            </button>

            {/* Ordina - Far right */}
            <div className="w-[140px] flex-shrink-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ordina</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] cursor-pointer"
              >
                <option value="newest">Più Recenti</option>
                <option value="oldest">Meno Recenti</option>
                <option value="price-asc">Prezzo ↑</option>
                <option value="price-desc">Prezzo ↓</option>
                <option value="area-asc">Superficie ↑</option>
                <option value="area-desc">Superficie ↓</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Filter and Sort Buttons - Scrolls with content */}
      <div className="lg:hidden w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="relative h-11 px-4 bg-[#C47B5B] text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm hover:bg-[#B36A4A] active:scale-95 transition-all duration-200"
            >
              <i className="ri-filter-3-line text-lg"></i>
              <span>Filtra</span>
              {(getActiveAdvancedFiltersCount() > 0 || selectedZones.length > 0 || selectedMainCategory || selectedType !== 'all') && (
                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center bg-[#14B8A6] text-white text-xs font-bold rounded-full shadow-md animate-scaleIn">
                  {getActiveAdvancedFiltersCount() + (selectedZones.length > 0 ? 1 : 0) + (selectedMainCategory ? 1 : 0) + (selectedType !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMobileSortModal(true)}
              className="h-11 px-4 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 border-gray-200 hover:bg-gray-200 hover:border-gray-300 active:scale-95 transition-all duration-200"
            >
              <i className="ri-sort-desc text-lg"></i>
              <span>Ordina</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Title & Stats Section */}
      <div className="bg-gradient-to-br from-[#D97860] via-[#C86B54] to-[#C9A876] text-white py-6">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Tutti gli Immobili</h1>
              <p className="text-sm text-white/90">
                Esplora la nostra selezione di immobili a Roma
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[65px]">
                <div className="text-lg font-bold mb-1">{filteredProperties.length}</div>
                <div className="text-xs text-white/80">Totali</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[65px]">
                <div className="text-lg font-bold mb-1">
                  {filteredProperties.filter(p => p.type === 'rent').length}
                </div>
                <div className="text-xs text-white/80">Affitto</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[65px]">
                <div className="text-lg font-bold mb-1">
                  {filteredProperties.filter(p => p.type === 'buy').length}
                </div>
                <div className="text-xs text-white/80">Vendita</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[65px]">
                <div className="text-lg font-bold mb-1">
                  {new Set(filteredProperties.map(p => p.zone)).size}
                </div>
                <div className="text-xs text-white/80">Zone</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal - Enhanced Design */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-fadeIn">
          <div 
            className="bg-white w-full max-h-[90vh] overflow-hidden flex flex-col rounded-t-3xl shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-xl font-bold text-[#3D2817]">Filtri di Ricerca</h2>
                <p className="text-xs text-gray-500 mt-0.5">Personalizza la tua ricerca</p>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{
                touchAction: 'pan-y',
                overscrollBehavior: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="space-y-6">
                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <i className="ri-home-4-line text-base text-[#C47B5B]"></i>
                    </div>
                    Tipo di Immobile
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="modern-select cursor-pointer h-12"
                  >
                    <option value="all">Tutti i tipi</option>
                    <option value="sale">In Vendita</option>
                    <option value="rent">In Affitto</option>
                  </select>
                </div>

                {/* Zones Filter */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <i className="ri-map-pin-line text-base text-[#C47B5B]"></i>
                    </div>
                    Zona
                  </label>
                  <button
                    type="button"
                    onClick={() => setMobileDrawer('zone')}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all text-left flex items-center justify-between font-medium"
                  >
                    <span className="text-sm">
                      {selectedZones.length > 0 
                        ? `${selectedZones.length} zone selezionate` 
                        : 'Seleziona zone...'}
                    </span>
                    <i className="ri-arrow-right-s-line text-xl text-gray-400"></i>
                  </button>
                </div>

                {/* Categories Filter */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <i className="ri-building-line text-base text-[#C47B5B]"></i>
                    </div>
                    Categoria
                  </label>
                  <CategoryFilter
                    selectedMainCategory={selectedMainCategory}
                    selectedSubCategory={selectedSubCategory}
                    selectedSubSubCategory={selectedSubSubCategory}
                    onMainCategoryChange={handleMainCategoryChange}
                    onSubCategoryChange={handleSubCategoryChange}
                    onSubSubCategoryChange={setSelectedSubSubCategory}
                    getSubCategories={getSubCategories}
                    getSubSubCategories={getSubSubCategories}
                    propertyCategories={propertyCategories}
                    shouldShowBusinessActivity={shouldShowBusinessActivity}
                    businessActivities={businessActivities}
                    filteredBusinessActivities={filteredBusinessActivities}
                    selectedBusinessActivities={selectedBusinessActivities}
                    businessSearch={businessSearch}
                    setBusinessSearch={setBusinessSearch}
                    handleBusinessActivityToggle={handleBusinessActivityToggle}
                    handleSelectAllBusiness={handleSelectAllBusiness}
                    hideMobileBusinessActivities={true}
                  />
                  
                  {/* Business Activities Button - Full Screen */}
                  {shouldShowBusinessActivity && (
                    <div className="mt-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <i className="ri-store-2-line text-base text-[#C47B5B]"></i>
                        </div>
                        Attività Commerciali
                      </label>
                      <button
                        type="button"
                        onClick={() => setMobileDrawer('business')}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 hover:border-[#D97860] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/10 transition-all text-left flex items-center justify-between font-medium"
                      >
                        <span className="text-sm">
                          {selectedBusinessActivities.length > 0 
                            ? `${selectedBusinessActivities.length} attività selezionate` 
                            : 'Seleziona attività...'}
                        </span>
                        <i className="ri-arrow-right-s-line text-xl text-gray-400"></i>
                      </button>
                    </div>
                  )}
                </div>

                {/* Advanced Filters Button */}
                <div className="pt-6 mt-6 border-t-2 border-gray-100">
                  <button
                    onClick={() => {
                      setShowMobileFilters(false);
                      setShowAdvancedFilters(true);
                    }}
                    className="w-full min-h-[52px] px-4 py-3.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-2 border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 relative font-semibold"
                  >
                    <i className="ri-equalizer-line text-lg"></i>
                    <span>Filtri Avanzati</span>
                    {getActiveAdvancedFiltersCount() > 0 && (
                      <span className="ml-auto min-w-[24px] h-6 px-2 flex items-center justify-center bg-[#14B8A6] text-white text-xs font-bold rounded-full shadow-md animate-scaleIn">
                        {getActiveAdvancedFiltersCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer - Enhanced Button Hierarchy */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white shadow-lg space-y-2">
              {/* Primary CTA: Full Width */}
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-12 px-6 bg-[#C47B5B] text-white rounded-xl hover:bg-[#B36A4A] active:scale-[0.98] transition-all duration-200 font-bold shadow-lg shadow-[#C47B5B]/30 flex items-center justify-center gap-2"
              >
                <span>Mostra {filteredProperties.length} Immobili</span>
                <i className="ri-arrow-right-line text-xl"></i>
              </button>
              {/* Secondary: Text Button */}
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedZones([]);
                  handleMainCategoryChange('');
                }}
                className="w-full h-10 px-4 text-gray-600 hover:text-gray-800 active:scale-95 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-1.5"
              >
                <i className="ri-delete-bin-6-line text-base"></i>
                <span>Cancella filtri</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Modal - Enhanced */}
      {showMobileSortModal && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-fadeIn">
          <div className="bg-white w-full rounded-t-3xl shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                  <i className="ri-sort-desc text-lg text-[#C47B5B]"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#3D2817]">Ordina per</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Scegli l'ordinamento</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileSortModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            {/* Sort Options - Card Style */}
            <div className="p-5 pb-6">
              <div className="space-y-3">
                {[
                  { value: 'newest', label: 'Più Recenti', icon: 'ri-time-line' },
                  { value: 'oldest', label: 'Meno Recenti', icon: 'ri-history-line' },
                  { value: 'price-asc', label: 'Prezzo: Basso → Alto', icon: 'ri-arrow-up-line' },
                  { value: 'price-desc', label: 'Prezzo: Alto → Basso', icon: 'ri-arrow-down-line' },
                  { value: 'area-asc', label: 'Superficie: Piccola → Grande', icon: 'ri-expand-width-line' },
                  { value: 'area-desc', label: 'Superficie: Grande → Piccola', icon: 'ri-contract-left-right-line' },
                  { value: 'most-viewed', label: 'Più Visualizzati', icon: 'ri-eye-line' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowMobileSortModal(false);
                    }}
                    className={`w-full min-h-[52px] px-4 py-3.5 rounded-xl text-left flex items-center gap-3 transition-all duration-200 cursor-pointer border-2 ${
                      sortBy === option.value
                        ? 'bg-[#C47B5B] border-[#C47B5B] text-white shadow-lg shadow-[#C47B5B]/30'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                      sortBy === option.value ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <i className={`${option.icon} text-xl ${sortBy === option.value ? 'text-white' : 'text-[#C47B5B]'}`}></i>
                    </div>
                    <span className="font-bold flex-1">{option.label}</span>
                    {sortBy === option.value && (
                      <i className="ri-check-line text-2xl"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      

      {/* Properties List */}
      {/* Property Results Section - Proper spacing from filters */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Results Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <i className="ri-loader-4-line animate-spin text-[#D97860]"></i>
                      Caricamento...
                    </span>
                  ) : (
                    `${filteredProperties.length} Immobili`
                  )}
                </h2>
                {!loading && filteredProperties.length > 0 && (
                  <span className="text-xs text-gray-500 font-normal">
                    ({filteredProperties.filter(p => p.type === 'rent').length} affitto, {filteredProperties.filter(p => p.type === 'sale').length} vendita)
                  </span>
                )}
              </div>
              {!loading && filteredProperties.length > 0 && (
                <p className="text-xs text-gray-500">
                  Trova immobile perfetto per te
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#D97860]/10 rounded-full flex items-center justify-center mb-4">
              <i className="ri-loader-4-line text-3xl text-[#D97860] animate-spin"></i>
            </div>
            <p className="text-gray-600 font-medium">Caricamento immobili...</p>
            <p className="text-sm text-gray-500 mt-1">Un momento, stiamo preparando i risultati</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-home-4-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Nessun immobile trovato</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Non abbiamo trovato immobili che corrispondono ai filtri selezionati. Prova a modificare i criteri di ricerca.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedZones([]);
                  setSelectedMainCategory('');
                  setSelectedSubCategory('');
                  setSelectedSubSubCategory('');
                  setAdvancedFilters({
                    minPrice: '',
                    maxPrice: '',
                    minArea: '',
                    maxArea: '',
                    rooms: '',
                    bathrooms: '',
                    floor: '',
                    condition: '',
                    energyClass: '',
                    features: []
                  });
                }}
                className="px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer font-medium flex items-center gap-2"
              >
                <i className="ri-refresh-line"></i>
                Reset Filtri
              </button>
              <Link
                href="/pubblica-annuncio"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium flex items-center gap-2"
              >
                <i className="ri-add-line"></i>
                Pubblica un Annuncio
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 auto-rows-fr">
            {filteredProperties.map((property) => (
              <div key={property.id} className="w-full h-full">
                <SharedPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Bottom Drawer - Zone Selection */}
      {mobileDrawer === 'zone' && (
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
                  checked={selectedZones.length === getAllZones().length}
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
                            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer min-h-[44px]"
                          >
                            <input
                              type="checkbox"
                              checked={selectedZones.includes(subZone)}
                              onChange={() => handleZoneToggle(subZone)}
                              className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                            />
                            <span className="text-sm text-[#3D2817] flex-1">
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
                {selectedZones.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-white/30 rounded-full text-sm font-bold">
                    {selectedZones.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Drawer - Business Activities */}
      {mobileDrawer === 'business' && (
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
                  checked={selectedBusinessActivities.length === filteredBusinessActivities.length && filteredBusinessActivities.length > 0}
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
                    checked={selectedBusinessActivities.includes(activity)}
                    onChange={() => handleBusinessActivityToggle(activity)}
                    className="w-5 h-5 text-[#D97860] border-2 border-gray-300 rounded focus:ring-[#D97860] focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-sm text-[#3D2817] flex-1">
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
                {selectedBusinessActivities.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-white/30 rounded-full text-sm font-bold">
                    {selectedBusinessActivities.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onApplyFilters={setAdvancedFilters}
        selectedMainCategory={selectedMainCategory}
      />
    </div>
  );
}
