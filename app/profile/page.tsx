'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabaseClient';
import { transformProperties } from '@/utils/propertyTransform';
import SharedPropertyCard from '@/components/feature/SharedPropertyCard';

const ProfilePage = () => {
  const router = useRouter();
  const { user, userProfile, updateProfile, loading } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'properties' | 'favorites' | 'messages'>('properties');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || ''
  });
  const [profileData, setProfileData] = useState({
    full_name: userProfile?.full_name || '',
    email: user?.email || '',
    phone: userProfile?.phone || '',
    avatar_url: userProfile?.avatar_url || ''
  });
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/accedi');
    }
  }, [user, loading, router]);

  // Update profile data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || '',
        email: user?.email || '',
        phone: userProfile.phone || '',
        avatar_url: userProfile.avatar_url || ''
      });
      setEditForm({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || ''
      });
    }
  }, [userProfile, user]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);

      // Fetch user properties via Edge Function
      try {
        const { propertyFunctions } = await import('@/lib/supabaseFunctions');
        const propertiesData = await propertyFunctions.get({ 
          userId: user.id,
          sortBy: 'newest'
        });
        const transformedProperties = transformProperties(propertiesData || []);
        setUserProperties(transformedProperties);
      } catch (error: any) {
        setUserProperties([]);
        toast.error(`Errore nel caricamento degli annunci: ${error?.message || 'Errore sconosciuto'}`);
      }

      // Fetch user favorites using Edge Function
      try {
        const { favoriteFunctions } = await import('@/lib/supabaseFunctions');
        const favoritesData = await favoriteFunctions.get();
        // Transform favorites data from function response
        const transformedFavorites = transformProperties(
          (favoritesData || []).map((fav: any) => fav.properties || fav).filter((p: any) => p !== null && p !== undefined)
        );
        setUserFavorites(transformedFavorites);
      } catch (error: any) {
        setUserFavorites([]);
        // Don't show error toast for favorites - it's not critical
      }

      // Fetch user messages (unread count)
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('id, is_read')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('is_read', false);

        if (messagesError) throw messagesError;
        setUserMessages(messagesData || []);
      } catch (error: any) {
        setUserMessages([]);
        // Don't show error toast for messages - it's not critical
      }
    } catch (error: any) {
      toast.error(`Errore nel caricamento dei dati: ${error?.message || 'Errore sconosciuto'}`);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileError('');

    // Validate phone if provided
    if (editForm.phone.trim() !== '') {
      const cleaned = editForm.phone.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+?39)?3\d{9}$/;
      const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;
      
      if (cleaned === '39' || cleaned === '+39') {
        setProfileError('Il numero di telefono deve essere completo (es. +39 333 123 4567)');
        setSaving(false);
        return;
      }
      
      if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
        setProfileError('Formato numero di telefono non valido. Usa un numero italiano valido (es. +39 333 123 4567 o 06 1234 5678)');
        setSaving(false);
        return;
      }
    }

    try {
      const { error } = await updateProfile(editForm.full_name, editForm.phone, profileData.avatar_url);
      if (error) {
        throw error;
      }
      setIsEditingProfile(false);
      toast.success('Profilo aggiornato con successo!');
    } catch (error: any) {
      setProfileError(error.message || 'Errore durante il salvataggio del profilo.');
      toast.error('Errore durante il salvataggio: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = {
    properties: userProperties.length,
    favorites: userFavorites.length,
    messages: userMessages.length,
    views: userProperties.reduce((sum, prop) => sum + (prop.views || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 sm:pt-28 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Desktop Layout: Sidebar + Main Content */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Sidebar - Profile Summary (Desktop) */}
            <aside className="hidden lg:block lg:col-span-3 mb-6 lg:mb-0">
              <div className="sticky top-20 space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D97860] to-[#C86B54] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg">
                      {profileData.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt={profileData.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(profileData.full_name)
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{profileData.full_name || 'Utente'}</h2>
                    <p className="text-xs text-gray-500 mb-4">{profileData.email}</p>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Il Mio Profilo</h1>
                    <p className="text-xs text-gray-500">Gestisci le tue informazioni</p>
                  </div>
                  
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full px-4 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer font-medium flex items-center justify-center gap-2"
                  >
                    <i className="ri-edit-line"></i>
                    Modifica Profilo
                  </button>
                </div>

                {/* Stats Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Statistiche</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D97860]/10 flex items-center justify-center">
                          <i className="ri-home-4-line text-[#D97860] text-lg"></i>
                        </div>
                        <span className="text-sm text-gray-600">Annunci</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.properties}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C9A876]/10 flex items-center justify-center">
                          <i className="ri-heart-line text-[#C9A876] text-lg"></i>
                        </div>
                        <span className="text-sm text-gray-600">Preferiti</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.favorites}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#8B7355]/10 flex items-center justify-center">
                          <i className="ri-message-3-line text-[#8B7355] text-lg"></i>
                        </div>
                        <span className="text-sm text-gray-600">Messaggi</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.messages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#6B5D52]/10 flex items-center justify-center">
                          <i className="ri-eye-line text-[#6B5D52] text-lg"></i>
                        </div>
                        <span className="text-sm text-gray-600">Visualizzazioni</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-9">
              {/* Mobile Profile Summary */}
              <div className="lg:hidden mb-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D97860] to-[#C86B54] flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0">
                      {profileData.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt={profileData.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(profileData.full_name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-bold text-gray-900 truncate mb-0.5">Il Mio Profilo</h1>
                      <p className="text-xs text-gray-500 truncate">{profileData.full_name || 'Utente'}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer flex-shrink-0"
                    >
                      <i className="ri-edit-line text-lg"></i>
                    </button>
                  </div>
                  
                  {/* Mobile Stats Grid */}
                  <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#D97860] mb-1">{stats.properties}</div>
                      <div className="text-xs text-gray-600">Annunci</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#C9A876] mb-1">{stats.favorites}</div>
                      <div className="text-xs text-gray-600">Preferiti</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#8B7355] mb-1">{stats.messages}</div>
                      <div className="text-xs text-gray-600">Messaggi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#6B5D52] mb-1">{stats.views}</div>
                      <div className="text-xs text-gray-600">Visualizzazioni</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('properties')}
                    className={`flex-1 min-w-[120px] px-4 sm:px-6 py-4 font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                      activeTab === 'properties'
                        ? 'bg-[#D97860] text-white border-b-2 border-[#D97860]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className="ri-home-4-line text-lg"></i>
                    <span className="hidden sm:inline">I miei annunci</span>
                    <span className="sm:hidden">Annunci</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 min-w-[120px] px-4 sm:px-6 py-4 font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                      activeTab === 'favorites'
                        ? 'bg-[#D97860] text-white border-b-2 border-[#D97860]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className="ri-heart-line text-lg"></i>
                    <span>Preferiti</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 min-w-[120px] px-4 sm:px-6 py-4 font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 relative ${
                      activeTab === 'messages'
                        ? 'bg-[#D97860] text-white border-b-2 border-[#D97860]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className="ri-message-3-line text-lg"></i>
                    <span>Messaggi</span>
                    {stats.messages > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {stats.messages > 9 ? '9+' : stats.messages}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                {/* Properties Tab */}
                {activeTab === 'properties' && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">I miei annunci</h2>
                        <p className="text-sm text-gray-500">Gestisci i tuoi immobili pubblicati</p>
                      </div>
                      <Link
                        href="/pubblica-annuncio"
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium flex items-center justify-center gap-2"
                      >
                        <i className="ri-add-line"></i>
                        Nuovo annuncio
                      </Link>
                    </div>

                  {loadingData ? (
                    <div className="text-center py-12">
                      <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
                      <p className="text-gray-600 mt-4">Caricamento...</p>
                    </div>
                  ) : userProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-home-4-line text-5xl text-gray-300 mb-3"></i>
                      <p className="text-gray-600 mb-4">Non hai ancora pubblicato annunci</p>
                      <Link
                        href="/pubblica-annuncio"
                        className="inline-block px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium"
                      >
                        Pubblica il tuo primo annuncio
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {userProperties.map((property) => (
                        <div key={property.id} className="relative">
                          <SharedPropertyCard property={property} />
                          {property.status && (
                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium z-20 ${
                              property.status === 'approved' 
                                ? 'bg-green-500 text-white'
                                : property.status === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                              {property.status === 'approved' ? 'Approvato' : 
                               property.status === 'pending' ? 'In attesa' : 'Rifiutato'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

                {/* Favorites Tab */}
                {activeTab === 'favorites' && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">I miei preferiti</h2>
                        <p className="text-sm text-gray-500">Immobili che hai salvato</p>
                      </div>
                      <Link
                        href="/search-results"
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium flex items-center justify-center gap-2"
                      >
                        <i className="ri-search-line"></i>
                        Cerca immobili
                      </Link>
                    </div>

                  {loadingData ? (
                    <div className="text-center py-12">
                      <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
                      <p className="text-gray-600 mt-4">Caricamento...</p>
                    </div>
                  ) : userFavorites.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-heart-line text-5xl text-gray-300 mb-3"></i>
                      <p className="text-gray-600 mb-4">Non hai ancora salvato nessun immobile</p>
                      <Link
                        href="/search-results"
                        className="inline-block px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium"
                      >
                        Esplora immobili
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {userFavorites.map((property) => (
                        <div key={property.id}>
                          <SharedPropertyCard property={property} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Messaggi</h2>
                        <p className="text-sm text-gray-500">I tuoi messaggi e conversazioni</p>
                      </div>
                      <Link
                        href="/messages"
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium flex items-center justify-center gap-2"
                      >
                        <i className="ri-message-3-line"></i>
                        Vai ai messaggi
                      </Link>
                    </div>

                  {loadingData ? (
                    <div className="text-center py-12">
                      <i className="ri-loader-4-line text-4xl text-[#D97860] animate-spin"></i>
                      <p className="text-gray-600 mt-4">Caricamento...</p>
                    </div>
                  ) : userMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="ri-message-3-line text-5xl text-gray-300 mb-3"></i>
                      <p className="text-gray-600">Nessun messaggio non letto</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-[#D97860]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-message-3-line text-4xl text-[#D97860]"></i>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Hai {userMessages.length} messaggio{userMessages.length !== 1 ? 'i' : ''} non letto{userMessages.length !== 1 ? 'i' : ''}
                      </h3>
                      <p className="text-gray-600 mb-6">Controlla i tuoi messaggi per rispondere alle richieste</p>
                      <Link
                        href="/messages"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer whitespace-nowrap font-medium"
                      >
                        <i className="ri-message-3-line"></i>
                        Vai ai messaggi
                      </Link>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Modifica Profilo</h2>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setEditForm({
                    full_name: profileData.full_name,
                    phone: profileData.phone
                  });
                  setProfileError('');
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {profileError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
                <i className="ri-error-warning-line text-lg flex-shrink-0 mt-0.5"></i>
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="Il tuo nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">L'email non può essere modificata</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="+39 123 456 7890"
                />
                <p className="mt-1 text-xs text-gray-500">Formato: +39 333 123 4567 o 06 1234 5678</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setEditForm({
                    full_name: profileData.full_name,
                    phone: profileData.phone
                  });
                  setProfileError('');
                }}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
