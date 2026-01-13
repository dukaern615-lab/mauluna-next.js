'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabaseClient';
import { notificationFunctions } from '@/lib/supabaseFunctions';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  Link?: string;
  created_at: string;
}

interface GroupedNotifications {
  [key: string]: Notification[];
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showRefreshing = false) => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('[NotificationsPage] Fetching notifications for user:', user.id);
      
      // Use Edge Function to fetch notifications
      const data = await notificationFunctions.get();
      
      console.log('[NotificationsPage] Received notification data:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        data: data,
        rawData: JSON.stringify(data, null, 2)
      });
      
      // Ensure data is an array
      const notificationsArray = Array.isArray(data) ? data : (data ? [data] : []);
      console.log('[NotificationsPage] Setting notifications:', notificationsArray.length, 'items');
      console.log('[NotificationsPage] Notification details:', {
        count: notificationsArray.length,
        types: notificationsArray.map(n => n?.type),
        titles: notificationsArray.map(n => n?.title),
        user_ids: notificationsArray.map(n => n?.user_id),
        current_user_id: user.id
      });
      
      setNotifications(notificationsArray);
      
      if (showRefreshing && notificationsArray.length > 0) {
        toast.success(`${notificationsArray.length} notifiche caricate`);
      }
    } catch (error: any) {
      console.error('[NotificationsPage] Error fetching notifications:', error);
      console.error('[NotificationsPage] Error details:', {
        message: error?.message,
        status: error?.status,
        stack: error?.stack,
        error: error
      });
      
      const errorMessage = error?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (error?.status === 401 && errorMessage.includes('expired'))) {
        setLoading(false);
        setRefreshing(false);
        router.push('/accedi');
        return;
      }
      
      toast.error('Errore nel caricamento delle notifiche');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, toast.success, toast.error, router]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Use Edge Function to mark as read
      await notificationFunctions.markAsRead(notificationId);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      // Use Edge Function to mark as unread
      await notificationFunctions.markAsUnread(notificationId);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: false } : notif
        )
      );
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      toast.success('Notifica segnata come non letta');
    } catch (error: any) {
      console.error('Error marking notification as unread:', error);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const markAllAsRead = async () => {
    try {
      // Use Edge Function to mark all as read
      await notificationFunctions.markAllAsRead();

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setSelectedNotifications(new Set()); // Clear selection
      toast.success('Tutte le notifiche sono state lette');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Use Edge Function to delete notification
      await notificationFunctions.delete(notificationId);

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      toast.success('Notifica eliminata');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const deleteMultiple = async (notificationIds: string[]) => {
    try {
      // Use Edge Function to delete multiple notifications
      await notificationFunctions.deleteMultiple(notificationIds);

      setNotifications(prev => prev.filter(notif => !notificationIds.includes(notif.id)));
      setSelectedNotifications(new Set());
      toast.success(`${notificationIds.length} notifiche eliminate`);
    } catch (error: any) {
      console.error('Error deleting notifications:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedNotifications(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'new_message':
        return 'ri-message-3-line';
      case 'favorite':
      case 'property_favorited':
        return 'ri-heart-line';
      case 'property':
      case 'property_approved':
      case 'property_rejected':
      case 'property_shared':
        return 'ri-home-4-line';
      case 'system':
        return 'ri-notification-line';
      default:
        return 'ri-information-line';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'message':
      case 'new_message':
        return 'Messaggi';
      case 'favorite':
      case 'property_favorited':
        return 'Preferiti';
      case 'property_approved':
        return 'Approvazioni';
      case 'property_rejected':
        return 'Rifiuti';
      case 'property_shared':
        return 'Condivisioni';
      case 'system':
        return 'Sistema';
      default:
        return 'Tutte';
    }
  };

  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types);
  }, [notifications]);

  // Filter notifications by read status and type
  const filteredNotifications = useMemo(() => {
    let filtered = filter === 'unread'
    ? notifications.filter(notif => !notif.is_read)
    : notifications;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(notif => notif.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notif =>
        notif.title.toLowerCase().includes(query) ||
        notif.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filter, typeFilter, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: GroupedNotifications = {};
    
    filteredNotifications.forEach(notif => {
      const date = new Date(notif.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setDate(thisMonth.getDate() - 30);
      
      let groupKey: string;
      const notifDate = new Date(date);
      notifDate.setHours(0, 0, 0, 0);
      
      if (notifDate.getTime() === today.getTime()) {
        groupKey = 'Oggi';
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groupKey = 'Ieri';
      } else if (date > thisWeek) {
        groupKey = 'Questa settimana';
      } else if (date > thisMonth) {
        groupKey = 'Questo mese';
      } else {
        groupKey = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
        // Capitalize first letter
        groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notif);
    });
    
    // Sort groups by date (most recent first)
    const sortedGroups: GroupedNotifications = {};
    const groupOrder = ['Oggi', 'Ieri', 'Questa settimana', 'Questo mese'];
    const otherGroups: string[] = [];
    
    Object.keys(groups).forEach(key => {
      if (groupOrder.includes(key)) {
        sortedGroups[key] = groups[key];
      } else {
        otherGroups.push(key);
      }
    });
    
    // Sort other groups by date (most recent first)
    otherGroups.sort((a, b) => {
      const dateA = new Date(groups[a][0].created_at);
      const dateB = new Date(groups[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    otherGroups.forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter(notif => !notif.is_read).length;
  const readCount = notifications.filter(notif => notif.is_read).length;
  const totalCount = notifications.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 sm:pt-28 lg:pt-32 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Notifiche</h1>
              <button
                onClick={() => fetchNotifications(true)}
                disabled={refreshing || loading}
                className="px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base border border-gray-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Aggiorna notifiche"
              >
                <i className={`ri-refresh-line ${refreshing ? 'animate-spin' : ''}`}></i>
                <span className="hidden sm:inline">Aggiorna</span>
              </button>
            </div>
            
            {/* Stats Summary */}
            {totalCount > 0 && (
              <div className="mb-4 sm:mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <div className="text-xs sm:text-sm text-gray-500 mb-1">Totale</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{totalCount}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200 shadow-sm">
                  <div className="text-xs sm:text-sm text-orange-600 mb-1">Non lette</div>
                  <div className="text-xl sm:text-2xl font-bold text-[#D97860]">{unreadCount}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-xs sm:text-sm text-green-600 mb-1">Lette</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{readCount}</div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            {totalCount > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Cerca nelle notifiche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-sm sm:text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter and Action Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Filter Buttons Row 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Status Filter Buttons */}
                <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base ${
                      filter === 'all' 
                        ? 'bg-[#D97860] text-white shadow-md scale-105' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <i className="ri-notification-3-line mr-2"></i>
                Tutte
              </button>
              <button
                onClick={() => setFilter('unread')}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base relative ${
                      filter === 'unread' 
                        ? 'bg-[#D97860] text-white shadow-md scale-105' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <i className="ri-mail-unread-line mr-2"></i>
                    Non lette
                    {unreadCount > 0 && (
                      <span className="ml-1.5 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {selectedNotifications.size > 0 && (
                    <>
                      <button
                        onClick={() => deleteMultiple(Array.from(selectedNotifications))}
                        className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base shadow-sm hover:shadow flex items-center"
                      >
                        <i className="ri-delete-bin-line mr-2"></i>
                        <span className="hidden sm:inline">Elimina selezionate ({selectedNotifications.size})</span>
                        <span className="sm:hidden">Elimina ({selectedNotifications.size})</span>
                      </button>
                      <button
                        onClick={deselectAll}
                        className="px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base border border-gray-200 shadow-sm hover:shadow"
                      >
                        Annulla
              </button>
                    </>
                  )}
                  {selectedNotifications.size === 0 && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                      className="px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base border border-gray-200 shadow-sm hover:shadow flex items-center"
                >
                  <i className="ri-check-double-line mr-2"></i>
                      <span className="hidden sm:inline">Segna tutte come lette</span>
                      <span className="sm:hidden">Segna tutte lette</span>
                    </button>
                  )}
                  {selectedNotifications.size === 0 && filteredNotifications.length > 0 && (
                    <button
                      onClick={selectAll}
                      className="px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium text-sm sm:text-base border border-gray-200 shadow-sm hover:shadow flex items-center"
                    >
                      <i className="ri-checkbox-line mr-2"></i>
                      <span className="hidden sm:inline">Seleziona tutte</span>
                      <span className="sm:hidden">Seleziona</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Type Filter Buttons */}
              {availableTypes.length > 0 && (
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium text-xs sm:text-sm ${
                      typeFilter === 'all' 
                        ? 'bg-gray-800 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Tutti i tipi
                  </button>
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap font-medium text-xs sm:text-sm ${
                        typeFilter === type 
                          ? 'bg-gray-800 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {getNotificationTypeLabel(type)}
                </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 lg:p-6 animate-pulse">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
              </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 sm:py-32">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <i className="ri-notification-off-line text-4xl sm:text-5xl text-gray-300"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  {searchQuery 
                    ? 'Nessun risultato trovato' 
                    : typeFilter !== 'all'
                    ? `Nessuna notifica di tipo "${getNotificationTypeLabel(typeFilter)}"`
                    : filter === 'unread' 
                    ? 'Nessuna notifica non letta' 
                    : 'Nessuna notifica'}
              </h3>
                <p className="text-gray-600 text-sm sm:text-base px-4 mb-6">
                  {searchQuery
                    ? `Nessuna notifica corrisponde a "${searchQuery}". Prova con altri termini.`
                    : typeFilter !== 'all'
                    ? `Non ci sono notifiche di questo tipo. Prova a cambiare filtro.`
                    : filter === 'unread' 
                    ? 'Tutte le notifiche sono state lette. Ottimo lavoro!' 
                    : 'Non hai ancora ricevuto notifiche. Le notifiche appariranno qui quando ci saranno aggiornamenti.'}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => fetchNotifications(true)}
                    className="px-4 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#c46950] transition-colors cursor-pointer font-medium text-sm sm:text-base inline-flex items-center gap-2"
                  >
                    <i className="ri-refresh-line"></i>
                    Aggiorna
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
                <div key={groupKey}>
                  {/* Date Group Header */}
                  <div className="sticky top-20 sm:top-24 z-10 bg-gray-50 py-2 sm:py-3 mb-3 sm:mb-4">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-700 uppercase tracking-wide">
                      {groupKey}
                    </h2>
                  </div>
                  
                  {/* Notifications in Group */}
                  <div className="space-y-3 sm:space-y-4">
                    {groupNotifications.map((notification) => (
                <div
                  key={notification.id}
                        className={`bg-white border rounded-xl p-4 sm:p-5 lg:p-6 hover:shadow-lg transition-all duration-200 ${
                          selectedNotifications.has(notification.id)
                            ? 'ring-2 ring-[#D97860] ring-offset-2'
                            : ''
                        } ${
                          !notification.is_read 
                            ? 'border-[#D97860] border-l-4 shadow-md bg-gradient-to-r from-orange-50/50 to-white' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Checkbox for bulk selection */}
                          <button
                            onClick={() => toggleSelection(notification.id)}
                            className={`mt-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded border-2 flex-shrink-0 transition-all ${
                              selectedNotifications.has(notification.id)
                                ? 'bg-[#D97860] border-[#D97860] text-white'
                                : 'border-gray-300 hover:border-[#D97860]'
                            }`}
                            aria-label="Seleziona notifica"
                          >
                            {selectedNotifications.has(notification.id) && (
                              <i className="ri-check-line text-xs sm:text-sm"></i>
                            )}
                          </button>

                          {/* Icon */}
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full flex-shrink-0 ${
                            !notification.is_read 
                              ? 'bg-[#D97860] text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <i className={`${getNotificationIcon(notification.type)} text-lg sm:text-xl`}></i>
                    </div>
                          
                          {/* Content */}
                    <div className="flex-1 min-w-0">
                            {/* Title and Unread Indicator */}
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                              <h3 className="font-semibold text-gray-800 text-sm sm:text-base lg:text-lg pr-2">
                                {notification.title}
                              </h3>
                        {!notification.is_read && (
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#D97860] rounded-full flex-shrink-0 mt-1.5 sm:mt-2 animate-pulse"></span>
                        )}
                      </div>
                            
                            {/* Message */}
                            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                              {notification.message}
                            </p>
                            
                            {/* Actions and Metadata */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                              {/* Timestamp */}
                              <span className="text-gray-500 flex items-center">
                                <i className="ri-time-line mr-1.5"></i>
                                {new Date(notification.created_at).toLocaleString('it-IT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                        </span>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 sm:gap-3 sm:gap-4 flex-wrap">
                        {notification.Link && (
                          <Link
                            href={notification.Link}
                                    onClick={() => {
                                      if (!notification.is_read) {
                                        markAsRead(notification.id);
                                      }
                                    }}
                                    className="text-[#D97860] hover:text-[#c46950] hover:underline cursor-pointer font-medium flex items-center justify-center py-1 px-2 -mx-2 sm:mx-0 rounded hover:bg-orange-50 transition-colors min-h-[44px] sm:min-h-0"
                                  >
                                    <i className="ri-arrow-right-line mr-1"></i>
                            Visualizza
                          </Link>
                        )}
                                {notification.is_read ? (
                                  <button
                                    onClick={() => markAsUnread(notification.id)}
                                    className="text-gray-600 hover:text-gray-800 hover:underline cursor-pointer font-medium flex items-center justify-center py-1 px-2 -mx-2 sm:mx-0 rounded hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-0"
                                  >
                                    <i className="ri-mail-unread-line mr-1"></i>
                                    <span className="hidden sm:inline">Segna come non letta</span>
                                    <span className="sm:hidden">Non letta</span>
                                  </button>
                                ) : (
                          <button
                            onClick={() => markAsRead(notification.id)}
                                    className="text-[#D97860] hover:text-[#c46950] hover:underline cursor-pointer font-medium flex items-center justify-center py-1 px-2 -mx-2 sm:mx-0 rounded hover:bg-orange-50 transition-colors min-h-[44px] sm:min-h-0"
                          >
                                    <i className="ri-check-line mr-1"></i>
                                    <span className="hidden sm:inline">Segna come letta</span>
                                    <span className="sm:hidden">Segna letta</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                                  className="text-red-500 hover:text-red-600 hover:underline cursor-pointer font-medium flex items-center justify-center py-1 px-2 -mx-2 sm:mx-0 rounded hover:bg-red-50 transition-colors min-h-[44px] sm:min-h-0"
                        >
                                  <i className="ri-delete-bin-line mr-1"></i>
                          Elimina
                        </button>
                      </div>
                    </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
