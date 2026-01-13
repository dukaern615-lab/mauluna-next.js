'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * OAuth Callback Handler
 * Processes OAuth redirects with hash fragments and redirects to dashboard
 */
export default function OAuthCallback() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Check if we have hash fragments (OAuth callback)
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        
        if (hash && hash.includes('access_token')) {
          // Supabase will automatically process the hash fragments
          // Wait for the session to be established
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('OAuth callback error:', error);
            // Redirect to login on error
            router.push('/accedi');
            return;
          }
          
          if (session) {
            // Clear the hash from URL
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', window.location.pathname);
            }
            
            // Get intended destination or default to dashboard
            const intendedPath = '/profile';
            
            // Redirect to intended destination
            router.push(intendedPath);
          } else {
            // No session yet, wait a bit and try again
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              
              if (retrySession) {
                if (typeof window !== 'undefined') {
                  window.history.replaceState(null, '', window.location.pathname);
                }
                const intendedPath = '/profile';
                router.push(intendedPath);
              } else {
                router.push('/accedi');
              }
            }, 1000);
          }
        } else {
          // No hash fragments, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('OAuth callback handler error:', error);
        router.push('/accedi');
      }
    };

    handleOAuthCallback();
  }, [router, pathname]);

  // Show loading state while processing
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F3] via-white to-[#F9F6F3] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#D97860] border-t-transparent mb-4"></div>
        <p className="text-[#3D2817] font-medium">Accesso in corso...</p>
      </div>
    </div>
  );
}
