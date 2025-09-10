

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
// FIX: Add file extension to fix module resolution error.
import { supabase } from './lib/supabase.ts';
// FIX: Add file extension to fix module resolution error.
import type { View, Transaction, Account, RecurringTransaction, Task, UserProfile, Budget, Notification } from './types.ts';
// FIX: Add file extension to fix module resolution error.
import { calculateNextDueDate } from './utils/date.ts';
// FIX: Add file extension to fix module resolution error.
import { resizeImage } from './utils/image.ts';

// Components
// FIX: Add file extension to fix module resolution error.
import Header from './components/Header.tsx';
// FIX: Add file extension to fix module resolution error.
import Dashboard from './components/Dashboard.tsx';
// FIX: Add file extension to fix module resolution error.
import BottomNavBar from './components/BottomNavBar.tsx';
// FIX: Add file extension to fix module resolution error.
import AccountsList from './components/AccountsList.tsx';
// FIX: Add file extension to fix module resolution error.
import CalendarView from './components/CalendarView.tsx';
// FIX: Add file extension to fix module resolution error.
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
// FIX: Add file extension to fix module resolution error.
import TasksList from './components/TasksList.tsx';
// FIX: Add file extension to fix module resolution error.
import BudgetsList from './components/BudgetsList.tsx';

// Modals & Forms
// FIX: Add file extension to fix module resolution error.
import AddMenuModal from './components/AddMenuModal.tsx';
// FIX: Add file extension to fix module resolution error.
import FijosMenuModal from './components/FijosMenuModal.tsx';
// FIX: Add file extension to fix module resolution error.
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
// FIX: Add file extension to fix module resolution error.
import SettingsPanel from './components/SettingsPanel.tsx';
// FIX: Add file extension to fix module resolution error.
import PinLockScreen from './components/PinLockScreen.tsx';
// FIX: Add file extension to fix module resolution error.
import GetStarted from './components/GetStarted.tsx';
// FIX: Add file extension to fix module resolution error.
import Auth from './components/Auth.tsx';
// FIX: Add file extension to fix module resolution error.
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
// FIX: Add file extension to fix module resolution error.
import NotificationsDropdown from './components/NotificationsDropdown.tsx';
// FIX: Add file extension to fix module resolution error.
import AddTransactionForm from './components/AddTransactionForm.tsx';
// FIX: Add file extension to fix module resolution error.
import AddTransferForm from './components/AddTransferForm.tsx';
// FIX: Add file extension to fix module resolution error.
import AddAccountForm from './components/AddAccountForm.tsx';
// FIX: Add file extension to fix module resolution error.
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
// FIX: Add file extension to fix module resolution error.
import AddTaskForm from './components/AddTaskForm.tsx';
// FIX: Add file extension to fix module resolution error.
import AddBudgetForm from './components/AddBudgetForm.tsx';
// FIX: Add file extension to fix module resolution error.
import SearchModal from './components/SearchModal.tsx';

