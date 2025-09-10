
import React, { useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Budget, Transaction, Currency } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import ProgressBar from './ui/ProgressBar.tsx';
import { Target, Trash2, Pencil } from 'lucide-react';

interface BudgetsListProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAddBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
}

const formatCurrency = (value: number, currency: Currency = 'DOP') => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const BudgetsList: React.FC<BudgetsListProps> = ({ budgets, transactions, onAddBudget, onEditBudget, onDeleteBudget }) => {
    
    const spentAmounts = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const spent: { [category: string]: number } = {};

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (t.type === 'expense' && transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
                spent[t.category] = (spent[t.category] || 0) + t.amount;
            }
        });

        return spent;
    }, [transactions]);

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Target className="w-6 h-6 mr-2 text-brand-secondary" />
                    <h3 className="text-xl font-semibold">Presupuestos Mensuales</h3>
                </div>
                <Button onClick={onAddBudget} className="w-auto px-4 py-2 text-sm !transform-none">
                    Crear Presupuesto
                </Button>
            </div>
            {budgets.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-neutral-700 dark:text-neutral-200">Aún no has creado ningún presupuesto.</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-600">¡Define tus límites de gasto para empezar!</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {budgets.map(budget => {
                        const spent = spentAmounts[budget.category] || 0;
                        const remaining = budget.amount - spent;
                        const progress = Math.min((spent / budget.amount) * 100, 100);

                        return (
                            <li key={budget.id} className="p-4 bg-neutral-100/50 dark:bg-neutral-800/60 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-neutral-900 dark:text-white">{budget.category}</span>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onEditBudget(budget)}
                                            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full"
                                            aria-label={`Editar presupuesto de ${budget.category}`}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                         <button
                                            onClick={() => onDeleteBudget(budget.id)}
                                            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-expense hover:bg-expense/10 rounded-full"
                                            aria-label={`Eliminar presupuesto de ${budget.category}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <ProgressBar percentage={progress} />
                                <div className="flex justify-between items-center text-sm mt-2">
                                    <span className="text-neutral-600 dark:text-neutral-200">
                                        Gastado: <span className="font-semibold">{formatCurrency(spent)}</span>
                                    </span>
                                    <span className={`font-semibold ${remaining >= 0 ? 'text-neutral-500 dark:text-neutral-400' : 'text-expense'}`}>
                                        {remaining >= 0 ? `${formatCurrency(remaining)} restante` : `${formatCurrency(Math.abs(remaining))} excedido`}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
};

export default BudgetsList;