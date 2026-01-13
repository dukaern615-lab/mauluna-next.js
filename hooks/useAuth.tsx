'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { apiClient } from '@/lib/api';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => Promise<{ error: Error | null; data: any }>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  updateProfile: (fullName?: string, phone?: string, avatarUrl?: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: 'google' | 'facebook' | 'apple') => Promise<{ data: any; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
        setIsAdmin(false);
        return;
      }

      if (data) {
        setUserProfile(data);
        setIsAdmin(data.is_admin === true);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUserProfile(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        apiClient.setToken(session.access_token);
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        apiClient.setToken(session.access_token);
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        apiClient.setToken(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        return { error, data: null };
      }

      // If session exists, user is auto-confirmed (email confirmation disabled)
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        apiClient.setToken(data.session.access_token);
        if (data.user) {
          await fetchUserProfile(data.user.id);
        }
      }

      return { error: null, data };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error, data: null };
    }
  };

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Check if email confirmation is required (user exists but no session)
      if (data.user && !data.session) {
        // Wait a moment for the trigger to potentially auto-confirm
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to sign in immediately to check if auto-confirm worked
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError && signInData.session) {
          setSession(signInData.session);
          setUser(signInData.session.user);
          apiClient.setToken(signInData.session.access_token);
          await fetchUserProfile(signInData.session.user.id);
          return { success: true, requiresEmailConfirmation: false };
        }

        return { 
          success: true, 
          requiresEmailConfirmation: true,
          error: 'Registration successful, but please check your email to confirm your account before logging in.' 
        };
      }

      // Session exists - user was auto-confirmed
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        apiClient.setToken(data.session.access_token);
        await fetchUserProfile(data.user.id);
      }

      return { success: true, requiresEmailConfirmation: false };
    } catch (error) {
      return { success: false, error: (error as Error).message, requiresEmailConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error, data: null };
      }

      if (data.session && data.user) {
        setUser(data.user);
        setSession(data.session);
        apiClient.setToken(data.session.access_token);
        await fetchUserProfile(data.user.id);
      }

      return { error: null, data };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (fullName?: string, phone?: string, avatarUrl?: string) => {
    try {
      if (!user) throw new Error('No user logged in');

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (fullName !== undefined) updateData.full_name = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh user profile
      await fetchUserProfile(user.id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    isAdmin,
    signUp,
    register,
    signIn,
    signOut,
    updateProfile,
    signInWithProvider,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
