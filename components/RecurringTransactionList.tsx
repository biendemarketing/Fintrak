
import React from 'react';
// FIX: Add file extension to fix module resolution error.
import type { RecurringTransaction, Account, Currency } from '../types.ts';
import Card from './ui/Card.tsx';
import { Repeat, Trash2, ArrowUpCircle, ArrowDownCircle, Pencil } from 'lucide-react';
import { calculateNextDueDate } from '../utils/date.ts';
import Button from './ui/Button.tsx';

interface RecurringTransactionListProps {
  recurringTransactions: RecurringTransaction[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (recTransaction: RecurringTransaction) => void;
  onAdd: () => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const RecurringTransactionList: React.FC<RecurringTransactionListProps> = ({ recurringTransactions, accounts, onDelete, onEdit, onAdd }) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Repeat className="w-6 h-6 mr-2 text-brand-secondary" />
          <h3 className="text-xl font-semibold">Ingresos y Gastos Fijos</h3>
        </div>
        <Button onClick={onAdd} className="w-auto px-4 py-2 text-sm !transform-none">
            Agregar Nuevo
        </Button>
      </div>
      {recurringTransactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-neutral-700 dark:text-neutral-200">No tienes movimientos fijos configurados.</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-600">Agrega uno para automatizar tus finanzas.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recurringTransactions.map(rt => {
            const account = accounts.find(a => a.id === rt.accountId);
            const isIncome = rt.type === 'income';
            const nextDueDate = calculateNextDueDate(rt.startDate, rt.frequency);
            
            return (
              <li key={rt.id} className="flex items-center justify-between p-3 bg-neutral-100/50 dark:bg-neutral-800/60 rounded-lg">
                <div className="flex items-center space-x-4">
                  {isIncome 
                    ? <ArrowUpCircle className="w-6 h-6 text-income flex-shrink-0" /> 
                    : <ArrowDownCircle className="w-6 h-6 text-expense flex-shrink-0" />
                  }
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{rt.description}</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-200">{rt.category}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-1">{account?.name || 'Cuenta no encontrada'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                    <div className="text-right">
                        <p className={`font-bold ${isIncome ? 'text-income' : 'text-expense'}`}>
                            {formatCurrency(rt.amount, rt.currency)}
                        </p>
                        <p className="text-xs text-neutral-700 dark:text-neutral-200">{rt.frequency}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-600">Prox: {new Date(nextDueDate  + 'T00:00:00').toLocaleDateString('es-DO')}</p>
                    </div>
                  <button
                    onClick={() => onEdit(rt)}
                    className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors duration-200"
                    aria-label={`Editar ${rt.description}`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(rt.id)}
                    className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-expense hover:bg-expense/10 rounded-full transition-colors duration-200"
                    aria-label={`Eliminar ${rt.description}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  );
};

export default RecurringTransactionList;