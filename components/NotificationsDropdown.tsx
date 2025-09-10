
import React from 'react';
import { Bell, CreditCard, Landmark, GraduationCap } from 'lucide-react';
// FIX: Add file extension to fix module resolution error.
import type { View } from '../types.ts';

interface NotificationsDropdownProps {
  isOpen: boolean;
  setView: (view: View) => void;
}

const NotificationItem: React.FC<{icon: React.ElementType, title: string, time: string}> = ({icon: Icon, title, time}) => (
    <li className="flex items-start p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-md transition-colors">
        <div className="flex-shrink-0 mt-1">
            <Icon className="w-5 h-5 text-brand-primary" />
        </div>
        <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{title}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{time}</p>
        </div>
    </li>
);

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, setView }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-2xl z-50 overflow-hidden">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-lg flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notificaciones
        </h3>
      </div>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-700/50 max-h-96 overflow-y-auto">
        <NotificationItem 
            icon={Landmark}
            title="Se acerca el pago de tu préstamo del Popular."
            time="hace 2 horas"
        />
        <NotificationItem 
            icon={CreditCard}
            title="Tu suscripción de Netflix se renovará pronto."
            time="ayer"
        />
         <NotificationItem 
            icon={GraduationCap}
            title="Recordatorio: Pago del colegio vence en 3 días."
            time="hace 2 días"
        />
        <NotificationItem 
            icon={CreditCard}
            title="Se ha procesado tu pago a la tarjeta Gold BHD."
            time="hace 3 días"
        />
      </ul>
      <div className="p-2 bg-neutral-50 dark:bg-neutral-800/50 text-center border-t border-neutral-200 dark:border-neutral-700">
        <button onClick={() => setView('notifications')} className="text-sm font-medium text-brand-primary hover:underline">
            Ver todas
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;