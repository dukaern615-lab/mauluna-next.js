'use client';

import { createClient } from '@supabase/supabase-js';

// Client-side only Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mzjrywhxgqddptdxecsx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16anJ5d2h4Z3FkZHB0ZHhlY3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTQzOTMsImV4cCI6MjA4MDU5MDM5M30.p6mvqJT1ptqnX1TDJQrJBBAV4hSovLwUpay5ZHFBKpI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});



