
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
// FIX: Add file extensions to fix module resolution errors.
import { supabase } from './lib/supabase.ts';
import type { View, Transaction, Account, UserProfile, RecurringTransaction, Task, Budget, Notification, Currency } from './types.ts';
import { calculateNextDueDate } from './utils/date.ts';
import { resizeImage } from './utils/image.ts';
import { COLOR_THEMES } from './constants.ts';

// Components
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import AccountsList from './components/AccountsList.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import AddMenuModal from './components/AddMenuModal.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import Auth from './components/Auth.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import GetStarted from './components/GetStarted.tsx';
import CalendarView from './components/CalendarView.tsx';
import TasksList from './components/TasksList.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
import SearchModal from './components/SearchModal.tsx';
import NotificationsDropdown from './components/NotificationsDropdown.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';

// A type for the state of modals
type ModalState = 
    | { type: 'addTransaction'; data?: null }
    | { type: 'editTransaction'; data: Transaction }
    | { type: 'addAccount'; data?: null }
    | { type: 'editAccount'; data: Account }
    | { type: 'transactionDetail'; data: Transaction }
    | { type: 'addMenu'; data?: null }
    | { type: 'addTransfer'; data?: { toAccountId: string } | null }
    | { type: 'addRecurring'; data?: null }
    | { type: 'editRecurring'; data: RecurringTransaction }
    | { type: 'settings'; data?: null }
    | { type: 'addTask'; data?: null }
    | { type: 'editTask'; data: Task }
    | { type: 'fijosMenu'; data?: null }
    | { type: 'completeTask'; data: Task }
    | { type: 'search'; data?: null }
    | { type: 'notifications'; data?: null }
    | { type: 'addBudget'; data?: null }
    | { type: 'editBudget'; data: Budget }
    | null;

