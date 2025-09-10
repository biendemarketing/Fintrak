
import React, { useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Task } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import TaskItem from './TaskItem.tsx';
import { ListChecks } from 'lucide-react';

interface TasksListProps {
  tasks: Task[];
  onToggleCompletion: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
}

const TasksList: React.FC<TasksListProps> = ({ tasks, onToggleCompletion, onDeleteTask, onEditTask, onAddTask }) => {
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = tasks.filter(t => !t.isCompleted).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const completed = tasks.filter(t => t.isCompleted).sort((a, b) => new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime()).reverse();
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <ListChecks className="w-7 h-7 mr-2 text-brand-secondary" />
                <h3 className="text-2xl font-bold">Tareas y Recordatorios</h3>
            </div>
            <Button onClick={onAddTask} className="w-auto px-4 py-2 text-sm !transform-none">
                Crear Tarea
            </Button>
        </div>
        
        <div className="space-y-6">
            <Card>
                <h4 className="text-lg font-semibold mb-4">Pendientes</h4>
                {pendingTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {pendingTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggleCompletion={onToggleCompletion}
                                onEdit={onEditTask}
                                onDelete={onDeleteTask}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-neutral-500 dark:text-neutral-600 py-6">¡No hay tareas pendientes!</p>
                )}
            </Card>

            <Card>
                <h4 className="text-lg font-semibold mb-4">Completadas</h4>
                {completedTasks.length > 0 ? (
                    <ul className="space-y-3">
                        {completedTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggleCompletion={onToggleCompletion}
                                onEdit={onEditTask}
                                onDelete={onDeleteTask}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-neutral-500 dark:text-neutral-600 py-6">Aún no has completado ninguna tarea.</p>
                )}
            </Card>
        </div>
    </div>
  );
};

export default TasksList;