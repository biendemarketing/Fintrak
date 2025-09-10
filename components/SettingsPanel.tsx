import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
// FIX: Add file extension to fix module resolution error.
import type { AppSettings, UserProfile, ThemeName } from '../types.ts';
import Avatar from './ui/Avatar.tsx';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import Button from './ui/Button.tsx';
import PinSetupModal from './PinSetupModal.tsx';
import { X, User, Palette, Lock, Bell, LogOut, ChevronRight } from 'lucide-react';
import { COLOR_THEMES } from '../constants.ts';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  userProfile: UserProfile | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onUpdateSettings, userProfile }) => {
  const [isPinModalOpen, setPinModalOpen] = useState(false);

  const handleThemeChange = (theme: ThemeName) => {
    onUpdateSettings({ theme });
    // This logic might need to be more sophisticated depending on theme implementation
    const selectedTheme = COLOR_THEMES.find(t => t.name === theme);
    if (selectedTheme) {
        document.documentElement.style.setProperty('--color-primary', selectedTheme.primary);
        document.documentElement.style.setProperty('--color-secondary', selectedTheme.secondary);
    }
  };

  const handlePinSet = (pin: string) => {
    onUpdateSettings({ pinLock: pin }); // In a real app, you would hash this PIN
    setPinModalOpen(false);
  };
  
  const handlePinToggle = (enabled: boolean) => {
      if (enabled) {
          setPinModalOpen(true);
      } else {
          if (window.confirm('¿Estás seguro de que quieres desactivar el PIN de seguridad?')) {
            onUpdateSettings({ pinLock: null });
          }
      }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        await supabase.auth.signOut();
        onClose();
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-neutral-100 dark:bg-neutral-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 id="settings-title" className="text-xl font-bold">Ajustes</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800" aria-label="Cerrar ajustes">
            <X className="w-6 h-6" />
          </button>
        </header>
        
        <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-65px)]">
          {/* Profile Section */}
          {userProfile && (
            <div className="flex items-center space-x-4">
              <Avatar src={userProfile.avatar_url} name={`${userProfile.first_name} ${userProfile.last_name}`} />
              <div>
                <p className="font-semibold text-lg">{userProfile.first_name} {userProfile.last_name}</p>
                <p className="text-sm text-neutral-500">{user?.email}</p>
              </div>
            </div>
          )}

          {/* Settings List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-neutral-500 tracking-wider">Preferencias</h3>
            <div className="bg-white dark:bg-neutral-800/50 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-700">
                <SettingsItem icon={User} label="Perfil" />
                <SettingsItem icon={Palette} label="Tema">
                    <select 
                        value={settings.theme} 
                        onChange={(e) => handleThemeChange(e.target.value as ThemeName)}
                        className="bg-transparent dark:bg-neutral-800 text-right text-sm font-medium border-none focus:ring-0"
                    >
                        {COLOR_THEMES.map(theme => (
                            <option key={theme.name} value={theme.name}>{theme.label}</option>
                        ))}
                    </select>
                </SettingsItem>
            </div>
          </div>
          
           <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-neutral-500 tracking-wider">Seguridad</h3>
            <div className="bg-white dark:bg-neutral-800/50 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-700">
                <SettingsItem icon={Lock} label="Bloqueo con PIN">
                  <ToggleSwitch id="pin-lock" isChecked={!!settings.pinLock} onChange={handlePinToggle} />
                </SettingsItem>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-neutral-500 tracking-wider">Notificaciones</h3>
             <div className="bg-white dark:bg-neutral-800/50 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-700">
                <SettingsItem icon={Bell} label="Recordatorios de Pago">
                  <ToggleSwitch id="payment-reminders" isChecked={settings.notifications.paymentReminders} onChange={c => onUpdateSettings({ notifications: {...settings.notifications, paymentReminders: c} })} />
                </SettingsItem>
                 <SettingsItem icon={Bell} label="Alertas de Presupuesto">
                   <ToggleSwitch id="budget-alerts" isChecked={settings.notifications.budgetAlerts} onChange={c => onUpdateSettings({ notifications: {...settings.notifications, budgetAlerts: c} })} />
                </SettingsItem>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleLogout} className="w-full !bg-expense hover:!bg-expense/90 flex items-center justify-center space-x-2">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
      {isPinModalOpen && <PinSetupModal onClose={() => setPinModalOpen(false)} onSetPin={handlePinSet} />}
    </>
  );
};

const SettingsItem: React.FC<{icon: React.ElementType, label: string, children?: React.ReactNode}> = ({ icon: Icon, label, children }) => (
    <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3 text-neutral-500" />
            <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
            {children || <ChevronRight className="w-5 h-5 text-neutral-400" />}
        </div>
    </div>
);

export default SettingsPanel;
