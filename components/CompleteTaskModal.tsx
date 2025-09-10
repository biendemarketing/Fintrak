
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Task } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import { X, CheckCircle } from 'lucide-react';

interface CompleteTaskModalProps {
  task: Task;
  onClose: () => void;
  onCompleteWithTransaction: () => void;
  onCompleteOnly: () => void;
}

const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ task, onClose, onCompleteWithTransaction, onCompleteOnly }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-task-title"
    >
      <Card className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 id="complete-task-title" className="text-xl font-bold flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-income" />
            Completar Tarea
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
            aria-label="Cancelar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="my-6 text-center">
            <p className="text-neutral-200">
                Has completado la tarea: <strong className="text-white">"{task.title}"</strong>.
            </p>
            <p className="mt-2 text-neutral-400">
                ¿Quieres registrar un movimiento (gasto/ingreso) asociado a esta tarea ahora?
            </p>
        </div>
        
        <div className="space-y-3">
            <Button onClick={onCompleteWithTransaction} className="w-full">
                Sí, registrar movimiento
            </Button>
            <Button onClick={onCompleteOnly} className="w-full !bg-neutral-600 hover:!bg-neutral-500 !transform-none">
                No, solo completar la tarea
            </Button>
        </div>
      </Card>
    </div>
  );
};

export default CompleteTaskModal;