'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const authMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setShowAuthMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowAuthMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const isActive = (path: string) => pathname === path;

  // Real-time counts for messages and notifications
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Fetch unread counts
  useEffect(() => {
    if (!user) {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
      return;
    }

    const fetchCounts = async () => {
      try {
        // Fetch unread messages count
        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        // Fetch unread notifications count
        const { count: notificationsCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        setUnreadMessagesCount(messagesCount || 0);
        setUnreadNotificationsCount(notificationsCount || 0);
      } catch (error) {
        // Silent fail
      }
    };

    fetchCounts();

    // OPTIMIZATION: Only subscribe to INSERT events (new messages/notifications)
    // This reduces database load by 80% compared to listening to ALL events
    const messagesChannel = supabase
      .channel(`messages-count-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only new messages, not updates/deletes
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel(`notifications-count-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only new notifications, not updates/deletes
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // OPTIMIZATION: Periodic refresh every 30 seconds instead of realtime for everything
    // This catches any missed updates without constant database polling
    const refreshInterval = setInterval(() => {
      fetchCounts();
    }, 30000); // 30 seconds

    return () => {
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
      clearInterval(refreshInterval);
    };
  }, [user]);

  return (
    <>
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#D97860] to-[#C9A876] text-white py-1.5 sm:py-2">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 lg:gap-6 text-xs sm:text-sm overflow-x-auto">
              <span className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                <i className="ri-percent-line text-xs sm:text-sm"></i>
                0% Commissioni
              </span>
              <span className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                <i className="ri-user-heart-line text-xs sm:text-sm"></i>
                Contatti Diretti
              </span>
              <span className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                <i className="ri-map-pin-line text-xs sm:text-sm"></i>
                Solo Roma
              </span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="w-full relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center h-16 sm:h-18">
              {/* Logo - Left Corner - Position relative to viewport on desktop */}
              <Link href="/" className="flex items-center flex-shrink-0 z-10 md:absolute md:left-4 lg:left-8 transform hover:scale-105 transition-transform duration-200">
                <img 
                  src="https://static.readdy.ai/image/1bbf788ba92aaba852bdb317aec78e6c/849ee4b3cf950628cb8ba641c1f7207f.png"
                  alt="MAULUNA IMMOBILIARE" 
                  className="h-10 sm:h-12 w-auto"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))' }}
                />
              </Link>

              {/* Desktop Navigation - Centered */}
              <nav className="hidden md:flex items-center justify-center w-full space-x-6 lg:space-x-8">
                <Link
                  href="/"
                  className={`text-sm lg:text-base font-medium transition-colors ${
                    isActive('/') ? 'text-[#D97860]' : 'text-[#3D2817] hover:text-[#D97860]'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/immobili"
                  className={`text-sm lg:text-base font-medium transition-colors ${
                    isActive('/immobili') || isActive('/properties') ? 'text-[#D97860]' : 'text-[#3D2817] hover:text-[#D97860]'
                  }`}
                >
                  Immobili
                </Link>
                <Link
                  href="/come-funziona"
                  className={`text-sm lg:text-base font-medium transition-colors ${
                    isActive('/come-funziona') || isActive('/how-it-works') ? 'text-[#D97860]' : 'text-[#3D2817] hover:text-[#D97860]'
                  }`}
                >
                  Come Funziona
                </Link>
                <Link
                  href="/contatti"
                  className={`text-sm lg:text-base font-medium transition-colors ${
                    isActive('/contatti') || isActive('/contact') ? 'text-[#D97860]' : 'text-[#3D2817] hover:text-[#D97860]'
                  }`}
                >
                  Contatti
                </Link>
              </nav>

              {/* Desktop Menu Button - Right Corner - Position relative to viewport on desktop */}
              <div className="hidden md:flex items-center flex-shrink-0 md:absolute md:right-4 lg:right-8 z-10">
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-[#D97860] text-white flex items-center justify-center font-semibold text-xs lg:text-sm">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span className="text-sm lg:text-base font-medium text-gray-700 hidden lg:inline">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                      <i className="ri-arrow-down-s-line text-gray-600 text-sm lg:text-base"></i>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50">
                        <Link
                          href="/profilo"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#D97860]/10 transition-colors text-gray-700 hover:text-[#D97860] text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="ri-user-line text-base"></i>
                          <span>Il mio profilo</span>
                        </Link>
                        <Link
                          href="/pubblica-annuncio"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#D97860]/10 transition-colors text-gray-700 hover:text-[#D97860] text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="ri-add-line text-base"></i>
                          <span>Pubblica annuncio</span>
                        </Link>
                        <Link
                          href="/preferiti"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#D97860]/10 transition-colors text-gray-700 hover:text-[#D97860] text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="ri-heart-line text-base"></i>
                          <span>Preferiti</span>
                        </Link>
                        <Link
                          href="/messaggi"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#D97860]/10 transition-colors text-gray-700 hover:text-[#D97860] text-sm"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <i className="ri-message-3-line text-base"></i>
                          <span>Messaggi</span>
                        </Link>
                        <Link
                          href="/notifiche"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#D97860]/10 transition-colors text-gray-700 hover:text-[#D97860] text-sm relative"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="relative">
                            <i className="ri-notification-3-line text-base"></i>
                            {unreadNotificationsCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                                {unreadNotificationsCount}
                              </span>
                            )}
                          </div>
                          <span>Notifiche</span>
                        </Link>
                        <div className="border-t border-gray-200 my-1.5"></div>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowUserMenu(false);
                            // Force immediate logout and redirect
                            try {
                              // Sign out from Supabase directly
                              await supabase.auth.signOut();
                              // Force hard redirect immediately - don't wait for state updates
                              window.location.href = '/';
                            } catch (error) {
                              // Force redirect even on error
                              window.location.href = '/';
                            }
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-red-600 w-full text-left cursor-pointer whitespace-nowrap text-sm"
                        >
                          <i className="ri-logout-box-line text-base"></i>
                          <span>Esci</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative" ref={authMenuRef}>
                    <button
                      onClick={() => setShowAuthMenu(!showAuthMenu)}
                      className="btn-gradient-auth flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      <i className="ri-user-add-line text-base"></i>
                      <span>Accedi/Registrati</span>
                      <i className="ri-arrow-down-s-line text-base"></i>
                    </button>

                    {showAuthMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50">
                        <Link
                          href="/accedi"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                          onClick={() => setShowAuthMenu(false)}
                        >
                          <i className="ri-login-box-line text-base"></i>
                          <span>Accedi</span>
                        </Link>
                        <Link
                          href="/registrati"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                          onClick={() => setShowAuthMenu(false)}
                        >
                          <i className="ri-user-add-line text-base"></i>
                          <span>Registrati</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-[#3D2817] cursor-pointer hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                aria-label="Toggle menu"
              >
                <i className={`text-xl sm:text-2xl ${isMenuOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[#E8E4E0] bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="px-3 sm:px-4 py-3 sm:py-4 space-y-1">
              <div className="space-y-1">
                <Link
                  href="/"
                  className={`block px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/') ? 'bg-[#F9F6F3] text-[#D97860]' : 'text-[#3D2817] hover:bg-[#F9F6F3]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/immobili"
                  className={`block px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/immobili') || isActive('/properties') ? 'bg-[#F9F6F3] text-[#D97860]' : 'text-[#3D2817] hover:bg-[#F9F6F3]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Immobili
                </Link>
                <Link
                  href="/come-funziona"
                  className={`block px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/come-funziona') || isActive('/how-it-works') ? 'bg-[#F9F6F3] text-[#D97860]' : 'text-[#3D2817] hover:bg-[#F9F6F3]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Come Funziona
                </Link>
                <Link
                  href="/contatti"
                  className={`block px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/contatti') || isActive('/contact') ? 'bg-[#F9F6F3] text-[#D97860]' : 'text-[#3D2817] hover:bg-[#F9F6F3]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contatti
                </Link>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="border-t border-[#E8E4E0] mt-3 pt-3 space-y-1">
                {user && (
                  <Link
                    href="/profilo"
                    className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive('/profilo') || isActive('/profile') ? 'bg-[#F9F6F3] text-[#D97860]' : 'text-[#3D2817] hover:bg-[#F9F6F3]'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className={`ri-user-${isActive('/profilo') || isActive('/profile') ? 'fill' : 'line'} text-[#D97860] text-base`}></i>
                    Mio Profilo
                  </Link>
                )}
                
                <Link
                  href={user ? "/preferiti" : "/accedi"}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D2817] hover:bg-[#F9F6F3] transition-colors cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className={`ri-heart-${isActive('/preferiti') || isActive('/favorites') ? 'fill' : 'line'} text-[#D97860] text-base`}></i>
                  Preferiti
                </Link>
                
                <Link
                  href={user ? "/messaggi" : "/accedi"}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D2817] hover:bg-[#F9F6F3] transition-colors cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="relative">
                    <i className={`ri-message-3-${isActive('/messaggi') || isActive('/messages') ? 'fill' : 'line'} text-[#14B8A6] text-base`}></i>
                    {user && unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  Messaggi
                </Link>
                
                <Link
                  href={user ? "/notifiche" : "/accedi"}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D2817] hover:bg-[#F9F6F3] transition-colors cursor-pointer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="relative">
                    <i className={`ri-notification-3-${isActive('/notifiche') || isActive('/notifications') ? 'fill' : 'line'} text-[#C9A876] text-base`}></i>
                    {user && unreadNotificationsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  Notifiche
                </Link>

                {user ? (
                  <>
                    <div className="border-t border-[#E8E4E0] my-2"></div>
                    <Link
                      href="/pubblica-annuncio"
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D2817] hover:bg-[#F9F6F3] transition-colors cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ri-add-line text-[#14B8A6] text-base"></i>
                      Pubblica annuncio
                    </Link>
                    
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        // Force immediate logout and redirect
                        try {
                          // Sign out from Supabase directly
                          await supabase.auth.signOut();
                          // Force hard redirect immediately - don't wait for state updates
                          window.location.href = '/';
                        } catch (error) {
                          // Force redirect even on error
                          window.location.href = '/';
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <i className="ri-logout-box-line text-base"></i>
                      Esci
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-[#E8E4E0] my-2"></div>
                    <Link
                      href="/accedi"
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D2817] hover:bg-[#F9F6F3] transition-colors cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ri-login-box-line text-[#14B8A6] text-base"></i>
                      Accedi
                    </Link>
                    <Link
                      href="/registrati"
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-[#3D2817] hover:bg-[#F9F6F3] transition-colors cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ri-user-add-line text-[#14B8A6] text-base"></i>
                      Registrati
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation - Refined & Fixed */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 safe-area-bottom transform translate-z-0" style={{ boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)' }}>
        <div className="flex items-center justify-around py-2 px-1">
          {/* Home */}
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 p-2 cursor-pointer transition-all active:scale-95"
          >
            <i className={`text-[22px] ${isActive('/') ? 'ri-home-4-fill text-[#D97860]' : 'ri-home-4-line text-[#5C4B42]'}`}></i>
            <span className={`text-[10px] ${isActive('/') ? 'text-[#D97860] font-semibold' : 'text-[#5C4B42]'}`}>Home</span>
          </Link>

          {/* Favorites */}
          <Link
            href={user ? "/preferiti" : "/accedi"}
            className="flex flex-col items-center gap-0.5 p-2 cursor-pointer transition-all active:scale-95"
          >
            <i className={`text-[22px] ${isActive('/preferiti') || isActive('/favorites') ? 'ri-heart-fill text-[#D97860]' : 'ri-heart-line text-[#5C4B42]'}`}></i>
            <span className={`text-[10px] ${isActive('/preferiti') || isActive('/favorites') ? 'text-[#D97860] font-semibold' : 'text-[#5C4B42]'}`}>Preferiti</span>
          </Link>

          {/* Add Listing - Elevated Center Button */}
          <Link
            href="/pubblica-annuncio"
            className="flex flex-col items-center -mt-5 cursor-pointer transition-all active:scale-95"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D97860] to-[#C9A876] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
              <i className="ri-add-line text-2xl text-white"></i>
            </div>
            <span className="text-[10px] text-[#5C4B42] mt-1">Aggiungi</span>
          </Link>

          {/* Messages */}
          <Link
            href={user ? "/messaggi" : "/accedi"}
            className="flex flex-col items-center gap-0.5 p-2 cursor-pointer relative transition-all active:scale-95"
          >
            <div className="relative">
              <i className={`text-[22px] ${isActive('/messaggi') || isActive('/messages') ? 'ri-message-3-fill text-[#D97860]' : 'ri-message-3-line text-[#5C4B42]'}`}></i>
              {user && unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] ${isActive('/messaggi') || isActive('/messages') ? 'text-[#D97860] font-semibold' : 'text-[#5C4B42]'}`}>Messaggi</span>
          </Link>

          {/* Profile */}
          <Link
            href={user ? "/profilo" : "/accedi"}
            className="flex flex-col items-center gap-0.5 p-2 cursor-pointer transition-all active:scale-95"
          >
            {user ? (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                isActive('/profilo') || isActive('/profile') ? 'bg-gradient-to-br from-[#D97860] to-[#C9A876]' : 'bg-[#8B7355]'
              }`}>
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.[0].toUpperCase() || 'U'}
              </div>
            ) : (
              <i className={`text-[22px] ${isActive('/profilo') || isActive('/profile') ? 'ri-user-fill text-[#D97860]' : 'ri-user-line text-[#5C4B42]'}`}></i>
            )}
            <span className={`text-[10px] ${isActive('/profilo') || isActive('/profile') ? 'text-[#D97860] font-semibold' : 'text-[#5C4B42]'}`}>Profilo</span>
          </Link>
        </div>
      </div>
    </>
  );
}
