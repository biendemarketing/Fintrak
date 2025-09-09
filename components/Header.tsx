import React, { useState, useRef, useEffect } from 'react';
import { Menu, Wallet, Search, Bell } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import type { View } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenSearch, setView }) => {
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NavIconButton: React.FC<{onClick: () => void; label: string; children: React.ReactNode}> = ({ onClick, label, children }) => (
    <button
      onClick={onClick}
      className="p-2 text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <header className="bg-neutral-100/80 dark:bg-neutral-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-700/50">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wallet className="w-7 h-7 text-brand-primary" />
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            FinTrack
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <NavIconButton onClick={onOpenSearch} label="Buscar transacciones">
            <Search className="w-6 h-6" />
          </NavIconButton>
          
          <div className="relative" ref={notificationsRef}>
            <NavIconButton onClick={() => setNotificationsOpen(prev => !prev)} label="Ver notificaciones">
              <Bell className="w-6 h-6" />
            </NavIconButton>
            <NotificationsDropdown isOpen={isNotificationsOpen} setView={setView} />
          </div>

          <NavIconButton onClick={onOpenSettings} label="Abrir ajustes">
            <Menu className="w-6 h-6" />
          </NavIconButton>
        </div>
      </div>
    </header>
  );
};

export default Header;