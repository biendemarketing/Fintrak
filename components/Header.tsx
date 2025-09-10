import React from 'react';
// FIX: Add file extensions to fix module resolution errors.
import { Search, Bell, Menu } from 'lucide-react';
import type { UserProfile } from '../types.ts';
import Avatar from './ui/Avatar.tsx';

interface HeaderProps {
    userProfile: UserProfile | null;
    unreadNotifications: number;
    onOpenSearch: () => void;
    onOpenNotifications: () => void;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ userProfile, unreadNotifications, onOpenSearch, onOpenNotifications, onOpenSettings }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <header className="sticky top-0 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-lg p-4 z-20">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Avatar 
                        name={`${userProfile?.first_name} ${userProfile?.last_name}`}
                        src={userProfile?.avatar_url}
                        size="md"
                    />
                    <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{getGreeting()},</p>
                        <h1 className="font-bold text-lg text-neutral-900 dark:text-white">{userProfile?.first_name || 'Usuario'}</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button onClick={onOpenSearch} className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <Search className="w-6 h-6" />
                    </button>
                    <button onClick={onOpenNotifications} className="relative p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <Bell className="w-6 h-6" />
                        {unreadNotifications > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-expense text-white text-xs font-bold">
                                {unreadNotifications}
                            </span>
                        )}
                    </button>
                    <button onClick={onOpenSettings} className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
