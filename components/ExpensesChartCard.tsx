
import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
// FIX: Add file extension to fix module resolution error.
import type { Transaction } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import { Calendar } from 'lucide-react';

interface ExpensesChartCardProps {
    transactions: Transaction[];
    onViewCalendar: () => void;
}

const COLORS = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#F59E0B', '#6366F1', '#D946EF'];

const renderLegend = (props: any) => {
    const { payload } = props;
    // Calculate total from the `value` property of each payload entry.
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
        <ul className="space-y-2 text-sm">
            {payload.map((entry: any, index: number) => {
                // Use `entry.value` for percentage calculation.
                const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                return (
                    <li key={`item-${index}`} className="flex items-center justify-between">
                        <div className="flex items-center">
                           <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                           {/* Display category name (`entry.name`) instead of the numeric value. */}
                           <span>{entry.name}</span>
                        </div>
                        <span className="font-semibold">{percentage}%</span>
                    </li>
                );
            })}
        </ul>
    );
};

const ExpensesChartCard: React.FC<ExpensesChartCardProps> = ({ transactions, onViewCalendar }) => {
    const expenseData = useMemo(() => {
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryMap = new Map<string, number>();
        
        expenseTransactions.forEach(t => {
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        });
        
        const data = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
        return data.sort((a, b) => b.value - a.value);
    }, [transactions]);

    // Calculate total expenses to be used in the tooltip for correct percentage.
    const totalExpenses = useMemo(() => {
        return expenseData.reduce((sum, entry) => sum + entry.value, 0);
    }, [expenseData]);

    // Define tooltip inside component to get access to `totalExpenses`.
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
          const { name, value } = payload[0];
          // Calculate percentage based on total expenses, not the payload which only contains the active item.
          const percentage = totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(0) : 0;
          return (
            <div className="bg-neutral-600 p-2 border border-neutral-500 rounded-md shadow-lg text-white text-sm">
              <p className="font-semibold">{`${name}: ${value.toLocaleString('es-DO')} (${percentage}%)`}</p>
            </div>
          );
        }
        return null;
    };
    
    if (expenseData.length === 0) {
        return null; // Don't render the card if there's no expense data
    }

    return (
        <Card>
            <div className="grid md:grid-cols-2 gap-6 items-center">
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={expenseData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                            >
                                {expenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-between h-full">
                    <div className="flex-1">
                       {renderLegend({ payload: expenseData.map((e, i) => ({ name: e.name, value: e.value, color: COLORS[i % COLORS.length] })) })}
                    </div>
                    <Button onClick={onViewCalendar} className="w-full !mt-4 !bg-neutral-600 hover:!bg-neutral-500 flex items-center justify-center space-x-2 !transform-none">
                        <Calendar className="w-5 h-5" />
                        <span>Ver Calendario</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default ExpensesChartCard;