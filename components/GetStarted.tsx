import React, { useState } from 'react';
// FIX: Add file extension to fix module resolution error.
import Slide1Icon from './icons/Slide1Icon.tsx';
// FIX: Add file extension to fix module resolution error.
import Slide2Icon from './icons/Slide2Icon.tsx';
// FIX: Add file extension to fix module resolution error.
import Slide3Icon from './icons/Slide3Icon.tsx';
// FIX: Add file extension to fix module resolution error.
import Button from './ui/Button.tsx';

interface GetStartedProps {
  onNavigateToAuth: (initialView: 'signIn' | 'signUp') => void;
}

const slides = [
  {
    icon: Slide1Icon,
    title: '¡Bienvenido a FinTrack!',
    description: 'Tu nuevo asistente financiero personal. Toma el control de tu dinero de una forma sencilla y visual.',
  },
  {
    icon: Slide2Icon,
    title: 'Organiza tus Cuentas',
    description: 'Agrega todas tus cuentas bancarias, tarjetas y efectivo en un solo lugar para tener una vista completa de tu patrimonio.',
  },
  {
    icon: Slide3Icon,
    title: 'Registra y Planifica',
    description: 'Anota tus gastos e ingresos diarios, y no olvides nunca un pago con nuestros recordatorios y gastos fijos.',
  },
];

const GetStarted: React.FC<GetStartedProps> = ({ onNavigateToAuth }) => {
  const [step, setStep] = useState(0);
  const isLastStep = step === slides.length - 1;
  const CurrentIcon = slides[step].icon;

  const handleNext = () => {
    if (!isLastStep) {
      setStep(s => s + 1);
    }
  };
  
  const progressPercentage = ((step + 1) / slides.length) * 100;

  return (
    <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900 z-50 flex flex-col items-center justify-between p-8 text-neutral-900 dark:text-white text-center">
      <div className="w-full max-w-md flex justify-end">
          <button onClick={() => onNavigateToAuth('signIn')} className="font-semibold text-neutral-600 dark:text-neutral-400 hover:text-brand-primary dark:hover:text-white transition-colors">
            Saltar
          </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-8">
        <CurrentIcon className="w-48 h-48 md:w-64 md:h-64 mb-12" />
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{slides[step].title}</h1>
        <p className="text-neutral-600 dark:text-neutral-300 max-w-md">{slides[step].description}</p>
      </div>
      
      <div className="w-full max-w-md">
         <div className="mb-8">
            <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-1.5">
                <div 
                    className="bg-brand-primary rounded-full h-1.5 transition-all duration-300 ease-in-out" 
                    style={{ width: `${progressPercentage}%` }}
                    aria-label={`Progreso: paso ${step + 1} de ${slides.length}`}
                ></div>
            </div>
        </div>
        
        {isLastStep ? (
            <div className="space-y-3">
                <Button onClick={() => onNavigateToAuth('signUp')} className="w-full">Crear Cuenta</Button>
                <button onClick={() => onNavigateToAuth('signIn')} className="font-semibold text-neutral-600 dark:text-neutral-300 py-3">
                    Ya tengo una cuenta
                </button>
            </div>
        ) : (
            <div className="flex justify-end">
                <button onClick={handleNext} className="font-bold text-brand-primary py-3 px-4">
                    Siguiente
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default GetStarted;