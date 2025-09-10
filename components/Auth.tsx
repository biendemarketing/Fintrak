
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';
import GoogleIcon from './icons/GoogleIcon';
import AppleIcon from './icons/AppleIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import PasswordRequirements from './PasswordRequirements';
import { AuthApiError } from '@supabase/supabase-js';


interface AuthProps {
    initialView?: 'signIn' | 'signUp';
    onNavigateToGetStarted?: () => void;
}

const Auth: React.FC<AuthProps> = ({ initialView = 'signIn', onNavigateToGetStarted }) => {
    const [view, setView] = useState(initialView);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (error) {
            setError(error.message);
        } else if (data.user?.identities?.length === 0) {
            setError("Este correo ya está registrado. Por favor, inicia sesión.");
        } 
        else {
            setMessage('¡Revisa tu correo para verificar tu cuenta!');
        }
        setLoading(false);
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error instanceof AuthApiError && error.message.includes('Invalid login credentials')) {
                 setError('Correo o contraseña incorrectos.');
            } else {
                 setError(error.message);
            }
        }
        setLoading(false);
    };

    const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({ provider });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };
    
    const renderContent = () => {
        if (view === 'signUp') {
            return (
                <form onSubmit={handleSignUp} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <Input type="text" placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                        <Input type="text" placeholder="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} required />
                    </div>
                    <Input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
                    <div>
                        <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                        <PasswordStrengthMeter password={password} />
                    </div>
                    <Button type="submit" disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear Cuenta'}</Button>
                    <PasswordRequirements password={password} />
                </form>
            );
        }
        
        return (
             <form onSubmit={handleSignIn} className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                <Button type="submit" disabled={loading}>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</Button>
            </form>
        );
    };
    
    const title = view === 'signIn' ? 'Inicia Sesión' : 'Crea tu Cuenta';
    const description = view === 'signIn' 
        ? '¡Qué bueno verte de nuevo!'
        : 'Comienza a organizar tus finanzas hoy mismo.';

    return (
        <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900 z-50 flex flex-col items-center justify-center p-4">
             {onNavigateToGetStarted && (
                 <button onClick={onNavigateToGetStarted} className="absolute top-6 left-6 flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-brand-primary dark:hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    <span>Volver</span>
                </button>
             )}
            <Card className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-neutral-600 dark:text-neutral-300 mt-1">{description}</p>
                </div>
                
                {error && <p className="bg-red-500/20 text-red-400 text-sm text-center p-3 rounded-md mb-4">{error}</p>}
                {message && <p className="bg-green-500/20 text-green-400 text-sm text-center p-3 rounded-md mb-4">{message}</p>}

                {renderContent()}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-neutral-300 dark:border-neutral-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">O continúa con</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleOAuthSignIn('google')} className="flex items-center justify-center w-full py-2.5 px-4 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <GoogleIcon className="w-5 h-5 mr-2" />
                        <span className="font-semibold text-sm">Google</span>
                    </button>
                    <button onClick={() => handleOAuthSignIn('apple')} className="flex items-center justify-center w-full py-2.5 px-4 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <AppleIcon className="w-5 h-5 mr-2 fill-current" />
                         <span className="font-semibold text-sm">Apple</span>
                    </button>
                </div>
                
                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            setView(view === 'signIn' ? 'signUp' : 'signIn');
                            setError(null);
                            setMessage(null);
                        }}
                        className="text-sm font-semibold text-brand-primary hover:underline"
                    >
                        {view === 'signIn'
                            ? '¿No tienes una cuenta? Regístrate'
                            : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default Auth;
