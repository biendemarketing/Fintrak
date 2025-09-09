import React from 'react';
import type { Account, Currency } from '../types';
import CardBrandLogo from './CardBrandLogo';
import { EyeOff } from 'lucide-react';

interface CardDisplayProps {
    card: Account;
    balance?: { balanceDOP: number; balanceUSD: number };
}

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const maskAccountNumber = (number?: string) => {
    if (!number || number.length < 4) return `** ${number}`;
    return `** ${number.slice(-4)}`;
};

// Simple hash function to generate a number from a string
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const gradients = [
    'from-purple-500 to-indigo-600',
    'from-pink-500 to-rose-500',
    'from-sky-400 to-cyan-400',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-violet-500 to-fuchsia-500',
];

const CardDisplay: React.FC<CardDisplayProps> = ({ card, balance }) => {
    const gradientIndex = simpleHash(card.id) % gradients.length;
    const gradient = gradients[gradientIndex];
    const cardBalance = balance || { balanceDOP: 0, balanceUSD: 0 };
    const primaryBalance = card.currency === 'DOP' ? cardBalance.balanceDOP : cardBalance.balanceUSD;

    return (
        <div className={`relative w-full aspect-[1.586] rounded-xl shadow-lg p-6 text-white flex flex-col justify-between overflow-hidden bg-gradient-to-br ${gradient}`}>
            {/* Glossy effect */}
            <div className="absolute top-0 left-0 w-1/2 h-full bg-white/10 skew-x-[-20deg] -translate-x-1/2"></div>

            <div className="relative z-10">
                <p className="text-sm font-medium uppercase tracking-wider">{card.name}</p>
                <div className="mt-2">
                    <p className="text-3xl font-bold tracking-tight">{formatCurrency(primaryBalance, card.currency)}</p>
                </div>
            </div>

            <div className="relative z-10 flex items-end justify-between">
                <div className="flex items-center space-x-2 font-mono text-sm tracking-wider">
                     <EyeOff className="w-4 h-4 opacity-70" />
                     <span>{maskAccountNumber(card.cardNumber)}</span>
                </div>
                {card.cardBrand && <CardBrandLogo brand={card.cardBrand} />}
            </div>

            {card.isFrozen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center">
                        <p className="text-xl font-bold">CONGELADA</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardDisplay;