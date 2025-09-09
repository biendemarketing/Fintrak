import React from 'react';
import type { Transaction, Account } from '../types';
import TransactionItem from './TransactionItem';
import { List } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  onDeleteTransaction: (id: string) => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, accounts, onDeleteTransaction, onSelectTransaction }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-700 dark:text-neutral-200">Aún no tienes movimientos.</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-600">Agrega uno para comenzar.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {transactions.map(transaction => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          accounts={accounts}
          onDelete={onDeleteTransaction}
          onSelect={onSelectTransaction}
        />
      ))}
    </ul>
  );
};

export default TransactionList;