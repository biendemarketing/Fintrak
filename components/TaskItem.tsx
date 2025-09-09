import React from 'react';
import type { Task } from '../types';
import { Pencil, Trash2, Receipt } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleCompletion: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isMinimal?: boolean;
}

const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleCompletion, onEdit, onDelete, isMinimal = false }) => {
  const { id, title, dueDate, time, isCompleted, transactionId } = task;

  const handleToggle = () => {
    onToggleCompletion(task);
  };
  
  const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  let dueDateColor = 'text-neutral-500 dark:text-neutral-400';
  if (!isCompleted) {
    if (daysUntilDue < 0) dueDateColor = 'text-expense';
    else if (daysUntilDue <= 3) dueDateColor = 'text-yellow-500';
  }

  return (
    <li className={`flex items-center justify-between p-3 rounded-lg ${isMinimal ? '' : 'bg-neutral-100/50 dark:bg-neutral-800/60'}`}>
        <div className="flex items-center space-x-4 flex-1 overflow-hidden">
            {!isMinimal && (
                <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={handleToggle}
                    className="w-5 h-5 rounded text-brand-primary bg-neutral-200 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 focus:ring-brand-primary flex-shrink-0"
                />
            )}
            <div className="flex-1 overflow-hidden">
                <p className={`font-semibold text-neutral-900 dark:text-white truncate ${isCompleted ? 'line-through text-neutral-500 dark:text-neutral-400' : ''}`}>
                    {title}
                </p>
                <div className="flex items-center space-x-2">
                    <span className={`text-xs ${dueDateColor}`}>
                        {new Date(dueDate + 'T00:00:00').toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })}
                        {time && ` a las ${formatTime(time)}`}
                    </span>
                     {transactionId && <span title="Movimiento asociado"><Receipt className="w-3 h-3 text-brand-primary" /></span>}
                </div>
            </div>
        </div>
        {!isMinimal && (
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => onEdit(task)}
                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                    aria-label="Editar tarea"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(id)}
                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-expense hover:bg-expense/10 rounded-full transition-colors"
                    aria-label="Eliminar tarea"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        )}
    </li>
  );
};

export default TaskItem;