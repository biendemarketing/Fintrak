
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Notification } from '../types.ts';
import { Bell, AlertTriangle, Info } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'reminder':
      return <Bell className="w-5 h-5 text-brand-primary" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const { id, type, title, message, created_at, is_read } = notification;

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return 'justo ahora';
  };

  return (
    <li className={`flex items-start p-3 rounded-lg transition-colors ${is_read ? '' : 'bg-brand-primary/10'}`}>
      <div className="flex-shrink-0 mt-1">
        <NotificationIcon type={type} />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{message}</p>
        <p className="text-xs text-neutral-500 mt-1">{timeAgo(created_at)}</p>
      </div>
      {!is_read && (
        <button
          onClick={() => onMarkAsRead(id)}
          className="ml-3 flex-shrink-0 text-xs font-semibold text-brand-primary hover:underline"
          title="Marcar como leída"
        >
          Leída
        </button>
      )}
    </li>
  );
};

export default NotificationItem;
