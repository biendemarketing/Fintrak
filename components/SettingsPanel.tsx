
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Profile, ThemeName } from '../types.ts';
import { LogOut, Palette, Lock, User as UserIcon, Trash2 } from 'lucide-react';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
// FIX: Add file extension to fix module resolution error.
import Avatar from './ui/Avatar.tsx';
// FIX: Add file extension to fix module resolution error.
import ToggleSwitch from './ui/ToggleSwitch.tsx';
// FIX: Add file extension to fix module resolution error.
import { COLOR_THEMES } from '../constants.ts';

interface SettingsPanelProps {
    profile: Profile | null;
    onLogout: () => void;
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    isPinEnabled: boolean;
    onTogglePin: (enabled: boolean) => void;
    onSetupPin: () => void;
    onDeleteData: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    profile, 
    onLogout,
    theme,
    setTheme,
    isPinEnabled,
    onTogglePin,
    onSetupPin,
    onDeleteData
}) => {
    const fullName = profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario';
    
    const handleTogglePin = (enabled: boolean) => {
        if (enabled) {
            onSetupPin();
        } else {
            onTogglePin(false);
        }
    };
    
    const handleDeleteRequest = () => {
        if (window.confirm('¿Estás SEGURO de que quieres eliminar TODOS tus datos? Esta acción es irreversible y borrará todas tus cuentas, transacciones y configuraciones.')) {
            onDeleteData();
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col items-center text-center">
                    <Avatar src={profile?.avatar_url} name={fullName} size="lg" />
                    <h2 className="mt-4 text-2xl font-bold">{fullName}</h2>
                    {/* Placeholder for email, assuming it's available from session */}
                    {/* <p className="text-neutral-400">{session?.user.email}</p> */}
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center"><Palette className="w-5 h-5 mr-2 text-brand-secondary"/> Tema de Color</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {COLOR_THEMES.map(t => (
                        <button 
                            key={t.name}
                            onClick={() => setTheme(t.name)}
                            className={`p-2 rounded-lg border-2 ${theme === t.name ? 'border-brand-primary' : 'border-transparent'}`}
                        >
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `rgb(${t.primary})` }}></div>
                                <span className="font-medium text-sm">{t.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>
            
             <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-brand-secondary"/> Seguridad</h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium">Bloqueo por PIN</p>
                        <p className="text-sm text-neutral-400">Protege tu app con un PIN de 4 dígitos.</p>
                    </div>
                    <ToggleSwitch id="pin-toggle" isChecked={isPinEnabled} onChange={handleTogglePin} />
                </div>
                 {isPinEnabled && (
                     <Button onClick={onSetupPin} className="w-full !mt-4 !bg-neutral-600 hover:!bg-neutral-500 text-sm py-2 !transform-none">
                        Cambiar PIN
                    </Button>
                 )}
            </Card>

             <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center"><UserIcon className="w-5 h-5 mr-2 text-brand-secondary"/> Cuenta</h3>
                 <Button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 !bg-neutral-600 hover:!bg-neutral-500 !transform-none">
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </Button>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-4 flex items-center"><Trash2 className="w-5 h-5 mr-2 text-expense"/> Zona de Peligro</h3>
                <div className="bg-expense/10 p-4 rounded-lg">
                    <p className="font-medium text-expense">Eliminar todos mis datos</p>
                    <p className="text-sm text-neutral-400 mt-1 mb-3">Esta acción borrará permanentemente toda tu información de la aplicación.</p>
                    <Button onClick={handleDeleteRequest} className="w-full !bg-expense hover:!bg-expense/90 !transform-none text-sm py-2">
                        Eliminar mis datos
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPanel;
