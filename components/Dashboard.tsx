// FIX: This file was missing. Added full implementation for the Dashboard component.
import React from 'react';
import type { Transaction, Account, Task, Currency, Budget } from '../types';
import Card from './ui/Card';
import TransactionList from './TransactionList';
import ExpensesChartCard from './ExpensesChartCard';
import TaskItem from './TaskItem';
import BudgetsSummaryCard from './BudgetsSummaryCard';
import { ListChecks, ArrowRight } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  tasks: Task[];
  budgets: Budget[];
  accountBalances: { [key: string]: { balanceDOP: number; balanceUSD: number } };
  onDeleteTransaction: (id: string) => void;
  onSelectTransaction: (transaction: Transaction) => void;
  onViewCalendar: () => void;
  onViewTasks: () => void;
  onViewBudgets: () => void;
  onToggleTaskCompletion: (task: Task) => void;
}

const BalanceCard: React.FC<{accountBalances: DashboardProps['accountBalances']}> = ({ accountBalances }) => {
    const totalDOP = Object.values(accountBalances).reduce((sum, b) => sum + b.balanceDOP, 0);
    const totalUSD = Object.values(accountBalances).reduce((sum, b) => sum + b.balanceUSD, 0);

    const format = (value: number, currency: Currency) => new Intl.NumberFormat(currency === 'DOP' ? 'es-DO' : 'en-US', { style: 'currency', currency }).format(value);

    return (
        <Card className="bg-gradient-to-br from-brand-primary to-purple-600 text-white shadow-2xl shadow-brand-primary/30">
            <p className="text-sm font-medium text-purple-200 uppercase tracking-wider">Balance Total</p>
            <div className="mt-2">
                <p className="text-4xl font-bold tracking-tight">{format(totalDOP, 'DOP')}</p>
                {totalUSD !== 0 && (
                    <p className="text-lg font-semibold text-purple-200 mt-1">{format(totalUSD, 'USD')}</p>
                )}
            </div>
        </Card>
    );
};

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  accounts,
  tasks,
  budgets,
  accountBalances,
  onDeleteTransaction,
  onSelectTransaction,
  onViewCalendar,
  onViewTasks,
  onViewBudgets,
  onToggleTaskCompletion,
}) => {
  const recentTransactions = transactions.slice(0, 5);
  const pendingTasks = tasks.filter(t => !t.isCompleted).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);
  
  return (
    <div className="space-y-6">
      <BalanceCard accountBalances={accountBalances} />
      
      {budgets.length > 0 && (
        <BudgetsSummaryCard budgets={budgets} transactions={transactions} onViewBudgets={onViewBudgets} />
      )}
      
      <ExpensesChartCard transactions={transactions} onViewCalendar={onViewCalendar} />
      
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Movimientos Recientes</h3>
           <button onClick={onViewCalendar} className="flex items-center text-sm font-medium text-brand-primary hover:underline">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </button>
        </div>
        <TransactionList 
          transactions={recentTransactions} 
          accounts={accounts} 
          onDeleteTransaction={onDeleteTransaction} 
          onSelectTransaction={onSelectTransaction} 
        />
      </Card>
      
      {pendingTasks.length > 0 && (
          <Card>
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center"><ListChecks className="w-6 h-6 mr-2 text-brand-secondary"/> Tareas Pendientes</h3>
                  <button onClick={onViewTasks} className="flex items-center text-sm font-medium text-brand-primary hover:underline">
                      Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
              </div>
              <ul className="space-y-2">
                {pendingTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggleCompletion={onToggleTaskCompletion} 
                        onEdit={() => {}} // Not editable from dashboard
                        onDelete={() => {}} // Not deletable from dashboard
                    />
                ))}
              </ul>
          </Card>
      )}
    </div>
  );
};

export default Dashboard;