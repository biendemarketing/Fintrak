
import React from 'react';
import Card from './ui/Card.tsx';
import { ListChecks, Repeat, X, Target } from 'lucide-react';
// FIX: Add file extension to fix module resolution error.
import type { View } from '../types.ts';

interface FijosMenuModalProps {
    onClose: () => void;
    setView: (view: View) => void;
}

const FijosMenuModal: React.FC<FijosMenuModalProps> = ({ onClose, setView }) => {
    
    const ActionButton: React.FC<{icon: React.ElementType, title: string, description: string, onClick: () => void}> = ({icon: Icon, title, description, onClick}) => (
         <button 
            onClick={onClick}
            className="flex items-center w-full p-4 text-left bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
            <Icon className="w-8 h-8 mr-4 text-brand-secondary" />
            <div>
                <p className="font-semibold text-neutral-900 dark:text-white">{title}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-200">{description}</p>
            </div>
        </button>
    );

    const handleSelect = (view: View) => {
        setView(view);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={onClose}
        >
            <Card 
                className="w-full max-w-md mb-20"
                onClick={(e) => e.stopPropagation()}
            >
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Tareas y Fijos</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-3">
                    <ActionButton 
                        icon={Target} 
                        title="Presupuestos" 
                        description="Define y sigue tus límites de gasto."
                        onClick={() => handleSelect('budgets')}
                    />
                    <ActionButton 
                        icon={ListChecks} 
                        title="Tareas y Recordatorios" 
                        description="Gestiona tus pendientes."
                        onClick={() => handleSelect('tasks')}
                    />
                    <ActionButton 
                        icon={Repeat} 
                        title="Ingresos/Gastos Fijos" 
                        description="Movimientos que se repiten."
                        onClick={() => handleSelect('recurring')}
                    />
                </div>
            </Card>
        </div>
    );
};

export default FijosMenuModal;