'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  const { signIn, register, signInWithProvider } = useAuth();
  const toast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(loginEmail, loginPassword);

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

      // Login successful
      onSuccess();
      toast.success('Accesso effettuato con successo!');
    } catch (err: any) {
      setError('Si è verificato un errore. Riprova.');
      toast.error('Errore durante l\'accesso: ' + (err.message || ''));
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!registerData.fullName || !registerData.email || !registerData.password) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email.trim())) {
      setError('Formato email non valido');
      return;
    }

    // Validate phone if provided
    if (registerData.phone.trim() !== '') {
      const cleaned = registerData.phone.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+?39)?3\d{9}$/;
      const landlineRegex = /^(?:\+?39)?0\d{8,10}$/;
      
      if (cleaned === '39' || cleaned === '+39') {
        setError('Il numero di telefono deve essere completo (es. +39 333 123 4567)');
        return;
      }
      
      if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
        setError('Formato numero di telefono non valido. Usa un numero italiano valido');
        return;
      }
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    if (registerData.password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri');
      return;
    }

    if (!registerData.agreeToTerms) {
      setError('Devi accettare i termini e condizioni');
      return;
    }

    setLoading(true);

    try {
      const result = await register(
        registerData.email,
        registerData.password,
        registerData.fullName,
        registerData.phone
      );

      if (!result.success) {
        setError(result.error || 'Errore durante la registrazione');
        toast.error(result.error || 'Errore durante la registrazione');
        setLoading(false);
        return;
      }

      // If email confirmation is required, show message to user
      if (result.requiresEmailConfirmation) {
        setError('Registrazione completata! Controlla la tua email per confermare il tuo account prima di accedere.');
        toast.info('Controlla la tua email per confermare il tuo account.');
        setLoading(false);
        return;
      }

      // Registration successful and user is logged in
      onSuccess();
      toast.success('Registrazione completata con successo!');
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
      toast.error('Errore durante la registrazione: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google') => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithProvider(provider);
      const { error: signInError } = result;

      if (signInError) {
        setError(`Errore durante l'accesso con ${provider}: ${signInError.message}`);
        toast.error(`Errore durante l'accesso con ${provider}`);
        setLoading(false);
      } else {
        // OAuth redirects, so we don't need to call onSuccess here
        toast.info('Reindirizzamento in corso...');
      }
    } catch (err: any) {
      setError('Si è verificato un errore. Riprova.');
      toast.error('Errore durante l\'accesso: ' + (err.message || ''));
      setLoading(false);
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-[#3D2817]">
            {isLogin ? 'Bentornato su MAULUNA' : 'Crea il Tuo Account'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-600"></i>
          </button>
        </div>

        <div className="p-6">
          {/* Subtitle */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-6 text-sm mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-[#D97860]"></i>
                </div>
                <span className="text-gray-600">0% Commissioni</span>
              </div>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-map-pin-line text-[#D97860]"></i>
                </div>
                <span className="text-gray-600">Solo Roma</span>
              </div>
            </div>
            <p className="text-gray-600 text-center text-sm">
              {isLogin 
                ? 'Gestisci i tuoi annunci, contatta proprietari e trova l\'immobile perfetto a Roma'
                : 'Gestisci i tuoi annunci, contatta proprietari e trova l\'immobile perfetto a Roma'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <i className="ri-error-warning-line text-red-600 text-lg mt-0.5"></i>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Social Login Buttons - Google Only */}
          <div className="mb-6">
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              <i className="ri-google-fill text-xl text-[#DB4437]"></i>
              <span className="font-medium text-gray-700">Continua con Google</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">oppure con email</span>
            </div>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tua@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A876] focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#C9A876] to-[#B8956A] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    Accesso...
                  </span>
                ) : (
                  'Accedi al Tuo Account'
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#3D2817] mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-user-line text-[#5C4B42]"></i>
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    className="block w-full pl-10 pr-3 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817]"
                    placeholder="Mario Rossi"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-[#3D2817] mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-mail-line text-[#5C4B42]"></i>
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    className="block w-full pl-10 pr-3 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817]"
                    placeholder="mario@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#3D2817] mb-1">
                  Telefono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-phone-line text-[#5C4B42]"></i>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    className="block w-full pl-10 pr-3 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817]"
                    placeholder="+39 123 456 7890"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-[#3D2817] mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-[#5C4B42]"></i>
                  </div>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    className="block w-full pl-10 pr-10 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-[#5C4B42]`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#3D2817] mb-1">
                  Conferma Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-[#5C4B42]"></i>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    className="block w-full pl-10 pr-10 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-[#3D2817]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={registerData.agreeToTerms}
                  onChange={handleRegisterChange}
                  className="mt-1 h-4 w-4 text-[#D97860] focus:ring-[#D97860] border-[#E8E4E0] rounded cursor-pointer"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-[#5C4B42]">
                  Accetto i{' '}
                  <a href="/termini" target="_blank" className="text-[#D97860] hover:text-[#C9A876] font-medium">
                    Termini e Condizioni
                  </a>
                  {' '}e la{' '}
                  <a href="/privacy" target="_blank" className="text-[#D97860] hover:text-[#C9A876] font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D97860] to-[#C9A876] text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Registrazione...' : 'Inizia Gratis'}
              </button>
            </form>
          )}

          {/* Toggle between Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? (
                <>
                  Non hai ancora un account?{' '}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                    }}
                    className="text-[#D97860] hover:underline font-semibold cursor-pointer"
                  >
                    Registrati Gratis
                  </button>
                </>
              ) : (
                <>
                  Hai già un account?{' '}
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setError('');
                    }}
                    className="font-semibold text-[#D97860] hover:text-[#C9A876] transition-colors cursor-pointer"
                  >
                    Accedi
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Trust Message */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              <i className="ri-shield-check-line text-[#C9A876] mr-1"></i>
              {isLogin 
                ? 'Accesso sicuro e crittografato - La tua piattaforma immobiliare gratuita di Roma'
                : 'Unisciti a migliaia di romani che risparmiano sulle commissioni'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
