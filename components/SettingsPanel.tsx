import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
// FIX: Add file extensions to fix module resolution errors.
import type { UserProfile, ThemeName, Currency } from '../types.ts';
import { X, LogOut, User as UserIcon, Palette, Lock, Edit2 } from 'lucide-react';
import Avatar from './ui/Avatar.tsx';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';
import Select from './ui/Select.tsx';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import PinSetupModal from './PinSetupModal.tsx';
import { COLOR_THEMES } from '../constants.ts';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    userProfile: UserProfile | null;
    onUpdateProfile: (profileUpdate: Partial<UserProfile>, avatarFile?: File | null) => void;
    onLogout: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, user, userProfile, onUpdateProfile, onLogout }) => {
    // State for form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // State for settings
    const [theme, setTheme] = useState<ThemeName>('default');
    const [isPinEnabled, setIsPinEnabled] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [defaultCurrency, setDefaultCurrency] = useState<Currency>('DOP');

    // UI State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    
    // Populate state when userProfile changes
    useEffect(() => {
        if (userProfile) {
            setFirstName(userProfile.first_name || '');
            setLastName(userProfile.last_name || '');
            setTheme(userProfile.theme || 'default');
            setIsPinEnabled(userProfile.isPinEnabled || false);
            setDefaultCurrency(userProfile.default_currency || 'DOP');
            setAvatarPreview(null); // Reset preview on profile change
            setAvatarFile(null);
        }
        setIsDarkMode(localStorage.getItem('theme') === 'dark');
    }, [userProfile]);
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({ first_name: firstName, last_name: lastName }, avatarFile);
    };

    const handleThemeChange = (newTheme: ThemeName) => {
        setTheme(newTheme);
        onUpdateProfile({ theme: newTheme });
    };

    const handlePinToggle = (enabled: boolean) => {
        if (enabled) {
            setIsPinModalOpen(true);
        } else {
            // Disable PIN
            setIsPinEnabled(false);
            onUpdateProfile({ isPinEnabled: false, pin: undefined });
        }
    };

    const handleSetPin = (pin: string) => {
        setIsPinEnabled(true);
        onUpdateProfile({ isPinEnabled: true, pin });
        setIsPinModalOpen(false);
    };

    const handleDarkModeToggle = (enabled: boolean) => {
        setIsDarkMode(enabled);
        if (enabled) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };
    
    const handleCurrencyChange = (currency: Currency) => {
        setDefaultCurrency(currency);
        onUpdateProfile({ default_currency: currency });
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <header className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700/50 flex items-center justify-between">
                        <h2 className="text-xl font-bold">Ajustes</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                            <X className="w-6 h-6" />
                        </button>
                    </header>
                    
                    <main className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Profile Section */}
                        <section>
                            <h3 className="text-lg font-semibold flex items-center mb-4"><UserIcon className="w-5 h-5 mr-2 text-brand-primary"/> Perfil</h3>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <Avatar name={`${firstName} ${lastName}`} src={avatarPreview || userProfile?.avatar_url} size="lg" />
                                        <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-brand-primary p-2 rounded-full cursor-pointer hover:bg-brand-primary/90">
                                            <Edit2 className="w-4 h-4 text-white" />
                                            <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-xl">{`${firstName} ${lastName}`}</p>
                                        <p className="text-sm text-neutral-500">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Nombre</label>
                                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Apellido</label>
                                        <Input value={lastName} onChange={e => setLastName(e.target.value)} />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Guardar Cambios</Button>
                            </form>
                        </section>

                        {/* Theme Section */}
                        <section>
                            <h3 className="text-lg font-semibold flex items-center mb-4"><Palette className="w-5 h-5 mr-2 text-brand-primary"/> Tema de Color</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {COLOR_THEMES.map(t => (
                                    <button key={t.name} onClick={() => handleThemeChange(t.name)} className={`p-3 rounded-lg border-2 ${theme === t.name ? 'border-brand-primary' : 'border-neutral-200 dark:border-neutral-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold">{t.label}</span>
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `rgb(${t.primary})` }}></div>
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `rgb(${t.secondary})` }}></div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                        
                        {/* Security & General Settings */}
                        <section>
                             <h3 className="text-lg font-semibold flex items-center mb-4"><Lock className="w-5 h-5 mr-2 text-brand-primary"/> Preferencias</h3>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-neutral-200/50 dark:bg-neutral-800/60 rounded-lg">
                                    <label htmlFor="dark-mode-toggle" className="font-medium">Modo Oscuro</label>
                                    <ToggleSwitch id="dark-mode-toggle" isChecked={isDarkMode} onChange={handleDarkModeToggle} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-neutral-200/50 dark:bg-neutral-800/60 rounded-lg">
                                    <label htmlFor="pin-toggle" className="font-medium">Bloqueo con PIN</label>
                                    <ToggleSwitch id="pin-toggle" isChecked={isPinEnabled} onChange={handlePinToggle} />
                                </div>
                                <div className="p-3 bg-neutral-200/50 dark:bg-neutral-800/60 rounded-lg">
                                    <label htmlFor="default-currency" className="font-medium mb-2 block">Moneda por Defecto</label>
                                    <Select id="default-currency" value={defaultCurrency} onChange={e => handleCurrencyChange(e.target.value as Currency)}>
                                        <option value="DOP">Peso Dominicano (DOP)</option>
                                        <option value="USD">Dólar Americano (USD)</option>
                                    </Select>
                                </div>
                             </div>
                        </section>
                    </main>
                    
                    <footer className="flex-shrink-0 p-6">
                        <Button onClick={onLogout} className="w-full !bg-neutral-700 hover:!bg-neutral-600 flex items-center justify-center space-x-2">
                            <LogOut className="w-5 h-5"/>
                            <span>Cerrar Sesión</span>
                        </Button>
                    </footer>
                </div>
            </div>
            {isPinModalOpen && <PinSetupModal onClose={() => setIsPinModalOpen(false)} onSetPin={handleSetPin} />}
        </>
    );
};

export default SettingsPanel;
