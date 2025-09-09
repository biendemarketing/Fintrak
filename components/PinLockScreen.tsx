
import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import Button from './ui/Button';

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

const PinLockScreen: React.FC<PinLockScreenProps> = ({ correctPin, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPin = e.target.value;
    if (/^\d{0,4}$/.test(newPin)) {
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        handleSubmit(newPin);
      }
    }
  };

  const handleSubmit = (currentPin: string) => {
    if (currentPin === correctPin) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(pin);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 z-50 flex flex-col items-center justify-center p-4 text-white">
        <div className="text-center w-full max-w-xs">
            <div className="mx-auto bg-brand-primary/20 rounded-full w-20 h-20 flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-brand-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">PIN de Seguridad</h1>
            <p className="text-neutral-200 mb-6">Ingresa tu PIN de 4 dígitos para continuar.</p>
            
            <form onSubmit={handleFormSubmit}>
                <input
                    type="password"
                    value={pin}
                    onChange={handlePinChange}
                    maxLength={4}
                    className={`w-full text-center text-4xl tracking-[1.5rem] bg-transparent border-b-2 ${error ? 'border-expense animate-shake' : 'border-neutral-600 focus:border-brand-primary'} outline-none transition-colors duration-300 pb-2`}
                    autoFocus
                    inputMode="numeric"
                    pattern="\d{4}"
                />
                {error && <p className="text-expense mt-3 text-sm">PIN incorrecto. Intenta de nuevo.</p>}
                
                <Button type="submit" className="w-full mt-8">
                    Desbloquear
                </Button>
            </form>
        </div>
         <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            .animate-shake {
                animation: shake 0.5s ease-in-out;
            }
        `}</style>
    </div>
  );
};

export default PinLockScreen;