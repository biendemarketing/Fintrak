
import React, { useState, useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Account, Transaction, Currency } from '../types.ts';
import CardDisplay from './CardDisplay.tsx';
import TransactionItem from './TransactionItem.tsx';
import { Plus, Pause, Play, Settings, ChevronLeft, ChevronRight, List, CreditCard as CreditCardIcon, Trash2, Pencil } from 'lucide-react';

interface CardsViewProps {
    cards: Account[];
    accounts: Account[]; // Needed for TransactionItem
    transactions: Transaction[];
    balances: { [key: string]: { balanceDOP: number; balanceUSD: number } };
    onEditCard: (card: Account) => void;
    onUpdateCard: (card: Partial<Account> & { id: string }) => void;
    onSelectTransaction: (transaction: Transaction) => void;
    onAddMoneyToCard: (card: Account) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const CardCarouselView: React.FC<CardsViewProps> = ({ cards, accounts, transactions, balances, onEditCard, onUpdateCard, onSelectTransaction, onAddMoneyToCard }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeCard = cards[activeIndex];

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const filteredTransactions = useMemo(() => {
        if (!activeCard) return [];
        return transactions.filter(t => t.accountId === activeCard.id || (t.type === 'transfer' && t.transferToAccountId === activeCard.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeCard, transactions]);
    
    if (!activeCard) return null;

    return (
        <div className="space-y-6">
            <div className="relative">
                <div className="overflow-hidden">
                    <div 
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                    >
                        {cards.map((card) => (
                            <div key={card.id} className="w-full flex-shrink-0 px-1">
                                <CardDisplay card={card} balance={balances[card.id]} />
                            </div>
                        ))}
                    </div>
                </div>
                 {cards.length > 1 && (
                    <>
                        <button onClick={handlePrev} className="absolute left-[-10px] top-1/2 -translate-y-1/2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full p-1 shadow-md">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                         <button onClick={handleNext} className="absolute right-[-10px] top-1/2 -translate-y-1/2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full p-1 shadow-md">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                 )}
            </div>

            <div className="flex justify-around items-center text-center">
                <ActionButton icon={Plus} label="Pagar Tarjeta" onClick={() => onAddMoneyToCard(activeCard)} />
                <ActionButton 
                    icon={activeCard.isFrozen ? Play : Pause} 
                    label={activeCard.isFrozen ? 'Descongelar' : 'Congelar'}
                    onClick={() => onUpdateCard({ id: activeCard.id, isFrozen: !activeCard.isFrozen })} 
                />
                <ActionButton icon={Settings} label="Ajustes" onClick={() => onEditCard(activeCard)} />
            </div>

            <div>
                <h4 className="text-lg font-semibold mb-2 ml-1">Movimientos Recientes</h4>
                 {filteredTransactions.length > 0 ? (
                    <ul className="space-y-3">
                        {filteredTransactions.slice(0, 5).map(transaction => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                accounts={accounts} 
                                onDelete={() => {}} // Delete action handled elsewhere
                                onSelect={onSelectTransaction}
                            />
                        ))}
                    </ul>
                 ) : (
                    <div className="text-center py-8 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg">
                        <p className="text-neutral-500 dark:text-neutral-600">No hay transacciones todavía.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

const CardListView: React.FC<Pick<CardsViewProps, 'cards' | 'balances' | 'onEditCard'>> = ({ cards, balances, onEditCard }) => (
    <ul className="space-y-4">
        {cards.map(card => {
            const balance = balances[card.id] || { balanceDOP: 0, balanceUSD: 0 };
            const primaryBalance = card.currency === 'DOP' ? balance.balanceDOP : balance.balanceUSD;
            return (
                <li key={card.id} className="flex items-center justify-between p-4 bg-neutral-100/50 dark:bg-neutral-800/60 rounded-lg">
                    <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                        <CreditCardIcon className="w-8 h-8 text-indigo-400" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-neutral-900 dark:text-white truncate">{card.name}</p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-200">{card.bank}</p>
                            {card.cardNumber && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-1 font-mono tracking-wider">**** {card.cardNumber}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="text-right">
                            <p className="font-semibold text-expense text-sm">{formatCurrency(primaryBalance, card.currency)}</p>
                        </div>
                        <button
                            onClick={() => onEditCard(card)}
                            className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors duration-200"
                            aria-label={`Editar tarjeta ${card.name}`}
                        >
                            <Pencil className="w-5 h-5" />
                        </button>
                    </div>
                </li>
            );
        })}
    </ul>
);


const CardsView: React.FC<CardsViewProps> = (props) => {
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                <div className="flex items-center p-1 bg-neutral-200 dark:bg-neutral-700 rounded-md">
                    <button onClick={() => setViewMode('card')} className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white dark:bg-neutral-800' : 'text-neutral-500 dark:text-neutral-200'}`}>
                        <CreditCardIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-neutral-800' : 'text-neutral-500 dark:text-neutral-200'}`}>
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {viewMode === 'card' ? <CardCarouselView {...props} /> : <CardListView {...props} />}
        </div>
    )
};

const ActionButton: React.FC<{icon: React.ElementType, label: string, onClick: () => void}> = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6" />
        </div>
        <span>{label}</span>
    </button>
);

export default CardsView;