import React from 'react';
import { Landmark } from 'lucide-react';
import type { Transaction, Currency, Account, User, View, Task } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import TransactionItem from './TransactionItem';
import ExpensesChartCard from './ExpensesChartCard';
import TaskItem from './TaskItem';

interface DashboardProps {
  user: User;
  accounts: Account[];
  accountBalances: { [key: string]: { balanceDOP: number; balanceUSD: number } };
  transactions: Transaction[];
  tasks: Task[];
  setView: (view: View) => void;
  onToggleTaskCompletion: (task: Task) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const Dashboard: React.FC<DashboardProps> = ({ user, accounts, accountBalances, transactions, tasks, setView, onToggleTaskCompletion }) => {
    
    const { netWorthDOP, netWorthUSD } = React.useMemo(() => {
        let totalAccountBalanceDOP = 0;
        let totalAccountBalanceUSD = 0;
        let totalCardBalanceDOP = 0;
        let totalCardBalanceUSD = 0;

        accounts.forEach(acc => {
            const balances = accountBalances[acc.id] || { balanceDOP: 0, balanceUSD: 0 };
            if (acc.type === 'Tarjeta de Crédito') {
                totalCardBalanceDOP += balances.balanceDOP;
                totalCardBalanceUSD += balances.balanceUSD;
            } else {
                totalAccountBalanceDOP += balances.balanceDOP;
                totalAccountBalanceUSD += balances.balanceUSD;
            }
        });
        
        return {
            netWorthDOP: totalAccountBalanceDOP - totalCardBalanceDOP,
            netWorthUSD: totalAccountBalanceUSD - totalCardBalanceUSD,
        };
    }, [accounts, accountBalances]);

    const recentMovements = React.useMemo(() => {
        return [...transactions]
            .sort((a, b) => {
                const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateComparison !== 0) return dateComparison;
                return (b.time || '').localeCompare(a.time || '');
            })
            .slice(0, 3);
    }, [transactions]);

    const upcomingTasks = React.useMemo(() => {
        return tasks
            .filter(t => !t.isCompleted)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 3);
    }, [tasks]);
    
  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold ml-2">Hola, {user.name.split(' ')[0]} 👋</h2>
        
        <Card className="bg-gradient-to-br from-brand-primary to-brand-secondary">
             <div className="flex items-center justify-between">
                <p className="text-lg font-medium text-white">Patrimonio Total</p>
                <Landmark className="w-6 h-6 text-white"/>
            </div>
            <div className="mt-2 flex items-baseline space-x-6">
                <p className="text-3xl font-bold text-white">{formatCurrency(netWorthDOP, 'DOP')}</p>
                <p className="text-2xl font-bold text-white/80">{formatCurrency(netWorthUSD, 'USD')}</p>
            </div>
        </Card>

        <ExpensesChartCard 
            transactions={transactions} 
            onViewCalendar={() => setView('calendar')}
        />
        
        <Card>
            <h3 className="text-xl font-semibold mb-4">Últimos Movimientos</h3>
            {recentMovements.length > 0 ? (
              <>
                <ul className="space-y-3">
                    {recentMovements.map(t => (
                        <TransactionItem
                            key={t.id}
                            transaction={t}
                            accounts={accounts}
                            onDelete={() => {}} // No delete from dashboard
                            onSelect={() => {}} // No select from dashboard
                            isMinimal
                        />
                    ))}
                </ul>
                <Button onClick={() => setView('calendar')} className="w-full !mt-6 !bg-neutral-600 hover:!bg-neutral-500 !transform-none">
                    Ver todos los movimientos
                </Button>
              </>
            ) : (
                <p className="text-center text-neutral-500 dark:text-neutral-600 py-6">No hay movimientos recientes.</p>
            )}
        </Card>

        <Card>
            <h3 className="text-xl font-semibold mb-4">Tareas y Recordatorios</h3>
            {upcomingTasks.length > 0 ? (
              <>
                <ul className="space-y-3">
                    {upcomingTasks.map(t => (
                        <TaskItem
                            key={t.id}
                            task={t}
                            onToggleCompletion={onToggleTaskCompletion}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            isMinimal
                        />
                    ))}
                </ul>
                <Button onClick={() => setView('tasks')} className="w-full !mt-6 !bg-neutral-600 hover:!bg-neutral-500 !transform-none">
                    Ver todas las tareas
                </Button>
              </>
            ) : (
                <p className="text-center text-neutral-500 dark:text-neutral-600 py-6">¡Estás al día con tus tareas!</p>
            )}
        </Card>
    </div>
  );
};

export default Dashboard;