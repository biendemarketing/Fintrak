import React from 'react';
// FIX: Add file extensions to fix module resolution errors.
import type { Notification } from '../types.ts';
import NotificationItem from './NotificationItem.tsx';
import { BellOff, CheckCheck } from 'lucide-react';

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
        <header className="flex-shrink-0 p-3 border-b border-neutral-200 dark:border-neutral-700/50 flex items-center justify-between">
            <h3 className="font-semibold">Notificaciones</h3>
            {hasUnread && (
                <button 
                    onClick={onMarkAllAsRead} 
                    className="text-xs font-semibold text-brand-primary hover:underline flex items-center space-x-1"
                >
                    <CheckCheck className="w-4 h-4" />
                    <span>Marcar todas como leídas</span>
                </button>
            )}
        </header>
        
        {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <BellOff className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mb-4" />
                <p className="font-semibold text-neutral-700 dark:text-neutral-200">Todo está tranquilo</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No tienes notificaciones nuevas.</p>
            </div>
        ) : (
            <ul className="flex-1 overflow-y-auto">
                {notifications.map(notification => (
                    <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onMarkAsRead={onMarkAsRead}
                    />
                ))}
            </ul>
        )}
    </div>
  );
};

export default NotificationsList;
