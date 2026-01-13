'use client';

import { useState, useEffect } from 'react';
import type { Property } from '../page';
import { romeZones } from '@/mocks/properties';
import { useToast } from '@/hooks/useToast';

interface PropertyEditModalProps {
  property: Property;
  onClose: () => void;
  onSave: (data: Partial<Property>) => void;
}

export default function PropertyEditModal({ property, onClose, onSave }: PropertyEditModalProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: property.title,
    description: property.description,
    price: property.price,
    property_type: property.property_type,
    listing_type: property.listing_type,
    address: property.address,
    city: property.city,
    zone: property.zone,
    subzone: property.subzone,
    square_meters: property.square_meters,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    total_floors: property.total_floors,
    year_built: property.year_built,
    energy_class: property.energy_class,
    heating_type: property.heating_type,
    has_elevator: property.has_elevator,
    has_parking: property.has_parking,
    has_balcony: property.has_balcony,
    has_terrace: property.has_terrace,
    has_garden: property.has_garden,
    has_cellar: property.has_cellar,
    furnished: property.furnished,
    available_from: property.available_from,
    owner_name: property.owner_name || '',
    owner_email: property.owner_email || '',
    owner_phone: property.owner_phone || '',
    owner_whatsapp: property.owner_whatsapp || '',
  });

  const [saving, setSaving] = useState(false);
  const [selectedZone, setSelectedZone] = useState(property.zone);
  const [subzones, setSubzones] = useState<string[]>([]);

  useEffect(() => {
    // Get subzones from the object structure
    const zoneSubzones = romeZones[selectedZone as keyof typeof romeZones];
    setSubzones(Array.isArray(zoneSubzones) ? zoneSubzones : []);
  }, [selectedZone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate owner name
    if (!formData.owner_name || !formData.owner_name.trim()) {
      toast.error('Il nome del proprietario è obbligatorio');
      return;
    }

    // Validate at least one contact method
    const hasEmail = formData.owner_email && formData.owner_email.trim() !== '';
    const hasPhone = formData.owner_phone && formData.owner_phone.trim() !== '';
    const hasWhatsApp = formData.owner_whatsapp && formData.owner_whatsapp.trim() !== '';

    if (!hasEmail && !hasPhone && !hasWhatsApp) {
      toast.error('Devi fornire almeno un metodo di contatto: Email, Telefono o WhatsApp');
      return;
    }

    // Validate email if provided
    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.owner_email.trim())) {
        toast.error('Formato email non valido');
        return;
      }
    }

    // Validate phone if provided
    if (hasPhone) {
      const cleaned = formData.owner_phone.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+?39)?3\d{9}$/;
      const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;
      
      if (cleaned === '39' || cleaned === '+39') {
        toast.error('Il numero di telefono deve essere completo (es. +39 333 123 4567)');
        return;
      }
      
      if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
        toast.error('Formato numero di telefono non valido. Usa un numero italiano valido');
        return;
      }
    }

    // Validate WhatsApp if provided
    if (hasWhatsApp) {
      const cleaned = formData.owner_whatsapp.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+?39)?3\d{9}$/;
      const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;
      
      if (cleaned === '39' || cleaned === '+39') {
        toast.error('Il numero WhatsApp deve essere completo (es. +39 333 123 4567)');
        return;
      }
      
      if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
        toast.error('Formato numero WhatsApp non valido. Usa un numero italiano valido');
        return;
      }
    }

    // Validate price
    if (formData.price) {
      const priceValue = formData.price as string | number;
      const priceNum = typeof priceValue === 'string' 
        ? parseFloat(priceValue.replace(/[^\d.,]/g, '').replace(',', '.'))
        : Number(priceValue);
      
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error('Il prezzo deve essere un numero maggiore di zero');
        return;
      }
    }

    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Modifica Annuncio</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Owner Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Proprietario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => handleChange('owner_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    placeholder="+39 123 456 7890"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    <i className="ri-whatsapp-line mr-1"></i>
                    Gli utenti potranno contattare via WhatsApp
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Immobile *
                  </label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => handleChange('property_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  >
                    <option value="apartment">Appartamento</option>
                    <option value="house">Casa</option>
                    <option value="office">Ufficio</option>
                    <option value="commercial">Commerciale</option>
                    <option value="land">Terreno</option>
                    <option value="garage">Box/Garage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Annuncio *
                  </label>
                  <select
                    value={formData.listing_type}
                    onChange={(e) => handleChange('listing_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  >
                    <option value="sale">Vendita</option>
                    <option value="rent">Affitto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prezzo (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibile dal
                  </label>
                  <input
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => handleChange('available_from', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Posizione</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona *
                  </label>
                  <select
                    value={formData.zone}
                    onChange={(e) => {
                      handleChange('zone', e.target.value);
                      setSelectedZone(e.target.value);
                      handleChange('subzone', '');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  >
                    <option value="">Seleziona zona</option>
                    {Object.keys(romeZones).map((zoneName) => (
                      <option key={zoneName} value={zoneName}>
                        {zoneName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sottozona
                  </label>
                  <select
                    value={formData.subzone}
                    onChange={(e) => handleChange('subzone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    disabled={!selectedZone}
                  >
                    <option value="">Seleziona sottozona</option>
                    {subzones.map((subzone) => (
                      <option key={subzone} value={subzone}>
                        {subzone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettagli Immobile</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mq *
                  </label>
                  <input
                    type="number"
                    value={formData.square_meters}
                    onChange={(e) => handleChange('square_meters', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locali
                  </label>
                  <input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => handleChange('rooms', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bagni
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piano
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => handleChange('floor', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piani Totali
                  </label>
                  <input
                    type="number"
                    value={formData.total_floors}
                    onChange={(e) => handleChange('total_floors', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anno
                  </label>
                  <input
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => handleChange('year_built', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe Energetica
                  </label>
                  <select
                    value={formData.energy_class}
                    onChange={(e) => handleChange('energy_class', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Riscaldamento
                  </label>
                  <select
                    value={formData.heating_type}
                    onChange={(e) => handleChange('heating_type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  >
                    <option value="">Seleziona</option>
                    <option value="autonomous">Autonomo</option>
                    <option value="centralized">Centralizzato</option>
                    <option value="none">Assente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Caratteristiche</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'has_elevator', label: 'Ascensore', icon: 'ri-arrow-up-down-line' },
                  { key: 'has_parking', label: 'Parcheggio', icon: 'ri-parking-box-line' },
                  { key: 'has_balcony', label: 'Balcone', icon: 'ri-door-open-line' },
                  { key: 'has_terrace', label: 'Terrazzo', icon: 'ri-home-4-line' },
                  { key: 'has_garden', label: 'Giardino', icon: 'ri-plant-line' },
                  { key: 'has_cellar', label: 'Cantina', icon: 'ri-archive-line' },
                  { key: 'furnished', label: 'Arredato', icon: 'ri-sofa-line' },
                ].map((feature) => (
                  <label key={feature.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[feature.key as keyof typeof formData] as boolean}
                      onChange={(e) => handleChange(feature.key, e.target.checked)}
                      className="w-5 h-5 text-[#D97860] border-gray-300 rounded focus:ring-[#D97860] cursor-pointer"
                    />
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <i className={`${feature.icon} text-lg`}></i>
                      {feature.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C86850] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Salvataggio...
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  Salva Modifiche
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}