import React from 'react';
import { LayoutDashboard, Plus, Landmark, ArrowRightLeft, CircleDollarSign } from 'lucide-react';
import type { View } from '../types';

interface BottomNavBarProps {
    activeView: View;
    setView: (view: View) => void;
    openAddMenu: () => void;
    openFijosMenu: () => void;
}

const NavButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    label: string;
}> = ({ onClick, isActive, children, label }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-brand-primary' : 'text-neutral-500 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white'}`}
    >
        {children}
        <span className="text-xs mt-1">{label}</span>
    </button>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setView, openAddMenu, openFijosMenu }) => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-700 z-30">
            <div className="container mx-auto h-full grid grid-cols-5 items-center justify-center">
                <NavButton
                    onClick={() => setView('dashboard')}
                    isActive={activeView === 'dashboard'}
                    label="Inicio"
                >
                    <LayoutDashboard className="w-6 h-6" />
                </NavButton>

                <NavButton
                    onClick={() => setView('calendar')}
                    isActive={activeView === 'calendar'}
                    label="Movimientos"
                >
                    <ArrowRightLeft className="w-6 h-6" />
                </NavButton>

                <div className="flex justify-center items-center">
                    <button
                        onClick={openAddMenu}
                        className="bg-brand-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform -translate-y-4 hover:scale-110 transition-transform duration-200 ease-in-out"
                        aria-label="Agregar"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                </div>
                
                 <NavButton
                    onClick={openFijosMenu}
                    isActive={activeView === 'tasks' || activeView === 'recurring'}
                    label="Fijos"
                >
                    <CircleDollarSign className="w-6 h-6" />
                </NavButton>

                <NavButton
                    onClick={() => setView('accounts')}
                    isActive={activeView === 'accounts'}
                    label="Cuentas"
                >
                    <Landmark className="w-6 h-6" />
                </NavButton>

            </div>
        </footer>
    );
};

export default BottomNavBar;