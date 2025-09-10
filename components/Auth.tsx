
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
import AppleIcon from './icons/AppleIcon.tsx';
// FIX: Add file extension to fix module resolution error.
import PasswordStrengthMeter from './PasswordStrengthMeter.tsx';
// FIX: Add file extension to fix module resolution error.
import PasswordRequirements from './PasswordRequirements.tsx';
// FIX: Add file extension to fix module resolution error.
import ArrowLeftIcon from './icons/ArrowLeftIcon.tsx';

interface AuthProps {
    view: 'signIn' | 'signUp';
    setView: (view: 'signIn' | 'signUp') => void;
}

const Auth: React.FC<AuthProps> = ({ view, setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const isSignUp = view === 'signUp';

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
        if(password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setLoading(false);
            return;
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            }
        });
        if (error) {
            setError(error.message);
        } else if (data.user && data.user.identities?.length === 0) {
            setMessage('Ya existe un usuario con este correo. Intenta iniciar sesión.');
        } else {
            setMessage('¡Revisa tu correo para verificar tu cuenta!');
        }
    } else { // Sign In
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            setError('Email o contraseña inválidos.');
        }
    }
    setLoading(false);
  };
  
  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
      await supabase.auth.signInWithOAuth({
          provider,
          options: {
              redirectTo: window.location.origin,
          }
      });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-800/70 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700/50 relative">
           {isSignUp && (
                 <button onClick={() => setView('signIn')} className="absolute top-6 left-6 text-neutral-500 hover:text-brand-primary">
                    <ArrowLeftIcon />
                </button>
            )}
           <div className="text-center mb-8">
               <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{isSignUp ? 'Crear Cuenta' : 'Bienvenido'}</h1>
               <p className="text-neutral-600 dark:text-neutral-300 mt-2">{isSignUp ? 'Empecemos con tus datos.' : 'Ingresa a tu cuenta para continuar.'}</p>
           </div>

            {error && <p className="bg-expense/20 text-expense text-center p-3 rounded-md mb-4 text-sm">{error}</p>}
            {message && <p className="bg-income/20 text-income text-center p-3 rounded-md mb-4 text-sm">{message}</p>}

           <form onSubmit={handleAuthAction} className="space-y-4">
                {isSignUp && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Nombre</label>
                            <Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Juan" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Apellido</label>
                            <Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Pérez" />
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Correo Electrónico</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@correo.com" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Contraseña</label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                    {isSignUp && <PasswordStrengthMeter password={password} />}
                </div>
                {isSignUp && (
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Confirmar Contraseña</label>
                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
                        <PasswordRequirements password={password} />
                    </div>
                )}
                <Button type="submit" disabled={loading} className="w-full !mt-6">
                    {loading ? 'Cargando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Button>
           </form>
           
           <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300 dark:border-neutral-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">O continúa con</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => handleOAuthSignIn('google')} className="w-full inline-flex justify-center py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-sm font-medium text-neutral-500 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                    <GoogleIcon className="w-5 h-5"/>
                </button>
                 <button onClick={() => handleOAuthSignIn('apple')} className="w-full inline-flex justify-center py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-sm font-medium text-neutral-500 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                    <AppleIcon className="w-5 h-5"/>
                </button>
            </div>
            
            <div className="mt-6 text-center">
                <button onClick={() => setView(isSignUp ? 'signIn' : 'signUp')} className="text-sm text-brand-primary hover:underline">
                    {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
