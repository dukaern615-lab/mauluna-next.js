'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';
import PropertyMap from '@/components/feature/PropertyMap';
import { romeZones } from '@/mocks/properties';
import ZoneFilter from '@/components/feature/ZoneFilter';
import CategoryFilter from '@/components/feature/CategoryFilter';
import { propertyFunctions } from '@/lib/supabaseFunctions';
import { transformProperties } from '@/utils/propertyTransform';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

// Property categories – same as Hero Section
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

// Business activities list – same as Hero Section
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

  // Category‑specific features (matching add‑listing page)
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#3D2817]">Altri Filtri</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Price Range */}
            <div>
              <h3 className="text-lg font-semibold text-[#3D2817] mb-3 flex items-center">
                <i className="ri-money-euro-circle-line mr-2 text-[#D97860]"></i>
                Prezzo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min (€)</label>
                  <input
                    type="number"
                    value={localFilters.minPrice}
                    onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max (€)</label>
                  <input
                    type="number"
                    value={localFilters.maxPrice}
                    onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                    placeholder="1 000 000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Area Range */}
            <div>
              <h3 className="text-lg font-semibold text-[#3D2817] mb-3 flex items-center">
                <i className="ri-ruler-line mr-2 text-[#D97860]"></i>
                Superficie (m²)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min (m²)</label>
                  <input
                    type="number"
                    value={localFilters.minArea}
                    onChange={(e) => setLocalFilters({ ...localFilters, minArea: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max (m²)</label>
                  <input
                    type="number"
                    value={localFilters.maxArea}
                    onChange={(e) => setLocalFilters({ ...localFilters, maxArea: e.target.value })}
                    placeholder="500"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Rooms, Bathrooms, Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locali</label>
                <select
                  value={localFilters.rooms}
                  onChange={(e) => setLocalFilters({ ...localFilters, rooms: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                >
                  <option value="">Tutti</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bagni</label>
                <select
                  value={localFilters.bathrooms}
                  onChange={(e) => setLocalFilters({ ...localFilters, bathrooms: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                >
                  <option value="">Tutti</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4+">4+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Piano</label>
                <input
                  type="text"
                  value={localFilters.floor}
                  onChange={(e) => setLocalFilters({ ...localFilters, floor: e.target.value })}
                  placeholder="es. 3, T, S1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                />
              </div>
            </div>

            {/* Condition and Energy Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                <select
                  value={localFilters.condition}
                  onChange={(e) => setLocalFilters({ ...localFilters, condition: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                >
                  <option value="">Tutti</option>
                  <option value="Nuovo">Nuovo</option>
                  <option value="Eccellente">Eccellente</option>
                  <option value="Buono">Buono</option>
                  <option value="Ristrutturato">Ristrutturato</option>
                  <option value="Da ristrutturare">Da ristrutturare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe Energetica</label>
                <select
                  value={localFilters.energyClass}
                  onChange={(e) => setLocalFilters({ ...localFilters, energyClass: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                >
                  <option value="">Tutte</option>
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

            {/* Category‑Specific Features */}
            {selectedMainCategory && (
              <div>
                <h3 className="text-lg font-semibold text-[#3D2817] mb-3 flex items-center">
                  <i className="ri-star-line mr-2 text-[#D97860]"></i>
                  Caratteristiche{' '}
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
                    : ''}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-4 bg-[#F9F6F3] rounded-lg border border-[#E8E4E0]">
                  {getCategoryFeatures().map((feature) => (
                    <label
                      key={feature}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
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
                        className="w-4 h-4 text-[#D97860] border-[#E8E4E0] rounded focus:ring-[#D97860] cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-[#3D2817]">{feature}</span>
                    </label>
                  ))}
                </div>
                {localFilters.features && localFilters.features.length > 0 && (
                  <div className="mt-2 text-sm text-[#5C4B42]">
                    <i className="ri-check-line text-[#14B8A6] mr-1"></i>
                    {localFilters.features.length} caratteristiche selezionate
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancella Filtri
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap"
          >
            Applica Filtri
          </button>
        </div>
      </div>
    </div>
  );
};

// Business Activities Modal Component
const BusinessActivitiesModal = ({
  isOpen,
  onClose,
  selectedActivities,
  onApply
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedActivities: string[];
  onApply: (activities: string[]) => void;
}) => {
  const [localActivities, setLocalActivities] = useState<string[]>(selectedActivities);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLocalActivities(selectedActivities);
  }, [selectedActivities]);

  if (!isOpen) return null;

  // Filter activities based on search
  const filteredActivities = businessActivities.filter(activity =>
    activity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle individual activity
  const toggleActivity = (activity: string) => {
    if (localActivities.includes(activity)) {
      setLocalActivities(localActivities.filter(a => a !== activity));
    } else {
      setLocalActivities([...localActivities, activity]);
    }
  };

  // Select all filtered activities
  const selectAll = () => {
    const allActivities = [...new Set([...localActivities, ...filteredActivities])];
    setLocalActivities(allActivities);
  };

  // Clear all activities
  const clearAll = () => {
    setLocalActivities([]);
  };

  // Apply and close
  const handleApply = () => {
    onApply(localActivities);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#3D2817]">
            <i className="ri-store-2-line text-amber-600 mr-2"></i>
            Seleziona Attività Commerciali
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {/* Search Box */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Cerca attività... (es: bar, ristorante, negozio)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        {/* Select All / Clear All */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filteredActivities.length > 0 && filteredActivities.every(a => localActivities.includes(a))}
              onChange={(e) => {
                if (e.target.checked) {
                  selectAll();
                } else {
                  // Uncheck only filtered activities
                  setLocalActivities(localActivities.filter(a => !filteredActivities.includes(a)));
                }
              }}
              className="w-5 h-5 text-amber-600 border-amber-400 rounded focus:ring-amber-500 cursor-pointer"
            />
            <span className="font-semibold text-amber-900">
              {searchQuery ? 'Seleziona risultati visibili' : 'Seleziona tutte le attività'}
            </span>
          </label>
          {localActivities.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <i className="ri-close-circle-line mr-1"></i>
              Cancella tutto
            </button>
          )}
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="ri-search-line text-4xl mb-2"></i>
              <p>Nessuna attività trovata per "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredActivities.map((activity) => (
                <label
                  key={activity}
                  className="flex items-start space-x-2 cursor-pointer hover:bg-amber-50 p-3 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                >
                  <input
                    type="checkbox"
                    checked={localActivities.includes(activity)}
                    onChange={() => toggleActivity(activity)}
                    className="w-4 h-4 text-amber-600 border-amber-400 rounded focus:ring-amber-500 cursor-pointer flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-[#3D2817]">{activity}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-bold text-amber-700">{localActivities.length}</span> attività selezionate
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Applica Filtri
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSortModal, setShowMobileSortModal] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);
  
  // Map interaction state
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [circleFilter, setCircleFilter] = useState<{ center: { lat: number; lng: number }; radiusKm: number } | null>(null);
  
  // Favorites and contact state
  const { favorites, toggleFavorite } = useFavorites();
  const toast = useToast();
  const { user } = useAuth();
  const [contactProperty, setContactProperty] = useState<any | null>(null);
  
  // Mobile drawer state for full-screen zone/business selection
  const [mobileDrawer, setMobileDrawer] = useState<'zone' | 'business' | null>(null);

  // Scroll detection for hiding filter bar
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFilterBarVisible, setIsFilterBarVisible] = useState(true);
  
  // Business Activities Modal
  const [showBusinessActivitiesModal, setShowBusinessActivitiesModal] = useState(false);

  // Initialize filters from URL params immediately (not with defaults)
  const getInitialType = () => {
    const tipoParam = searchParams.get('tipo');
    return tipoParam || 'all';
  };

  const getInitialZones = () => {
    const zonesParam = searchParams.get('zones');
    return zonesParam ? zonesParam.split(',').filter(z => z.trim()) : [];
  };

  const getInitialMainCategory = () => searchParams.get('mainCategory') || '';
  const getInitialSubCategory = () => searchParams.get('subCategory') || '';
  const getInitialSubSubCategory = () => searchParams.get('subSubCategory') || '';
  const getInitialBusinessActivities = () => {
    const param = searchParams.get('businessActivities');
    return param ? param.split(',').filter(a => a.trim()) : [];
  };

  // Basic filters (top bar) - initialized from URL params
  const [selectedType, setSelectedType] = useState(getInitialType);
  const [selectedZones, setSelectedZones] = useState<string[]>(getInitialZones);
  const [selectedMainCategory, setSelectedMainCategory] = useState(getInitialMainCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState(getInitialSubCategory);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState(getInitialSubSubCategory);
  
  // Business activities state - must be declared before useEffect that uses it
  const [businessSearch, setBusinessSearch] = useState('');
  const [selectedBusinessActivities, setSelectedBusinessActivities] = useState<string[]>(getInitialBusinessActivities);

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
  const fetchingRef = useRef(false); // Prevent duplicate requests
  const isClearingFiltersRef = useRef(false); // Track when we're clearing filters to prevent URL param re-application
  const abortControllerRef = useRef<AbortController | null>(null); // For request cancellation
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30); // Initial load: 30 properties
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Use refs to store latest filter values to avoid dependency issues
  const filtersRef = useRef({
    selectedType,
    selectedZones,
    selectedMainCategory,
    selectedSubCategory,
    selectedSubSubCategory,
    selectedBusinessActivities,
    advancedFilters,
    sortBy,
    page,
    pageSize
  });
  
  // Update refs when filters change
  useEffect(() => {
    filtersRef.current = {
      selectedType,
      selectedZones,
      selectedMainCategory,
      selectedSubCategory,
      selectedSubSubCategory,
      selectedBusinessActivities,
      advancedFilters,
      sortBy,
      page,
      pageSize
    };
  }, [selectedType, selectedZones, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, selectedBusinessActivities, advancedFilters, sortBy, page, pageSize]);

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

  // Normalize filter values - convert empty strings to undefined, filter out empty values
  const normalizeFilters = useCallback((filters: any) => {
    const normalized: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      // Skip empty strings, null, undefined, empty arrays
      if (value === '' || value === null || value === undefined) {
        return;
      }
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      normalized[key] = value;
    });
    return normalized;
  }, []);

  // Memoize array joins to prevent unnecessary re-renders (PRIORITY 2: Fix useEffect dependencies)
  const zonesKey = useMemo(() => selectedZones.join(','), [selectedZones]);
  const businessActivitiesKey = useMemo(() => selectedBusinessActivities.join(','), [selectedBusinessActivities]);
  
  // Fetch properties from Supabase via Edge Function
  const fetchProperties = useCallback(async (signal?: AbortSignal, isLoadMore: boolean = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const finalSignal = signal || abortController.signal;

    // Prevent duplicate concurrent requests
    if (fetchingRef.current) {
      return;
    }

    // Read latest filter values from ref to avoid stale closures
    const currentFilters = filtersRef.current;

    try {
      fetchingRef.current = true;
      
      // Set loading state based on whether we're loading more or initial load
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        // PERFORMANCE FIX: Don't clear properties - keep showing old results while loading new ones
        // This makes filters feel instant (0-50ms) instead of slow (300-500ms)
        // setFilteredProperties([]); // ← COMMENTED OUT! Clearing this causes blank screen while waiting
      }
      
      // Calculate offset for pagination using currentFilters values
      const currentPage = isLoadMore ? currentFilters.page + 1 : currentFilters.page;
      const offset = (currentPage - 1) * currentFilters.pageSize;
      
      // Build filters object for Edge Function
      const filterObj: any = {
        limit: currentFilters.pageSize,
        offset: offset,
        sortBy: currentFilters.sortBy,
      };

      // Type filter - only add if not 'all'
      if (currentFilters.selectedType && currentFilters.selectedType !== 'all') {
        // Map Italian URL values to English database values
        const dbType = currentFilters.selectedType === 'affitto' ? 'rent' 
                      : currentFilters.selectedType === 'vendita' ? 'sale' 
                      : currentFilters.selectedType;
        filterObj.type = dbType;
      }

      // Zone filter - only add if array has items
      if (currentFilters.selectedZones.length > 0) {
        filterObj.zones = currentFilters.selectedZones;
      }

      // Category filters - only add if not empty
      if (currentFilters.selectedMainCategory && currentFilters.selectedMainCategory.trim() !== '') {
        filterObj.category = currentFilters.selectedMainCategory;
      }
      if (currentFilters.selectedSubCategory && currentFilters.selectedSubCategory.trim() !== '') {
        filterObj.subCategory = currentFilters.selectedSubCategory;
      }
      if (currentFilters.selectedSubSubCategory && currentFilters.selectedSubSubCategory.trim() !== '') {
        filterObj.subSubCategory = currentFilters.selectedSubSubCategory;
      }

      // Business activities filter - only add if array has items
      if (currentFilters.selectedBusinessActivities.length > 0) {
        filterObj.businessActivities = currentFilters.selectedBusinessActivities;
      }

      // Advanced filters - only add if not empty
      const advFilters = currentFilters.advancedFilters;
      if (advFilters.minPrice && advFilters.minPrice.trim() !== '') {
        filterObj.priceMin = advFilters.minPrice;
      }
      if (advFilters.maxPrice && advFilters.maxPrice.trim() !== '') {
        filterObj.priceMax = advFilters.maxPrice;
      }
      if (advFilters.minArea && advFilters.minArea.trim() !== '') {
        filterObj.minArea = advFilters.minArea;
      }
      if (advFilters.maxArea && advFilters.maxArea.trim() !== '') {
        filterObj.maxArea = advFilters.maxArea;
      }
      if (advFilters.rooms && advFilters.rooms.trim() !== '') {
        filterObj.rooms = advFilters.rooms;
      }
      if (advFilters.bathrooms && advFilters.bathrooms.trim() !== '') {
        filterObj.bathrooms = advFilters.bathrooms;
      }
      if (advFilters.floor && advFilters.floor.trim() !== '') {
        filterObj.floor = advFilters.floor;
      }
      if (advFilters.condition && advFilters.condition.trim() !== '') {
        filterObj.condition = advFilters.condition;
      }
      if (advFilters.energyClass && advFilters.energyClass.trim() !== '') {
        filterObj.energyClass = advFilters.energyClass;
      }
      if (advFilters.features.length > 0) {
        filterObj.features = advFilters.features;
      }

      // Normalize filters to remove any undefined/empty values
      const normalizedFilters = normalizeFilters(filterObj);

      // Check if request was aborted
      if (finalSignal.aborted) {
        return;
      }

      // Fetch via Edge Function
      const data = await propertyFunctions.get(normalizedFilters);

      // Check if request was aborted after fetch
      if (finalSignal.aborted) {
        return;
      }

      // Transform Supabase data using standardized utility
      const transformedProperties = transformProperties(Array.isArray(data) ? data : []);
      
      // Update properties based on whether we're loading more or initial load
      if (isLoadMore) {
        const nextPage = currentFilters.page + 1;
        setFilteredProperties(prev => [...prev, ...transformedProperties]);
        setPage(nextPage);
        // If we got fewer results than requested, there are no more pages
        setHasMore(transformedProperties.length >= currentFilters.pageSize);
      } else {
        setFilteredProperties(transformedProperties);
        // Reset page to 1 on initial load (not load more)
        setPage(1);
        // If we got fewer results than requested, there are no more pages
        setHasMore(transformedProperties.length >= currentFilters.pageSize);
      }
    } catch (error: any) {
      // Don't log abort errors
      if (error?.name === 'AbortError' || finalSignal.aborted) {
        return;
      }
      setFilteredProperties([]);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!finalSignal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
      fetchingRef.current = false;
    }
  }, [normalizeFilters]); // Only depend on normalizeFilters (stable function)

  // Read URL parameters and sync state when URL changes (but only if different)
  useEffect(() => {
    // Skip if we're currently clearing filters (prevents re-applying old URL params)
    if (isClearingFiltersRef.current) {
      return;
    }
    
    const tipoParam = searchParams.get('tipo');
    const mainCategoryParam = searchParams.get('mainCategory');
    const subCategoryParam = searchParams.get('subCategory');
    const subSubCategoryParam = searchParams.get('subSubCategory');
    const zonesParam = searchParams.get('zones');
    const businessActivitiesParam = searchParams.get('businessActivities');

    const newType = tipoParam || 'all';
    const newMainCategory = mainCategoryParam || '';
    const newSubCategory = subCategoryParam || '';
    const newSubSubCategory = subSubCategoryParam || '';
    const newZones = zonesParam ? zonesParam.split(',').filter(z => z.trim()) : [];
    const newBusinessActivities = businessActivitiesParam 
      ? businessActivitiesParam.split(',').filter(a => a.trim()) 
      : [];

    // Only update state if values actually changed (prevent unnecessary re-renders)
    let hasChanges = false;

    if (selectedType !== newType) {
      setSelectedType(newType);
      hasChanges = true;
    }
    if (selectedMainCategory !== newMainCategory) {
      setSelectedMainCategory(newMainCategory);
      hasChanges = true;
    }
    if (selectedSubCategory !== newSubCategory) {
      setSelectedSubCategory(newSubCategory);
      hasChanges = true;
    }
    if (selectedSubSubCategory !== newSubSubCategory) {
      setSelectedSubSubCategory(newSubSubCategory);
      hasChanges = true;
    }
    // Compare arrays efficiently without JSON.stringify
    const zonesChanged = selectedZones.length !== newZones.length || 
      selectedZones.some((zone, i) => zone !== newZones[i]);
    if (zonesChanged) {
      setSelectedZones(newZones);
      hasChanges = true;
    }
    
    const activitiesChanged = selectedBusinessActivities.length !== newBusinessActivities.length ||
      selectedBusinessActivities.some((activity, i) => activity !== newBusinessActivities[i]);
    if (activitiesChanged) {
      setSelectedBusinessActivities(newBusinessActivities);
      hasChanges = true;
    }

    // URL params synced
  }, [searchParams]); // Only depend on searchParams

  // Single useEffect to trigger fetch when filter state changes (with debouncing)
  // Note: circleFilter is NOT included because it's a client-side filter applied after fetch
  // The map circle filter is applied to already-fetched properties, not sent to the server
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout with 100ms delay (OPTIMIZED: reduced from 150ms for faster feel)
    debounceTimeoutRef.current = setTimeout(() => {
      fetchProperties();
    }, 100);

    // Cleanup: cancel debounce on unmount or when dependencies change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedType, zonesKey, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, businessActivitiesKey, advancedFilters.minPrice, advancedFilters.maxPrice, advancedFilters.minArea, advancedFilters.maxArea, advancedFilters.rooms, advancedFilters.bathrooms, advancedFilters.floor, advancedFilters.condition, advancedFilters.energyClass, advancedFilters.features.length, sortBy, fetchProperties]);

  // Category functions – same as Hero Section (memoized with useMemo to prevent unnecessary re-computation)
  const subCategoriesArray = useMemo(() => {
    if (!selectedMainCategory) return [];
    const category = propertyCategories[selectedMainCategory as keyof typeof propertyCategories];
    return typeof category === 'object' && Object.keys(category).length > 0 ? Object.keys(category) : [];
  }, [selectedMainCategory]);

  const subSubCategoriesArray = useMemo(() => {
    if (!selectedMainCategory || !selectedSubCategory) return [];
    const mainCat = propertyCategories[selectedMainCategory as keyof typeof propertyCategories];
    if (!mainCat || typeof mainCat !== 'object') return [];
    return (mainCat as any)[selectedSubCategory] || [];
  }, [selectedMainCategory, selectedSubCategory]);

  // Functions that return categories (for compatibility with existing code)
  const getSubCategories = useCallback(() => subCategoriesArray, [subCategoriesArray]);
  const getSubSubCategories = useCallback(() => subSubCategoriesArray, [subSubCategoriesArray]);

  const handleMainCategoryChange = useCallback((category: string) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory('');
    setSelectedSubSubCategory('');
  }, []);

  const handleSubCategoryChange = useCallback((subCategory: string) => {
    setSelectedSubCategory(subCategory);
    setSelectedSubSubCategory('');
  }, []);

  // Clear all filters function - clears state AND URL params
  const clearAllFilters = useCallback(() => {
    
    // Set flag to prevent useEffect from re-applying URL params
    isClearingFiltersRef.current = true;
    
    // Clear all state
    setSelectedType('all');
    setSelectedZones([]);
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    setSelectedSubSubCategory('');
    setSelectedBusinessActivities([]);
    setCircleFilter(null); // Clear circle filter from map
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
    
    // Reset pagination
    setPage(1);
    setHasMore(true);
    
    // CRITICAL: Clear URL params to prevent useEffect from re-applying filters
    router.replace('/search-results');
    
    // Reset flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isClearingFiltersRef.current = false;
    }, 100);
    
  }, [router]);

  // Check if we should show business activity dropdown
  const shouldShowBusinessActivity = selectedMainCategory === 'Commerciale' && selectedSubCategory === 'Attività/Licenza commerciale';

  // Zone selection helpers – same as Hero Section
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

  const [expandedMacroZones, setExpandedMacroZones] = useState<string[]>([]);

  const toggleMacroZoneExpansion = useCallback((macroZone: string) => {
    setExpandedMacroZones((prev) =>
      prev.includes(macroZone) ? prev.filter((z) => z !== macroZone) : [...prev, macroZone]
    );
  }, []);

  const isMacroZoneSelected = useCallback((macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allInMacro = [macroZone, ...subZones];
    return allInMacro.every((z) => selectedZones.includes(z));
  }, [selectedZones]);

  const isMacroZonePartiallySelected = useCallback((macroZone: string) => {
    const subZones = romeZones[macroZone as keyof typeof romeZones] || [];
    const allInMacro = [macroZone, ...subZones];
    const selectedCount = allInMacro.filter((z) => selectedZones.includes(z)).length;
    return selectedCount > 0 && selectedCount < allInMacro.length;
  }, [selectedZones]);

  const [zoneSearch, setZoneSearch] = useState('');

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

  const getFilteredMacroZones = useCallback(() => {
    if (!zoneSearch) return Object.keys(romeZones);
    return Object.keys(romeZones).filter((macro) => {
      const subs = romeZones[macro as keyof typeof romeZones] || [];
      const macroMatch = macro.toLowerCase().includes(zoneSearch.toLowerCase());
      const subMatch = subs.some((sub) => sub.toLowerCase().includes(zoneSearch.toLowerCase()));
      return macroMatch || subMatch;
    });
  }, [zoneSearch]);

  const getFilteredSubZones = useCallback((macroZone: string) => {
    const subs = romeZones[macroZone as keyof typeof romeZones] || [];
    if (!zoneSearch) return subs;
    return subs.filter((sub) => sub.toLowerCase().includes(zoneSearch.toLowerCase()));
  }, [zoneSearch]);

  // Business activities helpers – same as Hero Section
  // Note: businessSearch and selectedBusinessActivities are declared above with other filter states
  const filteredBusinessActivities = businessActivities.filter((a) =>
    a.toLowerCase().includes(businessSearch.toLowerCase())
  );

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

  // Scroll detection for hiding/showing filter bar (desktop only)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show near top (within 150px)
      if (currentScrollY < 150) {
        setIsFilterBarVisible(true);
      } else {
        // Hide when scrolling down, stay hidden when scrolling up (until near top)
        if (currentScrollY > lastScrollY) {
          setIsFilterBarVisible(false);
        }
        // Don't show on scroll up - only show when scrolling back to top
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Zone coordinates for circle filtering (same as PropertyMap)
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

  const ROME_CENTER = { lat: 41.9028, lng: 12.4964 };

  // Haversine formula to calculate distance between two coordinates in km
  const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get property coordinates (latitude/longitude) - ONLY exact coordinates, NO zone fallback
  const getPropertyCoords = (property: any): { lat: number; lng: number } | null => {
    // Use exact coordinates if available
    if (property.latitude && property.longitude && 
        !isNaN(Number(property.latitude)) && !isNaN(Number(property.longitude)) &&
        Number(property.latitude) !== 0 && Number(property.longitude) !== 0) {
      return { lat: property.latitude, lng: property.longitude };
    }
    
    // NO ZONE FALLBACK - return null if no coordinates
    return null;
  };

  // Apply circle filter to properties (client-side filtering)
  const displayedProperties = useMemo(() => {
    if (!circleFilter) {
      return filteredProperties;
    }

    // Filter properties that are within the circle radius
    return filteredProperties.filter(property => {
      const propCoords = getPropertyCoords(property);
      if (!propCoords) return false; // Exclude properties without coordinates
      const distance = calculateDistance(circleFilter.center, propCoords);
      return distance <= circleFilter.radiusKm;
    });
  }, [filteredProperties, circleFilter]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />
      
      {/* Spacer for fixed header - Height matches header (top banner + main nav) */}
      <div className="h-[100px] lg:h-[100px]"></div>
      
      {/* Mobile Filter, Sort, and Map Buttons - Only visible on mobile - Scrolls with content */}
      <div className="lg:hidden w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-3 py-2.5">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="relative h-11 px-3 bg-[#C47B5B] text-white rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold shadow-sm hover:bg-[#B36A4A] active:scale-95 transition-all duration-200"
            >
              <i className="ri-filter-3-line text-lg"></i>
              <span>Filtra</span>
              {(getActiveAdvancedFiltersCount() > 0 || selectedZones.length > 0 || selectedMainCategory || selectedBusinessActivities.length > 0 || selectedType !== 'all' || circleFilter) && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 flex items-center justify-center bg-[#14B8A6] text-white text-xs font-bold rounded-full shadow-md">
                  {getActiveAdvancedFiltersCount() + 
                   (selectedZones.length > 0 ? 1 : 0) + 
                   (selectedMainCategory ? 1 : 0) + 
                   (selectedSubCategory ? 1 : 0) + 
                   (selectedSubSubCategory ? 1 : 0) + 
                   selectedBusinessActivities.length + 
                   (selectedType !== 'all' ? 1 : 0) +
                   (circleFilter ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMobileSortModal(true)}
              className="h-11 px-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold border-2 border-gray-200 hover:bg-gray-200 hover:border-gray-300 active:scale-95 transition-all duration-200"
            >
              <i className="ri-sort-desc text-lg"></i>
              <span>Ordina</span>
            </button>
            <button
              onClick={() => setShowMobileMap(true)}
              className="h-11 px-3 bg-[#4285F4] text-white rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold shadow-sm hover:bg-[#3367D6] active:scale-95 transition-all duration-200"
            >
              <i className="ri-map-pin-line text-lg"></i>
              <span>Mappa</span>
            </button>
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
                  className="modern-select cursor-pointer h-12 w-full px-4 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] transition-all"
                >
                    <option value="all">Tutti i tipi</option>
                    <option value="vendita">In Vendita</option>
                    <option value="affitto">In Affitto</option>
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
                    <span className="flex-1 text-base font-bold">{option.label}</span>
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
      
      {/* Desktop Filter Bar - Full-width edge-to-edge sticky below fixed header - Scrolls under header on scroll down */}
      <div className={`hidden lg:block w-full bg-white border-b border-gray-200 shadow-sm sticky top-[100px] z-40 transition-transform duration-300 ${
        isFilterBarVisible ? 'translate-y-0' : '-translate-y-full opacity-0'
      }`}>
        <div className="w-full px-6 py-4">
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
                <option value="vendita">Vendita</option>
                <option value="affitto">Affitto</option>
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

      {/* Main Content Area - 60/40 Split on Desktop */}
      <div className="lg:flex lg:h-[calc(100vh-180px)]">
        {/* Left Side: Properties List (40% on desktop, full width on mobile) */}
        <div className="lg:w-[40%] lg:overflow-y-auto lg:h-full">
          <div className="max-w-7xl lg:max-w-none mx-auto px-4 sm:px-6 lg:px-6 pb-6 sm:pb-8 lg:pb-10 pt-0 mt-0 lg:mt-4">
        {/* Results Header - Mobile: 2 lines, Desktop: 1 line */}
        <div className="mb-4 lg:mb-5">
          {/* Mobile Layout: Stacked */}
          <div className="lg:hidden">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-bold text-[#3D2817]">
                <span className="text-[#D97860]">{displayedProperties.length}</span> {displayedProperties.length === 1 ? 'Risultato' : 'Risultati'}
              </h2>
              
              {/* Clear All Button */}
              {(selectedType !== 'all' || selectedZones.length > 0 || selectedMainCategory || selectedBusinessActivities.length > 0 || getActiveAdvancedFiltersCount() > 0 || circleFilter) && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-sm font-semibold text-[#D97860] hover:bg-[#D97860] hover:text-white rounded-lg transition-colors border border-[#D97860]"
                >
                  Cancella Tutti
                </button>
              )}
            </div>

            {/* Active Filters */}
            {(selectedType !== 'all' || selectedZones.length > 0 || selectedMainCategory || selectedBusinessActivities.length > 0 || getActiveAdvancedFiltersCount() > 0 || circleFilter) && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {selectedType === 'vendita' ? 'Vendita' : 'Affitto'}
                    <button
                      onClick={() => setSelectedType('all')}
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedZones.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {selectedZones.length === 1 ? selectedZones[0] : `${selectedZones.length} Zone`}
                    <button
                      onClick={() => setSelectedZones([])}
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedMainCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {selectedMainCategory}
                    <button
                      onClick={() => {
                        setSelectedMainCategory('');
                        setSelectedSubCategory('');
                        setSelectedSubSubCategory('');
                        setSelectedBusinessActivities([]);
                      }}
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedSubCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14B8A6]/10 border border-[#14B8A6] text-[#14B8A6] rounded-lg text-sm font-medium">
                    {selectedSubCategory}
                    <button
                      onClick={() => {
                        setSelectedSubCategory('');
                        setSelectedSubSubCategory('');
                        setSelectedBusinessActivities([]);
                      }}
                      className="hover:bg-[#14B8A6] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedSubSubCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14B8A6]/10 border border-[#14B8A6] text-[#14B8A6] rounded-lg text-sm font-medium">
                    {selectedSubSubCategory}
                    <button
                      onClick={() => {
                        setSelectedSubSubCategory('');
                      }}
                      className="hover:bg-[#14B8A6] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedBusinessActivities.length > 0 && (
                    <button
                    onClick={() => setShowBusinessActivitiesModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-2 border-amber-500 text-amber-800 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                    <i className="ri-store-2-line text-base"></i>
                    Attività ({selectedBusinessActivities.length})
                    <i className="ri-pencil-line text-sm"></i>
                    </button>
                )}

                {getActiveAdvancedFiltersCount() > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {getActiveAdvancedFiltersCount()} Avanzati
                    <button
                      onClick={() => {
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
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {/* Circle Filter Badge - Mobile */}
                {circleFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3D2817] text-white rounded-lg text-sm font-medium">
                    <i className="ri-focus-3-line text-base"></i>
                    Area: {circleFilter.radiusKm < 1 
                      ? `${Math.round(circleFilter.radiusKm * 1000)}m` 
                      : `${circleFilter.radiusKm.toFixed(1)}km`}
                    <button
                      onClick={() => setCircleFilter(null)}
                      className="hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Layout: Single Line */}
          <div className="hidden lg:block">
            {/* Results Count - Large and Prominent */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-[#3D2817]">
                <span className="text-[#D97860]">{displayedProperties.length}</span> {displayedProperties.length === 1 ? 'Risultato' : 'Risultati'}
              </h2>
              
              {/* Clear All Button */}
              {(selectedType !== 'all' || selectedZones.length > 0 || selectedMainCategory || selectedBusinessActivities.length > 0 || getActiveAdvancedFiltersCount() > 0 || circleFilter) && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-semibold text-[#D97860] hover:bg-[#D97860] hover:text-white rounded-lg transition-colors border border-[#D97860]"
                >
                  Cancella Tutti
                </button>
              )}
            </div>

            {/* Active Filters - Separate line, smaller, lighter */}
            {(selectedType !== 'all' || selectedZones.length > 0 || selectedMainCategory || selectedBusinessActivities.length > 0 || getActiveAdvancedFiltersCount() > 0 || circleFilter) && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {selectedType === 'vendita' ? 'Vendita' : 'Affitto'}
                    <button
                      onClick={() => setSelectedType('all')}
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedZones.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {selectedZones.length === 1 ? selectedZones[0] : `${selectedZones.length} Zone`}
                    <button
                      onClick={() => setSelectedZones([])}
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedMainCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {selectedMainCategory}
                    <button
                      onClick={() => {
                        setSelectedMainCategory('');
                        setSelectedSubCategory('');
                        setSelectedSubSubCategory('');
                        setSelectedBusinessActivities([]);
                      }}
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedSubCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14B8A6]/10 border border-[#14B8A6] text-[#14B8A6] rounded-lg text-sm font-medium">
                    {selectedSubCategory}
                    <button
                      onClick={() => {
                        setSelectedSubCategory('');
                        setSelectedSubSubCategory('');
                        setSelectedBusinessActivities([]);
                      }}
                      className="hover:bg-[#14B8A6] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedSubSubCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14B8A6]/10 border border-[#14B8A6] text-[#14B8A6] rounded-lg text-sm font-medium">
                    {selectedSubSubCategory}
                    <button
                      onClick={() => {
                        setSelectedSubSubCategory('');
                      }}
                      className="hover:bg-[#14B8A6] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {selectedBusinessActivities.length > 0 && (
                    <button
                    onClick={() => setShowBusinessActivitiesModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-2 border-amber-500 text-amber-800 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                    <i className="ri-store-2-line text-base"></i>
                    Attività ({selectedBusinessActivities.length})
                    <i className="ri-pencil-line text-sm"></i>
                    </button>
                )}

                {getActiveAdvancedFiltersCount() > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#D97860] text-[#D97860] rounded-lg text-sm font-medium">
                    {getActiveAdvancedFiltersCount()} Avanzati
                    <button
                      onClick={() => {
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
                      className="hover:bg-[#D97860] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}

                {/* Circle Filter Badge */}
                {circleFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3D2817] text-white rounded-lg text-sm font-medium">
                    <i className="ri-focus-3-line text-base"></i>
                    {circleFilter.radiusKm < 1 
                      ? `${Math.round(circleFilter.radiusKm * 1000)}m` 
                      : `${circleFilter.radiusKm.toFixed(1)}km`}
                    <button
                      onClick={() => setCircleFilter(null)}
                      className="hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {!loading && displayedProperties.length === 0 ? (
          <div className="text-center py-16 sm:py-20 lg:py-24 bg-white rounded-2xl border border-[#E8E4E0]">
            <i className="ri-search-line text-6xl sm:text-7xl text-gray-300 mb-6"></i>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#3D2817] mb-3">Nessun immobile trovato</h3>
            <p className="text-[#5C4B42] text-base sm:text-lg mb-6 max-w-md mx-auto">
              Prova a modificare i filtri di ricerca o rimuovere alcuni filtri per vedere più risultati
            </p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-[#D97860] text-white rounded-xl hover:bg-[#C86B54] transition-colors font-semibold shadow-lg"
            >
              Rimuovi Tutti i Filtri
            </button>
          </div>
        ) : displayedProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <i className="ri-loader-4-line text-5xl text-[#D97860] animate-spin mb-4"></i>
            <p className="text-[#5C4B42] text-base sm:text-lg">Caricamento immobili...</p>
          </div>
        ) : (
          <>
            {/* Properties Grid - Single column on desktop (40% width), 2 columns on tablet, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 lg:gap-4 items-stretch auto-rows-fr">
              {displayedProperties.map((property) => (
                <div 
                  key={property.id}
                  id={`property-${property.id}`}
                  className={`w-full h-full transition-all duration-200 ${
                    hoveredPropertyId === property.id ? 'ring-2 ring-[#D97860] ring-offset-2 rounded-xl' : ''
                  }`}
                  onMouseEnter={() => setHoveredPropertyId(property.id)}
                  onMouseLeave={() => setHoveredPropertyId(null)}
                >
                  <SharedPropertyCard property={property} />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && displayedProperties.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchProperties(undefined, true)}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                      <span>Caricamento...</span>
                    </>
                  ) : (
                    <>
                      <span>Carica Altri</span>
                      <i className="ri-arrow-down-line text-xl"></i>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>

        {/* Right Side: Map (60% on desktop, hidden on mobile) */}
        <div className="hidden lg:block lg:w-[60%] lg:h-full lg:sticky lg:top-0">
          <PropertyMap
            properties={displayedProperties}
            onPropertyClick={(property) => {
              setSelectedMapPropertyId(property.id);
            }}
            onPropertyHover={setHoveredPropertyId}
            hoveredPropertyId={hoveredPropertyId}
            selectedPropertyId={selectedMapPropertyId}
            onCircleFilter={(center, radiusKm) => {
              setCircleFilter({ center, radiusKm });
            }}
            onClearCircle={() => setCircleFilter(null)}
            circleActive={!!circleFilter}
            onToggleFavorite={async (propertyId) => {
              if (!user) {
                toast.error('Accedi per salvare i preferiti');
                return;
              }
              try {
                await toggleFavorite(propertyId);
                toast.success(favorites.includes(propertyId) ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
              } catch (error) {
                toast.error('Errore durante l\'operazione');
              }
            }}
            onContact={(property) => {
              setContactProperty(property);
            }}
            favorites={favorites}
          />
        </div>
      </div>

      {/* Mobile Full-Screen Map Modal */}
      {showMobileMap && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <PropertyMap
            properties={displayedProperties}
            onPropertyClick={(property) => {
              setSelectedMapPropertyId(property.id);
            }}
            onPropertyHover={setHoveredPropertyId}
            hoveredPropertyId={hoveredPropertyId}
            selectedPropertyId={selectedMapPropertyId}
            onCircleFilter={(center, radiusKm) => {
              setCircleFilter({ center, radiusKm });
            }}
            onClearCircle={() => setCircleFilter(null)}
            circleActive={!!circleFilter}
            isFullScreen={true}
            onClose={() => setShowMobileMap(false)}
            onToggleFavorite={async (propertyId) => {
              if (!user) {
                toast.error('Accedi per salvare i preferiti');
                return;
              }
              try {
                await toggleFavorite(propertyId);
                toast.success(favorites.includes(propertyId) ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
              } catch (error) {
                toast.error('Errore durante l\'operazione');
              }
            }}
            onContact={(property) => {
              // Don't close map - just show contact modal over the map
              setContactProperty(property);
            }}
            favorites={favorites}
          />
        </div>
      )}

      {/* Mobile Bottom Drawer - Zone Selection */}
      {mobileDrawer === 'zone' && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDrawer(null)}></div>
          <div 
            className="absolute inset-0 bg-white flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ 
              touchAction: 'auto',
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
              touchAction: 'auto',
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

      {/* Business Activities Modal */}
      <BusinessActivitiesModal
        isOpen={showBusinessActivitiesModal}
        onClose={() => setShowBusinessActivitiesModal(false)}
        selectedActivities={selectedBusinessActivities}
        onApply={setSelectedBusinessActivities}
      />

      {/* Map Contact Modal */}
      {contactProperty && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Contatta il Proprietario</h3>
                <button
                  onClick={() => setContactProperty(null)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl text-gray-600"></i>
                </button>
              </div>
              
              <div className="bg-[#F9F6F3] rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] rounded-full text-white font-bold text-lg">
                    {contactProperty.owner?.name ? contactProperty.owner.name.charAt(0) : 'P'}
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D2817]">
                      {contactProperty.owner?.name || 'Proprietario'}
                    </p>
                    <p className="text-sm text-gray-500">{contactProperty.zone || 'Roma'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-3">
              {/* WhatsApp */}
              {contactProperty.owner?.whatsapp && (
                <a
                  href={`https://wa.me/${contactProperty.owner.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Ciao, sono interessato all'immobile: ${contactProperty.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full">
                    <i className="ri-whatsapp-line text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">WhatsApp</p>
                    <p className="text-sm text-gray-500">{contactProperty.owner.whatsapp}</p>
                  </div>
                </a>
              )}
              
              {/* Phone */}
              {contactProperty.owner?.phone && (
                <a
                  href={`tel:${contactProperty.owner.phone}`}
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded-full">
                    <i className="ri-phone-line text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Telefono</p>
                    <p className="text-sm text-gray-500">{contactProperty.owner.phone}</p>
                  </div>
                </a>
              )}
              
              {/* Email */}
              {contactProperty.owner?.email && (
                <a
                  href={`mailto:${contactProperty.owner.email}?subject=${encodeURIComponent(`Richiesta info: ${contactProperty.title}`)}`}
                  className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-500 rounded-full">
                    <i className="ri-mail-line text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{contactProperty.owner.email}</p>
                  </div>
                </a>
              )}
              
              {/* No contact info */}
              {!contactProperty.owner?.whatsapp && !contactProperty.owner?.phone && !contactProperty.owner?.email && (
                <div className="text-center py-4 text-gray-500">
                  <i className="ri-information-line text-2xl mb-2"></i>
                  <p>Nessun contatto disponibile</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F6F3] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D97860]"></div>
        <p className="mt-4 text-gray-600">Caricamento risultati...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
