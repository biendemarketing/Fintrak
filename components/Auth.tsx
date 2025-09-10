import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';
import GoogleIcon from './icons/GoogleIcon.tsx';
import PasswordRequirements from './PasswordRequirements.tsx';
import ArrowLeftIcon from './icons/ArrowLeftIcon.tsx';

interface AuthProps {
  onBack: () => void;
  initialView?: 'signIn' | 'signUp';
}

const Auth: React.FC<AuthProps> = ({ onBack, initialView = 'signIn' }) => {
  const [view, setView] = useState<'signIn' | 'signUp' | 'forgotPassword'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Reset fields when view changes
  useEffect(() => {
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setTermsAccepted(false);
  }, [view]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (view === 'signUp') {
      // Validation
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }
      if (!termsAccepted) {
          setError('Debes aceptar los términos y condiciones.');
          setLoading(false);
          return;
      }
      // Password requirements check (this is also visually shown to user)
      const passwordReqs = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
      if (!passwordReqs.every(req => req.test(password))) {
          setError('La contraseña no cumple con los requisitos de seguridad.');
          setLoading(false);
          return;
      }

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
        setMessage('¡Revisa tu correo para verificar tu cuenta!');
      }
    } else if (view === 'signIn') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else if (view === 'forgotPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) setError(error.message);
        else setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo.');
    }

    setLoading(false);
  };

  const handleOAuth = async (provider: 'google') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const renderFormContent = () => {
    if (view === 'forgotPassword') {
        return (
            <>
                 <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Correo Electrónico</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@correo.com" />
                </div>
                 <Button type="submit" disabled={loading} className="w-full !mt-6">
                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                </Button>
            </>
        )
    }

    return (
      <>
        {view === 'signUp' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Nombre</label>
                <Input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Juan" />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Apellido</label>
                <Input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Pérez" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Fecha de Nacimiento</label>
              <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Correo Electrónico</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@correo.com" />
        </div>
        <div>
           <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Contraseña</label>
                {view === 'signIn' && (
                    <button type="button" onClick={() => setView('forgotPassword')} className="text-xs font-semibold text-brand-primary hover:underline">
                        ¿Olvidaste tu contraseña?
                    </button>
                )}
           </div>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        {view === 'signUp' && (
          <>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Confirmar Contraseña</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <PasswordRequirements password={password} />
            <div className="flex items-start space-x-2 mt-4">
                <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 rounded"/>
                <label htmlFor="terms" className="text-xs text-neutral-600 dark:text-neutral-400">
                    He leído y acepto los <a href="#" className="underline text-brand-primary">Términos y Condiciones</a> y la <a href="#" className="underline text-brand-primary">Política de Privacidad</a>.
                </label>
            </div>
          </>
        )}
        
        <Button type="submit" disabled={loading} className="w-full !mt-6">
          {loading ? 'Cargando...' : view === 'signIn' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </Button>
      </>
    );
  };
  

  return (
    <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900 z-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
             <button onClick={onBack} className="absolute top-6 left-6 flex items-center space-x-2 text-neutral-600 dark:text-neutral-300 hover:text-brand-primary dark:hover:text-white">
                <ArrowLeftIcon />
                <span>Volver</span>
            </button>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {view === 'signIn' ? 'Bienvenido de Nuevo' : view === 'signUp' ? 'Crea tu Cuenta' : 'Recuperar Contraseña'}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                    {view === 'signIn' ? 'Ingresa para continuar a FinTrack.' : view === 'signUp' ? 'Empecemos a organizar tus finanzas.' : 'Ingresa tu correo para recibir un enlace de recuperación.'}
                </p>
            </div>

            {view !== 'forgotPassword' && (
              <>
                <Button onClick={() => handleOAuth('google')} className="w-full !bg-white dark:!bg-neutral-800 !text-neutral-900 dark:!text-white border border-neutral-300 dark:border-neutral-600 hover:!bg-neutral-50 dark:hover:!bg-neutral-700 !transform-none flex items-center justify-center space-x-2">
                    <GoogleIcon className="w-5 h-5" />
                    <span>Continuar con Google</span>
                </Button>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-neutral-300 dark:border-neutral-700"></div>
                    <span className="flex-shrink mx-4 text-neutral-500 text-sm">O</span>
                    <div className="flex-grow border-t border-neutral-300 dark:border-neutral-700"></div>
                </div>
              </>
            )}
            
            {error && <p className="text-sm text-center text-expense bg-expense/10 p-3 rounded-md mb-4">{error}</p>}
            {message && <p className="text-sm text-center text-income bg-income/10 p-3 rounded-md mb-4">{message}</p>}

            <form onSubmit={handleAuthAction} className="space-y-4">
               {renderFormContent()}
            </form>
            
            {view !== 'forgotPassword' && (
                <div className="mt-6 text-center text-sm">
                    <p className="text-neutral-600 dark:text-neutral-400">
                        {view === 'signIn' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                        <button onClick={() => { setView(view === 'signIn' ? 'signUp' : 'signIn'); }} className="font-semibold text-brand-primary hover:underline ml-1">
                            {view === 'signIn' ? 'Regístrate' : 'Inicia sesión'}
                        </button>
                    </p>
                </div>
            )}
            {view === 'forgotPassword' && (
                 <div className="mt-6 text-center text-sm">
                    <p className="text-neutral-600 dark:text-neutral-400">
                        ¿Recordaste tu contraseña?
                        <button onClick={() => setView('signIn')} className="font-semibold text-brand-primary hover:underline ml-1">
                            Inicia sesión
                        </button>
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Auth;