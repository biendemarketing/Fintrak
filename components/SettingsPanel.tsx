
import React, { useState, useEffect } from 'react';
import type { User, Currency, ThemeName } from '../types';
import { X, LogOut, Save, Camera, Settings, Download, Upload, RefreshCcw, Check } from 'lucide-react';
import Avatar from './ui/Avatar';
import Input from './ui/Input';
import Button from './ui/Button';
import ToggleSwitch from './ui/ToggleSwitch';
import Select from './ui/Select';
import { resizeImage } from '../utils/image';
import { COLOR_THEMES } from '../constants';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onTogglePin: (enabled: boolean) => void;
  onLogout: () => void;
  onResetSettings: () => void;
}

const SettingsSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section>
        <h3 className="text-lg font-semibold text-brand-primary mb-4">{title}</h3>
        {children}
    </section>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, user, onUpdateUser, onTogglePin, onLogout, onResetSettings }) => {
  const [name, setName] = useState(user.name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleNameSave = () => {
    if (name.trim()) {
        onUpdateUser({ name: name.trim() });
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedImage = await resizeImage(file, 200);
        onUpdateUser({ profilePic: resizedImage });
      } catch (error) {
        console.error("Error changing profile picture:", error);
        alert("Hubo un error al cambiar la foto de perfil.");
      }
    }
  };

  const handleThemeChange = (isChecked: boolean) => {
    onUpdateUser({ theme: isChecked ? 'light' : 'dark' });
  };
  
  const handleNotificationsChange = (isChecked: boolean) => {
    onUpdateUser({ notificationsEnabled: isChecked });
  };
  
  const handleDefaultCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdateUser({ defaultCurrency: e.target.value as Currency });
  };

  const handleReset = () => {
    if (window.confirm('¿Quieres restaurar todos los ajustes a sus valores por defecto? Esto no afectará tus datos financieros.')) {
        onResetSettings();
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-neutral-50 dark:bg-neutral-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 id="settings-title" className="text-xl font-bold flex items-center"><Settings className="w-6 h-6 mr-2"/>Ajustes</h2>
            <button 
              onClick={onClose} 
              className="p-2 text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
              aria-label="Cerrar ajustes"
            >
              <X className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 p-6 overflow-y-auto space-y-8">
            <SettingsSection title="Perfil">
              <div className="flex items-center space-x-4 mb-4">
                 <div className="relative group">
                    <Avatar src={user.profilePic} name={user.name} size="lg" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Cambiar foto de perfil"
                    >
                        <Camera className="w-6 h-6" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} className="hidden" accept="image/*" />
                 </div>
                <div className="flex-1">
                   <label htmlFor="userName" className="block text-sm font-medium mb-1">Tu Nombre</label>
                   <div className="flex items-center space-x-2">
                        <Input id="userName" value={name} onChange={handleNameChange} className="bg-neutral-200 dark:bg-neutral-700"/>
                        <button onClick={handleNameSave} className="p-2 bg-brand-primary rounded-md hover:bg-brand-primary/90 text-white" aria-label="Guardar nombre"><Save className="w-5 h-5"/></button>
                   </div>
                </div>
              </div>
            </SettingsSection>
            
            <SettingsSection title="Apariencia">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-neutral-200/50 dark:bg-neutral-700/50 p-3 rounded-lg">
                    <label htmlFor="light-theme" className="font-medium">Tema Claro</label>
                    <ToggleSwitch id="light-theme" isChecked={user.theme === 'light'} onChange={handleThemeChange} />
                </div>
                <div className="bg-neutral-200/50 dark:bg-neutral-700/50 p-3 rounded-lg">
                    <label className="font-medium mb-3 block">Color del Tema</label>
                    <div className="flex items-center justify-around">
                        {COLOR_THEMES.map(theme => (
                            <div key={theme.name} className="flex flex-col items-center space-y-2">
                                <button
                                    onClick={() => onUpdateUser({ themeStyle: theme.name })}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 transition-all ${user.themeStyle === theme.name ? 'ring-brand-primary ring-offset-2 ring-offset-neutral-50 dark:ring-offset-neutral-800' : 'ring-transparent'}`}
                                    style={{ background: `linear-gradient(45deg, rgb(${theme.primary}), rgb(${theme.secondary}))` }}
                                    aria-label={`Seleccionar tema ${theme.label}`}
                                >
                                  {user.themeStyle === theme.name && <Check className="w-5 h-5 text-white" />}
                                </button>
                                <span className="text-xs">{theme.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Moneda">
                 <div className="bg-neutral-200/50 dark:bg-neutral-700/50 p-3 rounded-lg">
                    <label htmlFor="default-currency" className="font-medium mb-2 block">Moneda por Defecto</label>
                    <Select id="default-currency" value={user.defaultCurrency} onChange={handleDefaultCurrencyChange}>
                        <option value="DOP">Peso Dominicano (DOP)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                    </Select>
                 </div>
            </SettingsSection>

            <SettingsSection title="Seguridad">
              <div className="flex justify-between items-center bg-neutral-200/50 dark:bg-neutral-700/50 p-3 rounded-lg">
                <label htmlFor="pin-lock" className="font-medium">Activar PIN de Seguridad</label>
                <ToggleSwitch id="pin-lock" isChecked={user.pinEnabled} onChange={onTogglePin} />
              </div>
            </SettingsSection>
            
            <SettingsSection title="Notificaciones">
              <div className="flex justify-between items-center bg-neutral-200/50 dark:bg-neutral-700/50 p-3 rounded-lg">
                <label htmlFor="notifications" className="font-medium">Recibir Notificaciones</label>
                <ToggleSwitch id="notifications" isChecked={user.notificationsEnabled} onChange={handleNotificationsChange} />
              </div>
            </SettingsSection>
            
            <SettingsSection title="Gestión de Datos">
              <div className="space-y-3">
                <Button className="w-full !bg-neutral-600 hover:!bg-neutral-500 flex items-center justify-center space-x-2 !transform-none" disabled>
                  <Download className="w-5 h-5" /><span>Exportar Datos</span>
                </Button>
                <Button className="w-full !bg-neutral-600 hover:!bg-neutral-500 flex items-center justify-center space-x-2 !transform-none" disabled>
                  <Upload className="w-5 h-5" /><span>Importar Datos</span>
                </Button>
                 <Button onClick={handleReset} className="w-full !bg-neutral-600 hover:!bg-neutral-500 flex items-center justify-center space-x-2 !transform-none">
                  <RefreshCcw className="w-5 h-5" /><span>Restaurar Ajustes</span>
                </Button>
              </div>
            </SettingsSection>
          </div>

          <footer className="p-4 mt-auto border-t border-neutral-200 dark:border-neutral-700 space-y-4">
             <div className="text-center text-xs text-neutral-500 dark:text-neutral-600">
                <p>FinTrack v1.0.0</p>
             </div>
            <Button onClick={onLogout} className="w-full bg-expense hover:bg-expense/90 flex items-center justify-center space-x-2 !transform-none">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;