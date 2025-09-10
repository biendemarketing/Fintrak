
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Transaction, Account, RecurringTransaction, Task, View, Profile, Budget, ThemeName, Currency } from './types.ts';

// Components
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import AccountsList from './components/AccountsList.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import AddMenuModal from './components/AddMenuModal.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import PinSetupModal from './components/PinSetupModal.tsx';
import SearchModal from './components/SearchModal.tsx';
import NotificationsList from './components/NotificationsList.tsx';
import CalendarView from './components/CalendarView.tsx';
import TasksList from './components/TasksList.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
import Auth from './components/Auth.tsx';
import GetStarted from './components/GetStarted.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';

// Utils
import { resizeImage } from './utils/image.ts';
import { calculateNextDueDate } from './utils/date.ts';

// Example Data for first-time users
import { exampleAccounts, exampleTransactions, exampleRecurringTransactions, exampleTasks } from './data/exampleData.ts';

// A simple in-memory cache to avoid re-calculating balances on every render
const balanceCache = new Map<string, any>();

const App: React.FC = () => {
    // Auth & Profile State
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Main Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    
    // UI & Navigation State
    const [view, setView] = useState<View>('dashboard');
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isSearchOpen, setSearchOpen] = useState(false);
    
    // State for Modals and Forms
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);

    // App Settings
    const [theme, setTheme] = useState<ThemeName>(() => (localStorage.getItem('theme') as ThemeName) || 'default');
    const [pin, setPin] = useState<string | null>(localStorage.getItem('app_pin'));
    const [isPinEnabled, setPinEnabled] = useState<boolean>(!!localStorage.getItem('app_pin'));
    const [isAppLocked, setAppLocked] = useState(!!localStorage.getItem('app_pin'));
    const [showGetStarted, setShowGetStarted] = useState(() => !localStorage.getItem('has_seen_get_started'));

    // Authentication and data fetching effects
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                // Clear all data on logout
                setTransactions([]);
                setAccounts([]);
                setRecurringTransactions([]);
                setTasks([]);
                setBudgets([]);
                setProfile(null);
                balanceCache.clear();
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const fetchData = useCallback(async (user: User) => {
        setLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileError) throw profileError;
            setProfile(profileData);

            const dataFetches = [
                supabase.from('accounts').select('*'),
                supabase.from('transactions').select('*').order('date', { ascending: false }),
                supabase.from('recurring_transactions').select('*'),
                supabase.from('tasks').select('*'),
                supabase.from('budgets').select('*'),
            ];

            const [accountsRes, transactionsRes, recurringRes, tasksRes, budgetsRes] = await Promise.all(dataFetches);

            if (accountsRes.error || transactionsRes.error || recurringRes.error || tasksRes.error || budgetsRes.error) {
                console.error("Error fetching data:", accountsRes.error || transactionsRes.error || recurringRes.error || tasksRes.error || budgetsRes.error);
                return;
            }

            setAccounts(accountsRes.data || []);
            setTransactions(transactionsRes.data || []);
            setRecurringTransactions(recurringRes.data || []);
            setTasks(tasksRes.data || []);
            setBudgets(budgetsRes.data || []);
            
            // Check if user is new (has a profile but no accounts)
            if (profileData && (accountsRes.data || []).length === 0) {
                await seedInitialData(user);
            }

        } catch (error: any) {
            console.error("Error in data fetch process:", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user) {
            fetchData(session.user);
        } else {
            setLoading(false);
        }
    }, [session, fetchData]);

    // Apply theme to HTML element
    useEffect(() => {
        document.documentElement.className = ''; // Clear existing theme classes
        const selectedTheme = COLOR_THEMES.find(t => t.name === theme);
        if (selectedTheme) {
            document.documentElement.style.setProperty('--color-brand-primary', selectedTheme.primary);
            document.documentElement.style.setProperty('--color-brand-secondary', selectedTheme.secondary);
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const seedInitialData = async (user: User) => {
        // ... (implementation for seeding data)
    };

    const handleNavigateToAuth = (initialView: 'signIn' | 'signUp') => {
        setShowGetStarted(false);
        setView('auth');
        localStorage.setItem('has_seen_get_started', 'true');
    };

    // CRUD Handlers will go here (omitted for brevity but would include all Supabase interactions)

    // Calculate account balances with memoization
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
        const transactionsKey = transactions.map(t => t.id + t.amount).join(',');
        
        if (balanceCache.has(transactionsKey)) {
            return balanceCache.get(transactionsKey);
        }

        accounts.forEach(acc => {
            balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
        });

        [...transactions].reverse().forEach(t => {
            if (t.type === 'income') {
                if(balances[t.accountId]) balances[t.accountId][t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD'] += t.amount;
            } else if (t.type === 'expense') {
                if(balances[t.accountId]) balances[t.accountId][t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD'] -= t.amount;
            } else if (t.type === 'transfer' && t.transferToAccountId) {
                if(balances[t.accountId]) balances[t.accountId][t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD'] -= t.amount;
                if(balances[t.transferToAccountId]) balances[t.transferToAccountId][t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD'] += t.amount;
            }
        });
        
        balanceCache.set(transactionsKey, balances);
        return balances;
    }, [accounts, transactions]);
    
    // Render logic
    if (loading) {
        return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;
    }
    
    if (showGetStarted) {
        return <GetStarted onNavigateToAuth={handleNavigateToAuth} />;
    }

    if (!session) {
        return <Auth />;
    }
    
    if (isPinEnabled && isAppLocked) {
        return <PinLockScreen correctPin={pin!} onUnlock={() => setAppLocked(false)} />;
    }

    const renderView = () => {
        switch(view) {
            case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={()=>{}} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={()=>{}} />;
            case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={()=>{}} />;
            case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => setActiveModal('addAccount')} onDeleteAccount={()=>{}} onEditAccount={acc => { setAccountToEdit(acc); setActiveModal('addAccount');}} onUpdateAccount={()=>{}} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={card => { setTransferPrefill({ toAccountId: card.id }); setActiveModal('addTransfer'); }}/>;
            case 'tasks': return <TasksList tasks={tasks} onToggleCompletion={()=>{}} onDeleteTask={()=>{}} onEditTask={task => { setTaskToEdit(task); setActiveModal('addTask'); }} onAddTask={() => setActiveModal('addTask')} />;
            case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={()=>{}} onEdit={rt => { setRecurringToEdit(rt); setActiveModal('addRecurring'); }} onAdd={() => setActiveModal('addRecurring')} />;
            case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => setActiveModal('addBudget')} onEditBudget={b => { setBudgetToEdit(b); setActiveModal('addBudget'); }} onDeleteBudget={()=>{}} />;
            case 'notifications': return <NotificationsList />;
            case 'settings': return <SettingsPanel profile={profile} onLogout={() => supabase.auth.signOut()} theme={theme} setTheme={setTheme} isPinEnabled={isPinEnabled} onTogglePin={setPinEnabled} onSetupPin={() => setActiveModal('setupPin')} onDeleteData={()=>{}} />;
            default: return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={()=>{}} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={()=>{}} />;
        }
    };
    
    const closeModal = () => {
        setActiveModal(null);
        setTransactionToEdit(null);
        setAccountToEdit(null);
        setRecurringToEdit(null);
        setTaskToEdit(null);
        setBudgetToEdit(null);
        setTransferPrefill(null);
    };

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen font-sans pb-20">
            <Header onOpenSettings={() => setView('settings')} onOpenSearch={() => setSearchOpen(true)} setView={setView} />
            <main className="container mx-auto px-4 md:px-8 py-6">
                {renderView()}
            </main>
            <BottomNavBar activeView={view} setView={setView} openAddMenu={() => setActiveModal('addMenu')} openFijosMenu={() => setActiveModal('fijosMenu')} />

            {/* Modals */}
            {activeModal === 'addMenu' && <AddMenuModal onClose={closeModal} onSelect={type => { setActiveModal(`add${type.charAt(0).toUpperCase() + type.slice(1)}`); }} />}
            {activeModal === 'fijosMenu' && <FijosMenuModal onClose={closeModal} setView={setView} />}
            
            {activeModal === 'addTransaction' && <div className="fixed inset-0 bg-black/50 z-40 p-4 overflow-y-auto"><div className="mx-auto max-w-lg mt-10"><AddTransactionForm onAddTransaction={()=>{}} onUpdateTransaction={()=>{}} transactionToEdit={transactionToEdit} accounts={accounts} /></div></div>}
            {activeModal === 'addAccount' && <div className="fixed inset-0 bg-black/50 z-40 p-4 overflow-y-auto"><div className="mx-auto max-w-lg mt-10"><AddAccountForm onAddAccount={()=>{}} onUpdateAccount={()=>{}} accountToEdit={accountToEdit} /></div></div>}
            {activeModal === 'addTransfer' && <div className="fixed inset-0 bg-black/50 z-40 p-4 overflow-y-auto"><div className="mx-auto max-w-lg mt-10"><AddTransferForm onAddTransfer={()=>{}} accounts={accounts} prefillData={transferPrefill} /></div></div>}
            {activeModal === 'addRecurring' && <div className="fixed inset-0 bg-black/50 z-40 p-4 overflow-y-auto"><div className="mx-auto max-w-lg mt-10"><AddRecurringTransactionForm onAddRecurring={()=>{}} onUpdateRecurring={()=>{}} recurringTransactionToEdit={recurringToEdit} accounts={accounts} /></div></div>}
            {activeModal === 'addTask' && <div className="fixed inset-0 bg-black/50 z-40 p-4 overflow-y-auto"><div className="mx-auto max-w-lg mt-10"><AddTaskForm onAddTask={()=>{}} onUpdateTask={()=>{}} taskToEdit={taskToEdit} accounts={accounts} /></div></div>}
            {activeModal === 'addBudget' && <div className="fixed inset-0 bg-black/50 z-40 p-4 overflow-y-auto"><div className="mx-auto max-w-lg mt-10"><AddBudgetForm onAddBudget={()=>{}} onUpdateBudget={()=>{}} budgetToEdit={budgetToEdit} existingBudgets={budgets} /></div></div>}
            
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={()=>{}} />}
            {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={t => { setSelectedTransaction(t); setSearchOpen(false); }} />}
            {activeModal === 'setupPin' && <PinSetupModal onClose={closeModal} onSetPin={pin => { setPin(pin); setPinEnabled(true); localStorage.setItem('app_pin', pin); closeModal(); }} />}
        </div>
    );
};

// Define COLOR_THEMES inside App.tsx or import it if it's in constants.
const COLOR_THEMES: { name: ThemeName; label: string; primary: string; secondary: string }[] = [
    { name: 'default', label: 'Predeterminado', primary: '79 70 229', secondary: '236 72 153' },
    { name: 'forest', label: 'Bosque', primary: '22 163 74', secondary: '249 115 22' },
    { name: 'sunset', label: 'Atardecer', primary: '147 51 234', secondary: '245 158 11' },
    { name: 'ocean', label: 'Océano', primary: '59 130 246', secondary: '20 184 166' },
];

export default App;
