
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Notification } from '../types.ts';
// FIX: Add file extension to fix module resolution error.
import NotificationItem from './NotificationItem.tsx';

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-neutral-600 dark:text-neutral-400">No tienes notificaciones.</p>
        <p className="text-sm text-neutral-500">Todo está al día.</p>
      </div>
    );
  }
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="flex justify-between items-center p-3 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold">Notificaciones</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllAsRead} className="text-sm font-medium text-brand-primary hover:underline">
            Marcar todas como leídas
          </button>
        )}
      </div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700 max-h-80 overflow-y-auto">
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} />
        ))}
      </ul>
    </div>
  );
};

export default NotificationsList;
