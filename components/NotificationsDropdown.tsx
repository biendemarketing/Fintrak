
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Notification } from '../types.ts';
// FIX: Add file extension to fix module resolution error.
import NotificationsList from './NotificationsList.tsx';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute top-16 right-4 w-full max-w-sm bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 z-40"
        role="dialog"
      >
        <NotificationsList
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
        />
      </div>
    </>
  );
};

export default NotificationsDropdown;
