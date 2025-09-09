
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';

interface PinSetupModalProps {
  onClose: () => void;
  onSetPin: (pin: string) => void;
}

const PinSetupModal: React.FC<PinSetupModalProps> = ({ onClose, onSetPin }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Los PINs no coinciden.');
      return;
    }
    onSetPin(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <Lock className="w-5 h-5 mr-2 text-brand-primary" />
            Configurar PIN
          </h3>
          <button onClick={onClose} className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-200 mb-6">Crea un PIN de 4 dígitos para proteger tu aplicación.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-pin" className="block text-sm font-medium mb-1">Nuevo PIN</label>
            <Input
              id="new-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              inputMode="numeric"
              placeholder="****"
              className="text-center tracking-widest text-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="confirm-pin" className="block text-sm font-medium mb-1">Confirmar PIN</label>
            <Input
              id="confirm-pin"
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              inputMode="numeric"
              placeholder="****"
              className="text-center tracking-widest text-lg"
              required
            />
          </div>
          {error && <p className="text-expense text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full !mt-6">
            Guardar PIN
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PinSetupModal;