'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/base/Input';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import { getBaseUrl } from '@/config/domain';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Per favore conferma la tua email prima di accedere.');
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Email o password non validi.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // Login successful, navigate to dashboard
      router.push('/profilo');
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getBaseUrl()}`, // Use root URL to match Supabase Site URL
        },
      });

      if (signInError) {
        setError(`Errore durante l'accesso con ${provider}: ${signInError.message}`);
        setLoading(false);
      }
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Inserisci la tua email per reimpostare la password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getBaseUrl()}/reimposta-password`,
      });
      
      if (resetError) {
        setError('Errore: ' + resetError.message);
        setLoading(false);
        return;
      }
      
      setError('Email di reset password inviata! Controlla la tua casella di posta.');
      setLoading(false);
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F3] via-white to-[#F9F6F3] flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 md:px-6">
        <div className="w-full max-w-[90%] sm:max-w-md lg:max-w-lg">
          {/* Header Section - Minimal */}
          <div className="text-center mb-2 lg:mb-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3D2817] mb-2">
              Bentornato su MAULUNA
            </h1>
            {/* Badges - Below heading on desktop */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded-full border border-[#E8E4E0] shadow-sm">
                <i className="ri-money-dollar-circle-line text-[#D97860] text-xs"></i>
                <span className="text-xs text-gray-700 font-medium">0%</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded-full border border-[#E8E4E0] shadow-sm">
                <i className="ri-map-pin-line text-[#D97860] text-xs"></i>
                <span className="text-xs text-gray-700 font-medium">Roma</span>
              </div>
            </div>
          </div>

          {/* Login Card - Compact */}
          <div className="bg-white rounded-lg lg:rounded-xl shadow-lg border border-[#E8E4E0] p-4 sm:p-5 lg:p-6">
            {error && (
              <div className={`mb-2.5 lg:mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 ${error ? 'animate-shake' : ''}`}>
                <i className="ri-error-warning-line text-red-600 text-sm mt-0.5 flex-shrink-0"></i>
                <p className="text-xs text-red-600 flex-1">{error}</p>
              </div>
            )}

            {/* Social Login Buttons - Very Compact */}
            <div className="space-y-1.5 lg:space-y-2 mb-2.5 lg:mb-3">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <i className="ri-google-fill text-base text-[#DB4437]"></i>
                <span className="font-medium text-gray-700 text-sm">Continua con Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-2.5 lg:mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-gray-500 text-xs">oppure con email</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-2 lg:space-y-2.5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tua@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full text-base sm:text-sm py-2"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full text-base sm:text-sm py-2"
                />
              </div>

              {/* Remember Me & Forgot Password - Compact */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#C9A876] focus:ring-2 focus:ring-[#C9A876] cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-xs text-gray-600 group-hover:text-gray-700">Ricordami</span>
                </label>
                <Link 
                  href="#" 
                  onClick={handleForgotPassword}
                  className="text-xs text-[#C9A876] hover:text-[#B8956A] font-medium transition-colors"
                >
                  Password dimenticata?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D97860] to-[#C9A876] text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin text-sm"></i>
                    <span>Accesso...</span>
                  </span>
                ) : (
                  'Accedi'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-2.5 lg:mt-3 text-center">
              <p className="text-xs text-gray-600">
                Non hai un account?{' '}
                <Link href="/registrati" className="text-[#D97860] hover:text-[#C86B54] font-semibold transition-colors underline-offset-2 hover:underline">
                  Registrati
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
