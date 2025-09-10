
import React, { useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Budget, Transaction } from '../types.ts';
import Card from './ui/Card.tsx';
import ProgressBar from './ui/ProgressBar.tsx';
import { Target, ArrowRight } from 'lucide-react';

interface BudgetsSummaryCardProps {
    budgets: Budget[];
    transactions: Transaction[];
    onViewBudgets: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const BudgetsSummaryCard: React.FC<BudgetsSummaryCardProps> = ({ budgets, transactions, onViewBudgets }) => {

    const budgetStatus = useMemo(() => {
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

        return budgets.map(budget => {
            const spentAmount = spent[budget.category] || 0;
            const progress = (spentAmount / budget.amount) * 100;
            return {
                ...budget,
                spentAmount,
                progress,
            };
        })
        .sort((a, b) => b.progress - a.progress) // Show budgets closest to the limit first
        .slice(0, 3); // Show top 3

    }, [budgets, transactions]);
    
    if (budgetStatus.length === 0) return null;

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                    <Target className="w-6 h-6 mr-2 text-brand-secondary" />
                    Resumen de Presupuestos
                </h3>
                <button onClick={onViewBudgets} className="flex items-center text-sm font-medium text-brand-primary hover:underline">
                    Gestionar <ArrowRight className="w-4 h-4 ml-1" />
                </button>
            </div>
            <div className="space-y-4">
                {budgetStatus.map(budget => (
                    <div key={budget.id}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-semibold">{budget.category}</span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                                ${formatCurrency(budget.spentAmount)} de ${formatCurrency(budget.amount)}
                            </span>
                        </div>
                        <ProgressBar percentage={budget.progress} />
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default BudgetsSummaryCard;