const App: React.FC = () => {
    // Auth & Profile State
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPinLocked, setIsPinLocked] = useState(false);
    const [showGetStarted, setShowGetStarted] = useState(false);
    const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');

    // App Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // UI State
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [modalState, setModalState] = useState<ModalState>(null);
    
    // Derived State
    const unreadNotifications = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    // Auth subscription and session check
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (!session) {
                const hasSeenGetStarted = localStorage.getItem('hasSeenGetStarted');
                if (!hasSeenGetStarted) {
                    setShowGetStarted(true);
                }
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                setUserProfile(null);
                setTransactions([]);
                setAccounts([]);
                setRecurringTransactions([]);
                setTasks([]);
                setBudgets([]);
                setNotifications([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchData = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (profileError) throw profileError;
            setUserProfile(profileData);
            if (profileData.isPinEnabled && profileData.pin) {
                setIsPinLocked(true);
            }

            const tables = ['transactions', 'accounts', 'recurring_transactions', 'tasks', 'budgets', 'notifications'];
            const promises = tables.map(table => supabase.from(table).select('*').eq('user_id', userId));
            const [
                { data: transactionsData, error: transactionsError },
                { data: accountsData, error: accountsError },
                { data: recurringData, error: recurringError },
                { data: tasksData, error: tasksError },
                { data: budgetsData, error: budgetsError },
                { data: notificationsData, error: notificationsError },
            ] = await Promise.all(promises);

            if (transactionsError) throw transactionsError;
            if (accountsError) throw accountsError;
            if (recurringError) throw recurringError;
            if (tasksError) throw tasksError;
            if (budgetsError) throw budgetsError;
            if (notificationsError) throw notificationsError;
            
            setTransactions((transactionsData || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setAccounts(accountsData || []);
            setRecurringTransactions(recurringData || []);
            setTasks(tasksData || []);
            setBudgets(budgetsData || []);
            setNotifications((notificationsData || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (error: any) {
            console.error("Error fetching data:", error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (user) {
            fetchData(user.id);
        }
    }, [user, fetchData]);
    
    useEffect(() => {
        if (userProfile?.theme) {
            const theme = COLOR_THEMES.find(t => t.name === userProfile.theme);
            if (theme) {
                document.documentElement.style.setProperty('--color-brand-primary', theme.primary);
                document.documentElement.style.setProperty('--color-brand-secondary', theme.secondary);
            }
        }
        const darkMode = localStorage.getItem('theme') === 'dark';
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [userProfile?.theme]);

    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
        accounts.forEach(acc => { balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 }; });

        transactions.forEach(t => {
            const isDOP = t.currency === 'DOP';
            if (t.type === 'income') {
                if (balances[t.accountId]) isDOP ? balances[t.accountId].balanceDOP += t.amount : balances[t.accountId].balanceUSD += t.amount;
            } else if (t.type === 'expense') {
                if (balances[t.accountId]) isDOP ? balances[t.accountId].balanceDOP -= t.amount : balances[t.accountId].balanceUSD -= t.amount;
            } else if (t.type === 'transfer') {
                if (balances[t.accountId]) isDOP ? balances[t.accountId].balanceDOP -= t.amount : balances[t.accountId].balanceUSD -= t.amount;
                if (t.transferToAccountId && balances[t.transferToAccountId]) isDOP ? balances[t.transferToAccountId].balanceDOP += t.amount : balances[t.transferToAccountId].balanceUSD += t.amount;
            }
        });
        return balances;
    }, [transactions, accounts]);

    const uploadReceipt = async (file: File, transactionId: string): Promise<string | null> => {
        try {
            const resizedImage = await resizeImage(file, 800);
            const blob = await (await fetch(resizedImage)).blob();
            const fileName = `${user!.id}/${transactionId}_${Date.now()}.jpg`;
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, { contentType: 'image/jpeg' });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(data.path);
            return publicUrl;
        } catch(e) { console.error("Error uploading receipt:", e); return null; }
    };
    
    const handleAddTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id'>, receiptFile?: File) => {
        if (!user) return;
        const newId = uuidv4();
        let receiptImageUrl = undefined;
        if (receiptFile) receiptImageUrl = await uploadReceipt(receiptFile, newId);
        const newTransaction = { ...transactionData, id: newId, user_id: user.id, receiptImage: receiptImageUrl };
        const { error } = await supabase.from('transactions').insert(newTransaction);
        if (error) console.error(error); else {
            setTransactions(prev => [...prev, newTransaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setModalState(null);
        }
    };
    
    const handleUpdateTransaction = async (transactionUpdate: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        if (!user) return;
        let receiptImageUrl = transactionUpdate.receiptImage;
        if(receiptFile) receiptImageUrl = await uploadReceipt(receiptFile, transactionUpdate.id);
        const updatedData = { ...transactionUpdate, receiptImage: receiptImageUrl };
        const { error } = await supabase.from('transactions').update(updatedData).eq('id', transactionUpdate.id);
        if (error) console.error(error); else {
            setTransactions(prev => prev.map(t => t.id === transactionUpdate.id ? { ...t, ...updatedData } : t));
            setModalState(null);
        }
    };
    
    const handleDeleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) console.error(error); else {
            setTransactions(prev => prev.filter(t => t.id !== id));
            setModalState(null);
        }
    };

    const handleAddAccount = async (accountData: Omit<Account, 'id' | 'user_id'>) => {
        if (!user) return;
        const newAccount = { ...accountData, id: uuidv4(), user_id: user.id };
        const { error } = await supabase.from('accounts').insert(newAccount);
        if (error) console.error(error); else { setAccounts(prev => [...prev, newAccount]); setModalState(null); }
    };
    
    const handleUpdateAccount = async (accountUpdate: Partial<Account> & { id: string }) => {
        const { error } = await supabase.from('accounts').update(accountUpdate).eq('id', accountUpdate.id);
        if (error) console.error(error); else { setAccounts(prev => prev.map(a => a.id === accountUpdate.id ? { ...a, ...accountUpdate } : a)); setModalState(null); }
    };
    
    const handleDeleteAccount = async (id: string) => {
        if (!window.confirm('¿Seguro que quieres eliminar esta cuenta? Se eliminarán todos los movimientos asociados.')) return;
        const { error: txError } = await supabase.from('transactions').delete().eq('accountId', id);
        if (txError) { console.error(txError); return; }
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) console.error(error); else { setAccounts(prev => prev.filter(a => a.id !== id)); setTransactions(prev => prev.filter(t => t.accountId !== id)); }
    };

    const handleAddRecurring = async (data: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        if (!user) return;
        const nextDueDate = calculateNextDueDate(data.startDate, data.frequency);
        const newRec = { ...data, id: uuidv4(), user_id: user.id, nextDueDate };
        const { error } = await supabase.from('recurring_transactions').insert(newRec);
        if (error) console.error(error); else { setRecurringTransactions(prev => [...prev, newRec]); setModalState(null); }
    };
    
    const handleUpdateRecurring = async (data: Partial<RecurringTransaction> & { id: string }) => {
        const original = recurringTransactions.find(rt => rt.id === data.id); if (!original) return;
        const updatedData = { ...original, ...data }; const nextDueDate = calculateNextDueDate(updatedData.startDate, updatedData.frequency);
        const payload = { ...data, nextDueDate };
        const { error } = await supabase.from('recurring_transactions').update(payload).eq('id', data.id);
        if (error) console.error(error); else { setRecurringTransactions(prev => prev.map(rt => rt.id === data.id ? { ...rt, ...payload } : rt)); setModalState(null); }
    };
    
    const handleDeleteRecurring = async (id: string) => {
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (error) console.error(error); else setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
    };

    const handleAddTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'transactionId' | 'createdAt' | 'completedAt'>, transactionData?: Omit<Transaction, 'id' | 'user_id' | 'description'>) => {
        if (!user) return;
        let transactionId: string | undefined = undefined;
        if (transactionData) {
            const newTxId = uuidv4();
            const newTransaction = { ...transactionData, id: newTxId, user_id: user.id, description: taskData.title };
            const { error: txError } = await supabase.from('transactions').insert(newTransaction);
            if (txError) { console.error("Failed to create associated transaction:", txError); return; }
            transactionId = newTxId; setTransactions(prev => [...prev, newTransaction]);
        }
        const newTask: Omit<Task, 'id'> = { ...taskData, user_id: user.id, isCompleted: false, createdAt: new Date().toISOString(), transactionId };
        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) console.error(error); else { setTasks(prev => [...prev, data]); setModalState(null); }
    };
    
    const handleUpdateTask = async (data: Partial<Task> & { id: string }) => {
        const { error } = await supabase.from('tasks').update(data).eq('id', data.id);
        if (error) console.error(error); else { setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t)); setModalState(null); }
    };

    const handleToggleTaskCompletion = (task: Task) => {
        if (!task.isCompleted && task.transactionId) { setModalState({ type: 'completeTask', data: task }); return; }
        const update = { isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date().toISOString() : undefined };
        handleUpdateTask({ id: task.id, ...update });
    };

    const handleDeleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) console.error(error); else setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleAddBudget = async (data: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => {
        if (!user) return;
        const newBudget = { ...data, id: uuidv4(), user_id: user.id, created_at: new Date().toISOString(), period: 'monthly' as const };
        const { error } = await supabase.from('budgets').insert(newBudget);
        if (error) console.error(error); else { setBudgets(prev => [...prev, newBudget]); setModalState(null); }
    };

    const handleUpdateBudget = async (data: Partial<Budget> & { id: string }) => {
        const { error } = await supabase.from('budgets').update(data).eq('id', data.id);
        if (error) console.error(error); else { setBudgets(prev => prev.map(b => b.id === data.id ? { ...b, ...data } : b)); setModalState(null); }
    };

    const handleDeleteBudget = async (id: string) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) console.error(error); else setBudgets(prev => prev.filter(b => b.id !== id));
    };
    
    const handleUpdateProfile = async (profileUpdate: Partial<UserProfile>, avatarFile?: File | null) => {
        if (!user) return;
        let avatar_url = userProfile?.avatar_url;
        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
            if (uploadError) console.error('Error uploading avatar:', uploadError); else {
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName); avatar_url = data.publicUrl;
            }
        }
        const update = { ...profileUpdate, avatar_url, id: user.id };
        const { error } = await supabase.from('profiles').upsert(update);
        if (error) console.error(error); else setUserProfile(prev => ({...prev!, ...update}));
    };
    
    const handleMarkNotificationRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        if (error) console.error(error); else setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleMarkAllNotificationsRead = async () => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
        if (error) console.error(error); else setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };
    
    const handleLogout = async () => { await supabase.auth.signOut(); setModalState(null); };

    const handleSelectTransaction = (transaction: Transaction) => setModalState({ type: 'transactionDetail', data: transaction });
    const handleNavigateToAuth = (initialView: 'signIn' | 'signUp') => { localStorage.setItem('hasSeenGetStarted', 'true'); setAuthView(initialView); setShowGetStarted(false); };

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={handleSelectTransaction} onViewCalendar={() => setActiveView('calendar')} onViewTasks={() => setActiveView('tasks')} onViewBudgets={() => setActiveView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
            case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => setModalState({ type: 'addAccount'})} onDeleteAccount={handleDeleteAccount} onEditAccount={(acc) => setModalState({ type: 'editAccount', data: acc })} onUpdateAccount={handleUpdateAccount} onSelectTransaction={handleSelectTransaction} onAddMoneyToCard={(card) => setModalState({ type: 'addTransfer', data: { toAccountId: card.id } })} />;
            case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={handleSelectTransaction} onDeleteTransaction={handleDeleteTransaction} />;
            case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={handleDeleteRecurring} onEdit={(rt) => setModalState({type: 'editRecurring', data: rt})} onAdd={() => setModalState({type: 'addRecurring'})} />;
            case 'tasks': return <TasksList tasks={tasks} onToggleCompletion={handleToggleTaskCompletion} onDeleteTask={handleDeleteTask} onEditTask={(task) => setModalState({type: 'editTask', data: task})} onAddTask={() => setModalState({type: 'addTask'})} />;
            case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => setModalState({type: 'addBudget'})} onEditBudget={(b) => setModalState({type: 'editBudget', data: b})} onDeleteBudget={handleDeleteBudget} />;
            default: return <div>Not implemented</div>;
        }
    };
    
    const renderModalContent = () => {
        if (!modalState) return null;
        switch (modalState.type) {
            case 'addTransaction':
            case 'editTransaction': return <AddTransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={modalState.type === 'editTransaction' ? modalState.data : null} accounts={accounts} defaultCurrency={userProfile?.default_currency} />;
            case 'addAccount':
            case 'editAccount': return <AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={modalState.type === 'editAccount' ? modalState.data : null} />;
            case 'transactionDetail': return <TransactionDetailModal transaction={modalState.data} accounts={accounts} onClose={() => setModalState(null)} onDelete={handleDeleteTransaction} />;
            case 'addMenu': return <AddMenuModal onClose={() => setModalState(null)} onSelect={(type) => setModalState(type === 'transaction' ? {type: 'addTransaction'} : type === 'transfer' ? {type: 'addTransfer', data: null} : type === 'recurring' ? {type: 'addRecurring'} : {type: 'addTask'})} />;
            case 'addTransfer': return <AddTransferForm onAddTransfer={(data) => handleAddTransaction({ ...data, type: 'transfer', description: 'Transferencia', category: 'Transferencia' })} accounts={accounts} defaultCurrency={userProfile?.default_currency} prefillData={modalState.data} />;
            case 'addRecurring':
            case 'editRecurring': return <AddRecurringTransactionForm onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} recurringTransactionToEdit={modalState.type === 'editRecurring' ? modalState.data : null} accounts={accounts} defaultCurrency={userProfile?.default_currency} />;
            case 'addTask':
            case 'editTask': return <AddTaskForm onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} taskToEdit={modalState.type === 'editTask' ? modalState.data : null} accounts={accounts} defaultCurrency={userProfile?.default_currency} />;
            case 'fijosMenu': return <FijosMenuModal onClose={() => setModalState(null)} setView={view => { setActiveView(view); setModalState(null); }} />;
            case 'completeTask': return <CompleteTaskModal task={modalState.data} onClose={() => setModalState(null)} onCompleteOnly={() => { handleUpdateTask({ id: modalState.data.id, isCompleted: true, completedAt: new Date().toISOString() }); setModalState(null); }} onCompleteWithTransaction={() => { /* Logic to open transaction form prefilled */ setModalState(null); }} />;
            case 'search': return <SearchModal isOpen={true} onClose={() => setModalState(null)} transactions={transactions} accounts={accounts} onSelectTransaction={handleSelectTransaction} />;
            case 'notifications': return <NotificationsDropdown isOpen={true} onClose={() => setModalState(null)} notifications={notifications} onMarkAsRead={handleMarkNotificationRead} onMarkAllAsRead={handleMarkAllNotificationsRead} />;
            case 'addBudget':
            case 'editBudget': return <AddBudgetForm onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} budgetToEdit={modalState.type === 'editBudget' ? modalState.data : null} existingBudgets={budgets} />;
        }
        return null;
    };
    
    if (isLoading) return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-primary"></div></div>;
    if (showGetStarted) return <GetStarted onNavigateToAuth={handleNavigateToAuth} />;
    if (!user) return <Auth view={authView} setView={setAuthView} />;
    if (isPinLocked && userProfile?.pin) return <PinLockScreen correctPin={userProfile.pin} onUnlock={() => setIsPinLocked(false)} />;

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-white pb-24">
            <Header 
                userProfile={userProfile} 
                unreadNotifications={unreadNotifications}
                onOpenSearch={() => setModalState({ type: 'search' })}
                onOpenNotifications={() => setModalState(m => m?.type === 'notifications' ? null : { type: 'notifications' })}
                onOpenSettings={() => setModalState({ type: 'settings' })}
            />
            <main className="container mx-auto p-4">
                {renderContent()}
            </main>
            <BottomNavBar 
                activeView={activeView}
                setView={setActiveView}
                openAddMenu={() => setModalState({ type: 'addMenu' })}
                openFijosMenu={() => setModalState({ type: 'fijosMenu'})}
            />
            {modalState && modalState.type !== 'settings' && modalState.type !== 'search' && modalState.type !== 'notifications' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setModalState(null)}>
                    <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        {renderModalContent()}
                    </div>
                </div>
            )}
            {renderModalContent()}
            <SettingsPanel 
                isOpen={modalState?.type === 'settings'} 
                onClose={() => setModalState(null)} 
                user={user} 
                userProfile={userProfile} 
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
            />
        </div>
    );
};

export default App;
