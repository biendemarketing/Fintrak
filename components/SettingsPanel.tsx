// FIX: This file was missing. Added full implementation for the SettingsPanel component.
import React, { useState } from 'react';
import type { UserSettings, ThemeName, Currency } from '../types';
import { supabase } from '../lib/supabase';
import Card from './ui/Card';
import Button from './ui/Button';
import { Palette, Lock, LogOut, X, DollarSign } from 'lucide-react';
import Avatar from './ui/Avatar';
import ToggleSwitch from './ui/ToggleSwitch';
import Select from './ui/Select';
import { COLOR_THEMES } from '../constants';
import PinSetupModal from './PinSetupModal';
import type { User } from '@supabase/supabase-js';

interface SettingsPanelProps {
  user: User | null;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, settings, onUpdateSettings, onClose }) => {
    const [isPinModalOpen, setPinModalOpen] = useState(false);

    const handleThemeChange = (themeName: ThemeName) => {
        onUpdateSettings({ theme: themeName });
    };

    const handleCurrencyChange = (currency: Currency) => {
        onUpdateSettings({ defaultCurrency: currency });
    };

    const handlePinToggle = (enabled: boolean) => {
        if (enabled) {
            setPinModalOpen(true);
        } else {
            onUpdateSettings({ pinEnabled: false, pin: null });
        }
    };

    const handleSetPin = (pin: string) => {
        onUpdateSettings({ pinEnabled: true, pin });
        setPinModalOpen(false);
    };
    
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex justify-end" onClick={onClose}>
        <div 
            className="w-full max-w-sm h-full bg-neutral-100 dark:bg-neutral-900 shadow-2xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Ajustes</h2>
                 <button 
                    onClick={onClose} 
                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
                    aria-label="Cerrar ajustes"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <Card className="mb-6">
                <div className="flex items-center space-x-4">
                    <Avatar name={user?.email} />
                    <div>
                        <p className="font-semibold text-lg truncate">{user?.email}</p>
                    </div>
                </div>
                <Button onClick={() => supabase.auth.signOut()} className="w-full !mt-6 bg-neutral-600 hover:bg-neutral-500 flex items-center justify-center space-x-2">
                    <LogOut className="w-5 h-5"/>
                    <span>Cerrar Sesión</span>
                </Button>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4">Preferencias</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><Palette className="w-5 h-5 mr-3 text-neutral-400"/> Tema de Color</span>
                        <div className="flex space-x-2">
                            {COLOR_THEMES.map(theme => (
                                <button
                                    key={theme.name}
                                    onClick={() => handleThemeChange(theme.name)}
                                    className={`w-6 h-6 rounded-full border-2 ${settings.theme === theme.name ? 'border-white ring-2 ring-white/50' : 'border-transparent'}`}
                                    style={{ backgroundColor: `rgb(${theme.primary})`}}
                                    aria-label={`Seleccionar tema ${theme.label}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><DollarSign className="w-5 h-5 mr-3 text-neutral-400"/> Moneda Principal</span>
                        <Select value={settings.defaultCurrency} onChange={(e) => handleCurrencyChange(e.target.value as Currency)} className="w-24">
                            <option value="DOP">DOP</option>
                            <option value="USD">USD</option>
                        </Select>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="flex items-center"><Lock className="w-5 h-5 mr-3 text-neutral-400"/> Bloqueo con PIN</span>
                        <ToggleSwitch id="pin-lock" isChecked={settings.pinEnabled} onChange={handlePinToggle} />
                    </div>
                </div>
            </Card>
        </div>
        {isPinModalOpen && <PinSetupModal onClose={() => setPinModalOpen(false)} onSetPin={handleSetPin} />}
    </div>
  );
};

export default SettingsPanel;
