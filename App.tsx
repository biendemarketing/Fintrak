import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
// FIX: Add file extensions to fix module resolution errors.
import type { View, Transaction, Account, RecurringTransaction, Task, UserProfile, Budget, Notification } from './types.ts';
import { calculateNextDueDate } from './utils/date.ts';
import { resizeImage } from './utils/image.ts';

// Components
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import AccountsList from './components/AccountsList.tsx';
import CalendarView from './components/CalendarView.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import TasksList from './components/TasksList.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import AddMenuModal from './components/AddMenuModal.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import GetStarted from './components/GetStarted.tsx';
import Auth from './components/Auth.tsx';
import NotificationsDropdown from './components/NotificationsDropdown.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import SearchModal from './components/SearchModal.tsx';

// Example data for first-time users
import { exampleAccounts, exampleTransactions, exampleRecurringTransactions, exampleTasks } from './data/exampleData.ts';

const App: React.FC = () => {
    // Auth & User State
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPinLocked, setIsPinLocked] = useState(true); // Assume locked until proven otherwise
    const [showGetStarted, setShowGetStarted] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');
    
    // UI State
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isFijosMenuOpen, setIsFijosMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    // Modal State
    const [modal, setModal] = useState<string | null>(null);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [addTransferPrefill, setAddTransferPrefill] = useState<{ toAccountId: string } | null>(null);

    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Theme setup
    useEffect(() => {
        const localTheme = localStorage.getItem('theme');
        if (localTheme === 'dark' || (!localTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Session handling
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (!session) {
                // If user logs out, clear all data and show auth
                setUserProfile(null);
                setTransactions([]);
                setAccounts([]);
                setRecurringTransactions([]);
                setTasks([]);
                setBudgets([]);
                setNotifications([]);
                setIsPinLocked(true);
                setShowAuth(true);
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
        }).finally(() => {
            const hasVisited = localStorage.getItem('hasVisitedFinTrack');
            if (!hasVisited) {
                setShowGetStarted(true);
            }
            setLoading(false);
        });
        
        return () => subscription.unsubscribe();
    }, []);
    
    // Fetch user profile and check PIN status
    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (error && error.code !== 'PGRST116') { // 'PGRST116' is "exact one row not found"
                    console.error('Error fetching profile:', error);
                } else if (data) {
                    setUserProfile(data);
                    // PIN check
                    if (data.isPinEnabled && data.pin) {
                        setIsPinLocked(true); // Re-lock on user change, for safety
                    } else {
                        setIsPinLocked(false);
                    }
                } else {
                    // No profile found, could be a new user.
                    // This case is handled in on-signup trigger or here.
                    // For now, we assume profile exists or is created on signup.
                    setIsPinLocked(false);
                }
            };
            fetchProfile();
            setShowAuth(false);
            setShowGetStarted(false);
        } else if (!loading) {
            if (!showGetStarted) {
                setShowAuth(true);
            }
        }
    }, [user, loading, showGetStarted]);

    // Data Fetching
    const fetchData = useCallback(async () => {
        if (!user) return;
        const [transactionsRes, accountsRes, recurringRes, tasksRes, budgetsRes, notificationsRes] = await Promise.all([
            supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('time', { ascending: false }),
            supabase.from('accounts').select('*').eq('user_id', user.id).order('name'),
            supabase.from('recurring_transactions').select('*').eq('user_id', user.id),
            supabase.from('tasks').select('*').eq('user_id', user.id).order('dueDate'),
            supabase.from('budgets').select('*').eq('user_id', user.id),
            supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        setTransactions(transactionsRes.data || []);
        setAccounts(accountsRes.data || []);
        setRecurringTransactions(recurringRes.data || []);
        setTasks(tasksRes.data || []);
        setBudgets(budgetsRes.data || []);
        setNotifications(notificationsRes.data || []);
    }, [user]);

    useEffect(() => {
        if (user && userProfile && !isPinLocked) {
            fetchData();
        }
    }, [user, userProfile, isPinLocked, fetchData]);
    
     // Apply color theme from profile
    useEffect(() => {
        if (userProfile?.theme) {
            const root = document.documentElement;
            const theme = userProfile.theme;
            // This is a simplified example. In a real app, you might fetch theme colors.
            // Using placeholder values that could be defined in CSS.
            root.setAttribute('data-theme', theme);
        }
    }, [userProfile?.theme]);


    // Calculated State
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
        accounts.forEach(acc => {
            balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
        });

        transactions.forEach(t => {
            const key = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
            if (t.type === 'income') {
                if (balances[t.accountId]) balances[t.accountId][key] += t.amount;
            } else if (t.type === 'expense') {
                if (balances[t.accountId]) balances[t.accountId][key] -= t.amount;
            } else if (t.type === 'transfer' && t.transferToAccountId) {
                if (balances[t.accountId]) balances[t.accountId][key] -= t.amount;
                if (balances[t.transferToAccountId]) balances[t.transferToAccountId][key] += t.amount;
            }
        });
        return balances;
    }, [transactions, accounts]);

    const unreadNotifications = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    // CRUD Handlers
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'transferToAccountId'>, receiptFile?: File) => {
        if (!user) return;
        let receiptImageUrl: string | undefined = undefined;
        if (receiptFile) {
            const filePath = `${user.id}/${Date.now()}_${receiptFile.name}`;
            const resizedDataUrl = await resizeImage(receiptFile, 1024);
            const blob = await (await fetch(resizedDataUrl)).blob();

            const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, blob);
            if (!uploadError) {
                const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
                receiptImageUrl = data.publicUrl;
            } else {
                console.error("Upload error:", uploadError);
            }
        }
        
        const { data, error } = await supabase.from('transactions').insert([{ ...transaction, user_id: user.id, receiptImage: receiptImageUrl }]).select();
        if (error) console.error("Error adding transaction:", error);
        else if (data) setTransactions(prev => [data[0], ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setModal(null);
    };

    const handleUpdateTransaction = async (transactionUpdate: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        if (!user) return;
        let receiptImageUrl = transactionUpdate.receiptImage;
        if (receiptFile) {
            const filePath = `${user.id}/${Date.now()}_${receiptFile.name}`;
            const resizedDataUrl = await resizeImage(receiptFile, 1024);
            const blob = await (await fetch(resizedDataUrl)).blob();

            const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, blob);
            if (!uploadError) {
                const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
                receiptImageUrl = data.publicUrl;
            } else console.error("Upload error:", uploadError);
        }

        const { data, error } = await supabase.from('transactions').update({ ...transactionUpdate, receiptImage: receiptImageUrl }).eq('id', transactionUpdate.id).select();
        if (error) console.error("Error updating transaction:", error);
        else if (data) setTransactions(prev => prev.map(t => t.id === data[0].id ? data[0] : t));
        setModal(null);
        setTransactionToEdit(null);
    };

    const handleDeleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) console.error("Error deleting transaction:", error);
        else setTransactions(prev => prev.filter(t => t.id !== id));
        setSelectedTransaction(null);
    };

    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('accounts').insert([{ ...account, user_id: user.id }]).select();
        if (error) console.error("Error adding account:", error);
        else if (data) setAccounts(prev => [...prev, data[0]]);
        setModal(null);
    };

    const handleUpdateAccount = async (accountUpdate: Partial<Account> & { id: string }) => {
        const { data, error } = await supabase.from('accounts').update(accountUpdate).eq('id', accountUpdate.id).select();
        if (error) console.error("Error updating account:", error);
        else if (data) setAccounts(prev => prev.map(a => a.id === data[0].id ? data[0] : a));
        setModal(null);
        setAccountToEdit(null);
    };

    const handleDeleteAccount = async (id: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta cuenta? Se eliminarán todos los movimientos asociados.")) return;
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) console.error("Error deleting account:", error);
        else {
            setAccounts(prev => prev.filter(a => a.id !== id));
            fetchData(); // Refetch to remove associated transactions
        }
    };

    const handleAddTransfer = async (transfer: Omit<Transaction, 'id' | 'user_id' | 'type' | 'category' | 'description'>) => {
        if (!user) return;
        const transferData: Omit<Transaction, 'id' | 'user_id'> = {
            ...transfer,
            type: 'transfer',
            category: 'Transferencia',
            description: 'Transferencia entre cuentas'
        };
        const { data, error } = await supabase.from('transactions').insert([{ ...transferData, user_id: user.id }]).select();
        if (error) console.error("Error adding transfer:", error);
        else if (data) setTransactions(prev => [data[0], ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setModal(null);
        setAddTransferPrefill(null);
    };

    const handleAddRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        if (!user) return;
        const nextDueDate = calculateNextDueDate(rec.startDate, rec.frequency);
        const { data, error } = await supabase.from('recurring_transactions').insert([{ ...rec, user_id: user.id, nextDueDate }]).select();
        if (error) console.error("Error adding recurring transaction:", error);
        else if (data) setRecurringTransactions(prev => [...prev, data[0]]);
        setModal(null);
    };

    const handleUpdateRecurring = async (recUpdate: Partial<RecurringTransaction> & { id: string }) => {
        const original = recurringTransactions.find(r => r.id === recUpdate.id);
        if (!original) return;
        const nextDueDate = calculateNextDueDate(recUpdate.startDate || original.startDate, recUpdate.frequency || original.frequency);
        const { data, error } = await supabase.from('recurring_transactions').update({ ...recUpdate, nextDueDate }).eq('id', recUpdate.id).select();
        if (error) console.error("Error updating recurring tx:", error);
        else if (data) setRecurringTransactions(prev => prev.map(r => r.id === data[0].id ? data[0] : r));
        setModal(null);
        setRecurringToEdit(null);
    };

    const handleDeleteRecurring = async (id: string) => {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (error) console.error("Error deleting recurring tx:", error);
        else setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    };

    const handleAddTask = async (task: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'createdAt' | 'completedAt' | 'transactionId'>, transactionData?: any) => {
        if (!user) return;
        let transactionId: string | undefined = undefined;
        if(transactionData) {
            const { data, error } = await handleAddTransactionWithTask(transactionData, task.title);
            if(error) { console.error("Error creating associated tx:", error); return; }
            transactionId = data?.[0]?.id;
        }

        const taskPayload = { ...task, user_id: user.id, isCompleted: false, createdAt: new Date().toISOString(), transactionId };
        const { data, error } = await supabase.from('tasks').insert([taskPayload]).select();
        if (error) console.error("Error adding task:", error);
        else if (data) setTasks(prev => [...prev, data[0]]);
        setModal(null);
    };
    
    // Helper to add a transaction and return its ID for a task
    const handleAddTransactionWithTask = async (transaction: any, description: string) => {
         if (!user) return { data: null, error: 'No user' };
         return supabase.from('transactions').insert([{ ...transaction, description, user_id: user.id }]).select('id');
    };

    const handleUpdateTask = async (taskUpdate: Partial<Task> & { id: string }) => {
        const { data, error } = await supabase.from('tasks').update(taskUpdate).eq('id', taskUpdate.id).select();
        if (error) console.error("Error updating task:", error);
        else if (data) setTasks(prev => prev.map(t => t.id === data[0].id ? data[0] : t));
        setModal(null);
        setTaskToEdit(null);
    };

    const handleToggleTaskCompletion = async (task: Task) => {
        const isCompleting = !task.isCompleted;
        // Check if completing a task that was created with a transaction, but the tx doesn't exist yet
        if (isCompleting && task.transactionId && !transactions.find(t => t.id === task.transactionId)) {
            // Find the original transaction data from the task creation (not implemented in this version, would require storing it)
            // As a fallback, we can prompt the user to create it.
            setTaskToComplete(task);
            return;
        }
        
        const update = { isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date().toISOString() : null };
        const { data, error } = await supabase.from('tasks').update(update).eq('id', task.id).select();
        if (error) console.error("Error toggling task:", error);
        else if (data) setTasks(prev => prev.map(t => t.id === data[0].id ? data[0] : t));
    };
    
    const handleCompleteTaskWithTransaction = async () => {
        if(!taskToComplete) return;
        // This flow is simplified: we open a new transaction form.
        // The title of the task is used as the description.
        setModal('addTransaction');
        // A more robust solution would pre-fill based on data stored when the task was created.
        setTaskToComplete(null);
    };

    const handleCompleteTaskOnly = async () => {
        if(!taskToComplete) return;
        const update = { isCompleted: true, completedAt: new Date().toISOString() };
        const { data, error } = await supabase.from('tasks').update(update).eq('id', taskToComplete.id).select();
        if (error) console.error("Error toggling task:", error);
        else if (data) setTasks(prev => prev.map(t => t.id === data[0].id ? data[0] : t));
        setTaskToComplete(null);
    };

    const handleDeleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) console.error("Error deleting task:", error);
        else setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleAddBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => {
        if(!user) return;
        const payload = { ...budget, user_id: user.id, period: 'monthly' as const, created_at: new Date().toISOString() };
        const { data, error } = await supabase.from('budgets').insert([payload]).select();
        if(error) console.error("Error adding budget:", error);
        else if (data) setBudgets(prev => [...prev, data[0]]);
        setModal(null);
    };
    
    const handleUpdateBudget = async (budgetUpdate: Partial<Budget> & { id: string }) => {
        const { data, error } = await supabase.from('budgets').update(budgetUpdate).eq('id', budgetUpdate.id).select();
        if(error) console.error("Error updating budget:", error);
        else if (data) setBudgets(prev => prev.map(b => b.id === data[0].id ? data[0] : b));
        setModal(null);
        setBudgetToEdit(null);
    };

    const handleDeleteBudget = async (id: string) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if(error) console.error("Error deleting budget:", error);
        else setBudgets(prev => prev.filter(b => b.id !== id));
    };
    
    const handleUpdateProfile = async (profileUpdate: Partial<UserProfile>, avatarFile?: File | null) => {
        if (!user) return;
        let avatar_url = userProfile?.avatar_url;

        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;
            let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
            if (uploadError) {
                console.error('Error uploading avatar:', uploadError);
            } else {
                 const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                 avatar_url = data.publicUrl;
            }
        }
        
        const update = { ...profileUpdate, id: user.id, avatar_url, updated_at: new Date() };
        const { data, error } = await supabase.from('profiles').upsert(update, { onConflict: 'id' }).select().single();
        if (error) console.error("Error updating profile:", error);
        else if (data) setUserProfile(data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsSettingsOpen(false);
    };

    const handleMarkNotificationRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        if(!error) setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
    };

    const handleMarkAllNotificationsRead = async () => {
        if(!user) return;
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        if(!error) setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    };
    
    // UI Handlers
    const openAddMenu = () => {
        closeAllModals();
        setIsAddMenuOpen(true);
    };
    
    const openFijosMenu = () => {
        closeAllModals();
        setIsFijosMenuOpen(true);
    };

    const handleSelectAdd = (type: string) => {
        setIsAddMenuOpen(false);
        switch (type) {
            case 'transaction': setModal('addTransaction'); break;
            case 'transfer': setModal('addTransfer'); break;
            case 'recurring': setModal('addRecurring'); break;
            case 'task': setModal('addTask'); break;
        }
    };
    
    const openEditor = (item: any, type: string) => {
        closeAllModals();
        switch (type) {
            case 'transaction': setTransactionToEdit(item); setModal('addTransaction'); break;
            case 'account': setAccountToEdit(item); setModal('addAccount'); break;
            case 'recurring': setRecurringToEdit(item); setModal('addRecurring'); break;
            case 'task': setTaskToEdit(item); setModal('addTask'); break;
            case 'budget': setBudgetToEdit(item); setModal('addBudget'); break;
        }
    };

    const closeAllModals = () => {
        setIsAddMenuOpen(false);
        setIsFijosMenuOpen(false);
        setModal(null);
        setTransactionToEdit(null);
        setAccountToEdit(null);
        setRecurringToEdit(null);
        setTaskToEdit(null);
        setBudgetToEdit(null);
        setSelectedTransaction(null);
        setTaskToComplete(null);
        setAddTransferPrefill(null);
    };

    const handleNavigateToAuth = (initialView: 'signIn' | 'signUp') => {
        setAuthView(initialView);
        setShowGetStarted(false);
        setShowAuth(true);
        localStorage.setItem('hasVisitedFinTrack', 'true');
    };
    
    const handleSeedData = async () => {
        if (!user || accounts.length > 0) return;
        
        const accountPayloads = exampleAccounts.map(acc => ({ ...acc, user_id: user.id }));
        const { data: newAccounts, error: accError } = await supabase.from('accounts').insert(accountPayloads).select();
        
        if (accError || !newAccounts) { console.error("Seeding error (accounts):", accError); return; }
        
        const mainDopAccount = newAccounts.find(a => a.name === 'Cuenta Principal');
        const cardAccount = newAccounts.find(a => a.name === 'Tarjeta Gold');
        const usdAccount = newAccounts.find(a => a.name === 'Ahorros Dólares');

        const transactionPayloads = exampleTransactions.map((tx, i) => {
            let accountId;
            if (tx.currency === 'USD') accountId = usdAccount?.id;
            else if (i % 2 === 0) accountId = mainDopAccount?.id;
            else accountId = cardAccount?.id;
            
            return { ...tx, user_id: user.id, accountId: accountId };
        }).filter(tx => tx.accountId);
        await supabase.from('transactions').insert(transactionPayloads);

        const recurringPayloads = exampleRecurringTransactions.map(rt => ({
            ...rt, user_id: user.id, accountId: mainDopAccount?.id, nextDueDate: calculateNextDueDate(rt.startDate, rt.frequency)
        })).filter(rt => rt.accountId);
        await supabase.from('recurring_transactions').insert(recurringPayloads);

        const taskPayloads = exampleTasks.map(t => ({...t, user_id: user.id, createdAt: new Date().toISOString() }));
        await supabase.from('tasks').insert(taskPayloads);

        fetchData(); 
    };

    // Render logic
    if (loading) {
        return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;
    }
    
    if (showGetStarted) {
        return <GetStarted onNavigateToAuth={handleNavigateToAuth} />;
    }

    if (!session || showAuth) {
        return <Auth onBack={() => { setShowAuth(false); setShowGetStarted(true); }} initialView={authView} />;
    }
    
    if (userProfile?.isPinEnabled && isPinLocked) {
        return <PinLockScreen correctPin={userProfile.pin!} onUnlock={() => setIsPinLocked(false)} />;
    }
    
    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setActiveView('calendar')} onViewTasks={() => setActiveView('tasks')} onViewBudgets={() => setActiveView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
            case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => setModal('addAccount')} onDeleteAccount={handleDeleteAccount} onEditAccount={(acc) => openEditor(acc, 'account')} onUpdateAccount={handleUpdateAccount} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={(card) => { setAddTransferPrefill({toAccountId: card.id}); setModal('addTransfer'); }} />;
            case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={handleDeleteTransaction} />;
            case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onAdd={() => setModal('addRecurring')} onEdit={(rec) => openEditor(rec, 'recurring')} onDelete={handleDeleteRecurring} />;
            case 'tasks': return <TasksList tasks={tasks} onAddTask={() => setModal('addTask')} onEditTask={(task) => openEditor(task, 'task')} onDeleteTask={handleDeleteTask} onToggleCompletion={handleToggleTaskCompletion} />;
            case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => setModal('addBudget')} onEditBudget={(b) => openEditor(b, 'budget')} onDeleteBudget={handleDeleteBudget} />;
            default: return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setActiveView('calendar')} onViewTasks={() => setActiveView('tasks')} onViewBudgets={() => setActiveView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
        }
    };
    
    if(userProfile && accounts.length === 0 && transactions.length === 0 && !loading && modal === null) {
        return (
            <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center p-4">
                <div className="text-center text-white max-w-md">
                    <h1 className="text-3xl font-bold">¡Bienvenido a FinTrack, {userProfile?.first_name || 'Usuario'}!</h1>
                    <p className="mt-4 text-neutral-300">Parece que todo está vacío. ¿Quieres que agreguemos algunos datos de ejemplo para que puedas explorar la aplicación?</p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={handleSeedData} className="px-6 py-3 bg-brand-primary rounded-lg font-semibold hover:bg-brand-primary/90">Sí, agregar datos de ejemplo</button>
                        <button onClick={() => setModal('addAccount')} className="px-6 py-3 bg-neutral-700 rounded-lg font-semibold hover:bg-neutral-600">No, empezaré de cero</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen pb-24">
            <Header
                userProfile={userProfile}
                unreadNotifications={unreadNotifications}
                onOpenSearch={() => setModal('search')}
                onOpenNotifications={() => setIsNotificationsOpen(pr => !pr)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
            
            <main className="container mx-auto p-4">
                {renderView()}
            </main>

            <BottomNavBar activeView={activeView} setView={setActiveView} openAddMenu={openAddMenu} openFijosMenu={openFijosMenu} />
            
            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />
            <NotificationsDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkAsRead={handleMarkNotificationRead} onMarkAllAsRead={handleMarkAllNotificationsRead} />
            <SearchModal isOpen={modal === 'search'} onClose={closeAllModals} transactions={transactions} accounts={accounts} onSelectTransaction={(t) => { setSelectedTransaction(t); setModal(null); }} />

            {/* Form Modals */}
            {modal && !['search'].includes(modal) &&
                <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4" onClick={closeAllModals}>
                    <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        {modal === 'addTransaction' && <AddTransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={transactionToEdit} accounts={accounts} defaultCurrency={userProfile?.default_currency} />}
                        {modal === 'addAccount' && <AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={accountToEdit} />}
                        {modal === 'addTransfer' && <AddTransferForm onAddTransfer={handleAddTransfer} accounts={accounts} defaultCurrency={userProfile?.default_currency} prefillData={addTransferPrefill} />}
                        {modal === 'addRecurring' && <AddRecurringTransactionForm onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} recurringTransactionToEdit={recurringToEdit} accounts={accounts} defaultCurrency={userProfile?.default_currency} />}
                        {modal === 'addTask' && <AddTaskForm onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} taskToEdit={taskToEdit} accounts={accounts} defaultCurrency={userProfile?.default_currency} />}
                        {modal === 'addBudget' && <AddBudgetForm onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} budgetToEdit={budgetToEdit} existingBudgets={budgets} />}
                    </div>
                </div>
            }
            
            {isAddMenuOpen && <AddMenuModal onClose={closeAllModals} onSelect={handleSelectAdd} />}
            {isFijosMenuOpen && <FijosMenuModal onClose={closeAllModals} setView={(v) => { setActiveView(v); closeAllModals(); }} />}
            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={closeAllModals} onDelete={handleDeleteTransaction} />}
            {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={closeAllModals} onCompleteWithTransaction={handleCompleteTaskWithTransaction} onCompleteOnly={handleCompleteTaskOnly} />}
        </div>
    );
};

export default App;
