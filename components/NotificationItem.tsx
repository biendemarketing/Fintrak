import React from 'react';
// FIX: Add file extensions to fix module resolution errors.
import type { Notification } from '../types.ts';
import { Info, AlertTriangle, Bell } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'reminder':
      return <Bell className="w-5 h-5 text-blue-400" />;
    default:
      return <Info className="w-5 h-5 text-brand-primary" />;
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const { id, title, message, is_read, type, created_at } = notification;

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return Math.floor(seconds) + " segundos";
  };

  return (
    <li
      className={`flex items-start p-3 space-x-3 border-b border-neutral-200 dark:border-neutral-700/50 last:border-b-0 ${is_read ? '' : 'bg-brand-primary/10'}`}
    >
      <div className="flex-shrink-0 mt-1">
        <NotificationIcon type={type} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-neutral-900 dark:text-white">{title}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{message}</p>
        <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(created_at)}</span>
            {!is_read && (
                <button
                    onClick={() => onMarkAsRead(id)}
                    className="text-xs font-semibold text-brand-primary hover:underline"
                >
                    Marcar como leída
                </button>
            )}
        </div>
      </div>
    </li>
  );
};

export default NotificationItem;
