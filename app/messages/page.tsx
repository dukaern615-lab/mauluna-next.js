'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabaseClient';
import { messageFunctions } from '@/lib/supabaseFunctions';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  is_starred?: boolean;
  is_deleted?: boolean;
  is_archived?: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
  receiver?: {
    full_name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
  property?: {
    id: string;
    title: string;
    property_images?: Array<{ image_url: string; is_primary?: boolean; display_order?: number }>;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
    owner_whatsapp?: string;
  };
}

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactType: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  propertyId?: string;
  propertyTitle: string;
  propertyImage: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  isArchived: boolean;
  messages: Array<{
    id: string;
    sender: 'me' | 'other';
    content: string;
    timestamp: string;
    created_at?: string; // Store original timestamp for sorting
    is_read?: boolean; // Store read status for delivery indicators
  }>;
}

const MessagesPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showContactManager, setShowContactManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [swipedConversationId, setSwipedConversationId] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [initialSwipeOffset, setInitialSwipeOffset] = useState<number>(0);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);

  // Helper function to get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString('it-IT');
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Verify session exists before making call
      const { data: { session } } = await supabase.auth.getSession();

      // Use Edge Function to fetch messages
      const data = await messageFunctions.get();

      // Group messages into conversations
      const conversationMap = new Map<string, Conversation>();

      (data || []).forEach((msg: Message) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        const conversationKey = msg.property_id ? `${otherUserId}-${msg.property_id}` : otherUserId;

        if (!conversationMap.has(conversationKey)) {
          const propertyImage = msg.property?.property_images?.[0]?.image_url || 
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDE1MFYyMDBIMjAwVjE1MFoiIGZpbGw9IiNEMTcyRTYiLz4KPHBhdGggZD0iTTMwMCAyMDBIMjUwVjI1MEgzMDBWMjAwWiIgZmlsbD0iI0M5QTg3NiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzUiIHI9IjMwIiBmaWxsPSIjRkEzRjJGIi8+CjxwYXRoIGQ9Ik0yMzAgMTgwSDI3ME0yNTAgMTYwVjIwMCIgc3Ryb2tlPSIjNUM0QjQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=';
          
          // Get contact info from property owner if available, otherwise from user
          const contactEmail = msg.property?.owner_email || otherUser?.email || '';
          const contactPhone = msg.property?.owner_phone || otherUser?.phone || '';
          const contactWhatsApp = msg.property?.owner_whatsapp || '';
          
          // Get actual name - prioritize property owner_name from listing, then user profile name
          const contactName = msg.property?.owner_name || 
            otherUser?.full_name || 
            (msg.sender_id === user.id ? msg.receiver?.full_name : msg.sender?.full_name) || 
            'Utente Sconosciuto';
          
          conversationMap.set(conversationKey, {
            id: conversationKey,
            contactId: otherUserId,
            contactName: contactName,
            contactType: 'owner', // Default, can be enhanced
            contactEmail,
            contactPhone,
            contactWhatsApp,
            propertyId: msg?.property_id || undefined,
            propertyTitle: msg?.property?.title || 'Messaggio generale',
            propertyImage,
            lastMessage: msg.message,
            timestamp: formatTimestamp(msg.created_at),
            unread: !msg.is_read && msg.receiver_id === user.id,
            isArchived: msg.is_archived || false,
            messages: [],
          });
        }

        const conversation = conversationMap.get(conversationKey)!;
        const isSentByUser = msg.sender_id === user.id;
        
        conversation.messages.push({
          id: msg.id,
          sender: isSentByUser ? 'me' : 'other',
          content: msg.message,
          timestamp: formatTimestamp(msg.created_at),
          created_at: msg.created_at, // Store original timestamp for sorting
          is_read: msg.is_read, // Store read status for delivery indicators
        });

        // Always update last message text and display timestamp
          conversation.lastMessage = msg.message;
          conversation.timestamp = formatTimestamp(msg.created_at);
          conversation.unread = !msg.is_read && msg.receiver_id === user.id;
          conversation.isArchived = msg.is_archived || false;
      });

      // Sort conversations by most recent RECEIVED message (not sent messages)
      // This prevents conversations from jumping to top when user sends a message
      const conversationsList = Array.from(conversationMap.values())
        .map(conv => ({
          ...conv,
          messages: conv.messages.sort((a, b) => 
            new Date(a.created_at || a.timestamp).getTime() - new Date(b.created_at || b.timestamp).getTime()
          ),
        }))
        .map(conv => {
          // Find the most recent received message (sent by 'other', not 'me') for sorting
          const receivedMessages = conv.messages.filter(m => m.sender === 'other');
          
          const lastReceivedMessageTime = receivedMessages.length > 0
            ? new Date(receivedMessages[receivedMessages.length - 1]?.created_at || receivedMessages[receivedMessages.length - 1]?.timestamp || 0).getTime()
            : 0;
          
          // If no received messages, use the first message timestamp as fallback
          const fallbackTime = conv.messages.length > 0
            ? new Date(conv.messages[0]?.created_at || conv.messages[0]?.timestamp || 0).getTime()
            : 0;
          
          return { ...conv, sortTime: lastReceivedMessageTime || fallbackTime };
        })
        .sort((a, b) => b.sortTime - a.sortTime)
        .map(({ sortTime, ...conv }) => conv);

      // Track starred messages
      const starredSet = new Set<string>();
      (data || []).forEach((msg: Message) => {
        if (msg.is_starred) {
          starredSet.add(msg.id);
        }
      });
      setStarredMessages(starredSet);

      setConversations(conversationsList);
    } catch (error: any) {
      const errorMessage = error?.message || error?.error?.message || 'Errore nel caricamento dei messaggi';
      
      // Check current session status
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const sessionTimeUntilExpiry = currentSession?.expires_at ? (currentSession.expires_at - Math.floor(Date.now() / 1000)) : 0;
      const isSessionActuallyExpired = sessionTimeUntilExpiry <= 0;
      
      // Check if error message suggests expiration
      const errorSuggestsExpiration = 
        errorMessage.includes('session may have expired') ||
        errorMessage.includes('session has expired') ||
        (errorMessage.includes('Your session') && errorMessage.includes('expired') && errorMessage.includes('log in again'));
      
      // For 401 errors, check if they mention expiration
      const is401WithExpiration = (error?.status === 401 || error?.error?.status === 401) && 
        (errorMessage.includes('expired') || errorMessage.includes('session'));
      
      // ONLY redirect if session is actually expired
      if ((errorSuggestsExpiration || is401WithExpiration) && isSessionActuallyExpired) {
        setLoading(false);
        router.push('/accedi');
        return;
      }
      
      // If error suggests expiration but session is still valid, don't redirect
      if (errorSuggestsExpiration && !isSessionActuallyExpired) {
        toast.error(`Errore: ${errorMessage}`);
        setConversations([]);
        setStarredMessages(new Set());
        return;
      }
      
      // For other errors, show error toast
      toast.error(`Errore: ${errorMessage}`);
      setConversations([]);
      setStarredMessages(new Set());
    } finally {
      setLoading(false);
    }
  }, [user, toast, router]);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, fetchMessages]);

  // Track if user has manually scrolled (to prevent auto-scroll interrupting user)
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState<number>(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom only when new messages arrive (not on initial conversation open)
  useEffect(() => {
    if (!selectedConversation) {
      setLastMessageCount(0);
      setHasUserScrolled(false);
      return;
    }
    
    const conversation = conversations.find(c => c.id === selectedConversation);
    const currentMessageCount = conversation?.messages.length || 0;
    
    // Only auto-scroll if a new message was added (count increased from previous count > 0)
    // Don't auto-scroll on initial conversation load (when lastMessageCount is 0)
    if (messagesEndRef.current && currentMessageCount > 0 && lastMessageCount > 0) {
      const isNewMessage = currentMessageCount > lastMessageCount;
      
      if (isNewMessage && !hasUserScrolled) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
    
    // Update last message count
    if (currentMessageCount !== lastMessageCount) {
      setLastMessageCount(currentMessageCount);
    }
  }, [selectedConversation, conversations.find(c => c.id === selectedConversation)?.messages.length, lastMessageCount, hasUserScrolled]);

  // Reset scroll tracking when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setHasUserScrolled(false);
      const conversation = conversations.find(c => c.id === selectedConversation);
      setLastMessageCount(conversation?.messages.length || 0);
    }
  }, [selectedConversation]);

  // Track user scrolling to prevent interrupting manual scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // User has scrolled away from bottom
      if (scrollHeight - scrollTop - clientHeight > 100) {
        setHasUserScrolled(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedConversation]);

  const markAsRead = async (conversationId: string) => {
    try {
      if (!user) return;
      
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Mark all unread messages in this conversation as read
      const unreadMessageIds = conversation.messages
        .filter(m => m.sender === 'other')
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        // Use Edge Function to mark conversation as read
        await messageFunctions.markConversationAsRead(unreadMessageIds);

        // Update local state
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, unread: false };
            }
            return conv;
          })
        );
      }
    } catch (error: any) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      if (!user) return;

      // Use Edge Function to delete message
      await messageFunctions.delete(messageId);

      // Refresh conversations
      await fetchMessages();
      toast.success('Messaggio eliminato');
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione del messaggio');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      if (!user) return;

      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Get all message IDs in this conversation
      const messageIds = conversation.messages.map(m => m.id);

      if (messageIds.length === 0) return;

      // Use Edge Function to archive conversation
      await messageFunctions.archiveConversation(messageIds);

      toast.success('Conversazione archiviata');
      await fetchMessages();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error: any) {
      toast.error('Errore durante l\'archiviazione');
    }
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    try {
      if (!user) return;

      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Get all message IDs in this conversation
      const messageIds = conversation.messages.map(m => m.id);

      if (messageIds.length === 0) return;

      // Use Edge Function to unarchive conversation
      await messageFunctions.unarchiveConversation(messageIds);
      
      toast.success('Conversazione ripristinata');
      await fetchMessages();
    } catch (error: any) {
      toast.error('Errore durante il ripristino');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa conversazione? Tutti i messaggi verranno eliminati.')) return;
    
    try {
      if (!user) return;

      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Get all message IDs in this conversation
      const messageIds = conversation.messages.map(m => m.id);

      if (messageIds.length === 0) return;

      // Use Edge Function to delete conversation
      await messageFunctions.deleteConversation(messageIds);
      
      toast.success('Conversazione eliminata');
      await fetchMessages();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
      setSwipedConversationId(null);
      setSwipeOffset(0);
    } catch (error: any) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, conversationId: string) => {
    if (window.innerWidth > 640) return; // Only on mobile
    // Close any other swiped conversation
    if (swipedConversationId && swipedConversationId !== conversationId) {
      setSwipedConversationId(null);
      setSwipeOffset(0);
    }
    // Store the current offset when starting a new swipe
    setInitialSwipeOffset(swipedConversationId === conversationId ? swipeOffset : 0);
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, conversationId: string) => {
    if (window.innerWidth > 640 || swipeStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartX;
    
    // Calculate new offset from initial position
    const newOffset = initialSwipeOffset + diff;
    
    // If already swiped open, allow swiping right to close
    if (swipedConversationId === conversationId && initialSwipeOffset < 0) {
      // Already swiped open, allow swiping right to close
      if (newOffset >= 0) {
        setSwipeOffset(0);
        setSwipedConversationId(null);
      } else {
        setSwipeOffset(Math.max(newOffset, -80)); // Clamp to -80
      }
    } else if (diff < 0) {
      // Swiping left to open
      setSwipeOffset(Math.max(newOffset, -80)); // Max swipe of 80px
      setSwipedConversationId(conversationId);
    } else if (diff > 0 && swipedConversationId === conversationId) {
      // Swiping right to close when already open
      if (newOffset >= 0) {
        setSwipeOffset(0);
        setSwipedConversationId(null);
      } else {
        setSwipeOffset(Math.max(newOffset, -80));
      }
    }
  };

  const handleTouchEnd = () => {
    if (window.innerWidth > 640 || swipeStartX === null) return;
    
    // If swiped left enough, keep delete button open
    if (swipeOffset < -40) {
      setSwipeOffset(-80);
    } else {
      // Not enough swipe or swiped right, close it
      setSwipeOffset(0);
      setSwipedConversationId(null);
    }
    setSwipeStartX(null);
    setInitialSwipeOffset(0);
  };


  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      // Use Edge Function to send message
      const data = await messageFunctions.send(
        conversation.contactId,
        conversation.propertyId || null,
        conversation.propertyTitle,
        messageText
      );

      // Refresh messages to show the new one
      await fetchMessages();
      toast.success('Messaggio inviato');

      // Scroll to bottom after message is sent (will be handled by useEffect watching message count)
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (error?.status === 401 && errorMessage.includes('expired'))) {
        router.push('/accedi');
        return;
      }
      toast.error('Errore durante l\'invio del messaggio');
    }
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case 'owner': return 'ri-home-4-line';
      case 'agent': return 'ri-building-line';
      case 'buyer': return 'ri-user-line';
      default: return 'ri-user-line';
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'owner': return 'Proprietario';
      case 'agent': return 'Agenzia';
      case 'buyer': return 'Acquirente';
      default: return 'Contatto';
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    markAsRead(conversationId);
    // Hide sidebar on mobile when conversation is selected
    if (window.innerWidth < 640) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setShowSidebar(true);
    setSelectedConversation(null);
  };

  const handleStarMessage = async (messageId: string, isStarred: boolean) => {
    try {
      if (isStarred) {
        await messageFunctions.unstar(messageId);
        setStarredMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        toast.success('Messaggio rimosso dai preferiti');
      } else {
        await messageFunctions.star(messageId);
        setStarredMessages(prev => new Set(prev).add(messageId));
        toast.success('Messaggio aggiunto ai preferiti');
      }
      await fetchMessages();
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (error?.status === 401 && errorMessage.includes('expired'))) {
        router.push('/accedi');
        return;
      }
      toast.error('Errore durante l\'operazione');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo messaggio?')) return;
    
    try {
      await messageFunctions.delete(messageId);
      await fetchMessages();
      toast.success('Messaggio eliminato');
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (error?.status === 401 && errorMessage.includes('expired'))) {
        router.push('/accedi');
        return;
      }
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const handleBlockUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Sei sicuro di voler bloccare ${userName}? Non potrai più ricevere messaggi da questo utente.`)) return;
    
    try {
      await messageFunctions.block(userId);
      await fetchMessages();
      toast.success('Utente bloccato');
      if (selectedConversation) {
        const conversation = conversations.find(c => c.id === selectedConversation);
        if (conversation && conversation.contactId === userId) {
          setSelectedConversation(null);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (error?.status === 401 && errorMessage.includes('expired'))) {
        router.push('/accedi');
        return;
      }
      toast.error('Errore durante il blocco');
    }
  };

  const handleReportUser = (userId: string) => {
    setReportUserId(userId);
    setShowReportModal(true);
    setReportReason('');
    setReportDescription('');
  };

  const submitReport = async () => {
    if (!reportUserId || !reportReason.trim()) {
      toast.error('Inserisci un motivo per la segnalazione');
      return;
    }

    try {
      await messageFunctions.report(reportUserId, reportReason, reportDescription);
      setShowReportModal(false);
      setReportUserId(null);
      setReportReason('');
      setReportDescription('');
      toast.success('Segnalazione inviata. Grazie per il tuo feedback.');
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isSessionExpired = 
        (errorMessage.includes('session') && (errorMessage.includes('expired') || errorMessage.includes('may have expired'))) ||
        errorMessage.includes('session has expired') ||
        errorMessage.includes('session may have expired');
      
      if (isSessionExpired || (error?.status === 401 && errorMessage.includes('expired'))) {
        router.push('/accedi');
        return;
      }
      toast.error('Errore durante l\'invio della segnalazione');
    }
  };

  // Filter conversations based on archived status and search query
  const displayedConversations = (showArchived
    ? conversations.filter(conv => conv.isArchived)
    : conversations.filter(conv => !conv.isArchived)
  ).filter(conv => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contactName.toLowerCase().includes(query) ||
      conv.propertyTitle.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Header />
      <main className="pt-24 sm:pt-28 lg:pt-32 pb-4 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3D2817]">I Tuoi Messaggi</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[500px] sm:h-[600px] lg:h-[calc(100vh-200px)]">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={`${showSidebar ? 'w-full sm:w-1/3' : 'hidden sm:block sm:w-1/3'} border-r border-gray-200 flex flex-col`}>
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cerca conversazioni..."
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D97860]/20 focus:border-[#D97860] outline-none text-xs sm:text-sm transition-all"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base"></i>
                  </div>
                  {/* Archive Toggle */}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setShowArchived(false)}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        !showArchived 
                          ? 'bg-[#D97860] text-white' 
                          : 'bg-gray-100 text-[#5C4B42] hover:bg-gray-200'
                      }`}
                    >
                      <i className="ri-inbox-line mr-1"></i>
                      Attive
                    </button>
                    <button
                      onClick={() => setShowArchived(true)}
                      className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        showArchived 
                          ? 'bg-[#D97860] text-white' 
                          : 'bg-gray-100 text-[#5C4B42] hover:bg-gray-200'
                      }`}
                    >
                      <i className="ri-archive-line mr-1"></i>
                      Archiviate
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {displayedConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                        <i className="ri-message-2-line text-2xl text-gray-400"></i>
                      </div>
                      <p className="text-[#5C4B42] text-sm font-medium mb-1">
                      {showArchived ? 'Nessuna conversazione archiviata' : 'Nessuna conversazione'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {showArchived ? 'Le conversazioni archiviate appariranno qui' : 'Inizia una nuova conversazione'}
                      </p>
                    </div>
                  ) : (
                    displayedConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="relative overflow-hidden border-b border-gray-100"
                      onTouchStart={(e) => handleTouchStart(e, conversation.id)}
                      onTouchMove={(e) => handleTouchMove(e, conversation.id)}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Delete button (shown on swipe) */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center z-10"
                        style={{ 
                          transform: swipedConversationId === conversation.id 
                            ? `translateX(${swipeOffset + 80}px)` 
                            : 'translateX(100%)',
                          opacity: swipedConversationId === conversation.id ? 1 : 0,
                          transition: swipeStartX === null ? 'transform 0.2s, opacity 0.2s' : 'none'
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.id);
                          }}
                          className="text-white p-2"
                          title="Elimina conversazione"
                        >
                          <i className="ri-delete-bin-fill text-xl"></i>
                        </button>
                      </div>
                      {/* Conversation item */}
                      <div
                        onClick={() => {
                          if (swipedConversationId === conversation.id) {
                            setSwipedConversationId(null);
                            setSwipeOffset(0);
                          } else {
                            handleConversationSelect(conversation.id);
                          }
                        }}
                        className={`relative p-3 sm:p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation === conversation.id ? 'bg-[#D97860]/5 border-l-4 border-l-[#D97860]' : ''
                        }`}
                        style={{ 
                          transform: swipedConversationId === conversation.id 
                            ? `translateX(${swipeOffset}px)` 
                            : 'translateX(0)',
                          transition: swipeStartX === null ? 'transform 0.2s' : 'none',
                          touchAction: 'pan-y'
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Contact Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D97860] to-[#C9A876] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {conversation.contactName ? getInitials(conversation.contactName) : '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-start justify-between mb-1 gap-2">
                              <h3 className="font-semibold text-[#3D2817] text-sm truncate flex-1">
                              {conversation.contactName}
                            </h3>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-[#5C4B42] whitespace-nowrap">
                              {conversation.timestamp}
                            </span>
                                {showArchived ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                                      handleUnarchiveConversation(conversation.id);
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 transition-colors rounded hover:bg-green-50"
                                    title="Ripristina conversazione"
                                  >
                                    <i className="ri-inbox-unarchive-line text-xs"></i>
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveConversation(conversation.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-[#C9A876] transition-colors rounded hover:bg-gray-100"
                          title="Archivia conversazione"
                        >
                                    <i className="ri-archive-line text-xs"></i>
                        </button>
                      )}
                              </div>
                            </div>
                            <div className="flex items-center mb-1 gap-2">
                              <span className="inline-flex items-center gap-1">
                                <i className={`${getContactTypeIcon(conversation.contactType)} text-xs text-[#C9A876]`}></i>
                                <span className="text-xs text-[#C9A876]">{getContactTypeLabel(conversation.contactType)}</span>
                              </span>
                            </div>
                            <p className="text-xs text-[#5C4B42] mb-1 truncate font-medium">{conversation.propertyTitle}</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-[#5C4B42] truncate flex-1">{conversation.lastMessage}</p>
                              {conversation.unread && (
                                <div className="w-2.5 h-2.5 bg-[#D97860] rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className={`${showSidebar ? 'hidden sm:flex' : 'flex'} flex-1 flex-col`}>
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <button
                          onClick={handleBackToList}
                            className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <i className="ri-arrow-left-line text-lg text-[#5C4B42]"></i>
                        </button>
                          {/* Contact Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#D97860] to-[#C9A876] flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-sm">
                              {selectedConv.contactName ? getInitials(selectedConv.contactName) : '?'}
                            </div>
                          </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#3D2817] text-sm sm:text-base truncate">{selectedConv.contactName}</h3>
                          <div className="flex items-center text-xs sm:text-sm text-[#5C4B42]">
                            <i className={`${getContactTypeIcon(selectedConv.contactType)} mr-1`}></i>
                            <span className="mr-2">{getContactTypeLabel(selectedConv.contactType)}</span>
                              <span className="hidden sm:inline truncate">� {selectedConv.propertyTitle}</span>
                          </div>
                          </div>
                        </div>
                        {/* Conversation Actions Menu */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setShowConversationMenu(showConversationMenu === selectedConversation ? null : selectedConversation)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Azioni conversazione"
                          >
                            <i className="ri-more-2-line text-xl text-[#5C4B42]"></i>
                          </button>
                          {showConversationMenu === selectedConversation && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowConversationMenu(null)}
                              ></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    if (selectedConversation) handleArchiveConversation(selectedConversation);
                                    setShowConversationMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-[#3D2817] hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <i className="ri-archive-line text-[#C9A876]"></i>
                                  <span>Archivia</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleBlockUser(selectedConv.contactId, selectedConv.contactName);
                                    setShowConversationMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-[#3D2817] hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <i className="ri-user-forbid-line text-red-500"></i>
                                  <span>Blocca utente</span>
                                </button>
                                {selectedConv.contactPhone && (
                                  <button
                                    onClick={() => {
                                      window.location.href = `tel:${selectedConv.contactPhone}`;
                                      setShowConversationMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-[#3D2817] hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <i className="ri-phone-line text-green-600"></i>
                                    <span>Chiama</span>
                                  </button>
                                )}
                                {selectedConv.contactWhatsApp && (
                                  <button
                                    onClick={() => {
                                      window.open(`https://wa.me/${(selectedConv.contactWhatsApp || '').replace(/\D/g, '')}`, '_blank');
                                      setShowConversationMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-[#3D2817] hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <i className="ri-whatsapp-line text-green-500"></i>
                                    <span>WhatsApp</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleReportUser(selectedConv.contactId);
                                    setShowConversationMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <i className="ri-flag-line"></i>
                                  <span>Segnala utente</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div 
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white"
                    >
                      {selectedConv.messages.map((message, index) => {
                        const isStarred = starredMessages.has(message.id);
                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${message.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            {message.sender === 'other' && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#D97860] to-[#C9A876] flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                {selectedConv.contactName ? getInitials(selectedConv.contactName) : '?'}
                              </div>
                            )}
                            <div className="relative group">
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl relative shadow-sm ${
                                message.sender === 'me'
                                    ? 'bg-[#D97860] text-white rounded-br-sm'
                                    : 'bg-white text-[#3D2817] border border-gray-200 rounded-bl-sm'
                              }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words flex-1">{message.content}</p>
                                  {/* Mobile: Show menu button */}
                                  <button
                                    onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                                    className="sm:hidden flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Azioni messaggio"
                                  >
                                    <i className="ri-more-2-line text-sm"></i>
                                  </button>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-1.5">
                                <p className={`text-xs ${
                                    message.sender === 'me' ? 'text-white/70' : 'text-gray-500'
                                }`}>
                                  {message.timestamp}
                                </p>
                                {message.sender === 'me' && (
                                    <i className={`text-xs ${
                                      message.is_read 
                                        ? 'ri-check-double-line text-blue-300' // Read (blue double check)
                                        : 'ri-check-line text-white/70' // Delivered (single check)
                                    }`}></i>
                                  )}
                                </div>
                              </div>
                              {/* Message Actions Dropdown - Desktop: hover, Mobile: click */}
                              <div className={`absolute ${message.sender === 'me' ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 z-20 ${showMessageMenu === message.id ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'} transition-opacity pointer-events-none sm:pointer-events-auto`}>
                                {showMessageMenu === message.id && (
                                  <div 
                                    className="fixed inset-0 z-10 sm:hidden" 
                                    onClick={() => setShowMessageMenu(null)}
                                  ></div>
                                )}
                                <div className="pointer-events-auto">
                                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                                        <button
                                          onClick={() => {
                                            handleStarMessage(message.id, isStarred);
                                            setShowMessageMenu(null);
                                          }}
                                        className="w-full px-3 py-1.5 text-left text-xs text-[#3D2817] hover:bg-gray-100 flex items-center gap-2 min-h-[44px] sm:min-h-0"
                                      >
                                        <i className={`ri-star-${isStarred ? 'fill' : 'line'} ${isStarred ? 'text-yellow-500' : 'text-gray-400'}`}></i>
                                        <span>{isStarred ? 'Rimuovi preferito' : 'Aggiungi preferito'}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(message.content);
                                          setShowMessageMenu(null);
                                          toast.success('Messaggio copiato');
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs text-[#3D2817] hover:bg-gray-100 flex items-center gap-2 min-h-[44px] sm:min-h-0"
                                      >
                                        <i className="ri-file-copy-line text-gray-400"></i>
                                        <span>Copia</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDeleteMessage(message.id);
                                            setShowMessageMenu(null);
                                          }}
                                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 min-h-[44px] sm:min-h-0"
                                        >
                                        <i className="ri-delete-bin-line"></i>
                                        <span>Elimina</span>
                                        </button>
                                      </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          placeholder="Scrivi un messaggio..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D97860]/20 focus:border-[#D97860] outline-none text-base sm:text-sm transition-all"
                          style={{ fontSize: '16px' }} // Prevent mobile zoom (iOS requires 16px+)
                        />
                        </div>
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="px-4 py-2.5 bg-[#D97860] text-white rounded-xl hover:bg-[#C9A876] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center min-w-[44px]"
                          title="Invia messaggio"
                        >
                          <i className="ri-send-plane-fill text-base"></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center bg-[#D97860]/10 rounded-full">
                        <i className="ri-message-3-line text-xl sm:text-2xl text-[#D97860]"></i>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-[#3D2817] mb-2">Seleziona una Conversazione</h3>
                      <p className="text-[#5C4B42] text-sm sm:text-base">Scegli una conversazione dalla lista per iniziare a chattare</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />

      {/* Contact Manager Modal */}
      {showContactManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContactManager(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#3D2817]">Gestisci Contatti</h3>
              <button onClick={() => setShowContactManager(false)} className="text-[#5C4B42] hover:text-[#3D2817] cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-3">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-3 bg-[#F9F6F3] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#D97860] rounded-full flex items-center justify-center text-white font-semibold">
                        {conv.contactName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#3D2817]">{conv.contactName}</p>
                        <p className="text-sm text-[#5C4B42]">{getContactTypeLabel(conv.contactType)}</p>
                        {conv.propertyTitle && (
                          <p className="text-xs text-[#5C4B42]">{conv.propertyTitle}</p>
                        )}
                        {conv.contactPhone && (
                          <p className="text-xs text-[#5C4B42]">{conv.contactPhone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {conv.contactEmail && (
                        <a
                          href={`mailto:${conv.contactEmail}`}
                          className="p-2 text-[#C9A876] hover:bg-[#C9A876]/10 rounded-lg transition-colors cursor-pointer"
                          title="Email"
                        >
                          <i className="ri-mail-line"></i>
                        </a>
                      )}
                      {conv.contactPhone && (
                        <a
                          href={`tel:${conv.contactPhone}`}
                          className="p-2 text-[#D97860] hover:bg-[#D97860]/10 rounded-lg transition-colors cursor-pointer"
                          title="Telefono"
                        >
                          <i className="ri-phone-line"></i>
                        </a>
                      )}
                      {conv.contactWhatsApp && (
                        <a
                          href={`https://wa.me/${conv.contactWhatsApp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors cursor-pointer"
                          title="WhatsApp"
                        >
                          <i className="ri-whatsapp-line"></i>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#5C4B42]">
                  <i className="ri-user-line text-4xl mb-2"></i>
                  <p>Nessun contatto disponibile</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#3D2817]">Segnala Utente</h3>
              <button onClick={() => setShowReportModal(false)} className="text-[#5C4B42] hover:text-[#3D2817] cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Motivo della segnalazione *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                >
                  <option value="">Seleziona un motivo</option>
                  <option value="spam">Spam o contenuti inappropriati</option>
                  <option value="harassment">Molestie o comportamento offensivo</option>
                  <option value="fraud">Tentativo di frode</option>
                  <option value="fake">Profilo falso</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent"
                  placeholder="Fornisci maggiori dettagli sulla segnalazione..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-gray-300 text-[#5C4B42] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={submitReport}
                className="px-4 py-2 bg-[#D97860] text-white rounded-lg hover:bg-[#C9A876] transition-colors cursor-pointer"
              >
                Invia Segnalazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;

