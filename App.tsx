
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase.ts';
import type { View, Transaction, Account, UserProfile, RecurringTransaction, Task, Budget, Notification, Currency } from './types.ts';
import { resizeImage } from './utils/image.ts';
import { calculateNextDueDate } from './utils/date.ts';

// Component Imports
import Auth from './components/Auth.tsx';
import GetStarted from './components/GetStarted.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';
import AccountsList from './components/AccountsList.tsx';
import CalendarView from './components/CalendarView.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import TasksList from './components/TasksList.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import SearchModal from './components/SearchModal.tsx';
import NotificationsDropdown from './components/NotificationsDropdown.tsx';
import AddMenuModal from './components/AddMenuModal.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
import { COLOR_THEMES } from './constants.ts';

const App: React.FC = () => {
    // Auth State
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [isAppLocked, setIsAppLocked] = useState(true);
    const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');
    const [hasSeenGetStarted, setHasSeenGetStarted] = useState(() => localStorage.getItem('hasSeenGetStarted') === 'true');
    const [activeView, setActiveView] = useState<View>('dashboard');
    
    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // Modal & Panel State
    const [modal, setModal] = useState<string | null>(null);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [fijosMenuOpen, setFijosMenuOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Auth effect
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (!session) {
                setLoading(false);
                setIsAppLocked(true); // Re-lock when logged out
            }
        });

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    // Data fetching effect
    const fetchData = useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const [profile, accounts, transactions, recurring, tasks, budgets, notifications] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('accounts').select('*').eq('user_id', userId).order('name'),
                supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
                supabase.from('recurring_transactions').select('*').eq('user_id', userId).order('description'),
                supabase.from('tasks').select('*').eq('user_id', userId).order('due_date'),
                supabase.from('budgets').select('*').eq('user_id', userId),
                supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            ]);

            if (profile.error) throw profile.error;
            setUserProfile(profile.data);

            if (accounts.error) throw accounts.error;
            setAccounts(accounts.data);

            if (transactions.error) throw transactions.error;
            setTransactions(transactions.data);
            
            if (recurring.error) throw recurring.error;
            setRecurring(recurring.data.map(r => ({ ...r, nextDueDate: calculateNextDueDate(r.startDate, r.frequency) })));

            if (tasks.error) throw tasks.error;
            setTasks(tasks.data);

            if (budgets.error) throw budgets.error;
            setBudgets(budgets.data);

            if (notifications.error) throw notifications.error;
            setNotifications(notifications.data);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchData(user.id);
        }
    }, [user, fetchData]);

    // Theme effect
    useEffect(() => {
        if (userProfile?.theme) {
            const theme = COLOR_THEMES.find(t => t.name === userProfile.theme) || COLOR_THEMES[0];
            document.documentElement.style.setProperty('--color-brand-primary', theme.primary);
            document.documentElement.style.setProperty('--color-brand-secondary', theme.secondary);
        }
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [userProfile?.theme]);
    
    // Derived state
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
        accounts.forEach(acc => {
            balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
        });

        transactions.forEach(t => {
            if (!balances[t.accountId]) return;

            const amount = t.amount;
            const balanceKey = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';

            if (t.type === 'income') {
                balances[t.accountId][balanceKey] += amount;
            } else if (t.type === 'expense') {
                balances[t.accountId][balanceKey] -= amount;
            } else if (t.type === 'transfer') {
                balances[t.accountId][balanceKey] -= amount;
                if (t.transferToAccountId && balances[t.transferToAccountId]) {
                    balances[t.transferToAccountId][balanceKey] += amount;
                }
            }
        });
        return balances;
    }, [transactions, accounts]);

    const unreadNotifications = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    // CRUD Handlers
    const uploadFile = async (file: File, bucket: string, path: string) => {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    };
    
    // ... all other handlers (add, update, delete for each data type)

    const handleAddOrUpdate = async (tableName: string, data: any, id?: string) => {
        const query = id
            ? supabase.from(tableName).update(data).eq('id', id)
            : supabase.from(tableName).insert({ ...data, user_id: user!.id }).select();
            
        const { data: result, error } = await query.select().single();
        if (error) throw error;
        return result;
    };

    const handleDelete = async (tableName: string, id: string) => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
    };

    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id'>, receiptFile?: File) => {
        try {
            if (receiptFile) {
                const resized = await resizeImage(receiptFile, 1024);
                const blob = await (await fetch(resized)).blob();
                const fileToUpload = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const filePath = `${user!.id}/receipts/${fileToUpload.name}`;
                transaction.receiptImage = await uploadFile(fileToUpload, 'images', filePath);
            }
            const newTransaction = await handleAddOrUpdate('transactions', transaction) as Transaction;
            setTransactions(prev => [newTransaction, ...prev]);
            setModal(null);
        } catch (error) {
            console.error("Error adding transaction:", error);
            alert("Error al agregar movimiento.");
        }
    };

    const handleUpdateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        try {
            if (receiptFile) {
                const resized = await resizeImage(receiptFile, 1024);
                const blob = await (await fetch(resized)).blob();
                const fileToUpload = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const filePath = `${user!.id}/receipts/${fileToUpload.name}`;
                transaction.receiptImage = await uploadFile(fileToUpload, 'images', filePath);
            }
            const updatedTransaction = await handleAddOrUpdate('transactions', transaction, transaction.id) as Transaction;
            setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
            setModal(null);
            setTransactionToEdit(null);
        } catch (error) {
            console.error("Error updating transaction:", error);
            alert("Error al actualizar movimiento.");
        }
    };
    
    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar este movimiento?")) return;
        try {
            await handleDelete('transactions', id);
            setTransactions(prev => prev.filter(t => t.id !== id));
            setSelectedTransaction(null);
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Error al eliminar movimiento.");
        }
    };
    
    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        try {
            const newAccount = await handleAddOrUpdate('accounts', account) as Account;
            setAccounts(prev => [...prev, newAccount]);
            setModal(null);
        } catch (error) {
            console.error("Error adding account:", error);
        }
    };
    
    const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => {
        try {
            const updatedAccount = await handleAddOrUpdate('accounts', account, account.id) as Account;
            setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
            setModal(null);
            setAccountToEdit(null);
        } catch (error) {
            console.error("Error updating account:", error);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta cuenta? Esto no eliminará los movimientos asociados.")) return;
        try {
            await handleDelete('accounts', id);
            setAccounts(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting account:", error);
        }
    };
    
    const handleUpdateProfile = async (profileUpdate: Partial<UserProfile>, avatarFile?: File | null) => {
        try {
            if (avatarFile) {
                 const resized = await resizeImage(avatarFile, 200);
                 const blob = await (await fetch(resized)).blob();
                 const fileToUpload = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
                 const filePath = `${user!.id}/avatars/${fileToUpload.name}`;
                 profileUpdate.avatar_url = await uploadFile(fileToUpload, 'images', filePath);
            }
            const updatedProfile = await handleAddOrUpdate('profiles', profileUpdate, user!.id) as UserProfile;
            setUserProfile(updatedProfile);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSettingsOpen(false);
    };

    const handleSetGetStarted = () => {
        localStorage.setItem('hasSeenGetStarted', 'true');
        setHasSeenGetStarted(true);
    };

    const openModalWithItem = (modalName: string, item: any, editType: string) => {
        switch (editType) {
            case 'transaction': setTransactionToEdit(item); break;
            case 'account': setAccountToEdit(item); break;
            case 'recurring': setRecurringToEdit(item); break;
            case 'task': setTaskToEdit(item); break;
            case 'budget': setBudgetToEdit(item); break;
        }
        setModal(modalName);
    };

    // Render logic
    if (loading && !session) return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;
    
    if (!session) {
        if (!hasSeenGetStarted) {
            return <GetStarted onNavigateToAuth={(view) => { handleSetGetStarted(); setAuthView(view); }} />;
        }
        return <Auth key={authView} initialView={authView} onNavigateHome={() => window.location.reload()} />;
    }

    if (userProfile?.isPinEnabled && userProfile.pin && isAppLocked) {
        return <PinLockScreen correctPin={userProfile.pin} onUnlock={() => setIsAppLocked(false)} />;
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard 
                            transactions={transactions} 
                            accounts={accounts} 
                            tasks={tasks}
                            budgets={budgets}
                            accountBalances={accountBalances}
                            onDeleteTransaction={handleDeleteTransaction}
                            onSelectTransaction={setSelectedTransaction}
                            onViewCalendar={() => setActiveView('calendar')}
                            onViewTasks={() => setActiveView('tasks')}
                            onViewBudgets={() => setActiveView('budgets')}
                            onToggleTaskCompletion={async (task) => {
                                const updatedTask = await handleAddOrUpdate('tasks', { isCompleted: !task.isCompleted }, task.id) as Task;
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                            }}
                        />;
            case 'calendar':
                return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={handleDeleteTransaction} />;
            case 'accounts':
                return <AccountsList 
                            accounts={accounts} 
                            transactions={transactions}
                            accountBalances={accountBalances}
                            onAddAccount={() => setModal('addAccount')}
                            onDeleteAccount={handleDeleteAccount}
                            onEditAccount={(acc) => openModalWithItem('addAccount', acc, 'account')}
                            onUpdateAccount={handleUpdateAccount}
                            onSelectTransaction={setSelectedTransaction}
                            onAddMoneyToCard={(card) => { setTransferPrefill({toAccountId: card.id}); setModal('addTransfer'); }}
                        />;
            case 'recurring':
                return <RecurringTransactionList recurringTransactions={recurring} accounts={accounts} onDelete={() => {}} onEdit={() => {}} onAdd={() => setModal('addRecurring')} />;
            case 'tasks':
                return <TasksList 
                            tasks={tasks} 
                            onAddTask={() => setModal('addTask')}
                            onDeleteTask={async (id) => {
                                await handleDelete('tasks', id);
                                setTasks(prev => prev.filter(t => t.id !== id));
                            }}
                            onEditTask={(task) => openModalWithItem('addTask', task, 'task')}
                            onToggleCompletion={async (task) => {
                                if (!task.isCompleted && task.transactionId) { setTaskToComplete(task); return; }
                                const updatedTask = await handleAddOrUpdate('tasks', { isCompleted: !task.isCompleted }, task.id) as Task;
                                setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
                            }}
                        />;
            case 'budgets':
                return <BudgetsList 
                            budgets={budgets} 
                            transactions={transactions} 
                            onAddBudget={() => setModal('addBudget')}
                            onDeleteBudget={async (id) => {
                                await handleDelete('budgets', id);
                                setBudgets(prev => prev.filter(b => b.id !== id));
                            }}
                            onEditBudget={(budget) => openModalWithItem('addBudget', budget, 'budget')}
                        />;
            default:
                return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => {}} onViewTasks={() => {}} onViewBudgets={() => {}} onToggleTaskCompletion={()=>{}}/>;
        }
    };

    const closeModal = () => {
        setModal(null);
        setTransactionToEdit(null);
        setAccountToEdit(null);
        setRecurringToEdit(null);
        setTaskToEdit(null);
        setBudgetToEdit(null);
        setTransferPrefill(null);
    };

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-white pb-24">
            <Header 
                userProfile={userProfile} 
                unreadNotifications={unreadNotifications}
                onOpenSearch={() => setSearchOpen(true)}
                onOpenNotifications={() => setNotificationsOpen(o => !o)}
                onOpenSettings={() => setSettingsOpen(true)}
            />
            <main className="container mx-auto p-4">
                {renderView()}
            </main>
            <BottomNavBar 
                activeView={activeView}
                setView={setActiveView}
                openAddMenu={() => setAddMenuOpen(true)}
                openFijosMenu={() => setFijosMenuOpen(true)}
            />

            {/* Modals & Panels */}
            {addMenuOpen && <AddMenuModal onClose={() => setAddMenuOpen(false)} onSelect={(type) => { 
                setAddMenuOpen(false);
                if (type === 'transaction') setModal('addTransaction');
                if (type === 'transfer') setModal('addTransfer');
                if (type === 'recurring') setModal('addRecurring');
                if (type === 'task') setModal('addTask');
             }} />}
             
             {fijosMenuOpen && <FijosMenuModal onClose={() => setFijosMenuOpen(false)} setView={(view) => { setFijosMenuOpen(false); setActiveView(view); }} />}

            {modal === 'addTransaction' && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"><AddTransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={transactionToEdit} accounts={accounts} defaultCurrency={userProfile?.default_currency} /></div>}
            {modal === 'addAccount' && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"><AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={accountToEdit} /></div>}
            {modal === 'addTransfer' && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"><AddTransferForm onAddTransfer={async (transfer) => {
                await handleAddTransaction({ ...transfer, type: 'transfer', description: 'Transferencia', category: 'Transferencia' });
                closeModal();
            }} accounts={accounts} defaultCurrency={userProfile?.default_currency} prefillData={transferPrefill} /></div>}
            {modal === 'addRecurring' && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"><AddRecurringTransactionForm onAddRecurring={()=>{}} onUpdateRecurring={()=>{}} recurringTransactionToEdit={recurringToEdit} accounts={accounts} defaultCurrency={userProfile?.default_currency} /></div>}
            {modal === 'addTask' && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"><AddTaskForm onAddTask={()=>{}} onUpdateTask={()=>{}} taskToEdit={taskToEdit} accounts={accounts} defaultCurrency={userProfile?.default_currency} /></div>}
            {modal === 'addBudget' && <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"><AddBudgetForm onAddBudget={()=>{}} onUpdateBudget={()=>{}} budgetToEdit={budgetToEdit} existingBudgets={budgets}/></div>}

            {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} />}
            {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={() => {}} onCompleteWithTransaction={() => {}} />}

            <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />
            <NotificationsDropdown isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} notifications={notifications} onMarkAsRead={() => {}} onMarkAllAsRead={() => {}} />
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} />
        </div>
    );
};

export default App;
