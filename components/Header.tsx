
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { UserProfile } from '../types.ts';
import { Search, Bell } from 'lucide-react';
// FIX: Add file extension to fix module resolution error.
import Avatar from './ui/Avatar.tsx';

interface HeaderProps {
  userProfile: UserProfile | null;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({ userProfile, onOpenSettings, onOpenSearch, onOpenNotifications, notificationCount = 0 }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };
  
  const userName = userProfile?.first_name || 'Usuario';

  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        <div onClick={onOpenSettings} className="cursor-pointer">
           <Avatar name={`${userProfile?.first_name} ${userProfile?.last_name}`} src={userProfile?.avatar_url} size="md" />
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{userName}</h1>
        </div>
      </div>
      <div className="flex items-center space-x-2">
         <button onClick={onOpenSearch} className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Search className="w-6 h-6 text-neutral-700 dark:text-neutral-200" />
         </button>
         <button onClick={onOpenNotifications} className="relative p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Bell className="w-6 h-6 text-neutral-700 dark:text-neutral-200" />
            {notificationCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-secondary text-white text-xs items-center justify-center">{notificationCount}</span>
                </span>
            )}
         </button>
      </div>
    </header>
  );
};

export default Header;
