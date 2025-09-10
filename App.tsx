import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
// FIX: Add file extension to fix module resolution error.
import { supabase } from './lib/supabase.ts';
// FIX: Add file extension to fix module resolution error.
import type { View, Transaction, Account, RecurringTransaction, Task, Budget, Settings, UserProfile } from './types.ts';
// FIX: Add file extension to fix module resolution error.
import { resizeImage } from './utils/image.ts';
// FIX: Add file extension to fix module resolution error.
import { calculateNextDueDate } from './utils/date.ts';

// Components
import Header from './components/Header.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import Dashboard from './components/Dashboard.tsx';
import AccountsList from './components/AccountsList.tsx';
import CalendarView from './components/CalendarView.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import TasksList from './components/TasksList.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import NotificationsList from './components/NotificationsList.tsx';
import Auth from './components/Auth.tsx';
import GetStarted from './components/GetStarted.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';

// Modals
import AddMenuModal from './components/AddMenuModal.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import SearchModal from './components/SearchModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
// FIX: Add file extension to fix module resolution error.
import { COLOR_THEMES } from './constants.ts';

const App: React.FC = () => {
    // Auth State
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // App State
    const [loading, setLoading] = useState(true);
    const [isUnlocked, setUnlocked] = useState(false);
    const [hasSeenGetStarted, setHasSeenGetStarted] = useState(localStorage.getItem('hasSeenGetStarted') === 'true');
    const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');
    
    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    
    // UI State
    const [view, setView] = useState<View>('dashboard');
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);
    
    // Settings
    const [settings, setSettings] = useState<Settings>({
        theme: 'default',
        defaultCurrency: 'DOP',
        pin: null,
        isPinEnabled: false,
    });
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    

    // Effects for Auth and Data Fetching
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (!session) {
                setLoading(false);
            }
        });
        
        // Initial session load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [
                profileRes,
                transactionsRes,
                accountsRes,
                recurringRes,
                tasksRes,
                budgetsRes,
                settingsRes,
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('transactions').select('*').order('date', { ascending: false }),
                supabase.from('accounts').select('*').order('name'),
                supabase.from('recurring_transactions').select('*'),
                supabase.from('tasks').select('*'),
                supabase.from('budgets').select('*'),
                supabase.from('settings').select('*').eq('user_id', user.id).single(),
            ]);

            if (profileRes.data) setProfile(profileRes.data);
            if (transactionsRes.data) setTransactions(transactionsRes.data);
            if (accountsRes.data) setAccounts(accountsRes.data);
            if (recurringRes.data) setRecurringTransactions(recurringRes.data);
            if (tasksRes.data) setTasks(tasksRes.data);
            if (budgetsRes.data) setBudgets(budgetsRes.data);
            if (settingsRes.data) {
                setSettings(settingsRes.data);
                if (settingsRes.data.isPinEnabled && settingsRes.data.pin) {
                    setUnlocked(false);
                } else {
                    setUnlocked(true);
                }
            } else if (settingsRes.error) {
                const { data } = await supabase.from('settings').insert({ user_id: user.id }).select().single();
                if (data) setSettings(data);
                setUnlocked(true);
            }

        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        } else {
            // Clear data on logout
            setTransactions([]);
            setAccounts([]);
            setRecurringTransactions([]);
            setTasks([]);
            setBudgets([]);
            setProfile(null);
            setUnlocked(false);
        }
    }, [user, fetchInitialData]);
    
    // Theme application effect
    useEffect(() => {
        const theme = COLOR_THEMES.find(t => t.name === settings.theme) || COLOR_THEMES[0];
        document.documentElement.style.setProperty('--color-primary', theme.primary);
        document.documentElement.style.setProperty('--color-secondary', theme.secondary);
    }, [settings.theme]);

    // Derived State
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number, balanceUSD: number } } = {};
        accounts.forEach(acc => {
            balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
        });

        transactions.forEach(t => {
            if (t.type === 'transfer') {
                if (balances[t.accountId]) {
                    const key = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
                    balances[t.accountId][key] -= t.amount;
                }
                if (t.transferToAccountId && balances[t.transferToAccountId]) {
                    const key = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
                    balances[t.transferToAccountId][key] += t.amount;
                }
            } else {
                 if (balances[t.accountId]) {
                    const key = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
                    const amount = t.type === 'income' ? t.amount : -t.amount;
                    balances[t.accountId][key] += amount;
                }
            }
        });
        return balances;
    }, [transactions, accounts]);

    // Handlers
    const handleCloseModal = () => {
        setActiveModal(null);
        setTransactionToEdit(null);
        setAccountToEdit(null);
        setRecurringToEdit(null);
        setTaskToEdit(null);
        setBudgetToEdit(null);
        setTransferPrefill(null);
    };

    const handleSelectTransaction = (transaction: Transaction) => setSelectedTransaction(transaction);
    
    // CRUD Operations
    const crudOperation = async <T,>(
        operation: Promise<{ data: T | T[] | null; error: any }>,
        onSuccess: (data: T | T[]) => void,
        closeModal = true
    ) => {
        const { data, error } = await operation;
        if (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        } else if (data) {
            onSuccess(data);
            if(closeModal) handleCloseModal();
        }
    };
    
    // Transactions
    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id'>, receiptFile?: File) => {
        let receiptImage;
        if (receiptFile) {
            const resizedDataUrl = await resizeImage(receiptFile, 800);
            const response = await fetch(resizedDataUrl);
            const blob = await response.blob();
            const fileName = `${user!.id}/${Date.now()}-${receiptFile.name}`;
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob);
            if (error) console.error("Error uploading receipt:", error);
            else receiptImage = supabase.storage.from('receipts').getPublicUrl(data.path).data.publicUrl;
        }
        await crudOperation(
            supabase.from('transactions').insert({ ...transaction, user_id: user!.id, receiptImage }).select().single(),
            (newData) => setTransactions(prev => [newData as Transaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        );
    };
    
    const updateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        let receiptImage = transaction.receiptImage;
        if (receiptFile) {
             const resizedDataUrl = await resizeImage(receiptFile, 800);
            const response = await fetch(resizedDataUrl);
            const blob = await response.blob();
            const fileName = `${user!.id}/${Date.now()}-${receiptFile.name}`;
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob);
            if (error) console.error("Error uploading receipt:", error);
            else receiptImage = supabase.storage.from('receipts').getPublicUrl(data.path).data.publicUrl;
        }
        const { id, ...updateData } = transaction;
        await crudOperation(
            supabase.from('transactions').update({ ...updateData, receiptImage }).eq('id', id).select().single(),
            (updated) => setTransactions(prev => prev.map(t => t.id === id ? updated as Transaction : t))
        );
    };

    const deleteTransaction = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return;
        const transactionToDelete = transactions.find(t => t.id === id);
        if (transactionToDelete?.receiptImage) {
            const fileName = transactionToDelete.receiptImage.split('/').pop();
            if (fileName) await supabase.storage.from('receipts').remove([`${user!.id}/${fileName}`]);
        }
        await crudOperation(
            supabase.from('transactions').delete().eq('id', id),
            () => setTransactions(prev => prev.filter(t => t.id !== id)),
            false
        );
        setSelectedTransaction(null);
    };
    
    // Accounts
    const addAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        await crudOperation(
            supabase.from('accounts').insert({ ...account, user_id: user!.id }).select().single(),
            (newData) => setAccounts(prev => [...prev, newData as Account].sort((a,b) => a.name.localeCompare(b.name)))
        );
    };

    const updateAccount = async (account: Partial<Account> & { id: string }) => {
        const { id, ...updateData } = account;
        await crudOperation(
            supabase.from('accounts').update(updateData).eq('id', id).select().single(),
            (updated) => setAccounts(prev => prev.map(a => a.id === id ? updated as Account : a))
        );
    };

    const deleteAccount = async (id: string) => {
        if (!window.confirm('¿Eliminar cuenta? Esto también eliminará todos sus movimientos asociados.')) return;
        // In a real app, you might want to prevent this or handle orphaned transactions.
        await crudOperation(
            supabase.from('accounts').delete().eq('id', id),
            () => {
                setAccounts(prev => prev.filter(a => a.id !== id));
                setTransactions(prev => prev.filter(t => t.accountId !== id && t.transferToAccountId !== id));
            },
            false
        );
    };

    // Transfers
    const addTransfer = async (transfer: Omit<Transaction, 'id' | 'user_id' | 'type' | 'category' | 'description'>) => {
        const transferData = {
            ...transfer,
            user_id: user!.id,
            type: 'transfer',
            category: 'Transferencia',
            description: `Transferencia entre cuentas`,
        };
        await crudOperation(
            supabase.from('transactions').insert(transferData).select().single(),
            (newData) => setTransactions(prev => [newData as Transaction, ...prev])
        );
    };

    // Recurring Transactions
    const addRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        const nextDueDate = calculateNextDueDate(rec.startDate, rec.frequency);
        await crudOperation(
            supabase.from('recurring_transactions').insert({ ...rec, user_id: user!.id, nextDueDate }).select().single(),
            (newData) => setRecurringTransactions(prev => [...prev, newData as RecurringTransaction])
        );
    };
    
    const updateRecurring = async (rec: Partial<RecurringTransaction> & { id: string }) => {
        const { id, ...updateData } = rec;
        if(updateData.startDate && updateData.frequency) {
            updateData.nextDueDate = calculateNextDueDate(updateData.startDate, updateData.frequency);
        }
        await crudOperation(
            supabase.from('recurring_transactions').update(updateData).eq('id', id).select().single(),
            (updated) => setRecurringTransactions(prev => prev.map(r => r.id === id ? updated as RecurringTransaction : r))
        );
    };

    const deleteRecurring = async (id: string) => {
        if (!window.confirm('¿Eliminar movimiento fijo?')) return;
        await crudOperation(
            supabase.from('recurring_transactions').delete().eq('id', id),
            () => setRecurringTransactions(prev => prev.filter(r => r.id !== id)),
            false
        );
    };

    // Tasks
    const addTask = async (task: Omit<Task, 'id'|'user_id'|'isCompleted'|'createdAt'|'completedAt'|'transactionId'>, transactionData?: any) => {
        let transactionId;
        if (transactionData) {
            const { data, error } = await supabase.from('transactions').insert({ ...transactionData, user_id: user!.id, description: task.title }).select('id').single();
            if(error) { console.error(error); alert("Error creando movimiento asociado."); return; }
            transactionId = data?.id;
        }
        await crudOperation(
            supabase.from('tasks').insert({ ...task, user_id: user!.id, isCompleted: false, transactionId }).select().single(),
            (newData) => setTasks(prev => [...prev, newData as Task])
        );
    };

    const updateTask = async (task: Partial<Task> & { id: string }) => {
        const { id, ...updateData } = task;
        await crudOperation(
            supabase.from('tasks').update(updateData).eq('id', id).select().single(),
            (updated) => setTasks(prev => prev.map(t => t.id === id ? updated as Task : t))
        );
    };

    const deleteTask = async (id: string) => {
        if (!window.confirm('¿Eliminar tarea?')) return;
        await crudOperation(
            supabase.from('tasks').delete().eq('id', id),
            () => setTasks(prev => prev.filter(t => t.id !== id)),
            false
        );
    };

    const toggleTaskCompletion = async (task: Task) => {
        const isCompleted = !task.isCompleted;
        const completedAt = isCompleted ? new Date().toISOString() : undefined;
        await crudOperation(
            supabase.from('tasks').update({ isCompleted, completedAt }).eq('id', task.id).select().single(),
            (updated) => setTasks(prev => prev.map(t => t.id === task.id ? updated as Task : t)),
            false
        );
    };

    // Budgets
    const addBudget = async (budget: Omit<Budget, 'id'|'user_id'|'created_at'|'period'>) => {
        await crudOperation(
            supabase.from('budgets').insert({ ...budget, user_id: user!.id, period: 'monthly' }).select().single(),
            (newData) => setBudgets(prev => [...prev, newData as Budget])
        );
    };

    const updateBudget = async (budget: Partial<Budget> & { id: string }) => {
        const { id, ...updateData } = budget;
        await crudOperation(
            supabase.from('budgets').update(updateData).eq('id', id).select().single(),
            (updated) => setBudgets(prev => prev.map(b => b.id === id ? updated as Budget : b))
        );
    };
    
    const deleteBudget = async (id: string) => {
        if (!window.confirm('¿Eliminar presupuesto?')) return;
        await crudOperation(
            supabase.from('budgets').delete().eq('id', id),
            () => setBudgets(prev => prev.filter(b => b.id !== id)),
            false
        );
    };

    // Settings
    const updateSettings = async (newSettings: Partial<Settings>) => {
        await crudOperation(
            supabase.from('settings').update(newSettings).eq('user_id', user!.id).select().single(),
            (updated) => setSettings(updated as Settings),
            false
        );
    };

    const handleLogout = async () => { await supabase.auth.signOut(); };

    // Conditional Rendering
    if (!session && !hasSeenGetStarted) {
        return <GetStarted onNavigateToAuth={(view) => {
            setAuthView(view);
            setHasSeenGetStarted(true);
            localStorage.setItem('hasSeenGetStarted', 'true');
        }} />;
    }
    
    if (!session) {
        return <Auth initialView={authView} onBack={() => setHasSeenGetStarted(false)} />;
    }

    if (settings.isPinEnabled && !isUnlocked) {
        return <PinLockScreen correctPin={settings.pin!} onUnlock={() => setUnlocked(true)} />;
    }

    const renderView = () => {
        switch(view) {
            case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={deleteTransaction} onSelectTransaction={handleSelectTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={toggleTaskCompletion} />;
            case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => setActiveModal('addAccount')} onDeleteAccount={deleteAccount} onEditAccount={(acc) => { setAccountToEdit(acc); setActiveModal('addAccount'); }} onUpdateAccount={updateAccount} onSelectTransaction={handleSelectTransaction} onAddMoneyToCard={(card) => { setTransferPrefill({ toAccountId: card.id }); setActiveModal('addTransfer'); }} />;
            case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={handleSelectTransaction} onDeleteTransaction={deleteTransaction} />;
            case 'tasks': return <TasksList tasks={tasks} onToggleCompletion={(task) => { if(task.transactionId) { setTaskToComplete(task) } else { toggleTaskCompletion(task) } }} onDeleteTask={deleteTask} onEditTask={(task) => { setTaskToEdit(task); setActiveModal('addTask'); }} onAddTask={() => setActiveModal('addTask')} />;
            case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={deleteRecurring} onEdit={(rec) => { setRecurringToEdit(rec); setActiveModal('addRecurring'); }} onAdd={() => setActiveModal('addRecurring')} />;
            case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => setActiveModal('addBudget')} onEditBudget={(b) => { setBudgetToEdit(b); setActiveModal('addBudget'); }} onDeleteBudget={deleteBudget} />;
            case 'notifications': return <NotificationsList />;
            default: return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={deleteTransaction} onSelectTransaction={handleSelectTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={toggleTaskCompletion} />;
        }
    };
    
    const renderModalContent = () => {
        switch (activeModal) {
            case 'addTransaction':
                return <AddTransactionForm onAddTransaction={addTransaction} onUpdateTransaction={updateTransaction} transactionToEdit={transactionToEdit} accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
            case 'addAccount':
                return <AddAccountForm onAddAccount={addAccount} onUpdateAccount={updateAccount} accountToEdit={accountToEdit} />;
            case 'addTransfer':
                return <AddTransferForm onAddTransfer={addTransfer} accounts={accounts} defaultCurrency={settings.defaultCurrency} prefillData={transferPrefill} />;
            case 'addRecurring':
                return <AddRecurringTransactionForm onAddRecurring={addRecurring} onUpdateRecurring={updateRecurring} recurringTransactionToEdit={recurringToEdit} accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
            case 'addTask':
                return <AddTaskForm onAddTask={addTask} onUpdateTask={updateTask} taskToEdit={taskToEdit} accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
            case 'addBudget':
                return <AddBudgetForm onAddBudget={addBudget} onUpdateBudget={updateBudget} budgetToEdit={budgetToEdit} existingBudgets={budgets} />;
            default:
                return null;
        }
    };
    
    const isFormModalOpen = activeModal && activeModal.startsWith('add');

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen font-sans pb-20">
            <Header onOpenSettings={() => setSettingsOpen(true)} onOpenSearch={() => setSearchOpen(true)} setView={setView} />
            <main className="container mx-auto px-4 md:px-8 py-6">
                {loading && !user ? <p>Cargando sesión...</p> : loading && user ? <p>Cargando datos...</p> : renderView()}
            </main>
            <BottomNavBar activeView={view} setView={setView} openAddMenu={() => setActiveModal('addMenu')} openFijosMenu={() => setActiveModal('fijosMenu')} />

            {/* Modals */}
            {activeModal === 'addMenu' && <AddMenuModal onClose={handleCloseModal} onSelect={(type) => { setActiveModal(type === 'transaction' ? 'addTransaction' : type === 'transfer' ? 'addTransfer' : type === 'recurring' ? 'addRecurring' : 'addTask') }} />}
            {activeModal === 'fijosMenu' && <FijosMenuModal onClose={handleCloseModal} setView={setView} />}
            
            {isFormModalOpen && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
                     <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
                         {renderModalContent()}
                     </div>
                 </div>
            )}
            
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={deleteTransaction} />}
            <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={(t) => { setSearchOpen(false); handleSelectTransaction(t); }} />
            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} user={profile} settings={settings} onUpdateSettings={updateSettings} onLogout={handleLogout} />
            {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={() => { toggleTaskCompletion(taskToComplete); setTaskToComplete(null); }} onCompleteWithTransaction={() => { setActiveModal('addTransaction'); setTaskToComplete(null); /* TODO: prefill transaction form based on task */ }} />}

        </div>
    );
};

export default App;
