
import React, { useState, useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Transaction, Account, Currency } from '../types.ts';
import Card from './ui/Card.tsx';
import { ChevronLeft, ChevronRight, CalendarDays, List as ListIcon } from 'lucide-react';
import DayTransactionsModal from './DayTransactionsModal.tsx';
import SegmentedControl from './ui/SegmentedControl.tsx';
import TransactionList from './TransactionList.tsx';

interface MovementsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onSelectTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    return new Intl.NumberFormat(currency === 'DOP' ? 'es-DO' : 'en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const Calendar: React.FC<Omit<MovementsViewProps, 'onDeleteTransaction'>> = ({ transactions, accounts, onSelectTransaction }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const transactionsByDate = useMemo(() => {
        const map = new Map<string, Transaction[]>();
        transactions.forEach(t => {
            const dateStr = t.date;
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(t);
        });
        return map;
    }, [transactions]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: Date) => {
        setSelectedDay(day);
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`blank-${i}`} className="border border-transparent"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(year, month, i);
            const dateStr = dayDate.toISOString().split('T')[0];
            const dayTransactions = transactionsByDate.get(dateStr) || [];

            const summary = dayTransactions.reduce((acc, t) => {
                if(t.type === 'transfer') return acc;
                const key = t.currency === 'DOP' ? 'dop' : 'usd';
                if(t.type === 'income') acc[key].income += t.amount;
                if(t.type === 'expense') acc[key].expense += t.amount;
                return acc;
            }, { dop: { income: 0, expense: 0 }, usd: { income: 0, expense: 0 } });

            const hasTransactions = dayTransactions.length > 0;
            const isToday = new Date().toDateString() === dayDate.toDateString();

            days.push(
                <div 
                    key={i} 
                    className={`border border-neutral-200 dark:border-neutral-700/50 p-2 text-sm flex flex-col justify-between h-24 md:h-28 overflow-hidden transition-colors ${hasTransactions ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800' : ''}`}
                    onClick={hasTransactions ? () => handleDayClick(dayDate) : undefined}
                >
                    <span className={`font-semibold ${isToday ? 'bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{i}</span>
                    {hasTransactions && (
                        <div className="text-xs text-right">
                            {summary.dop.income > 0 && <p className="text-income truncate">+${formatCurrency(summary.dop.income, 'DOP')}</p>}
                            {summary.dop.expense > 0 && <p className="text-expense truncate">-${formatCurrency(summary.dop.expense, 'DOP')}</p>}
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };
    
    return (
        <>
             <div className="flex items-center justify-end mb-6">
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"><ChevronLeft className="w-5 h-5"/></button>
                    <span className="font-semibold w-32 text-center">{currentDate.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"><ChevronRight className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-neutral-200 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-700/50">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                    <div key={day} className="text-center font-bold py-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80">{day}</div>
                ))}
                {renderCalendar()}
            </div>
            
            {selectedDay && (
                <DayTransactionsModal
                    date={selectedDay}
                    transactions={(transactionsByDate.get(selectedDay.toISOString().split('T')[0]) || [])}
                    accounts={accounts}
                    onClose={() => setSelectedDay(null)}
                    onSelectTransaction={onSelectTransaction}
                />
            )}
        </>
    );
}


const CalendarView: React.FC<MovementsViewProps> = (props) => {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <CalendarDays className="w-6 h-6 mr-2 text-brand-secondary" />
                    <h3 className="text-xl font-semibold">Movimientos</h3>
                </div>
                <div className="w-48">
                    <SegmentedControl
                        options={[
                            {label: 'Calendario', value: 'calendar'}, 
                            {label: 'Lista', value: 'list'}
                        ]}
                        value={viewMode}
                        onChange={(value) => setViewMode(value as 'calendar' | 'list')}
                    />
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <Calendar {...props} />
            ) : (
                <TransactionList 
                    transactions={props.transactions}
                    accounts={props.accounts}
                    onDeleteTransaction={props.onDeleteTransaction}
                    onSelectTransaction={props.onSelectTransaction}
                />
            )}
        </Card>
    );
};

export default CalendarView;