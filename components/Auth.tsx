import React, { useState } from 'react';
// FIX: Add file extension to fix module resolution error.
import { supabase } from '../lib/supabase.ts';
// FIX: Add file extension to fix module resolution error.
import Button from './ui/Button.tsx';
// FIX: Add file extension to fix module resolution error.
import Input from './ui/Input.tsx';
// FIX: Add file extension to fix module resolution error.
import GoogleIcon from './icons/GoogleIcon.tsx';
// FIX: Add file extension to fix module resolution error.
import PasswordRequirements from './PasswordRequirements.tsx';
// FIX: Add file extension to fix module resolution error.
import ArrowLeftIcon from './icons/ArrowLeftIcon.tsx';
import { Wallet } from 'lucide-react';

interface AuthProps {
  initialView?: 'signIn' | 'signUp';
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ initialView = 'signIn', onBack }) => {
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSocialLogin = async (provider: 'google') => {
    setLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    setLoading(false);
  }

  const handleSignUp = async () => {
    // 1. Validate password requirements
    const passwordReqs = [
        /.{8,}/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    if (passwordReqs.some(req => !req)) {
        setError('La contraseña no cumple con todos los requisitos de seguridad.');
        return;
    }
    // 2. Validate password confirmation
    if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
    }
    // 3. Validate terms and conditions
    if (!termsAccepted) {
        setError('Debes aceptar los términos y condiciones para continuar.');
        return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('¡Revisa tu correo para verificar tu cuenta y poder iniciar sesión!');
      setView('signIn'); // Switch to sign-in view after successful sign-up
    }
    setLoading(false);
  };
  
  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        setError(error.message);
    }
    // Successful sign-in is handled by onAuthStateChange in App.tsx
    setLoading(false);
  };
  
   const handlePasswordReset = async () => {
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico para restablecer la contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.');
    }
    setLoading(false);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'signUp') {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  const isSignUp = view === 'signUp';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button onClick={onBack} className="absolute top-6 left-6 flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-brand-primary dark:hover:text-white transition-colors z-10">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </button>
        )}
        <div className="bg-white dark:bg-neutral-800/70 backdrop-blur-md p-8 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700/50">
          <div className="text-center mb-8">
            <Wallet className="w-10 h-10 text-brand-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{isSignUp ? 'Crea tu cuenta' : '¡Hola de nuevo!'}</h1>
            <p className="text-neutral-600 dark:text-neutral-300">{isSignUp ? 'Empieza a tomar el control de tus finanzas.' : 'Ingresa tus datos para continuar.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">Nombre</label>
                  <Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">Apellido</label>
                  <Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Pérez" required />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-1">Correo Electrónico</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
            </div>
             {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-1">Fecha de Nacimiento</label>
                  <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
                </div>
             )}
            <div>
              <label className="block text-sm font-medium text-neutral-200 mb-1">Contraseña</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">Confirmar Contraseña</label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            )}
            
            {isSignUp && <PasswordRequirements password={password} />}

            {error && <p className="text-sm text-center text-expense bg-expense/10 p-3 rounded-md">{error}</p>}
            {message && <p className="text-sm text-center text-income bg-income/10 p-3 rounded-md">{message}</p>}
            
            {!isSignUp && (
                <div className="text-right">
                    <button type="button" onClick={handlePasswordReset} className="text-sm font-medium text-brand-primary hover:underline">¿Olvidaste tu contraseña?</button>
                </div>
            )}
            
             {isSignUp && (
              <div className="flex items-start">
                <input id="terms" type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-neutral-300 rounded mt-0.5" />
                <label htmlFor="terms" className="ml-2 block text-sm text-neutral-400">
                  Acepto los <a href="#" className="font-medium text-brand-primary hover:underline">Términos y Condiciones</a>
                </label>
              </div>
            )}

            <Button type="submit" className="w-full !mt-6" disabled={loading}>
              {loading ? 'Cargando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-600" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-neutral-800 text-neutral-400">o</span></div>
          </div>

          <div className="flex justify-center">
             <button onClick={() => handleSocialLogin('google')} className="w-full inline-flex justify-center py-3 px-4 border border-neutral-600 rounded-md shadow-sm bg-neutral-700 text-sm font-medium text-neutral-200 hover:bg-neutral-600">
                <GoogleIcon className="w-5 h-5 mr-3" />
                <span>Continuar con Google</span>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-400">
            {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}{' '}
            <button onClick={() => { setView(isSignUp ? 'signIn' : 'signUp'); setError(null); setMessage(null); }} className="font-medium text-brand-primary hover:underline">
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;