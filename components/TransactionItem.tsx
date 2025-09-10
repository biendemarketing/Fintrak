
import React from 'react';
import { Trash2, Paperclip, ArrowRightLeft } from 'lucide-react';
// FIX: Add file extension to fix module resolution error.
import type { Transaction, Currency, Account } from '../types.ts';

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
  onDelete: (id: string) => void;
  onSelect: (transaction: Transaction) => void;
  isMinimal?: boolean;
}

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};


const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, accounts, onDelete, onSelect, isMinimal = false }) => {
  const { id, description, amount, type, category, currency, receiptImage, accountId, transferToAccountId, time } = transaction;
  const isIncome = type === 'income';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelect from firing when deleting
    if (!isMinimal) onDelete(id);
  }

  const handleSelect = () => {
    if (!isMinimal) onSelect(transaction);
  }

  const sourceAccount = accounts.find(a => a.id === accountId);

  if (type === 'transfer') {
    const fromAccount = accounts.find(a => a.id === accountId);
    const toAccount = accounts.find(a => a.id === transferToAccountId);
    return (
        <li
            className={`flex items-center justify-between p-3 bg-neutral-100/50 dark:bg-neutral-800/60 rounded-lg ${!isMinimal && 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700/80 transition-colors duration-200 cursor-pointer'}`}
            onClick={handleSelect}
            role={isMinimal ? undefined : 'button'}
            tabIndex={isMinimal ? undefined : 0}
            aria-label={`Ver detalles de transferencia`}
        >
            <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20">
                   <ArrowRightLeft className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">Transferencia</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-200">De: {fromAccount?.name || 'N/A'} a {toAccount?.name || 'N/A'}</p>
                   {time && <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-1">{formatTime(time)}</p>}
                </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <span className={`font-bold text-right text-neutral-700 dark:text-neutral-200`}>
                    {formatCurrency(amount, currency)}
                </span>
                {!isMinimal && (
                    <button
                        onClick={handleDelete}
                        className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-expense hover:bg-expense/10 rounded-full transition-colors duration-200"
                        aria-label="Eliminar transferencia"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </li>
    );
  }

  return (
    <li 
        className={`flex items-center justify-between p-3 bg-neutral-100/50 dark:bg-neutral-800/60 rounded-lg ${!isMinimal && 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700/80 transition-colors duration-200 cursor-pointer'}`}
        onClick={handleSelect}
        role={isMinimal ? undefined : 'button'}
        tabIndex={isMinimal ? undefined : 0}
        aria-label={`Ver detalles de ${description}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-2 h-12 rounded-full ${isIncome ? 'bg-income' : 'bg-expense'}`}></div>
        <div className="flex-1">
          <p className="font-semibold text-neutral-900 dark:text-white">{description}</p>
          <div className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-200">
            <span>{category}</span>
            {time && <span className="text-xs text-neutral-500 dark:text-neutral-600">&bull; {formatTime(time)}</span>}
          </div>
           {sourceAccount && <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-1">{sourceAccount.name}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        {receiptImage && <Paperclip className="w-4 h-4 text-neutral-500 dark:text-neutral-600" />}
        <span className={`font-bold text-right ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '-'} {formatCurrency(amount, currency)}
        </span>
        {!isMinimal && (
            <button
              onClick={handleDelete}
              className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-expense hover:bg-expense/10 rounded-full transition-colors duration-200"
              aria-label="Eliminar transacción"
            >
              <Trash2 className="w-5 h-5" />
            </button>
        )}
      </div>
    </li>
  );
};

export default TransactionItem;