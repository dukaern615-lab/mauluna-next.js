'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const { register, signInWithProvider } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Formato email non valido');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (formData.password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Devi accettare i termini e condizioni');
      return;
    }

    setLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.fullName,
        ''
      );

      if (!result.success) {
        setError(result.error || 'Errore durante la registrazione');
        setLoading(false);
        return;
      }

      // If email confirmation is required, show message to user
      if (result.requiresEmailConfirmation) {
        setError('Registrazione completata! Controlla la tua email per confermare il tuo account prima di accedere.');
        setLoading(false);
        // Don't navigate - let user see the message
        return;
      }

      // Registration successful and user is logged in, navigate to dashboard
      router.push('/profilo');
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider: 'google') => {
    try {
      const { error } = await signInWithProvider(provider);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Errore durante la registrazione con ${provider}`);
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
              Crea il Tuo Account
            </h1>
            {/* Badges - Below heading */}
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

          {/* Registration Card - Single Column */}
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
                type="button"
                onClick={() => handleSocialRegister('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700 font-medium text-sm">Continua con Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-2.5 lg:mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E4E0]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-[#5C4B42] text-xs">oppure</span>
              </div>
            </div>

            {/* Traditional Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-2.5">
              {/* Name and Email - Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-2.5">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-medium text-[#3D2817] mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <i className="ri-user-line text-[#5C4B42] text-sm"></i>
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817] text-base sm:text-sm"
                      placeholder="Mario Rossi"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-[#3D2817] mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <i className="ri-mail-line text-[#5C4B42] text-sm"></i>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817] text-base sm:text-sm"
                      placeholder="mario@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Password and Confirm Password - Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-2.5">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-[#3D2817] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <i className="ri-lock-line text-[#5C4B42] text-sm"></i>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-9 py-2 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817] text-base sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center cursor-pointer"
                    >
                      <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-[#5C4B42] text-sm`}></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#3D2817] mb-1">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <i className="ri-lock-line text-[#5C4B42] text-sm"></i>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817] text-base sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-1.5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-3.5 w-3.5 text-[#D97860] focus:ring-2 focus:ring-[#D97860] border-[#E8E4E0] rounded cursor-pointer flex-shrink-0"
                />
                <label htmlFor="agreeToTerms" className="block text-xs text-[#5C4B42] leading-relaxed">
                  Accetto i{' '}
                  <Link href="/termini" className="text-[#D97860] hover:text-[#C9A876] font-medium transition-colors underline-offset-2 hover:underline">
                    Termini e Condizioni
                  </Link>
                  {' '}e la{' '}
                  <Link href="/privacy" className="text-[#D97860] hover:text-[#C9A876] font-medium transition-colors underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D97860] to-[#C9A876] text-white py-2.5 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin text-sm"></i>
                    <span>Registrazione...</span>
                  </span>
                ) : (
                  'Inizia Gratis'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-2.5 lg:mt-3 text-center">
              <p className="text-xs text-[#5C4B42]">
                Hai già un account?{' '}
                <Link href="/accedi" className="font-semibold text-[#D97860] hover:text-[#C9A876] transition-colors underline-offset-2 hover:underline">
                  Accedi
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
