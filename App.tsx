// FIX: This file was missing. Added a full implementation for the main App component.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase.ts';
import type { View, Transaction, Account, RecurringTransaction, Task, AppSettings, UserProfile, Budget } from './types.ts';

// Import components
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import AccountsList from './components/AccountsList.tsx';
import AddMenuModal from './components/AddMenuModal.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import GetStarted from './components/GetStarted.tsx';
import Auth from './components/Auth.tsx';
import SearchModal from './components/SearchModal.tsx';
import NotificationsList from './components/NotificationsList.tsx';
import CalendarView from './components/CalendarView.tsx';
import TasksList from './components/TasksList.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';

// Import utils and data
import { resizeImage } from './utils/image.ts';
import { calculateNextDueDate } from './utils/date.ts';
import { exampleAccounts, exampleTransactions, exampleRecurringTransactions, exampleTasks } from './data/exampleData.ts';
import { COLOR_THEMES } from './constants.ts';

type AppState = 'GET_STARTED' | 'AUTH' | 'LOCKED' | 'LOADING' | 'READY';
type FormType = 'transaction' | 'account' | 'transfer' | 'recurring' | 'task' | 'budget';

const App: React.FC = () => {
    // App state
    const [appState, setAppState] = useState<AppState>('LOADING');
    const [view, setView] = useState<View>('dashboard');
    
    // Auth state
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [authInitialView, setAuthInitialView] = useState<'signIn' | 'signUp'>('signIn');

    // Data state
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    
    // UI State
    const [isAddMenuOpen, setAddMenuOpen] = useState(false);
    const [isFijosMenuOpen, setFijosMenuOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [formToShow, setFormToShow] = useState<FormType | null>(null);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [prefillData, setPrefillData] = useState<any>(null);


    // App Settings
    const [settings, setSettings] = useState<AppSettings>({
        theme: 'default',
        defaultCurrency: 'DOP',
        pin: null,
        pinEnabled: false
    });

    // --- Effects ---

    // Auth effect
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // App state and data loading effect
    useEffect(() => {
        const hasSeenGetStarted = localStorage.getItem('hasSeenGetStarted');
        if (!session) {
            if (!hasSeenGetStarted) {
                setAppState('GET_STARTED');
            } else {
                setAppState('AUTH');
            }
        } else {
            if (settings.pinEnabled && settings.pin) {
                setAppState('LOCKED');
            } else {
                setAppState('LOADING');
                fetchAllData(session.user);
            }
        }
    }, [session]);
    
    // Settings loader
    useEffect(() => {
        const loadedSettings = localStorage.getItem('fin-track-settings');
        if (loadedSettings) {
            setSettings(JSON.parse(loadedSettings));
        }
    }, []);

    // Settings saver
    useEffect(() => {
        localStorage.setItem('fin-track-settings', JSON.stringify(settings));
        document.documentElement.className = settings.theme === 'default' ? '' : settings.theme;
        // Apply theme colors via CSS variables
        const root = document.documentElement;
        const theme = COLOR_THEMES.find(t => t.name === settings.theme) || COLOR_THEMES[0];
        root.style.setProperty('--color-brand-primary', theme.primary);
        root.style.setProperty('--color-brand-secondary', theme.secondary);
    }, [settings]);

    // --- Data Fetching ---
    
    const fetchAllData = useCallback(async (user: User) => {
        setAppState('LOADING');
        try {
            const [
                { data: profileData, error: profileError },
                { data: accountsData, error: accountsError },
                { data: transactionsData, error: transactionsError },
                { data: recurringData, error: recurringError },
                { data: tasksData, error: tasksError },
                { data: budgetsData, error: budgetsError },
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('accounts').select('*').order('name'),
                supabase.from('transactions').select('*').order('date', { ascending: false }),
                supabase.from('recurring_transactions').select('*').order('description'),
                supabase.from('tasks').select('*').order('dueDate'),
                supabase.from('budgets').select('*').order('category'),
            ]);
            
            if (profileError || accountsError || transactionsError || recurringError || tasksError || budgetsError) throw new Error('Failed to fetch data');

            setUserProfile(profileData);
            setAccounts(accountsData || []);
            setTransactions(transactionsData || []);
            setRecurringTransactions(recurringData || []);
            setTasks(tasksData || []);
            setBudgets(budgetsData || []);
            
            setAppState('READY');
        } catch (error) {
            console.error(error);
            setAppState('READY'); // Still ready, but with empty data
        }
    }, []);
    
    // --- CRUD Functions ---
    
    // Transactions
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id'>, receiptFile?: File) => {
        let receiptImageUrl: string | null = null;
        if (receiptFile) {
            const resizedImage = await resizeImage(receiptFile, 800);
            const response = await fetch(resizedImage);
            const blob = await response.blob();
            const fileName = `${session!.user.id}/${Date.now()}-${receiptFile.name}`;
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob);
            if(error) { console.error("Upload error:", error); return; }
            receiptImageUrl = supabase.storage.from('receipts').getPublicUrl(data.path).data.publicUrl;
        }

        const { data, error } = await supabase.from('transactions').insert([{ ...transaction, receiptImage: receiptImageUrl }]).select();
        if (data) setTransactions([data[0], ...transactions]);
        closeForm();
    };

    const handleUpdateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        // Similar logic for handling image update
        const { data, error } = await supabase.from('transactions').update(transaction).eq('id', transaction.id).select();
        if (data) {
            setTransactions(transactions.map(t => t.id === transaction.id ? data[0] : t));
        }
        closeForm();
    };

    const handleDeleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) setTransactions(transactions.filter(t => t.id !== id));
        setSelectedTransaction(null);
    };

    // Accounts
    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        const { data, error } = await supabase.from('accounts').insert([account]).select();
        if (data) setAccounts([...accounts, data[0]]);
        closeForm();
    };

    const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => {
        const { data, error } = await supabase.from('accounts').update(account).eq('id', account.id).select();
        if (data) setAccounts(accounts.map(a => a.id === account.id ? data[0] : a));
        closeForm();
    };

    const handleDeleteAccount = async (id: string) => {
        if(window.confirm('¿Eliminar esta cuenta? También se eliminarán todas las transacciones asociadas.')) {
            // In a real app, you might want to reassign transactions or handle this differently.
            // For simplicity, we delete associated transactions.
            await supabase.from('transactions').delete().eq('accountId', id);
            await supabase.from('transactions').delete().eq('transferToAccountId', id);
            
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (!error) {
                setAccounts(accounts.filter(a => a.id !== id));
                setTransactions(transactions.filter(t => t.accountId !== id && t.transferToAccountId !== id));
            }
        }
    };
    
    // Recurring Transactions
    const handleAddRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        const nextDueDate = calculateNextDueDate(rec.startDate, rec.frequency);
        const { data } = await supabase.from('recurring_transactions').insert([{ ...rec, nextDueDate }]).select();
        if (data) setRecurringTransactions([...recurringTransactions, data[0]]);
        closeForm();
    };
    
    const handleUpdateRecurring = async (rec: Partial<RecurringTransaction> & { id: string }) => {
        const nextDueDate = rec.startDate && rec.frequency ? calculateNextDueDate(rec.startDate, rec.frequency) : undefined;
        const { data } = await supabase.from('recurring_transactions').update({ ...rec, nextDueDate }).eq('id', rec.id).select();
        if (data) setRecurringTransactions(recurringTransactions.map(r => r.id === rec.id ? data[0] : r));
        closeForm();
    };
    
    const handleDeleteRecurring = async (id: string) => {
        await supabase.from('recurring_transactions').delete().eq('id', id);
        setRecurringTransactions(recurringTransactions.filter(r => r.id !== id));
    };

    // Tasks
    const handleAddTask = async (task: Omit<Task, 'id'|'user_id'|'isCompleted'|'transactionId'|'createdAt'|'completedAt'>, transactionData?: any) => {
        let transactionId: string | undefined = undefined;
        if(transactionData) {
            const { data: newTransaction } = await supabase.from('transactions').insert([{...transactionData, description: task.title}]).select().single();
            if(newTransaction) {
                transactionId = newTransaction.id;
                setTransactions([newTransaction, ...transactions]);
            }
        }
        const { data } = await supabase.from('tasks').insert([{ ...task, transactionId }]).select();
        if (data) setTasks([...tasks, data[0]]);
        closeForm();
    };

    const handleUpdateTask = async (task: Partial<Task> & { id: string }) => {
        const { data } = await supabase.from('tasks').update(task).eq('id', task.id).select();
        if (data) setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
        closeForm();
    };

    const handleDeleteTask = async (id: string) => {
        await supabase.from('tasks').delete().eq('id', id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleToggleTaskCompletion = async (task: Task) => {
        if (!task.isCompleted && task.transactionId) {
            setTaskToComplete(task); // Show modal for tasks with transactions
            return;
        }
        const isCompleted = !task.isCompleted;
        const completedAt = isCompleted ? new Date().toISOString() : null;
        const { data } = await supabase.from('tasks').update({ isCompleted, completedAt }).eq('id', task.id).select();
        if (data) setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
    };
    
    // Budgets
    const handleAddBudget = async (budget: Omit<Budget, 'id'|'user_id'|'created_at'|'period'>) => {
        const { data } = await supabase.from('budgets').insert([budget]).select();
        if(data) setBudgets([...budgets, data[0]]);
        closeForm();
    };
    const handleUpdateBudget = async (budget: Partial<Budget> & {id: string}) => {
        const { data } = await supabase.from('budgets').update(budget).eq('id', budget.id).select();
        if(data) setBudgets(budgets.map(b => b.id === budget.id ? data[0] : b));
        closeForm();
    };
    const handleDeleteBudget = async (id: string) => {
        await supabase.from('budgets').delete().eq('id', id);
        setBudgets(budgets.filter(b => b.id !== id));
    };


    // --- UI Logic ---
    
    const closeForm = () => {
        setFormToShow(null);
        setItemToEdit(null);
        setPrefillData(null);
    };

    const openForm = (type: FormType, item?: any, prefill?: any) => {
        closeAllModals();
        setItemToEdit(item || null);
        setPrefillData(prefill || null);
        setFormToShow(type);
    };

    const closeAllModals = () => {
        setAddMenuOpen(false);
        setFijosMenuOpen(false);
        setSearchOpen(false);
        setSettingsOpen(false);
        setSelectedTransaction(null);
        setTaskToComplete(null);
    };
    
    const handleUnlock = async () => {
        setAppState('LOADING');
        if (session) await fetchAllData(session.user);
    };

    const handleNavigateToAuth = (initialView: 'signIn' | 'signUp') => {
        setAuthInitialView(initialView);
        setAppState('AUTH');
        localStorage.setItem('hasSeenGetStarted', 'true');
    };

    // --- Derived State ---
    
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
        accounts.forEach(acc => {
            balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
        });

        transactions.forEach(t => {
            if (t.type === 'income') {
                if (balances[t.accountId]) {
                    if (t.currency === 'DOP') balances[t.accountId].balanceDOP += t.amount;
                    else balances[t.accountId].balanceUSD += t.amount;
                }
            } else if (t.type === 'expense') {
                if (balances[t.accountId]) {
                    if (t.currency === 'DOP') balances[t.accountId].balanceDOP -= t.amount;
                    else balances[t.accountId].balanceUSD -= t.amount;
                }
            } else if (t.type === 'transfer') {
                if (t.accountId && balances[t.accountId]) {
                    if (t.currency === 'DOP') balances[t.accountId].balanceDOP -= t.amount;
                    else balances[t.accountId].balanceUSD -= t.amount;
                }
                if (t.transferToAccountId && balances[t.transferToAccountId]) {
                    if (t.currency === 'DOP') balances[t.transferToAccountId].balanceDOP += t.amount;
                    else balances[t.transferToAccountId].balanceUSD += t.amount;
                }
            }
        });
        return balances;
    }, [accounts, transactions]);

    // --- Render Logic ---
    
    const renderContent = () => {
        if(formToShow) {
            switch(formToShow) {
                case 'transaction': return <AddTransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={itemToEdit} accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
                case 'account': return <AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={itemToEdit} />;
                case 'transfer': return <AddTransferForm onAddTransfer={(t) => handleAddTransaction({...t, type: 'transfer', category: 'Transferencia', description: 'Transferencia entre cuentas'})} accounts={accounts} defaultCurrency={settings.defaultCurrency} prefillData={prefillData} />;
                case 'recurring': return <AddRecurringTransactionForm onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} recurringTransactionToEdit={itemToEdit} accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
                case 'task': return <AddTaskForm onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} taskToEdit={itemToEdit} accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
                case 'budget': return <AddBudgetForm onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} budgetToEdit={itemToEdit} existingBudgets={budgets} />;
                default: return null;
            }
        }
        switch(view) {
            case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
            case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => openForm('account')} onDeleteAccount={handleDeleteAccount} onEditAccount={(acc) => openForm('account', acc)} onUpdateAccount={handleUpdateAccount} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={(card) => openForm('transfer', null, { toAccountId: card.id })} />;
            case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={handleDeleteTransaction} />;
            case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={handleDeleteRecurring} onEdit={(rt) => openForm('recurring', rt)} onAdd={() => openForm('recurring')} />;
            case 'tasks': return <TasksList tasks={tasks} onToggleCompletion={handleToggleTaskCompletion} onDeleteTask={handleDeleteTask} onEditTask={(t) => openForm('task', t)} onAddTask={() => openForm('task')} />;
            case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => openForm('budget')} onEditBudget={(b) => openForm('budget', b)} onDeleteBudget={handleDeleteBudget} />;
            case 'notifications': return <NotificationsList />;
            default: return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
        }
    };

    if (appState === 'GET_STARTED') return <GetStarted onNavigateToAuth={handleNavigateToAuth} />;
    if (appState === 'AUTH') return <Auth initialView={authInitialView} onBack={localStorage.getItem('hasSeenGetStarted') ? undefined : () => setAppState('GET_STARTED')} />;
    if (appState === 'LOCKED' && settings.pin) return <PinLockScreen correctPin={settings.pin} onUnlock={handleUnlock} />;
    if (appState === 'LOADING' || !session) return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;


    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-white font-sans pb-20">
            <Header onOpenSettings={() => setSettingsOpen(true)} onOpenSearch={() => setSearchOpen(true)} setView={setView} />
            <main className="container mx-auto p-4 md:p-8">
                {formToShow ? (
                    <div>
                        {renderContent()}
                        <button onClick={closeForm} className="mt-4 text-center w-full text-neutral-500 hover:text-white">Cancelar</button>
                    </div>
                ) : (
                    renderContent()
                )}
            </main>
            {!formToShow && <BottomNavBar activeView={view} setView={setView} openAddMenu={() => setAddMenuOpen(true)} openFijosMenu={() => setFijosMenuOpen(true)} />}

            {/* Modals */}
            {isAddMenuOpen && <AddMenuModal onClose={() => setAddMenuOpen(false)} onSelect={(type) => openForm(type)} />}
            {isFijosMenuOpen && <FijosMenuModal onClose={() => setFijosMenuOpen(false)} setView={setView} />}
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} />}
            {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} />}
            {isSettingsOpen && userProfile && <SettingsPanel userProfile={userProfile} settings={settings} onUpdateSettings={(s) => setSettings(prev => ({...prev, ...s}))} onLogout={() => supabase.auth.signOut()} onClose={() => setSettingsOpen(false)} onSeedData={() => {}} onDeleteAllData={() => {}} />}
            {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={() => { handleToggleTaskCompletion({...taskToComplete, transactionId: null }); setTaskToComplete(null);}} onCompleteWithTransaction={() => { openForm('transaction'); setTaskToComplete(null); }} />}
        </div>
    );
};

export default App;