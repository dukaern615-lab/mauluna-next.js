'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { adminPropertyFunctions } from '@/lib/supabaseFunctions';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import PropertyTable from './components/PropertyTable';
import AddPropertyModal from './components/AddPropertyModal';
import PropertyEditModal from './components/PropertyEditModal';
import ImageManager from './components/ImageManager';
import WhatsAppLeads from './components/WhatsAppLeads';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  listing_type: string;
  address: string;
  city: string;
  zone: string;
  subzone: string;
  square_meters: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  total_floors: number;
  year_built: number;
  energy_class: string;
  heating_type: string;
  has_elevator: boolean;
  has_parking: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_garden: boolean;
  has_cellar: boolean;
  furnished: boolean;
  available_from: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  owner_whatsapp?: string;
  property_images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  user_id?: string;
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const toast = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'leads'>('properties');
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'title' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Advanced filters
  const [zoneFilter, setZoneFilter] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      // Admin needs all properties (including pending/rejected), so we use Edge Function with admin flag
      const { propertyFunctions } = await import('../../lib/supabaseFunctions');
      const data = await propertyFunctions.get({ 
        sortBy: 'newest',
        isAdmin: true
      });

      // Transform data to match expected format
      const transformedProperties = (Array.isArray(data) ? data : []).map((prop: any) => ({
        ...prop,
        property_images: prop.property_images || [],
      }));

      setProperties(transformedProperties);
      
      // Calculate stats
      const total = transformedProperties.length;
      const pending = transformedProperties.filter((p: any) => p.status === 'pending').length;
      const approved = transformedProperties.filter((p: any) => p.status === 'approved').length;
      const rejected = transformedProperties.filter((p: any) => p.status === 'rejected').length;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProperties();
    }
  }, [user, isAdmin, fetchProperties]);

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const applyFilters = useCallback(() => {
    let filtered = [...properties];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.property_type === typeFilter);
    }

    // Zone filter
    if (zoneFilter !== 'all') {
      filtered = filtered.filter(p => p.zone === zoneFilter);
    }

    // Price range filter
    if (priceMin) {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(p => p.price >= min);
      }
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(p => p.price <= max);
      }
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(p => new Date(p.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(p => new Date(p.created_at) <= toDate);
    }

    // Enhanced search filter (includes ID, owner info)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.zone?.toLowerCase().includes(query) ||
        p.id?.toLowerCase().includes(query) ||
        p.owner_name?.toLowerCase().includes(query) ||
        p.owner_email?.toLowerCase().includes(query) ||
        p.owner_phone?.toLowerCase().includes(query) ||
        p.owner_whatsapp?.toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProperties(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [properties, statusFilter, typeFilter, zoneFilter, priceMin, priceMax, dateFrom, dateTo, debouncedSearchQuery, sortBy, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);
  
  // Get unique zones for filter
  const availableZones = Array.from(new Set(properties.map(p => p.zone).filter(Boolean))).sort();

  const handleAction = async (action: string, propertyId: string) => {
    console.log('handleAction called:', { action, propertyId });
    setActionLoading(propertyId);
    try {
      // Use Edge Function for admin actions
      if (action === 'approve') {
        const response = await adminPropertyFunctions.approve(propertyId);
        console.log('[AdminPage] Approve response:', response);
        
        // Check if notification was created
        if (response && typeof response === 'object' && 'notificationCreated' in response) {
          if (response.notificationCreated === false) {
            console.warn('[AdminPage] Property approved but notification was NOT created:', {
              propertyId,
              response
            });
            toast.warning('Proprietà approvata, ma la notifica non è stata inviata. Verifica che SUPABASE_SERVICE_ROLE_KEY sia configurato.');
          } else {
            console.log('[AdminPage] Property approved and notification created successfully');
          }
        }
        toast.success('Proprietà approvata con successo');
      } else if (action === 'reject') {
        const response = await adminPropertyFunctions.reject(propertyId);
        console.log('[AdminPage] Reject response:', response);
        
        // Check if notification was created
        if (response && typeof response === 'object' && 'notificationCreated' in response) {
          if (response.notificationCreated === false) {
            console.warn('[AdminPage] Property rejected but notification was NOT created:', {
              propertyId,
              response
            });
            toast.warning('Proprietà rifiutata, ma la notifica non è stata inviata. Verifica che SUPABASE_SERVICE_ROLE_KEY sia configurato.');
          } else {
            console.log('[AdminPage] Property rejected and notification created successfully');
          }
        }
        toast.success('Proprietà rifiutata');
      } else if (action === 'toggle_featured') {
        await adminPropertyFunctions.toggleFeatured(propertyId);
        const property = properties.find(p => p.id === propertyId);
        toast.success(property?.featured ? 'Proprietà rimossa dagli in evidenza' : 'Proprietà aggiunta agli in evidenza');
      } else {
        toast.error('Azione non valida');
        setActionLoading(null);
        return;
      }

      await fetchProperties();
    } catch (error: any) {
      console.error('Error performing action:', error);
      toast.error(`Errore durante l'operazione: ${error?.message || 'Riprova.'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (bulkActionLoading) return; // Prevent double clicks
    
    if (selectedProperties.length === 0) {
      toast.warning('Seleziona almeno un annuncio');
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm(`Sei sicuro di voler eliminare ${selectedProperties.length} annunci?`);
      if (!confirmed) {
        return;
      }
    }

    setBulkActionLoading(action);

    try {
      // Use Edge Function for bulk actions
      if (action === 'approve') {
        await adminPropertyFunctions.bulkApprove(selectedProperties);
        toast.success(`${selectedProperties.length} proprietà approvate con successo`);
      } else if (action === 'reject') {
        await adminPropertyFunctions.bulkReject(selectedProperties);
        toast.success(`${selectedProperties.length} proprietà rifiutate`);
      } else if (action === 'delete') {
        await adminPropertyFunctions.bulkDelete(selectedProperties);
        toast.success(`${selectedProperties.length} proprietà eliminate`);
      }

      setSelectedProperties([]);
      await fetchProperties();
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast.error(`Errore durante l'operazione: ${error?.message || 'Riprova.'}`);
    } finally {
      setBulkActionLoading(null);
    }
  };

  const handleDeleteClick = (property: any) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;
    
    setDeleteLoading(true);
    try {
      // Use Edge Function to delete property (handles images automatically)
      await adminPropertyFunctions.delete(propertyToDelete.id);

      await fetchProperties();
      toast.success('Proprietà eliminata con successo');
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(`Errore durante l'eliminazione: ${error?.message || 'Riprova.'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Keep old handleDelete for backward compatibility with PropertyTable
  const handleDelete = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      handleDeleteClick(property);
    }
  };

  const handleEdit = (property: any) => {
    setSelectedProperty(property);
    setShowEditModal(true);
  };

  const handleManageImages = (property: any) => {
    setSelectedProperty(property);
    setShowImageManager(true);
  };

  const handleUpdateProperty = async (updatedData: any) => {
    try {
      const { id, ...updateFields } = updatedData;
      
      // Use Edge Function to update property
      await adminPropertyFunctions.update(id, updateFields);

      await fetchProperties();
      setShowEditModal(false);
      toast.success('Proprietà aggiornata con successo');
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast.error(`Errore durante l'aggiornamento: ${error?.message || 'Riprova.'}`);
    }
  };

  // Show loading only while auth is initializing
  // AdminRoute already handles the auth checks, so we just need to wait for loading to complete
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
          <p className="mt-4 text-gray-600">Caricamento pannello amministrazione...</p>
          <p className="mt-2 text-sm text-gray-500">Verifica permessi...</p>
        </div>
      </div>
    );
  }

  // If user is not admin, AdminRoute should handle redirect, but show message just in case
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="ri-shield-cross-line text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accesso Negato</h2>
          <p className="text-gray-600">Non hai i permessi per accedere a questa pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50 pt-24 sm:pt-28 lg:pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#3D2817]">Pannello Amministrazione</h1>
                <p className="text-gray-600 mt-1">Gestisci tutti gli annunci immobiliari</p>
              </div>
              {activeTab === 'properties' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line text-xl"></i>
                  Aggiungi Nuovo Annuncio
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'properties'
                    ? 'border-[#D97860] text-[#D97860]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-home-4-line mr-2"></i>
                Proprietà
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'leads'
                    ? 'border-[#D97860] text-[#D97860]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-whatsapp-line mr-2"></i>
                Lead WhatsApp
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div
              onClick={() => setStatusFilter('pending')}
              className="bg-white rounded-xl p-6 border-2 border-orange-200 hover:border-orange-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Attesa</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="ri-time-line text-2xl text-orange-600"></i>
                </div>
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('approved')}
              className="bg-white rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approvati</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-check-line text-2xl text-green-600"></i>
                </div>
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('rejected')}
              className="bg-white rounded-xl p-6 border-2 border-red-200 hover:border-red-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rifiutati</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="ri-close-line text-2xl text-red-600"></i>
                </div>
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('all')}
              className="bg-white rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Totale</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-home-4-line text-2xl text-blue-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-[#3D2817] mb-4 flex items-center">
              <i className="ri-filter-line mr-2 text-[#D97860]"></i>
              Filtri e Ricerca
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cerca</label>
                <div className="relative">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Cerca per ID, titolo, indirizzo, proprietario, email, telefono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="pending">In Attesa</option>
                  <option value="approved">Approvati</option>
                  <option value="rejected">Rifiutati</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="Case-Appartamenti">Case-Appartamenti</option>
                  <option value="Commerciale">Commerciale</option>
                  <option value="Ufficio">Ufficio</option>
                  <option value="Garage-Posti auto">Garage-Posti auto</option>
                  <option value="Magazzini-Depositi">Magazzini-Depositi</option>
                  <option value="Capannoni">Capannoni</option>
                  <option value="Terreni">Terreni</option>
                  <option value="Nuove Costruzioni">Nuove Costruzioni</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters - Collapsible */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-[#D97860] hover:text-[#C86B54] flex items-center gap-2">
                <i className="ri-settings-3-line"></i>
                Filtri Avanzati
              </summary>
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer text-sm"
                  >
                    <option value="all">Tutte le zone</option>
                    {availableZones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo Min (€)</label>
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prezzo Max (€)</label>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="999999"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Da</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data A</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex items-end gap-2">
                  <button
                    onClick={() => {
                      setZoneFilter('all');
                      setPriceMin('');
                      setPriceMax('');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-close-line mr-1"></i>
                    Reset Filtri
                  </button>
                </div>
              </div>
            </details>

            {/* Bulk Actions */}
            {selectedProperties.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedProperties.length} selezionati
                </span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkActionLoading !== null}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {bulkActionLoading === 'approve' ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Approvazione...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line"></i>
                      Approva
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkActionLoading !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {bulkActionLoading === 'reject' ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Rifiuto...
                    </>
                  ) : (
                    <>
                      <i className="ri-close-line"></i>
                      Rifiuta
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading !== null}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {bulkActionLoading === 'delete' ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Eliminazione...
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-line"></i>
                      Elimina
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Properties Table Section */}
          {activeTab === 'properties' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#3D2817] flex items-center">
                    <i className="ri-table-line mr-2 text-[#D97860]"></i>
                    Elenco Proprietà ({filteredProperties.length})
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} di {filteredProperties.length}
                  </p>
                </div>
                
                {/* View Mode Toggle and Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        viewMode === 'table'
                          ? 'bg-white text-[#D97860] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Vista Tabella"
                    >
                      <i className="ri-table-line"></i>
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-white text-[#D97860] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Vista Card"
                    >
                      <i className="ri-grid-line"></i>
                    </button>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">Ordina:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                    >
                      <option value="date">Data</option>
                      <option value="price">Prezzo</option>
                      <option value="title">Titolo</option>
                      <option value="status">Stato</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                    >
                      <i className={sortOrder === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'}></i>
                    </button>
                  </div>

                  {/* Items Per Page */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">Per pagina:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent cursor-pointer"
                    >
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="p-12 text-center">
              <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
              <p className="text-gray-600 mt-4">Caricamento...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nessun annuncio trovato</h3>
              <p className="text-gray-500 mb-6">Inizia aggiungendo il tuo primo annuncio</p>
              
              {/* Help Guide */}
              <div className="max-w-2xl mx-auto mt-8 text-left bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-[#3D2817] mb-4">Come usare il pannello:</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <i className="ri-add-circle-line text-[#D97860] mr-2 mt-0.5"></i>
                    <span><strong>Aggiungi annunci:</strong> Clicca "Aggiungi Nuovo Annuncio" per inserire nuove proprietà</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-edit-line text-[#C9A876] mr-2 mt-0.5"></i>
                    <span><strong>Modifica:</strong> Usa l'icona matita per modificare titolo, prezzo e dettagli</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-image-line text-[#14B8A6] mr-2 mt-0.5"></i>
                    <span><strong>Gestisci immagini:</strong> Carica e organizza le foto degli immobili</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-green-600 mr-2 mt-0.5"></i>
                    <span><strong>Approva/Rifiuta:</strong> Controlla e approva gli annunci prima della pubblicazione</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-delete-bin-line text-red-600 mr-2 mt-0.5"></i>
                    <span><strong>Elimina:</strong> Rimuovi annunci non più validi</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-star-line text-orange-600 mr-2 mt-0.5"></i>
                    <span><strong>In evidenza:</strong> Metti in risalto gli annunci più importanti</span>
                  </li>
                </ul>
              </div>
            </div>
            ) : (
              <>
                {/* View Mode: Table or Cards */}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <PropertyTable
                    properties={paginatedProperties}
                    selectedProperties={selectedProperties}
                    onSelectProperty={(id: string) => {
                      setSelectedProperties(prev =>
                        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
                      );
                    }}
                    onSelectAll={(selected: boolean) => {
                      setSelectedProperties(selected ? paginatedProperties.map((p: any) => p.id) : []);
                    }}
                    onAction={(action: string, propertyId: string) => {
                      if (action === 'delete') {
                        handleDelete(propertyId);
                      } else {
                        handleAction(action, propertyId);
                      }
                    }}
                    onEdit={handleEdit}
                    onManageImages={handleManageImages}
                    actionLoading={actionLoading}
                  />
                </div>
              ) : (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedProperties.map((property) => (
                      <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-48 bg-gray-100">
                          {property.property_images?.[0] ? (
                            <img
                              src={property.property_images[0].image_url}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="ri-image-line text-4xl text-gray-400"></i>
                            </div>
                          )}
                          {property.featured && (
                            <div className="absolute top-2 right-2 bg-[#C9A876] text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                              <i className="ri-star-fill"></i>
                              In Evidenza
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{property.address}</p>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-[#D97860]">
                              €{property.price?.toLocaleString('it-IT')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              property.status === 'approved' ? 'bg-green-100 text-green-700' :
                              property.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {property.status === 'approved' ? 'Approvato' :
                               property.status === 'pending' ? 'In Attesa' : 'Rifiutato'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => handleEdit(property)}
                              className="flex-1 px-3 py-1.5 text-sm bg-[#D97860] text-white rounded hover:bg-[#C86B54] transition-colors"
                            >
                              <i className="ri-edit-line mr-1"></i>
                              Modifica
                            </button>
                            <button
                              onClick={() => handleDeleteClick(property)}
                              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              title="Elimina"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Pagina {currentPage} di {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-arrow-left-line"></i>
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-[#D97860] text-white border-[#D97860]'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-arrow-right-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
          ) : (
            <WhatsAppLeads />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPropertyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchProperties}
      />

      {showEditModal && selectedProperty && (
        <PropertyEditModal
          property={selectedProperty}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProperty(null);
          }}
          onSave={async (data: any) => {
            await handleUpdateProperty({ ...selectedProperty, ...data });
          }}
        />
      )}

      {showImageManager && selectedProperty && (
        <ImageManager
          property={selectedProperty}
          onClose={() => {
            setShowImageManager(false);
            setSelectedProperty(null);
          }}
          onUpdate={fetchProperties}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && propertyToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleteLoading && setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-error-warning-line text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Conferma Eliminazione</h3>
                <p className="text-sm text-gray-600">Questa azione non può essere annullata</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 mb-1">{propertyToDelete.title}</p>
              <p className="text-sm text-gray-600">{propertyToDelete.address}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span>ID: <code className="bg-gray-200 px-1 rounded">{propertyToDelete.id.substring(0, 8)}...</code></span>
                <span>Prezzo: €{propertyToDelete.price?.toLocaleString('it-IT')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPropertyToDelete(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Eliminazione...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line"></i>
                    Elimina Definitivamente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
