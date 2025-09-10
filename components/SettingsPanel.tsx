// FIX: This file was missing. Added implementation for the SettingsPanel component.
import React, { useState } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { UserProfile, AppSettings, ThemeName, Currency } from '../types.ts';
import { User, LogOut, Palette, DollarSign, Lock, HelpCircle, Code, Trash2 } from 'lucide-react';
// FIX: Add file extension to fix module resolution error.
import Avatar from './ui/Avatar.tsx';
// FIX: Add file extension to fix module resolution error.
import Button from './ui/Button.tsx';
// FIX: Add file extension to fix module resolution error.
import ToggleSwitch from './ui/ToggleSwitch.tsx';
// FIX: Add file extension to fix module resolution error.
import Select from './ui/Select.tsx';
// FIX: Add file extension to fix module resolution error.
import PinSetupModal from './PinSetupModal.tsx';
// FIX: Add file extension to fix module resolution error.
import { COLOR_THEMES } from '../constants.ts';

interface SettingsPanelProps {
  userProfile: UserProfile | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
  onClose: () => void;
  onSeedData: () => void;
  onDeleteAllData: () => void;
}

const SettingsSection: React.FC<{title: string, icon: React.ElementType, children: React.ReactNode}> = ({ title, icon: Icon, children }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center mb-3 text-neutral-800 dark:text-neutral-100">
            <Icon className="w-5 h-5 mr-3 text-brand-primary" />
            {title}
        </h3>
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg space-y-4">
            {children}
        </div>
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ userProfile, settings, onUpdateSettings, onLogout, onClose, onSeedData, onDeleteAllData }) => {
    const [isPinModalOpen, setPinModalOpen] = useState(false);
    const fullName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Usuario';
    
    const handleSetPin = (pin: string) => {
        onUpdateSettings({ pin, pinEnabled: true });
        setPinModalOpen(false);
    };

    const handlePinToggle = (enabled: boolean) => {
        if (enabled && !settings.pin) {
            setPinModalOpen(true);
        } else {
            onUpdateSettings({ pinEnabled: enabled });
        }
    };

    const handleRemovePin = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar tu PIN?')) {
            onUpdateSettings({ pin: null, pinEnabled: false });
        }
    }
    
    const confirmDeleteAllData = () => {
        if (window.confirm('¡ADVERTENCIA! Esta acción es irreversible y eliminará TODAS tus cuentas, transacciones y datos de la aplicación. ¿Estás seguro de que quieres continuar?')) {
            onDeleteAllData();
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900 z-40 overflow-y-auto pb-20">
            <header className="sticky top-0 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-sm z-10 p-4 text-center border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-xl font-bold">Ajustes</h2>
                <button onClick={onClose} className="absolute top-3 right-3 text-sm font-semibold text-brand-primary">
                    Hecho
                </button>
            </header>
            
            <main className="p-4">
                <div className="flex flex-col items-center text-center mb-8">
                    <Avatar src={userProfile?.avatar_url} name={fullName} className="w-24 h-24 mb-4" />
                    <h2 className="text-2xl font-bold">{fullName}</h2>
                    <p className="text-neutral-500 dark:text-neutral-400">{userProfile?.id}</p>
                </div>

                <SettingsSection title="Perfil" icon={User}>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">La edición del perfil no está disponible en esta versión.</p>
                </SettingsSection>

                <SettingsSection title="Apariencia" icon={Palette}>
                    <div className="flex justify-between items-center">
                        <label htmlFor="theme-select" className="font-medium">Tema de Color</label>
                        <Select
                            id="theme-select"
                            value={settings.theme}
                            onChange={(e) => onUpdateSettings({ theme: e.target.value as ThemeName })}
                            className="w-40"
                        >
                            {COLOR_THEMES.map(theme => (
                                <option key={theme.name} value={theme.name}>{theme.label}</option>
                            ))}
                        </Select>
                    </div>
                </SettingsSection>

                <SettingsSection title="General" icon={DollarSign}>
                    <div className="flex justify-between items-center">
                        <label htmlFor="currency-select" className="font-medium">Moneda Principal</label>
                        <Select
                            id="currency-select"
                            value={settings.defaultCurrency}
                            onChange={(e) => onUpdateSettings({ defaultCurrency: e.target.value as Currency })}
                            className="w-40"
                        >
                            <option value="DOP">RD$ (DOP)</option>
                            <option value="USD">US$ (USD)</option>
                        </Select>
                    </div>
                </SettingsSection>

                <SettingsSection title="Seguridad" icon={Lock}>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Bloqueo con PIN</span>
                        <ToggleSwitch id="pin-lock" isChecked={settings.pinEnabled} onChange={handlePinToggle} />
                    </div>
                    {settings.pin && settings.pinEnabled && (
                        <div className="pt-2 text-center">
                            <button onClick={() => setPinModalOpen(true)} className="text-sm text-brand-primary hover:underline">
                                Cambiar PIN
                            </button>
                            <span className="mx-2 text-neutral-400">|</span>
                             <button onClick={handleRemovePin} className="text-sm text-expense hover:underline">
                                Quitar PIN
                            </button>
                        </div>
                    )}
                </SettingsSection>
                
                 <SettingsSection title="Datos de la Aplicación" icon={Code}>
                    <Button onClick={onSeedData} className="w-full !bg-neutral-600 hover:!bg-neutral-500 !transform-none">
                        Cargar Datos de Ejemplo
                    </Button>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">Esto agregará cuentas y transacciones de ejemplo para probar la aplicación. No eliminará tus datos existentes.</p>
                     <Button onClick={confirmDeleteAllData} className="w-full !bg-expense hover:!bg-expense/90 !transform-none flex items-center justify-center space-x-2">
                         <Trash2 className="w-4 h-4" />
                         <span>Eliminar Todos Mis Datos</span>
                    </Button>
                </SettingsSection>

                <SettingsSection title="Soporte" icon={HelpCircle}>
                     <p className="text-sm text-neutral-600 dark:text-neutral-300">Versión de la App: 1.0.0</p>
                </SettingsSection>

                <div className="mt-8">
                    <Button onClick={onLogout} className="w-full !bg-neutral-600 hover:!bg-neutral-500 !transform-none flex items-center justify-center space-x-2">
                        <LogOut className="w-5 h-5"/>
                        <span>Cerrar Sesión</span>
                    </Button>
                </div>
            </main>
            
            {isPinModalOpen && (
                <PinSetupModal onClose={() => setPinModalOpen(false)} onSetPin={handleSetPin} />
            )}
        </div>
    );
};

export default SettingsPanel;
