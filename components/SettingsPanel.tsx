import React, { useState } from 'react';
import { X, User, Palette, Lock, LogOut, Sun, Moon } from 'lucide-react';
// FIX: Add file extension to fix module resolution error.
import type { UserProfile, Settings, ThemeName } from '../types.ts';
// FIX: Add file extension to fix module resolution error.
import { COLOR_THEMES } from '../constants.ts';
// FIX: Add file extension to fix module resolution error.
import Avatar from './ui/Avatar.tsx';
// FIX: Add file extension to fix module resolution error.
import Button from './ui/Button.tsx';
// FIX: Add file extension to fix module resolution error.
import ToggleSwitch from './ui/ToggleSwitch.tsx';
// FIX: Add file extension to fix module resolution error.
import PinSetupModal from './PinSetupModal.tsx';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
  onLogout: () => void;
}

const SettingsSection: React.FC<{ icon: React.ElementType, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <div className="py-4 border-b border-neutral-200 dark:border-neutral-700">
    <h3 className="text-lg font-semibold flex items-center mb-4">
      <Icon className="w-5 h-5 mr-3 text-brand-primary" />
      {title}
    </h3>
    <div className="space-y-4 pl-8">
      {children}
    </div>
  </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, user, settings, onUpdateSettings, onLogout }) => {
  const [isPinModalOpen, setPinModalOpen] = useState(false);
  const isDarkMode = document.documentElement.classList.contains('dark');

  const handleThemeChange = (themeName: ThemeName) => {
    onUpdateSettings({ theme: themeName });
  };
  
  const handlePinToggle = (isEnabled: boolean) => {
    if (isEnabled && !settings.pin) {
      setPinModalOpen(true);
    } else {
      onUpdateSettings({ isPinEnabled: isEnabled });
    }
  };

  const handleSetPin = (pin: string) => {
    onUpdateSettings({ pin, isPinEnabled: true });
    setPinModalOpen(false);
  };
  
  const handleDarkModeToggle = () => {
      if (isDarkMode) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      }
      // This is a bit of a hack to force re-render on some components that don't auto-update
      window.dispatchEvent(new Event('storage'));
  };

  if (!isOpen) return null;
  
  const userName = user ? `${user.first_name} ${user.last_name}` : 'Invitado';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30" onClick={onClose} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-sm bg-neutral-100 dark:bg-neutral-900 shadow-2xl z-40 transform transition-transform ease-in-out duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <h2 className="text-xl font-bold">Ajustes</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
              <X className="w-6 h-6" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            <SettingsSection icon={User} title="Perfil">
              <div className="flex items-center space-x-4">
                <Avatar name={userName} src={user?.avatar_url} size="md" />
                <div>
                  <p className="font-semibold text-lg">{userName}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.id.substring(0,8)}...</p>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection icon={Palette} title="Apariencia">
                <div className="flex items-center justify-between">
                    <p>Modo Oscuro</p>
                    <button onClick={handleDarkModeToggle} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        {isDarkMode ? <Sun /> : <Moon />}
                    </button>
                </div>
                <div>
                    <p className="mb-2">Tema de Color</p>
                    <div className="flex space-x-3">
                    {COLOR_THEMES.map(theme => (
                        <button
                        key={theme.name}
                        onClick={() => handleThemeChange(theme.name)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900 transition-all ${settings.theme === theme.name ? 'ring-brand-primary' : 'ring-transparent'}`}
                        style={{ background: `linear-gradient(45deg, rgb(${theme.primary}), rgb(${theme.secondary}))` }}
                        aria-label={`Seleccionar tema ${theme.label}`}
                        />
                    ))}
                    </div>
                </div>
            </SettingsSection>
            
            <SettingsSection icon={Lock} title="Seguridad">
                <div className="flex items-center justify-between">
                    <span>Bloqueo con PIN</span>
                    <ToggleSwitch id="pin-lock" isChecked={settings.isPinEnabled} onChange={handlePinToggle} />
                </div>
                {settings.pin && (
                    <Button onClick={() => setPinModalOpen(true)} className="w-full !bg-neutral-600 hover:!bg-neutral-500 !transform-none">
                        Cambiar PIN
                    </Button>
                )}
            </SettingsSection>
          </main>

          <footer className="p-4 flex-shrink-0">
            <Button onClick={onLogout} className="w-full bg-expense hover:bg-expense/90 flex items-center justify-center space-x-2">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </footer>
        </div>
      </div>
      {isPinModalOpen && (
        <PinSetupModal
          onClose={() => setPinModalOpen(false)}
          onSetPin={handleSetPin}
        />
      )}
    </>
  );
};

export default SettingsPanel;
