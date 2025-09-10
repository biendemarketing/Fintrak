
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Transaction, Account } from '../types.ts';
import Card from './ui/Card.tsx';
import TransactionItem from './TransactionItem.tsx';
import { X } from 'lucide-react';

interface DayTransactionsModalProps {
  date: Date;
  transactions: Transaction[];
  accounts: Account[];
  onClose: () => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

const DayTransactionsModal: React.FC<DayTransactionsModalProps> = ({ date, transactions, accounts, onClose, onSelectTransaction }) => {
  const formattedDate = date.toLocaleDateString('es-DO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-transactions-title"
    >
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 id="day-transactions-title" className="text-lg font-bold capitalize">{formattedDate}</h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {transactions.length > 0 ? (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {transactions
              .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
              .map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                accounts={accounts}
                onDelete={() => {}} // Deletion is handled in the main detail modal
                onSelect={(t) => {
                  onSelectTransaction(t);
                  onClose();
                }}
              />
            ))}
          </ul>
        ) : (
          <p className="text-center text-neutral-500 py-8">No hay movimientos para este día.</p>
        )}
      </Card>
    </div>
  );
};

export default DayTransactionsModal;