const App: React.FC = () => {
    // Auth & User State
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [showGetStarted, setShowGetStarted] = useState(!localStorage.getItem('hasSeenGetStarted'));
    const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isFijosMenuOpen, setIsFijosMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    // Modal Content State
    const [formToShow, setFormToShow] = useState<string | null>(null); // 'transaction', 'account', 'transfer', 'recurring', 'task', 'budget'
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [prefillData, setPrefillData] = useState<any | null>(null);

    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Theme setup
    useEffect(() => {
        const applyTheme = () => {
            if (userProfile?.theme) {
                const root = window.document.documentElement;
                root.classList.remove('theme-default', 'theme-forest', 'theme-sunset', 'theme-ocean');
                root.classList.add(`theme-${userProfile.theme}`);
            }
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };
        applyTheme();
        window.addEventListener('storage', applyTheme);
        return () => window.removeEventListener('storage', applyTheme);
    }, [userProfile?.theme]);
    
    // Auth Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user?.id && !userProfile) {
                fetchUserProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                // Clear all data on logout
                setUserProfile(null);
                setTransactions([]);
                setAccounts([]);
                setRecurringTransactions([]);
                setTasks([]);
                setBudgets([]);
                setNotifications([]);
                setIsLocked(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [userProfile]);
    
    // Fetch user profile
    const fetchUserProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            setUserProfile(data);
            if (data.isPinEnabled && data.pin) {
                setIsLocked(true);
            }
        } else {
            console.error('Error fetching profile:', error);
        }
    }, []);

    // Fetch all data
    const fetchData = useCallback(async (userId: string) => {
        setIsLoading(true);
        const [accountsRes, transactionsRes, recurringRes, tasksRes, budgetsRes, notificationsRes] = await Promise.all([
            supabase.from('accounts').select('*').eq('user_id', userId).order('name'),
            supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).order('time', { ascending: false }),
            supabase.from('recurring_transactions').select('*').eq('user_id', userId).order('description'),
            supabase.from('tasks').select('*').eq('user_id', userId).order('dueDate'),
            supabase.from('budgets').select('*').eq('user_id', userId),
            supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);
        
        setAccounts(accountsRes.data || []);
        setTransactions(transactionsRes.data || []);
        setRecurringTransactions(recurringRes.data || []);
        setTasks(tasksRes.data || []);
        setBudgets(budgetsRes.data || []);
        setNotifications(notificationsRes.data || []);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (session?.user) {
            if (!userProfile) {
                fetchUserProfile(session.user.id);
            }
            fetchData(session.user.id);
        }
    }, [session, userProfile, fetchUserProfile, fetchData]);

    // Derived State
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
        accounts.forEach(acc => {
            balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
        });

        [...transactions].reverse().forEach(t => {
            const balanceKey = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
            if (t.type === 'income') {
                if (balances[t.accountId]) balances[t.accountId][balanceKey] += t.amount;
            } else if (t.type === 'expense') {
                if (balances[t.accountId]) balances[t.accountId][balanceKey] -= t.amount;
            } else if (t.type === 'transfer' && t.transferToAccountId) {
                if (balances[t.accountId]) balances[t.accountId][balanceKey] -= t.amount;
                if (balances[t.transferToAccountId]) balances[t.transferToAccountId][balanceKey] += t.amount;
            }
        });
        return balances;
    }, [transactions, accounts]);

    const unreadNotifications = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    // CRUD Handlers
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id'>, receiptFile?: File) => {
        let receiptImageUrl: string | undefined = undefined;
        if (receiptFile && session?.user) {
             const resizedImage = await resizeImage(receiptFile, 1024);
             const base64 = await fetch(resizedImage).then(res => res.blob());
             const filePath = `${session.user.id}/${new Date().getTime()}-${receiptFile.name}`;
             const { data: uploadData, error } = await supabase.storage.from('receipts').upload(filePath, base64);
             if (error) {
                 console.error('Error uploading receipt:', error);
             } else {
                 const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
                 receiptImageUrl = data.publicUrl;
             }
        }
        
        const { data, error } = await supabase.from('transactions').insert([{ ...transaction, user_id: session?.user.id, receiptImage: receiptImageUrl }]).select();
        if (data) setTransactions([data[0], ...transactions]);
        setFormToShow(null);
    };

    const handleUpdateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => {
       // Similar to add, but with update logic
       const { data, error } = await supabase.from('transactions').update(transaction).eq('id', transaction.id).select();
       if (data) {
           setTransactions(transactions.map(t => t.id === transaction.id ? data[0] : t));
       }
       setFormToShow(null);
       setItemToEdit(null);
    };

    const handleDeleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(transactions.filter(t => t.id !== id));
            setSelectedTransaction(null);
        }
    };
    
    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        const { data } = await supabase.from('accounts').insert([{ ...account, user_id: session?.user.id }]).select();
        if (data) setAccounts([...accounts, data[0]]);
        setFormToShow(null);
    };

    const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => {
        const { data } = await supabase.from('accounts').update(account).eq('id', account.id).select();
        if (data) setAccounts(accounts.map(a => a.id === account.id ? data[0] : a));
        setFormToShow(null);
        setItemToEdit(null);
    };

    const handleDeleteAccount = async (id: string) => {
        if(window.confirm('¿Seguro? Se borrarán todos los movimientos asociados.')){
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (!error) setAccounts(accounts.filter(a => a.id !== id));
        }
    };
    
    const handleAddTransfer = async (transfer: Omit<Transaction, 'id' | 'user_id' | 'type' | 'category' | 'description'>) => {
        const payload = {
            ...transfer,
            user_id: session?.user.id,
            type: 'transfer',
            category: 'Transferencia',
            description: 'Transferencia entre cuentas'
        } as const;
        const { data } = await supabase.from('transactions').insert([payload]).select();
        if (data) setTransactions([data[0], ...transactions]);
        setFormToShow(null);
        setPrefillData(null);
    };

    const handleAddRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        const nextDueDate = calculateNextDueDate(rec.startDate, rec.frequency);
        const { data } = await supabase.from('recurring_transactions').insert([{...rec, user_id: session?.user.id, nextDueDate }]).select();
        if(data) setRecurringTransactions([...recurringTransactions, data[0]]);
        setFormToShow(null);
    };

    const handleUpdateRecurring = async (rec: Partial<RecurringTransaction> & {id: string}) => {
        const { data } = await supabase.from('recurring_transactions').update(rec).eq('id', rec.id).select();
        if(data) setRecurringTransactions(recurringTransactions.map(r => r.id === rec.id ? data[0] : r));
        setFormToShow(null);
        setItemToEdit(null);
    };

    const handleDeleteRecurring = async (id: string) => {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if(!error) setRecurringTransactions(recurringTransactions.filter(r => r.id !== id));
    };

    const handleAddTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'createdAt' | 'completedAt' | 'transactionId'>, transactionData?: any) => {
        let transactionId: string | undefined;
        if (transactionData && session?.user) {
            const { data: transData, error } = await supabase.from('transactions').insert([{
                ...transactionData,
                description: taskData.title,
                user_id: session.user.id
            }]).select('id').single();
            if (transData) transactionId = transData.id;
        }

        const { data: task } = await supabase.from('tasks').insert([{
            ...taskData,
            user_id: session?.user.id,
            isCompleted: false,
            transactionId,
        }]).select();

        if (task) {
            setTasks([...tasks, task[0]]);
            if (transactionId && session?.user) fetchData(session.user.id);
        }
        setFormToShow(null);
    };

    const handleToggleTask = async (task: Task) => {
        const isCompleting = !task.isCompleted;
        if (isCompleting && task.transactionId) {
            setTaskToComplete(task);
            return;
        }

        const { data } = await supabase.from('tasks')
            .update({ isCompleted: isCompleting, completedAt: isCompleting ? new Date().toISOString() : null })
            .eq('id', task.id)
            .select();
        if (data) setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
    };

    const handleCompleteTaskWithTransaction = () => {
        if (!taskToComplete || !taskToComplete.transactionId) return;
        
        const completeTask = async () => {
             const { data } = await supabase.from('tasks')
                .update({ isCompleted: true, completedAt: new Date().toISOString() })
                .eq('id', taskToComplete.id)
                .select();
             if (data) setTasks(tasks.map(t => t.id === taskToComplete.id ? data[0] : t));
             setTaskToComplete(null);
             if (session?.user) fetchData(session.user.id); // refetch to show new transaction
        };
        
        completeTask();
    };

     const handleCompleteTaskOnly = async () => {
        if (!taskToComplete) return;
        const { data } = await supabase.from('tasks')
            .update({ isCompleted: true, completedAt: new Date().toISOString() })
            .eq('id', taskToComplete.id)
            .select();
        if (data) setTasks(tasks.map(t => t.id === taskToComplete.id ? data[0] : t));
        setTaskToComplete(null);
    };

    const handleUpdateTask = async (task: Partial<Task> & {id: string}) => {
        const { data } = await supabase.from('tasks').update(task).eq('id', task.id).select();
        if(data) setTasks(tasks.map(t => t.id === task.id ? data[0] : t));
        setFormToShow(null);
        setItemToEdit(null);
    };

    const handleDeleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if(!error) setTasks(tasks.filter(t => t.id !== id));
    };

    const handleAddBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => {
        const { data } = await supabase.from('budgets').insert([{ ...budget, user_id: session?.user.id, period: 'monthly' }]).select();
        if (data) setBudgets([...budgets, data[0]]);
        setFormToShow(null);
    };

    const handleUpdateBudget = async (budget: Partial<Budget> & { id: string }) => {
        const { data } = await supabase.from('budgets').update(budget).eq('id', budget.id).select();
        if (data) setBudgets(budgets.map(b => b.id === budget.id ? data[0] : b));
        setFormToShow(null);
        setItemToEdit(null);
    };

    const handleDeleteBudget = async (id: string) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if(!error) setBudgets(budgets.filter(b => b.id !== id));
    };

    const handleUpdateProfile = async (profileUpdate: Partial<UserProfile>, avatarFile?: File | null) => {
        let avatar_url: string | undefined = userProfile?.avatar_url;
        if (avatarFile && session?.user) {
            const resizedImage = await resizeImage(avatarFile, 512);
            const base64 = await fetch(resizedImage).then(res => res.blob());
            const filePath = `${session.user.id}/avatar-${new Date().getTime()}`;
            const { error } = await supabase.storage.from('avatars').upload(filePath, base64, { upsert: true });
            if (!error) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatar_url = data.publicUrl;
            }
        }
        
        if (session?.user) {
            const { data } = await supabase.from('profiles').update({ ...profileUpdate, avatar_url }).eq('id', session.user.id).select().single();
            if (data) setUserProfile(data);
        }
    };

    const handleMarkNotificationRead = async (id: string) => {
        const { data } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select().single();
        if (data) setNotifications(notifications.map(n => n.id === id ? data : n));
    };

    const handleMarkAllNotificationsRead = async () => {
        if(session?.user) {
            const { data } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false).select();
            if (data) fetchData(session.user.id);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsSettingsOpen(false);
    };
    
    // UI Handlers
    const openAddMenu = () => {
        setIsAddMenuOpen(true);
        setIsFijosMenuOpen(false);
    }
    const openFijosMenu = () => {
        setIsFijosMenuOpen(true);
        setIsAddMenuOpen(false);
    }

    const handleSelectAddMenu = (type: string) => {
        setItemToEdit(null);
        setFormToShow(type);
        setIsAddMenuOpen(false);
    }
    
    const closeForm = () => {
        setFormToShow(null);
        setItemToEdit(null);
        setPrefillData(null);
    }
    
    const handleEditItem = (item: any, type: string) => {
        setItemToEdit(item);
        setFormToShow(type);
        if (type === 'account') setView('accounts');
        if (type === 'recurring') setView('recurring');
        if (type === 'task') setView('tasks');
    }

    const handleNavigateToAuth = (initialView: 'signIn' | 'signUp') => {
        setShowGetStarted(false);
        setAuthView(initialView);
        localStorage.setItem('hasSeenGetStarted', 'true');
    };

    // Render Logic
    if (isLoading) {
        return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;
    }

    if (!session) {
        if (showGetStarted) {
            return <GetStarted onNavigateToAuth={handleNavigateToAuth} />;
        }
        return <Auth key={authView} view={authView} setView={setAuthView} />;
    }

    if (isLocked) {
        return <PinLockScreen correctPin={userProfile?.pin!} onUnlock={() => setIsLocked(false)} />;
    }

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard
                    transactions={transactions}
                    accounts={accounts}
                    tasks={tasks}
                    budgets={budgets}
                    accountBalances={accountBalances}
                    onDeleteTransaction={handleDeleteTransaction}
                    onSelectTransaction={setSelectedTransaction}
                    onViewCalendar={() => setView('calendar')}
                    onViewTasks={() => setView('tasks')}
                    onViewBudgets={() => setView('budgets')}
                    onToggleTaskCompletion={handleToggleTask}
                />;
            case 'calendar':
                return <CalendarView 
                    transactions={transactions} 
                    accounts={accounts} 
                    onSelectTransaction={setSelectedTransaction}
                    onDeleteTransaction={handleDeleteTransaction} 
                />;
            case 'accounts':
                return <AccountsList 
                    accounts={accounts}
                    transactions={transactions}
                    accountBalances={accountBalances}
                    onAddAccount={() => handleSelectAddMenu('account')}
                    onEditAccount={(acc) => handleEditItem(acc, 'account')}
                    onDeleteAccount={handleDeleteAccount}
                    onUpdateAccount={handleUpdateAccount}
                    onSelectTransaction={setSelectedTransaction}
                    onAddMoneyToCard={(card) => {
                        setPrefillData({ toAccountId: card.id });
                        handleSelectAddMenu('transfer');
                    }}
                />;
            case 'recurring':
                return <RecurringTransactionList 
                    recurringTransactions={recurringTransactions}
                    accounts={accounts}
                    onAdd={() => handleSelectAddMenu('recurring')}
                    onEdit={(rt) => handleEditItem(rt, 'recurring')}
                    onDelete={handleDeleteRecurring}
                />;
            case 'tasks':
                return <TasksList 
                    tasks={tasks}
                    onAddTask={() => handleSelectAddMenu('task')}
                    onEditTask={(task) => handleEditItem(task, 'task')}
                    onDeleteTask={handleDeleteTask}
                    onToggleCompletion={handleToggleTask}
                />;
            case 'budgets':
                return <BudgetsList 
                    budgets={budgets}
                    transactions={transactions}
                    onAddBudget={() => handleSelectAddMenu('budget')}
                    onEditBudget={(budget) => handleEditItem(budget, 'budget')}
                    onDeleteBudget={handleDeleteBudget}
                />;
            default:
                return <Dashboard
                    transactions={transactions}
                    accounts={accounts}
                    tasks={tasks}
                    budgets={budgets}
                    accountBalances={accountBalances}
                    onDeleteTransaction={handleDeleteTransaction}
                    onSelectTransaction={setSelectedTransaction}
                    onViewCalendar={() => setView('calendar')}
                    onViewTasks={() => setView('tasks')}
                    onViewBudgets={() => setView('budgets')}
                    onToggleTaskCompletion={handleToggleTask}
                />;
        }
    };
    
    const renderForm = () => {
        const formProps = {
            accounts: accounts,
            defaultCurrency: userProfile?.default_currency || 'DOP',
        };
        switch (formToShow) {
            case 'transaction':
                return <AddTransactionForm {...formProps} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={itemToEdit} />;
            case 'transfer':
                return <AddTransferForm {...formProps} onAddTransfer={handleAddTransfer} prefillData={prefillData} />;
            case 'account':
                return <AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={itemToEdit} />;
            case 'recurring':
                return <AddRecurringTransactionForm {...formProps} onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} recurringTransactionToEdit={itemToEdit} />;
            case 'task':
                return <AddTaskForm {...formProps} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} taskToEdit={itemToEdit} />;
            case 'budget':
                return <AddBudgetForm onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} budgetToEdit={itemToEdit} existingBudgets={budgets} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen font-sans pb-24">
            <Header
                userProfile={userProfile}
                unreadNotifications={unreadNotifications}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenNotifications={() => setIsNotificationsOpen(p => !p)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
            <main className="container mx-auto p-4">
                {formToShow ? (
                    <div>
                         <button onClick={closeForm} className="text-sm font-semibold mb-4">&larr; Volver</button>
                         {renderForm()}
                    </div>
                ) : renderView()}
            </main>

            {formToShow === null && <BottomNavBar activeView={view} setView={setView} openAddMenu={openAddMenu} openFijosMenu={openFijosMenu}/>}

            {isAddMenuOpen && <AddMenuModal onClose={() => setIsAddMenuOpen(false)} onSelect={handleSelectAddMenu} />}
            {isFijosMenuOpen && <FijosMenuModal onClose={() => setIsFijosMenuOpen(false)} setView={setView} />}
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} />}
            {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={handleCompleteTaskOnly} onCompleteWithTransaction={handleCompleteTaskWithTransaction} />}
            
            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={session.user} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />
            <NotificationsDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkAsRead={handleMarkNotificationRead} onMarkAllAsRead={handleMarkAllNotificationsRead} />
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={(t) => { setSelectedTransaction(t); setIsSearchOpen(false); }} />
        </div>
    );
};

export default App;