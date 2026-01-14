'use client';

import { supabase } from '@/lib/supabaseClient';
import { propertyCache, type PropertyFilters } from '@/lib/propertyCache';

/**
 * Generic function to invoke Supabase Edge Functions
 * @param requireAuth - If false, allows unauthenticated requests (for public read operations)
 */
export async function invokeFunction<T = any>(
  functionName: string,
  body?: any,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'POST',
  requireAuth: boolean = true
): Promise<T> {
  // PERFORMANCE OPTIMIZATION: Skip ALL auth logic for public operations
  if (!requireAuth) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        method,
      });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      throw error;
    }
  }
  
  // Only run session management for authenticated operations
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Only require auth if explicitly needed
  if (requireAuth && !session) {
    throw new Error('Authentication required. Please log in again.');
  }

  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message || 'Please try again.'}`);
  }
  
  // CRITICAL: Edge Functions with verify_jwt:true validate JWT BEFORE function code runs
  // We MUST ensure we always send a valid, non-expired token
  // Strategy: ALWAYS refresh token if session exists and is expiring, regardless of requireAuth
  // This ensures Edge Functions with verify_jwt:true work even when called with requireAuth:false
  let currentSession = session;
  
  // Always refresh session if it exists and is expiring/expired, regardless of requireAuth
  // This is critical because Edge Functions with verify_jwt:true require a valid token
  // CRITICAL: With verify_jwt:true, Supabase gateway validates JWT BEFORE function code runs
  // We MUST ensure token is ALWAYS valid and non-expired
  if (session) {
    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    let timeUntilExpiry = expiresAt - now;
    
    // ALWAYS refresh if token expires in less than 600 seconds (10 minutes) OR is already expired
    // Use a larger buffer (10 minutes) to ensure token is always fresh
    // If token is already expired, we MUST refresh it before sending
    if ((timeUntilExpiry < 600 || timeUntilExpiry <= 0) && session.refresh_token) {
      try {
        // Refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: session.refresh_token
        });
        
        if (refreshError || !refreshData.session) {
          
          // Check if it's actually an expiration error or just a temporary issue
          const isActualExpiration = 
            refreshError?.message?.includes('refresh_token_not_found') ||
            refreshError?.message?.includes('invalid_grant') ||
            refreshError?.message?.includes('expired') ||
            refreshError?.message?.includes('token_not_found');
          
          // If refresh fails, try to get a fresh session one more time (Supabase might have auto-refreshed)
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          
          // Always check original session validity FIRST before throwing any errors
          const originalExpiresAt = session.expires_at || 0;
          const originalTimeUntilExpiry = originalExpiresAt - Math.floor(Date.now() / 1000);
          
          if (freshSession?.access_token) {
            const freshExpiresAt = freshSession.expires_at || 0;
            const freshTimeUntilExpiry = freshExpiresAt - Math.floor(Date.now() / 1000);
            if (freshTimeUntilExpiry > 0) {
              currentSession = freshSession;
            } else if (originalTimeUntilExpiry > 0) {
              currentSession = session;
            } else if (requireAuth && isActualExpiration) {
              throw new Error('Your session may have expired. Please refresh the page or log in again.');
            } else if (requireAuth) {
              throw new Error('Session refresh failed. Please try again.');
            } else {
              currentSession = null;
            }
          } else if (originalTimeUntilExpiry > 0) {
            currentSession = session;
          } else if (requireAuth && isActualExpiration) {
            throw new Error('Your session has expired. Please refresh the page or log in again.');
          } else if (requireAuth) {
            throw new Error('Session refresh failed. Please try again.');
          } else {
            currentSession = null;
          }
        } else {
          // CRITICAL: Update session in client immediately
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: refreshData.session.access_token,
            refresh_token: refreshData.session.refresh_token
          });
          
          if (setSessionError) {
            // Silent
            // Try to get fresh session one more time
            const { data: { session: freshSession } } = await supabase.auth.getSession();
            if (freshSession?.access_token) {
              const freshExpiresAt = freshSession.expires_at || 0;
              const freshTimeUntilExpiry = freshExpiresAt - Math.floor(Date.now() / 1000);
              if (freshTimeUntilExpiry > 0) {
                // Silent
                currentSession = freshSession;
              } else if (requireAuth) {
                throw new Error('Your session has expired. Please refresh the page or log in again.');
              } else {
                currentSession = null;
              }
            } else if (requireAuth) {
              throw new Error('Your session may have expired. Please refresh the page or log in again.');
            } else {
              // Silent
              currentSession = null;
            }
          } else {
            // Use refreshed session
            currentSession = refreshData.session;
            
            // Verify refreshed token is valid
            const newExpiresAt = refreshData.session.expires_at || 0;
            const newTimeUntilExpiry = newExpiresAt - Math.floor(Date.now() / 1000);
            if (newTimeUntilExpiry <= 0) {
              // Silent
              if (requireAuth) {
                throw new Error('Your session has expired. Please refresh the page or log in again.');
              } else {
                // Silent
                currentSession = null;
              }
            } else {
              // Silent
            }
          }
        }
      } catch (refreshErr: any) {
        // Silent
        // CRITICAL: Check if original session is still valid BEFORE throwing any errors
        const originalExpiresAt = session.expires_at || 0;
        const originalTimeUntilExpiry = originalExpiresAt - Math.floor(Date.now() / 1000);
        
        // If original session is still valid, use it instead of throwing error
        if (originalTimeUntilExpiry > 0) {
          // Silent
          currentSession = session;
        } else {
          // Try to get fresh session one more time before giving up
          try {
            const { data: { session: freshSession } } = await supabase.auth.getSession();
            if (freshSession?.access_token) {
              const freshExpiresAt = freshSession.expires_at || 0;
              const freshTimeUntilExpiry = freshExpiresAt - Math.floor(Date.now() / 1000);
              if (freshTimeUntilExpiry > 0) {
                // Silent
                currentSession = freshSession;
              } else if (requireAuth) {
                // Silent
                throw new Error('Your session may have expired. Please refresh the page or log in again.');
              } else {
                currentSession = null;
              }
            } else if (requireAuth) {
              // Silent
              throw refreshErr;
            } else {
              currentSession = null;
            }
          } catch (e) {
            if (requireAuth) {
              throw refreshErr;
            } else {
              currentSession = null;
            }
          }
        }
      }
    } else if (timeUntilExpiry <= 0) {
      // Token is expired and we didn't try to refresh (no refresh_token)
      // Try to get fresh session one more time (Supabase might have auto-refreshed)
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (freshSession?.access_token) {
        const freshExpiresAt = freshSession.expires_at || 0;
        const freshTimeUntilExpiry = freshExpiresAt - Math.floor(Date.now() / 1000);
        if (freshTimeUntilExpiry > 0) {
          // Silent
          currentSession = freshSession;
        } else if (requireAuth) {
          throw new Error('Your session has expired. Please refresh the page or log in again.');
        } else {
          currentSession = null;
        }
      } else if (requireAuth) {
        throw new Error('Your session has expired. Please refresh the page or log in again.');
      } else {
        // For optional auth, continue without session
        // Silent
        currentSession = null;
      }
    }
    
    // Final check - get absolute latest session right before making request
    // This ensures we use Supabase's auto-refreshed token if available
    // CRITICAL: Do this even if we already refreshed, to get the absolute latest token
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    if (finalSession?.access_token) {
      const finalExpiresAt = finalSession.expires_at || 0;
      const finalTimeUntilExpiry = finalExpiresAt - Math.floor(Date.now() / 1000);
      // Use if it has at least 10 seconds remaining (minimum buffer for network latency)
      if (finalTimeUntilExpiry > 10) {
        currentSession = finalSession;
        // Silent
      } else if (finalTimeUntilExpiry <= 0) {
        // Silent
        if (requireAuth) {
          throw new Error('Your session has expired. Please refresh the page or log in again.');
        } else {
          currentSession = null;
        }
      } else {
        // Token has less than 10 seconds but is still valid - try to refresh one more time
        if (requireAuth && finalSession.refresh_token) {
          try {
            const { data: lastRefreshData, error: lastRefreshError } = await supabase.auth.refreshSession({
              refresh_token: finalSession.refresh_token
            });
            if (!lastRefreshError && lastRefreshData?.session) {
              await supabase.auth.setSession({
                access_token: lastRefreshData.session.access_token,
                refresh_token: lastRefreshData.session.refresh_token
              });
              currentSession = lastRefreshData.session;
              // Silent
            } else {
              throw new Error('Your session has expired. Please refresh the page or log in again.');
            }
          } catch (e) {
            throw new Error('Your session has expired. Please refresh the page or log in again.');
          }
        } else if (requireAuth) {
          throw new Error('Your session has expired. Please refresh the page or log in again.');
        } else {
          currentSession = null;
        }
      }
    }
    
    // Final validation before making request (only if requireAuth)
    if (requireAuth && currentSession) {
      const finalExpiresAt = currentSession.expires_at || 0;
      const finalTimeUntilExpiry = finalExpiresAt - Math.floor(Date.now() / 1000);
      if (finalTimeUntilExpiry <= 0) {
        // Silent
        throw new Error('Your session has expired. Please refresh the page or log in again.');
      }
    }
  }
  
    if (requireAuth && !currentSession?.access_token) {
      throw new Error('No valid session token available. Please log in again.');
    }

  try {
    // CRITICAL: Get the absolute latest session RIGHT before making the request
    // This ensures we use Supabase's auto-refreshed token if available
    // This is especially important for verify_jwt:true functions
    if (requireAuth || currentSession) {
      const { data: { session: absoluteLatestSession }, error: latestSessionError } = await supabase.auth.getSession();
      if (latestSessionError) {
        if (requireAuth) {
          throw new Error('Session error. Please log in again.');
        }
      } else if (absoluteLatestSession?.access_token) {
        const absoluteExpiresAt = absoluteLatestSession.expires_at || 0;
        const absoluteTimeUntilExpiry = absoluteExpiresAt - Math.floor(Date.now() / 1000);
        
        // Use the absolute latest session if it's valid (at least 10 seconds remaining)
        if (absoluteTimeUntilExpiry > 10) {
          currentSession = absoluteLatestSession;
        } else if (absoluteTimeUntilExpiry <= 0 && requireAuth) {
          // Try one last refresh if we have a refresh token
          if (absoluteLatestSession?.refresh_token) {
            try {
              const { data: lastRefreshData, error: lastRefreshError } = await supabase.auth.refreshSession({
                refresh_token: absoluteLatestSession.refresh_token
              });
              if (!lastRefreshError && lastRefreshData?.session) {
                await supabase.auth.setSession({
                  access_token: lastRefreshData.session.access_token,
                  refresh_token: lastRefreshData.session.refresh_token
                });
                currentSession = lastRefreshData.session;
              } else {
                throw new Error('Your session has expired. Please refresh the page or log in again.');
              }
            } catch (e) {
              throw new Error('Your session has expired. Please refresh the page or log in again.');
            }
          } else {
            throw new Error('Your session has expired. Please refresh the page or log in again.');
          }
        } else if (absoluteTimeUntilExpiry > 0 && requireAuth) {
          currentSession = absoluteLatestSession;
        }
      } else if (requireAuth) {
        // No session at all and auth is required
        throw new Error('No valid session found. Please log in again.');
      }
    }
    
    // Get Supabase URL and key from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
    };
    
    // Add Authorization header if we have a session
    // Always send auth header if available (even if requireAuth is false)
    // This allows Edge Functions with verify_jwt:true to work for both authenticated and unauthenticated users
    // CRITICAL: Get the ABSOLUTE latest session right before sending to ensure token is fresh
    // Always try to get the latest session, even if we already have currentSession
    const { data: { session: absoluteLatestSession } } = await supabase.auth.getSession();
    
    // Use the absolute latest session if available and valid
    if (absoluteLatestSession?.access_token) {
      const absoluteExpiresAt = absoluteLatestSession.expires_at || 0;
      const absoluteTimeUntilExpiry = absoluteExpiresAt - Math.floor(Date.now() / 1000);
      
      if (absoluteTimeUntilExpiry > 0) {
        currentSession = absoluteLatestSession;
      } else if (absoluteTimeUntilExpiry <= 0 && requireAuth) {
        throw new Error('Your session has expired. Please refresh the page or log in again.');
      }
    }
    
    // Final session check - use whatever session we have
    if (currentSession?.access_token) {
      const tokenExpiresAt = currentSession.expires_at || 0;
      const tokenTimeUntilExpiry = tokenExpiresAt - Math.floor(Date.now() / 1000);
      
      if (tokenTimeUntilExpiry <= 0) {
        if (requireAuth) {
          throw new Error('Your session has expired. Please refresh the page or log in again.');
        }
        // For optional auth, just skip sending the expired token
      } else {
        (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${currentSession.access_token}`;
      }
    } else if (requireAuth) {
      throw new Error('No valid session token available. Please refresh the page or log in again.');
    }
    
    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    const response = await fetch(functionUrl, fetchOptions);
    
    // Parse response
    let data: any;
    let error: any = null;
    
    const responseText = await response.text();
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        error = {
          message: errorData.error || `Edge Function returned status ${response.status}`,
          status: response.status,
          context: {
            body: errorData,
            responseText,
            status: response.status,
          },
        };
      } catch (e) {
        error = {
          message: `Edge Function returned status ${response.status}`,
          status: response.status,
          context: {
            responseText,
            status: response.status,
          },
        };
      }
    } else {
      // Parse success response
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        data = responseText;
      }
    }

    if (error) {
      // Try to extract actual error message from response
      let errorMessage = error.message || `Error calling ${functionName}`;
      let errorDetails: any = null;
      let suggestion: string | null = null;
      
      // If error has context, try to get the actual error from the Edge Function response
      if (error.context) {
        try {
          // Check if context has response body
          if (error.context.body) {
            const errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            if (errorBody?.error) {
              errorMessage = typeof errorBody.error === 'string' 
                ? errorBody.error 
                : errorBody.error.message || errorMessage;
            }
            // Extract details if available
            if (errorBody?.details) {
              errorDetails = errorBody.details;
              errorMessage = typeof errorBody.details === 'string' 
                ? errorBody.details 
                : errorMessage;
            }
            if (errorBody?.suggestion) {
              suggestion = errorBody.suggestion;
            }
            if (errorBody?.authErrorCode) {
              errorMessage += ` (Code: ${errorBody.authErrorCode})`;
            }
            if (errorBody?.hasAuthHeader === false) {
              errorMessage = 'No authorization token provided. Please refresh the page or log in again.';
            }
          }
          // Check if context has response text
          if (error.context.responseText) {
            try {
              const parsed = JSON.parse(error.context.responseText);
              if (parsed?.error) {
                errorMessage = typeof parsed.error === 'string' 
                  ? parsed.error 
                  : parsed.error.message || errorMessage;
              }
              // Extract details if available
              if (parsed?.details) {
                errorDetails = parsed.details;
                errorMessage = typeof parsed.details === 'string' 
                  ? parsed.details 
                  : errorMessage;
              }
              if (parsed?.suggestion) {
                suggestion = parsed.suggestion;
              }
              if (parsed?.authErrorCode) {
                errorMessage += ` (Code: ${parsed.authErrorCode})`;
              }
              if (parsed?.hasAuthHeader === false) {
                errorMessage = 'No authorization token provided. Please refresh the page or log in again.';
              }
            } catch (e) {
              // If parsing fails, try using responseText directly
              if (error.context.responseText && errorMessage === `Error calling ${functionName}`) {
                errorMessage = error.context.responseText;
              }
            }
          }
        } catch (e) {
          // Silent parse error
        }
      }
      
      // If it's an auth error, provide a clearer message with extracted details
      // IMPORTANT: Only throw session expiration if it's EXPLICITLY about expiration
      // Generic 401 errors might be temporary issues, network problems, or other auth failures
      const is401 = errorMessage.includes('401') || errorMessage.includes('Unauthorized') || (error as any)?.status === 401 || error.status === 401;
      
      if (is401) {
        // Use suggestion if available (Edge Function provides this)
        if (suggestion) {
          // Only throw session expired if suggestion explicitly says so
          if (suggestion.includes('expired') || suggestion.includes('session')) {
            throw new Error(suggestion);
          }
          // Otherwise, throw a less aggressive error message
          throw new Error(`Authentication issue: ${suggestion}`);
        }
        
        // Check if error details explicitly mention expiration
        if (errorDetails) {
          const detailsMsg = typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails);
          if (detailsMsg.includes('expired') || detailsMsg.includes('Token validation failed')) {
            throw new Error('Your session has expired. Please refresh the page or log in again.');
          }
          // For other 401 errors, don't say "session expired" - might be temporary
          throw new Error(`Authentication failed: ${detailsMsg}`);
        }
        
        // Check if error message explicitly mentions expiration
        if (errorMessage.includes('Token validation failed') || errorMessage.includes('expired')) {
          throw new Error('Your session has expired. Please refresh the page or log in again.');
        }
        
        // Generic 401 without explicit expiration
        throw new Error(`Authentication failed. Please try again.`);
      }
      
      // If it's the generic non-2xx message, try to get more details
      if (errorMessage.includes('non-2xx status code')) {
        // Try to get status code from error
        const statusCode = (error as any)?.status || (error as any)?.context?.status;
        if (statusCode) {
          errorMessage = `Edge Function returned status ${statusCode}. ${errorMessage}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Check if the response contains an error
    if (data && typeof data === 'object' && 'error' in data) {
      const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      throw new Error(errorMsg || `Error from ${functionName}`);
    }

    return data as T;
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error instanceof Error && !error.message.includes('non-2xx status code')) {
      throw error;
    }
    
    // Try to get more details from the error
    const errorMessage = error?.message || error?.error?.message || `Failed to call ${functionName}`;
    throw new Error(errorMessage);
  }
}

/**
 * Property-related functions
 */
export const propertyFunctions = {
  create: async (propertyData: any) => {
    return invokeFunction('create-property', propertyData, 'POST', true); // Requires auth
  },
  get: async (filters?: PropertyFilters) => {
    // Check cache first for faster response
    const cached = propertyCache.get(filters);
    if (cached) {
      return cached;
    }
    
    // Public read operation - doesn't require authentication
    const data = await invokeFunction('get-properties', filters || {}, 'POST', false);
    
    // Cache the result for future requests
    if (data) {
      propertyCache.set(filters, data);
    }
    
    return data;
  },
  
  // Force bypass cache when needed (e.g., after creating/updating property)
  getNoCache: async (filters?: PropertyFilters) => {
    return invokeFunction('get-properties', filters || {}, 'POST', false);
  },
  
  // Clear property cache (call after creating/updating/deleting property)
  clearCache: () => {
    propertyCache.clear();
  },
  updateCoordinates: async (propertyId: string, latitude: number, longitude: number) => {
    // Public operation - geocoding can happen from any user viewing the property
    return invokeFunction('update-property-coordinates', {
      propertyId,
      latitude,
      longitude
    }, 'POST', false);
  },
  trackView: async (propertyId: string) => {
    // Track view using RPC function - doesn't require auth
    try {
      await supabase.rpc('increment_property_view', { property_uuid: propertyId });
    } catch (error) {
      // Silently fail - view tracking is not critical
    }
  },
};

/**
 * Favorites-related functions
 */
export const favoriteFunctions = {
  get: async () => {
    return invokeFunction('manage-favorites', undefined, 'GET', true); // Requires auth
  },
  add: async (propertyId: string) => {
    return invokeFunction('manage-favorites', { propertyId }, 'POST', true); // Requires auth
  },
  remove: async (propertyId: string) => {
    return invokeFunction('manage-favorites', { propertyId }, 'DELETE', true); // Requires auth
  },
};

/**
 * Messages-related functions
 */
export const messageFunctions = {
  get: async () => {
    return invokeFunction('manage-messages', undefined, 'GET', true); // Requires auth
  },
  send: async (receiverId: string, propertyId: string | null, subject: string, message: string) => {
    return invokeFunction('manage-messages', {
      action: 'send',
      receiverId,
      propertyId,
      subject,
      message,
    }, 'POST', true); // Requires auth
  },
  markAsRead: async (messageId: string) => {
    return invokeFunction('manage-messages', { messageId }, 'PATCH', true); // Requires auth
  },
  star: async (messageId: string) => {
    return invokeFunction('manage-messages', { action: 'star', messageId }, 'POST', true); // Requires auth
  },
  unstar: async (messageId: string) => {
    return invokeFunction('manage-messages', { action: 'unstar', messageId }, 'POST', true); // Requires auth
  },
  delete: async (messageId: string) => {
    return invokeFunction('manage-messages', { action: 'delete', messageId }, 'POST', true); // Requires auth
  },
  block: async (userId: string) => {
    return invokeFunction('manage-messages', { action: 'block', userId }, 'POST', true); // Requires auth
  },
  unblock: async (userId: string) => {
    return invokeFunction('manage-messages', { action: 'unblock', userId }, 'POST', true); // Requires auth
  },
  report: async (userId: string, reason: string, description?: string) => {
    return invokeFunction('manage-messages', { action: 'report', userId, reason, description }, 'POST', true); // Requires auth
  },
  markConversationAsRead: async (messageIds: string[]) => {
    return invokeFunction('manage-messages', { action: 'markConversationAsRead', messageIds }, 'POST', true); // Requires auth
  },
  archiveConversation: async (messageIds: string[]) => {
    return invokeFunction('manage-messages', { action: 'archiveConversation', messageIds }, 'POST', true); // Requires auth
  },
  unarchiveConversation: async (messageIds: string[]) => {
    return invokeFunction('manage-messages', { action: 'unarchiveConversation', messageIds }, 'POST', true); // Requires auth
  },
  deleteConversation: async (messageIds: string[]) => {
    return invokeFunction('manage-messages', { action: 'deleteConversation', messageIds }, 'POST', true); // Requires auth
  },
};

/**
 * Notifications-related functions
 */
export const notificationFunctions = {
    get: async () => {
      return invokeFunction('manage-notifications', undefined, 'GET', true); // Requires auth
    },
    create: async (notificationData: { user_id: string; type: string; title: string; message: string; link?: string; is_read?: boolean } | any[]) => {
      return invokeFunction('manage-notifications', notificationData, 'POST', true); // Requires auth
    },
    markAsRead: async (notificationId: string) => {
      return invokeFunction('manage-notifications', { notificationId }, 'PATCH', true); // Requires auth
    },
    markAsUnread: async (notificationId: string) => {
      return invokeFunction('manage-notifications', { action: 'markAsUnread', notificationId }, 'PATCH', true); // Requires auth
    },
    markAllAsRead: async () => {
      return invokeFunction('manage-notifications', { action: 'markAllAsRead' }, 'PATCH', true); // Requires auth
    },
    delete: async (notificationId: string) => {
      return invokeFunction('manage-notifications', { id: notificationId }, 'DELETE', true); // Requires auth
    },
    deleteMultiple: async (notificationIds: string[]) => {
      return invokeFunction('manage-notifications', { action: 'deleteMultiple', ids: notificationIds }, 'DELETE', true); // Requires auth
    },
  };

/**
 * Property shares-related functions
 * Note: Notification is automatically created by database trigger
 */
export const shareFunctions = {
    trackShare: async (propertyId: string, sharedVia: string) => {
      // Track share in database (notification will be created automatically by trigger)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Allow anonymous shares (shared_by_user_id will be null)
        const { error } = await supabase
          .from('property_shares')
          .insert({
            property_id: propertyId,
            shared_by_user_id: null,
            shared_via: sharedVia,
          });
        if (error) {
          // Silent fail - tracking not critical
        }
        return;
      }
      
      const { error } = await supabase
        .from('property_shares')
        .insert({
          property_id: propertyId,
          shared_by_user_id: user.id,
          shared_via: sharedVia,
        });
      
      // Silent fail - tracking not critical
    },
  };

/**
 * Saved searches-related functions
 */
export const savedSearchFunctions = {
  get: async () => {
    return invokeFunction('manage-saved-searches', undefined, 'GET', true); // Requires auth
  },
  create: async (name: string, searchParams: any, notifyNewListings: boolean = true) => {
    return invokeFunction('manage-saved-searches', {
      name,
      searchParams,
      notifyNewListings,
    }, 'POST', true); // Requires auth
  },
  delete: async (searchId: string) => {
    return invokeFunction('manage-saved-searches', { id: searchId }, 'DELETE', true); // Requires auth
  },
};

/**
 * Admin property management functions
 */
export const adminPropertyFunctions = {
  approve: async (propertyId: string) => {
    return invokeFunction('admin-manage-property', {
      action: 'approve',
      propertyId,
    }, 'POST', true); // Requires auth
  },
  reject: async (propertyId: string) => {
    return invokeFunction('admin-manage-property', {
      action: 'reject',
      propertyId,
    }, 'POST', true); // Requires auth
  },
  toggleFeatured: async (propertyId: string) => {
    return invokeFunction('admin-manage-property', {
      action: 'toggle_featured',
      propertyId,
    }, 'POST', true); // Requires auth
  },
  delete: async (propertyId: string) => {
    return invokeFunction('admin-manage-property', {
      action: 'delete',
      propertyId,
    }, 'POST', true); // Requires auth
  },
  update: async (propertyId: string, propertyData: any) => {
    return invokeFunction('admin-manage-property', {
      action: 'update',
      propertyId,
      propertyData,
    }, 'POST', true); // Requires auth
  },
  addImage: async (propertyId: string, imageData: { url: string; isPrimary: boolean; displayOrder: number }) => {
    return invokeFunction('admin-manage-property', {
      action: 'add_image',
      propertyId,
      imageData,
    }, 'POST', true); // Requires auth
  },
  deleteImage: async (propertyId: string, imageData: { url: string; imageId: string }) => {
    return invokeFunction('admin-manage-property', {
      action: 'delete_image',
      propertyId,
      imageData,
    }, 'POST', true); // Requires auth
  },
  setPrimaryImage: async (propertyId: string, imageData: { imageId: string }) => {
    return invokeFunction('admin-manage-property', {
      action: 'set_primary_image',
      propertyId,
      imageData,
    }, 'POST', true); // Requires auth
  },
  bulkApprove: async (propertyIds: string[]) => {
    return invokeFunction('admin-manage-property', {
      action: 'bulk_approve',
      propertyIds,
    }, 'POST', true); // Requires auth
  },
  bulkReject: async (propertyIds: string[]) => {
    return invokeFunction('admin-manage-property', {
      action: 'bulk_reject',
      propertyIds,
    }, 'POST', true); // Requires auth
  },
  bulkDelete: async (propertyIds: string[]) => {
    return invokeFunction('admin-manage-property', {
      action: 'bulk_delete',
      propertyIds,
    }, 'POST', true); // Requires auth
  },
};

/**
 * WhatsApp Leads-related functions
 */
export const whatsappLeadsFunctions = {
  getLeads: async (filters?: {
    contacted?: boolean;
    context?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return invokeFunction('manage-whatsapp-leads', filters || {}, 'POST', true); // Requires auth
  },
  updateLead: async (leadId: string, data: { contacted?: boolean; notes?: string }) => {
    return invokeFunction('manage-whatsapp-leads', {
      action: 'update',
      leadId,
      ...data,
    }, 'POST', true); // Requires auth
  },
  deleteLead: async (leadId: string) => {
    return invokeFunction('manage-whatsapp-leads', {
      action: 'delete',
      leadId,
    }, 'POST', true); // Requires auth
  },
  trackClick: async (data: { context: string; messagePreview?: string }) => {
    return invokeFunction('manage-whatsapp-leads', {
      action: 'trackClick',
      ...data,
    }, 'POST', false); // Don't require auth - allows anonymous tracking
  },
};
