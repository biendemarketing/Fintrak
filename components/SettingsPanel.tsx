import React, { useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { X, User, Palette, Lock, LogOut, Sun, Moon, Save, Camera, Edit2 } from 'lucide-react';
import type { UserProfile, ThemeName } from '../types.ts';
import { COLOR_THEMES } from '../constants.ts';
import Avatar from './ui/Avatar.tsx';
import Button from './ui/Button.tsx';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import PinSetupModal from './PinSetupModal.tsx';
import Input from './ui/Input.tsx';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  userProfile: UserProfile | null;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>, avatarFile?: File | null) => void;
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

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, user, userProfile, onUpdateProfile, onLogout }) => {
  const [isPinModalOpen, setPinModalOpen] = useState(false);
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  // Form state for profile editing
  const [firstName, setFirstName] = useState(userProfile?.first_name || '');
  const [lastName, setLastName] = useState(userProfile?.last_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar_url || null);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setAvatarPreview(userProfile.avatar_url || null);
    }
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

  const handleProfileSave = () => {
    const updatedProfile: Partial<UserProfile> = {
      first_name: firstName,
      last_name: lastName,
    };
    onUpdateProfile(updatedProfile, avatarFile);
    // Optionally close panel after save, or show a success message
    // onClose();
  };
  
  const handleSettingsUpdate = (updatedSettings: Partial<UserProfile>) => {
    onUpdateProfile(updatedSettings, null);
  };
  
  const handlePinToggle = (isEnabled: boolean) => {
    if (isEnabled && !userProfile?.pin) {
      setPinModalOpen(true);
    } else {
      handleSettingsUpdate({ isPinEnabled: isEnabled });
    }
  };

  const handleSetPin = (pin: string) => {
    handleSettingsUpdate({ pin, isPinEnabled: true });
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
      window.dispatchEvent(new Event('storage'));
  };

  if (!isOpen || !userProfile) return null;
  
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
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <Avatar name={`${firstName} ${lastName}`} src={avatarPreview} size="lg" />
                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                    <Camera className="w-8 h-8"/>
                  </label>
                  <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
                 <div className="w-full space-y-3">
                    <Input type="text" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <Input type="text" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    <Button onClick={handleProfileSave} className="w-full flex items-center justify-center space-x-2 !transform-none">
                        <Save className="w-5 h-5" />
                        <span>Guardar Perfil</span>
                    </Button>
                 </div>
                 <p className="text-sm text-neutral-500 dark:text-neutral-400 w-full text-center border-t border-neutral-700 pt-4">{user?.email}</p>
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
                        onClick={() => handleSettingsUpdate({ theme: theme.name })}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900 transition-all ${userProfile.theme === theme.name ? 'ring-brand-primary' : 'ring-transparent'}`}
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
                    <ToggleSwitch id="pin-lock" isChecked={userProfile.isPinEnabled} onChange={handlePinToggle} />
                </div>
                {userProfile.pin && (
                    <Button onClick={() => setPinModalOpen(true)} className="w-full !bg-neutral-600 hover:!bg-neutral-500 !transform-none flex items-center justify-center space-x-2">
                        <Edit2 className="w-4 h-4" />
                        <span>Cambiar PIN</span>
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
