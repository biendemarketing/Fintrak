import React from 'react';
import Card from './ui/Card';
import { PlusCircle, ArrowRightLeft, Repeat, X, ListChecks } from 'lucide-react';

interface AddMenuModalProps {
    onClose: () => void;
    onSelect: (type: 'transaction' | 'transfer' | 'recurring' | 'task') => void;
}

const AddMenuModal: React.FC<AddMenuModalProps> = ({ onClose, onSelect }) => {
    
    const ActionButton: React.FC<{icon: React.ElementType, title: string, description: string, onClick: () => void}> = ({icon: Icon, title, description, onClick}) => (
         <button 
            onClick={onClick}
            className="flex items-center w-full p-4 text-left bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
            <Icon className="w-8 h-8 mr-4 text-brand-primary" />
            <div>
                <p className="font-semibold text-neutral-900 dark:text-white">{title}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-200">{description}</p>
            </div>
        </button>
    );

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
                    <h3 className="text-xl font-semibold">¿Qué quieres hacer?</h3>
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
                        icon={ListChecks} 
                        title="Añadir Tarea" 
                        description="Un recordatorio o algo por hacer."
                        onClick={() => onSelect('task')}
                    />
                    <ActionButton 
                        icon={PlusCircle} 
                        title="Registrar Movimiento" 
                        description="Una entrada o salida de dinero."
                        onClick={() => onSelect('transaction')}
                    />
                    <ActionButton 
                        icon={ArrowRightLeft} 
                        title="Hacer Transferencia" 
                        description="Mover dinero entre tus cuentas."
                        onClick={() => onSelect('transfer')}
                    />
                    <ActionButton 
                        icon={Repeat} 
                        title="Añadir Gasto/Ingreso Fijo" 
                        description="Programar un movimiento recurrente."
                        onClick={() => onSelect('recurring')}
                    />
                </div>
            </Card>
        </div>
    );
};

export default AddMenuModal;