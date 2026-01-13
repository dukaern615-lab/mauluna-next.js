'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Input from '@/components/base/Input';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have the required hash/token from the email link
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash && !searchParams.get('access_token')) {
      setError('Link di reset non valido. Per favore, usa il link inviato via email.');
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!password || !confirmPassword) {
      setError('Compila tutti i campi');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/accedi');
      }, 3000);
    } catch (err: any) {
      setError('Si è verificato un errore. Riprova.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F3] via-white to-[#F9F6F3] flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#D97860] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-lock-password-line text-3xl text-white"></i>
              </div>
              <h1 className="text-3xl font-bold text-[#3D2817] mb-2">
                Reimposta Password
              </h1>
              <p className="text-gray-600">
                Inserisci la tua nuova password
              </p>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-3xl text-green-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-[#3D2817] mb-2">
                  Password Aggiornata!
                </h2>
                <p className="text-gray-600 mb-6">
                  La tua password è stata reimpostata con successo. Verrai reindirizzato al login...
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors font-semibold"
                >
                  Vai al Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#3D2817] mb-2">
                    Nuova Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la nuova password"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#3D2817] mb-2">
                    Conferma Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Conferma la nuova password"
                    required
                    className="w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D97860] text-white py-3 rounded-lg font-semibold hover:bg-[#C86B54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Aggiornamento...
                    </span>
                  ) : (
                    'Reimposta Password'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-[#D97860] hover:text-[#C86B54] font-medium"
                  >
                    Torna al Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F3] via-white to-[#F9F6F3] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D97860]"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
