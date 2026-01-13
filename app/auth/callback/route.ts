import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
    }

    if (data.session) {
      // Redirect to dashboard or home
      const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard';
      const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      
      // Set session cookie (optional, Supabase handles this via localStorage)
      return response;
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}



