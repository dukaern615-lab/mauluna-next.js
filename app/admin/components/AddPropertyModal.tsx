'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { romeZones } from '@/mocks/properties';
import { useToast } from '@/hooks/useToast';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Business activities list - EXACT SAME as search results page
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

// Property categories - EXACT SAME as search results page
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

// Zone Selector Component - SAME AS HERO SECTION
const ZoneSelector = ({ selectedZone, onZoneChange }: { selectedZone: string, onZoneChange: (zone: string) => void }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');
  const [expandedMacroZones, setExpandedMacroZones] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleZoneSelect = (zone: string) => {
    onZoneChange(zone);
    setShowDropdown(false);
  };

  const toggleMacroZoneExpansion = (macroZone: string) => {
    setExpandedMacroZones(prev => 
      prev.includes(macroZone)
        ? prev.filter(zone => zone !== macroZone)
        : [...prev, macroZone]
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
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors text-left flex items-center justify-between"
      >
        <span className="truncate">
          {!selectedZone ? 'Seleziona una zona' : selectedZone}
        </span>
        <i className={`ri-arrow-down-s-line transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-[350px]">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Cerca zone..."
              value={zoneSearch}
              onChange={(e) => setZoneSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto max-h-[280px]">
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
        </div>
      )}
    </div>
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
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-[#3D2817] focus:border-[#D97860] focus:ring-2 focus:ring-[#D97860]/20 transition-colors text-left flex items-center justify-between"
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
  ],
  
  visibility: ['Alta', 'Media', 'Bassa'],
  commercialType: ['Negozio', 'Laboratorio', 'Showroom', 'Magazzino'],
  officeType: ['Singolo', 'Open space', 'Condiviso'],
  services: ['Reception', 'Pulizie', 'Sicurezza', 'Internet', 'Aria condizionata', 'Riscaldamento'],
  garageType: ['Box singolo', 'Box doppio', 'Posto auto coperto', 'Posto auto scoperto'],
  security: ['Videosorveglianza', 'Cancello automatico', 'Custode', 'Allarme'],
  access: ['24h', 'Orari limitati', 'Solo giorno'],
  landType: ['Edificabile', 'Agricolo', 'Industriale', 'Commerciale'],
  buildingRights: ['Residenziale', 'Commerciale', 'Industriale', 'Misto'],
  utilities: ['Acqua', 'Elettricità', 'Gas', 'Fognature', 'Telefono', 'Internet']
};

export default function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    listing_type: 'rent',
    property_type: '',
    sub_category: '',
    sub_sub_category: '',
    price: '',
    square_meters: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    address: '',
    zone: '', // Single zone string (matching add-listing page)
    description: '',
    condition: '',
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
    status: 'pending',
    featured: false,
    // User contact information
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_whatsapp: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [addressError, setAddressError] = useState('');
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize toast hook
  const toast = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));

    setUploadedImages(prev => [...prev, ...newFiles]);
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate required fields
    if (!formData.title?.trim()) {
      setError('Il titolo è obbligatorio');
      setSaving(false);
      return;
    }

    if (!formData.property_type) {
      setError('Il tipo di proprietà è obbligatorio');
      setSaving(false);
      return;
    }

    if (!formData.address?.trim()) {
      setError('L\'indirizzo è obbligatorio');
      setSaving(false);
      return;
    }

    if (!formData.zone || formData.zone.trim() === '') {
      setError('La zona è obbligatoria');
      setSaving(false);
      return;
    }

    // Validate owner name
    if (!formData.owner_name.trim()) {
      setError('Il nome del proprietario è obbligatorio');
      setSaving(false);
      return;
    }

    // Validate at least one contact method
    const hasEmail = formData.owner_email.trim() !== '';
    const hasPhone = formData.owner_phone.trim() !== '';
    const hasWhatsApp = formData.owner_whatsapp.trim() !== '';

    if (!hasEmail && !hasPhone && !hasWhatsApp) {
      setError('Devi fornire almeno un metodo di contatto: Email, Telefono o WhatsApp');
      setSaving(false);
      return;
    }

    // Validate email if provided
    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.owner_email.trim())) {
        setError('Formato email non valido');
        setSaving(false);
        return;
      }
    }

    // Validate phone if provided
    if (hasPhone) {
      const cleaned = formData.owner_phone.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+?39)?3\d{9}$/;
      const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;
      
      if (cleaned === '39' || cleaned === '+39') {
        setError('Il numero di telefono deve essere completo (es. +39 333 123 4567)');
        setSaving(false);
        return;
      }
      
      if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
        setError('Formato numero di telefono non valido. Usa un numero italiano valido');
        setSaving(false);
        return;
      }
    }

    // Validate WhatsApp if provided
    if (hasWhatsApp) {
      const cleaned = formData.owner_whatsapp.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+?39)?3\d{9}$/;
      const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;
      
      if (cleaned === '39' || cleaned === '+39') {
        setError('Il numero WhatsApp deve essere completo (es. +39 333 123 4567)');
        setSaving(false);
        return;
      }
      
      if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
        setError('Formato numero WhatsApp non valido. Usa un numero italiano valido');
        setSaving(false);
        return;
      }
    }

    // Validate price
    const priceNum = parseFloat(formData.price.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Il prezzo deve essere un numero maggiore di zero');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload images first and collect URLs
      const imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        setUploadingImages(true);
        
        try {
          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${i}.${fileExt}`;
            
            console.log(`Uploading image ${i + 1}/${uploadedImages.length}:`, fileName);
            
            // Upload to Supabase Storage directly to bucket (no user folder)
            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('property-images')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('property-images')
              .getPublicUrl(fileName);

            if (urlData?.publicUrl) {
              imageUrls.push(urlData.publicUrl);
              console.log('Image uploaded successfully:', urlData.publicUrl);
            }
          }
        } finally {
          setUploadingImages(false); // Reset after image upload completes
        }
        
        console.log(`Total images uploaded: ${imageUrls.length}`);
      }

      // Prepare property data
      const propertyData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        property_type: formData.property_type,
        sub_category: formData.sub_category || null,
        sub_sub_category: formData.sub_sub_category || null,
        listing_type: formData.listing_type,
        price: priceNum, // Use validated priceNum instead of parseFloat
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        sqm: formData.square_meters ? parseFloat(formData.square_meters) : null,
        address: formData.address || '',
        city: 'Roma',
        zone: formData.zone || null, // Use zone string directly
        floor: formData.floor || null,
        condition: formData.condition || null,
        energy_class: formData.energy_class || null,
        features: formData.features || [],
        business_activities: formData.business_activities || [],
        owner_name: formData.owner_name || null,
        owner_email: formData.owner_email || null,
        owner_phone: formData.owner_phone || null,
        owner_whatsapp: formData.owner_whatsapp || null,
        status: 'pending',
        featured: formData.featured || false,
        available_from: formData.available_from || null,
      };

      console.log('Creating property with data:', propertyData);

      // Create property using direct Supabase call
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (propertyError) {
        console.error('Property creation error:', propertyError);
        console.error('Error details:', propertyError.message, propertyError.details, propertyError.hint);
        throw new Error(propertyError.message || 'Failed to create property');
      }

      if (!property) {
        throw new Error('Property was not created - no data returned');
      }

      console.log('Property created successfully:', property.id);

      // Create property images records
      if (imageUrls.length > 0 && property) {
        const imageRecords = imageUrls.map((url, index) => ({
          property_id: property.id,
          image_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('property_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('Error creating image records:', imagesError);
          // Don't fail the whole operation if images fail
        }
      }

      toast.success('Proprietà creata con successo!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating property:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Set error state to display in UI
      const errorMessage = error?.message || error?.toString() || 'Errore sconosciuto durante la creazione dell\'annuncio';
      setError(errorMessage);
      
      // Show toast with detailed error
      toast.error(`Errore: ${errorMessage}`);
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      listing_type: 'rent',
      property_type: '',
      sub_category: '',
      sub_sub_category: '',
      price: '',
      square_meters: '',
      bedrooms: '',
      bathrooms: '',
      floor: '',
      address: '',
      zone: '',
      description: '',
      condition: '',
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
      status: 'approved',
      featured: false,
      owner_name: '',
      owner_email: '',
      owner_phone: '',
      owner_whatsapp: '',
    });
    setUploadedImages([]);
    setImagePreviewUrls([]);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset dependent fields
    if (field === 'property_type') {
      setFormData(prev => ({ 
        ...prev, 
        property_type: value,
        sub_category: '', 
        sub_sub_category: '',
        business_activities: []
      }));
    }
    if (field === 'sub_category') {
      setFormData(prev => ({ 
        ...prev, 
        sub_category: value,
        sub_sub_category: ''
      }));
    }
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

  // Google Places Autocomplete for address
  useEffect(() => {
    if (!isOpen || !addressInputRef.current) return;

    let autocompleteService: google.maps.places.AutocompleteService | null = null;
    let placesService: google.maps.places.PlacesService | null = null;
    let suggestionsContainer: HTMLDivElement | null = null;
    let inputTimeout: NodeJS.Timeout;

    const initServices = () => {
      const checkGoogle = () => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          autocompleteService = new google.maps.places.AutocompleteService();
          const mapDiv = document.createElement('div');
          placesService = new google.maps.places.PlacesService(mapDiv);
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    };

    const validateAddress = async (address: string) => {
      if (!autocompleteService || address.trim().length < 3) {
        setAddressError('');
        return;
      }

      autocompleteService.getPlacePredictions(
        {
          input: address,
          componentRestrictions: { country: 'it' },
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(41.7, 12.3),
            new google.maps.LatLng(42.0, 12.7)
          ),
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
            setAddressError('');
          } else {
            setAddressError('Indirizzo non trovato a Roma. Verifica l\'indirizzo.');
          }
        }
      );
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
        (predictions, status) => {
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

          predictions.slice(0, 5).forEach((prediction) => {
            const item = document.createElement('div');
            item.className = 'px-4 py-3 hover:bg-[#14B8A6]/10 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors';
            item.innerHTML = `
              <div class="font-medium text-gray-900">${prediction.structured_formatting.main_text}</div>
              <div class="text-xs text-gray-500 mt-0.5">${prediction.structured_formatting.secondary_text}</div>
            `;

            item.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevent event from bubbling to document

              // Close dropdown immediately
              const containerToClose = suggestionsContainer;
              if (containerToClose) {
                containerToClose.remove();
                suggestionsContainer = null;
              }

              if (!placesService || !prediction.place_id) return;

              placesService.getDetails(
                { placeId: prediction.place_id, fields: ['formatted_address', 'address_components', 'geometry', 'name'] },
                (place, status) => {
                  if (status === google.maps.places.PlacesServiceStatus.OK && place && place.formatted_address) {
                    const addressComponents = place.address_components || [];
                    const city = addressComponents.find(comp =>
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
                      setFormData(prev => ({ ...prev, address: '' }));
                      return;
                    }

                    let streetAddress = place.formatted_address;
                    const streetNumber = addressComponents.find(comp =>
                      comp.types.includes('street_number')
                    )?.long_name;
                    const route = addressComponents.find(comp =>
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

                    setFormData(prev => ({ ...prev, address: streetAddress }));
                    setAddressError('');

                    if (addressInputRef.current) {
                      addressInputRef.current.value = streetAddress;
                    }
                  }
                }
              );
            });

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
      const target = e.target as HTMLInputElement;
      if (target.value.trim().length >= 3) {
        await validateAddress(target.value);
      }
    };

    initServices();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Check if click is on a suggestion item - if so, don't close
      if (target && (target as HTMLElement).closest && (target as HTMLElement).closest('#address-suggestions')) {
        return; // Don't close if clicking inside suggestions
      }

      // Check if click is outside both the input and the suggestions container
      if (suggestionsContainer &&
        !suggestionsContainer.contains(target) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(target)) {
        suggestionsContainer.remove();
        suggestionsContainer = null;
      }
    };

    if (addressInputRef.current) {
      addressInputRef.current.addEventListener('input', handleInput);
      addressInputRef.current.addEventListener('blur', handleBlur);
      document.addEventListener('mousedown', handleClickOutside);
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
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#3D2817]">Aggiungi Nuovo Annuncio</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <i className="ri-error-warning-line text-xl"></i>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-image-line mr-2 text-[#C9A876]"></i>
              Immagini Proprietà
            </h3>
            
            {/* Upload Button */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#D97860] hover:bg-[#D97860]/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <i className="ri-upload-cloud-line text-2xl"></i>
                  <span>Clicca per caricare immagini</span>
                </div>
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Puoi selezionare più immagini contemporaneamente. La prima immagine sarà quella principale.
              </p>
            </div>

            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Primary Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#C9A876] text-white text-xs font-medium rounded">
                        <i className="ri-star-fill mr-1"></i>
                        Principale
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>

                    {/* Image Number */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Contact Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-user-line mr-2 text-[#D97860]"></i>
              Informazioni Proprietario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => handleChange('owner_email', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="mario.rossi@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => handleChange('owner_phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.owner_whatsapp}
                  onChange={(e) => handleChange('owner_whatsapp', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="+39 123 456 7890"
                />
                <p className="mt-1 text-xs text-gray-500">
                  <i className="ri-whatsapp-line mr-1"></i>
                  Gli utenti potranno contattare via WhatsApp
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-information-line mr-2 text-[#D97860]"></i>
              Informazioni Base
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo Annuncio *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Operazione *
                </label>
                <select
                  value={formData.listing_type}
                  onChange={(e) => handleChange('listing_type', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                  required
                >
                  <option value="rent">Affitto</option>
                  <option value="buy">Vendita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prezzo (€) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-home-4-line mr-2 text-[#C9A876]"></i>
              Categoria Immobile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria Principale *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleChange('property_type', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                  required
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipologia
                  </label>
                  <select
                    value={formData.sub_category}
                    onChange={(e) => handleChange('sub_category', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero Locali
                  </label>
                  <select
                    value={formData.sub_sub_category}
                    onChange={(e) => handleChange('sub_sub_category', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* Location */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-map-pin-line mr-2 text-[#14B8A6]"></i>
              Posizione
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo *
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="Via Roma 123"
                  required
                />
                {addressError && (
                  <p className="mt-1 text-sm text-red-600">{addressError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone di Roma *
                </label>
                <ZoneSelector
                  selectedZone={formData.zone || ''}
                  onZoneChange={(zone) => handleChange('zone', zone)}
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-ruler-line mr-2 text-[#8B5CF6]"></i>
              Dettagli Immobile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Superficie (m²) *
                </label>
                <input
                  type="number"
                  value={formData.square_meters}
                  onChange={(e) => handleChange('square_meters', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locali
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bagni
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Piano
                </label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => handleChange('floor', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="es. 3, T, S1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stato
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe Energetica
                </label>
                <select
                  value={formData.energy_class}
                  onChange={(e) => handleChange('energy_class', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
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

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-file-text-line mr-2 text-[#D97860]"></i>
              Descrizione
            </h3>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
              placeholder="Descrivi l'immobile..."
            />
          </div>

          {/* Features Section - Category Specific */}
          {formData.property_type && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
                <i className="ri-star-line mr-2 text-[#C9A876]"></i>
                Caratteristiche {formData.property_type === 'Case-Appartamenti' ? 'Residenziali' : 
                                formData.property_type === 'Commerciale' ? 'Commerciali' :
                                formData.property_type === 'Ufficio' ? 'Ufficio' :
                                formData.property_type === 'Garage-Posti auto' ? 'Garage' :
                                formData.property_type === 'Terreni' ? 'Terreno' :
                                formData.property_type === 'Magazzini-Depositi' ? 'Magazzino' :
                                formData.property_type === 'Capannoni' ? 'Industriali' : ''}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-[#F9F6F3] rounded-lg border border-[#E8E4E0]">
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
                      className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
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
                        className="w-4 h-4 text-[#C9A876] border-[#E8E4E0] rounded focus:ring-[#C9A876] cursor-pointer"
                      />
                      <span className="text-sm text-[#3D2817]">{feature}</span>
                    </label>
                  ));
                })()}
              </div>
              {formData.features && formData.features.length > 0 && (
                <div className="mt-2 text-sm text-[#5C4B42]">
                  <i className="ri-check-line text-[#14B8A6] mr-1"></i>
                  {formData.features.length} caratteristiche selezionate
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-settings-3-line mr-2 text-[#14B8A6]"></i>
              Stato Pubblicazione
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stato *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                  required
                >
                  <option value="pending">In Attesa</option>
                  <option value="approved">Approvato</option>
                  <option value="rejected">Rifiutato</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer pt-8">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleChange('featured', e.target.checked)}
                    className="w-4 h-4 text-[#D97860] border-gray-300 rounded focus:ring-[#D97860] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">In Evidenza</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="px-6 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center"
            >
              {saving || uploadingImages ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  {uploadingImages ? 'Caricamento immagini...' : 'Salvataggio...'}
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  Salva Annuncio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
