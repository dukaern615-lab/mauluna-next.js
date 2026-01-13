import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon key from MCP
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mzjrywhxgqddptdxecsx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16anJ5d2h4Z3FkZHB0ZHhlY3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTQzOTMsImV4cCI6MjA4MDU5MDM5M30.p6mvqJT1ptqnX1TDJQrJBBAV4hSovLwUpay5ZHFBKpI';

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Server-side Supabase client (for API routes)
// Uses service role key if available, otherwise falls back to anon key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});



