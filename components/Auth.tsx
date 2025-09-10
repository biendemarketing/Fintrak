
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Provider } from '@supabase/supabase-js';

import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';
import GoogleIcon from './icons/GoogleIcon.tsx';
import AppleIcon from './icons/AppleIcon.tsx';
import PasswordStrengthMeter from './PasswordStrengthMeter.tsx';
import PasswordRequirements from './PasswordRequirements.tsx';
import ArrowLeftIcon from './icons/ArrowLeftIcon.tsx';


interface AuthProps {
  initialView: 'signIn' | 'signUp';
  onNavigateHome: () => void;
}

const Auth: React.FC<AuthProps> = ({ initialView, onNavigateHome }) => {
  const [view, setView] = useState<'signIn' | 'signUp' | 'forgotPassword'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when view changes
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  }, [view]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
        if (view === 'signUp') {
            if (password !== confirmPassword) throw new Error("Las contraseñas no coinciden.");
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setMessage("¡Cuenta creada! Revisa tu email para verificar tu cuenta.");
        } else if (view === 'signIn') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // The onAuthStateChange in App.tsx will handle the redirect.
        } else if (view === 'forgotPassword') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setMessage("Si existe una cuenta con este email, recibirás un enlace para restaurar tu contraseña.");
        }
    } catch (err: any) {
        setError(err.error_description || err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: Provider) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
        setError(error.message);
        setLoading(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'signUp':
        return (
          <>
            <h1 className="text-2xl font-bold mb-1">Crear una Cuenta</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Empecemos tu viaje financiero.</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="email">Email</label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </div>
                <div>
                    <label htmlFor="password">Contraseña</label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    <PasswordStrengthMeter password={password} />
                </div>
                 <div>
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
            </div>
             <PasswordRequirements password={password} />
          </>
        );
      case 'forgotPassword':
        return (
            <>
                <button onClick={() => setView('signIn')} className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 hover:text-white mb-4">
                    <ArrowLeftIcon className="w-4 h-4 mr-1" />
                    Volver a inicio de sesión
                </button>
                <h1 className="text-2xl font-bold mb-1">¿Olvidaste tu contraseña?</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">No te preocupes. Ingresa tu email y te enviaremos un enlace para recuperarla.</p>
                <div>
                    <label htmlFor="email">Email</label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </div>
            </>
        )
      case 'signIn':
      default:
        return (
          <>
            <h1 className="text-2xl font-bold mb-1">¡Bienvenido de vuelta!</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Ingresa a tu cuenta para continuar.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="email">Email</label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>
              <div>
                <div className="flex justify-between items-baseline">
                    <label htmlFor="password">Contraseña</label>
                    <button onClick={() => setView('forgotPassword')} type="button" className="text-sm text-brand-primary/80 hover:text-brand-primary font-medium">¿Olvidaste tu contraseña?</button>
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
          </>
        );
    }
  };

  const renderFooter = () => {
    switch (view) {
        case 'signUp':
            return <p className="text-sm">¿Ya tienes una cuenta? <button onClick={() => setView('signIn')} className="font-bold text-brand-primary hover:underline">Inicia sesión</button></p>;
        case 'forgotPassword':
            return null;
        case 'signIn':
        default:
            return <p className="text-sm">¿No tienes cuenta? <button onClick={() => setView('signUp')} className="font-bold text-brand-primary hover:underline">Crea una ahora</button></p>;
    }
  }

  return (
    <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-neutral-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700/50">
          <form onSubmit={handleAuthAction} className="space-y-6">
            {renderForm()}
            
            {error && <p className="text-sm text-center text-expense bg-expense/10 p-2 rounded-md">{error}</p>}
            {message && <p className="text-sm text-center text-income bg-income/10 p-2 rounded-md">{message}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Cargando...' : (view === 'signUp' ? 'Crear Cuenta' : view === 'signIn' ? 'Iniciar Sesión' : 'Enviar Email')}
            </Button>
          </form>

          {view !== 'forgotPassword' && (
             <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-300 dark:border-neutral-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">O continúa con</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleOAuthLogin('google')} className="flex items-center justify-center w-full py-2.5 px-4 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                        <GoogleIcon className="w-5 h-5 mr-2" /> Google
                    </button>
                    <button onClick={() => handleOAuthLogin('apple')} className="flex items-center justify-center w-full py-2.5 px-4 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                        <AppleIcon className="w-5 h-5 mr-2" /> Apple
                    </button>
                </div>
            </>
          )}

           <div className="text-center mt-6">
            {renderFooter()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
