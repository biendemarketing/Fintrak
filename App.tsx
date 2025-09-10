
import React, { useState, useEffect, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
// FIX: Add file extension to fix module resolution error.
import { supabase } from './lib/supabase.ts';
// FIX: Add file extension to fix module resolution error.
import type { View, Transaction, Account, UserProfile, RecurringTransaction, Task, Budget, Notification } from './types.ts';
// FIX: Add file extension to fix module resolution error.
import { resizeImage } from './utils/image.ts';
// FIX: Add file extension to fix module resolution error.
import { calculateNextDueDate } from './utils/date.ts';

// Components
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AccountsList from './components/AccountsList.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import AddMenuModal from './components/AddMenuModal.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import SearchModal from './components/SearchModal.tsx';
import CalendarView from './components/CalendarView.tsx';
import TasksList from './components/TasksList.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import GetStarted from './components/GetStarted.tsx';
import Auth from './components/Auth.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';
import NotificationsDropdown from './components/NotificationsDropdown.tsx';

type FormType = 
    | 'transaction' 
    | 'account' 
    | 'transfer' 
    | 'recurring' 
    | 'task'
    | 'budget';
type EditingDataType = Transaction | Account | RecurringTransaction | Task | Budget | null;

const App: React.FC = () => {
    // Auth & User State
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLocked, setIsLocked] = useState(true);
    const [authView, setAuthView] = useState<'getStarted' | 'auth'>('getStarted');
    const [initialAuthView, setInitialAuthView] = useState<'signIn' | 'signUp'>('signIn');

    // App Data State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // UI State
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);
    const [isAddMenuOpen, setAddMenuOpen] = useState(false);
    const [isFijosMenuOpen, setFijosMenuOpen] = useState(false);
    const [formToShow, setFormToShow] = useState<FormType | null>(null);
    const [editingData, setEditingData] = useState<EditingDataType>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);

    // Dark Mode & Theme Handling
    useEffect(() => {
        const applyTheme = () => {
            // Apply dark mode
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        applyTheme();
        window.addEventListener('storage', applyTheme);
        return () => window.removeEventListener('storage', applyTheme);
    }, []);
    
    // Auth Effect
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                // If user logs out, reset all state
                setUserProfile(null);
                setTransactions([]);
                setAccounts([]);
                setRecurringTransactions([]);
                setTasks([]);
                setBudgets([]);
                setIsLocked(true); // Re-lock for next login
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // Data Fetching Effect
    useEffect(() => {
        const fetchData = async (user: User) => {
            setLoading(true);
            try {
                // Fetch profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profileData) {
                    console.error('Error fetching profile:', profileError);
                    setUserProfile(null);
                    return;
                }
                setUserProfile(profileData);
                setIsLocked(profileData.isPinEnabled); // Lock if PIN is enabled

                // Fetch other data in parallel
                const [
                    { data: accountsData, error: accountsError },
                    { data: transactionsData, error: transactionsError },
                    { data: recurringData, error: recurringError },
                    { data: tasksData, error: tasksError },
                    { data: budgetsData, error: budgetsError },
                ] = await Promise.all([
                    supabase.from('accounts').select('*'),
                    supabase.from('transactions').select('*').order('date', { ascending: false }).order('time', { ascending: false }),
                    supabase.from('recurring_transactions').select('*'),
                    supabase.from('tasks').select('*'),
                    supabase.from('budgets').select('*'),
                ]);

                if (accountsError) console.error('Accounts fetch error:', accountsError);
                if (transactionsError) console.error('Transactions fetch error:', transactionsError);
                if (recurringError) console.error('Recurring fetch error:', recurringError);
                if (tasksError) console.error('Tasks fetch error:', tasksError);
                if (budgetsError) console.error('Budgets fetch error:', budgetsError);

                setAccounts(accountsData || []);
                setTransactions(transactionsData || []);
                setRecurringTransactions(recurringData || []);
                setTasks(tasksData || []);
                setBudgets(budgetsData || []);

            } catch (err) {
                console.error("General fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user) {
            fetchData(session.user);
        } else {
            setLoading(false);
        }
    }, [session]);
    
    // Derived state for balances
    const accountBalances = useMemo(() => {
        const balances: { [key: string]: { balanceDOP: number, balanceUSD: number } } = {};
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
                 if (balances[t.accountId] && t.transferToAccountId) {
                    if (t.currency === 'DOP') {
                        balances[t.accountId].balanceDOP -= t.amount;
                        if(balances[t.transferToAccountId]) balances[t.transferToAccountId].balanceDOP += t.amount;
                    } else {
                        balances[t.accountId].balanceUSD -= t.amount;
                        if(balances[t.transferToAccountId]) balances[t.transferToAccountId].balanceUSD += t.amount;
                    }
                }
            }
        });
        return balances;
    }, [transactions, accounts]);

    const handleOpenForm = (type: FormType, dataToEdit: EditingDataType = null) => {
        setFormToShow(type);
        setEditingData(dataToEdit);
        setAddMenuOpen(false);
        setFijosMenuOpen(false);
    };

    const handleCloseForm = () => {
        setFormToShow(null);
        setEditingData(null);
        setTransferPrefill(null);
    };

    // --- CRUD Handlers --- //
    
    // Image Upload Helper
    const uploadImage = async (file: File, bucket: string): Promise<string | null> => {
        try {
            const resizedDataUrl = await resizeImage(file, 1024);
            const blob = await (await fetch(resizedDataUrl)).blob();
            const fileName = `${session!.user.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, blob);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };
    
    // Profile
    const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>, avatarFile?: File | null) => {
        if (!session?.user) return;
        let avatar_url = userProfile?.avatar_url;

        if (avatarFile) {
            const uploadedUrl = await uploadImage(avatarFile, 'avatars');
            if (uploadedUrl) avatar_url = uploadedUrl;
        }

        const profileData = { ...updatedProfile, id: session.user.id, avatar_url };
        const { data, error } = await supabase.from('profiles').upsert(profileData).select().single();
        if (error) console.error(error);
        else setUserProfile(data);
    };

    // Accounts
    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        const { data, error } = await supabase.from('accounts').insert({ ...account, user_id: session!.user.id }).select().single();
        if (error) console.error(error);
        else setAccounts(prev => [...prev, data]);
        handleCloseForm();
    };

    const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => {
        const { data, error } = await supabase.from('accounts').update(account).eq('id', account.id).select().single();
        if (error) console.error(error);
        else setAccounts(prev => prev.map(a => a.id === account.id ? data : a));
        handleCloseForm();
    };

    const handleDeleteAccount = async (id: string) => {
         if (window.confirm("¿Seguro que quieres eliminar esta cuenta? Se eliminarán TODOS los movimientos asociados.")) {
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (error) console.error(error);
            else {
                setAccounts(prev => prev.filter(a => a.id !== id));
                setTransactions(prev => prev.filter(t => t.accountId !== id && t.transferToAccountId !== id));
            }
        }
    };

    // Transactions
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'transferToAccountId'>, receiptFile?: File) => {
        let receiptImage;
        if (receiptFile) receiptImage = await uploadImage(receiptFile, 'receipts');

        const { data, error } = await supabase.from('transactions').insert({ ...transaction, receiptImage, user_id: session!.user.id }).select().single();
        if (error) console.error(error);
        else setTransactions(prev => [data, ...prev]);
        handleCloseForm();
    };
    
     const handleAddTransfer = async (transfer: Omit<Transaction, 'id' | 'user_id' | 'type' | 'category' | 'description'>) => {
        const payload: Omit<Transaction, 'id' | 'user_id'> = {
            ...transfer,
            type: 'transfer',
            category: 'Transferencia',
            description: 'Transferencia entre cuentas'
        };
        const { data, error } = await supabase.from('transactions').insert({ ...payload, user_id: session!.user.id }).select().single();
        if (error) console.error(error);
        else setTransactions(prev => [data, ...prev]);
        handleCloseForm();
    };

    const handleUpdateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        let payload = { ...transaction };
        if (receiptFile) {
            const receiptImage = await uploadImage(receiptFile, 'receipts');
            if (receiptImage) payload.receiptImage = receiptImage;
        }

        const { data, error } = await supabase.from('transactions').update(payload).eq('id', transaction.id).select().single();
        if (error) console.error(error);
        else setTransactions(prev => prev.map(t => t.id === transaction.id ? data : t));
        handleCloseForm();
    };
    
    const handleDeleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) console.error(error);
        else setTransactions(prev => prev.filter(t => t.id !== id));
        setSelectedTransaction(null);
    };

    // Recurring Transactions
    const handleAddRecurring = async (recTransaction: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        const nextDueDate = calculateNextDueDate(recTransaction.startDate, recTransaction.frequency);
        const { data, error } = await supabase.from('recurring_transactions').insert({ ...recTransaction, nextDueDate, user_id: session!.user.id }).select().single();
        if (error) console.error(error);
        else setRecurringTransactions(prev => [...prev, data]);
        handleCloseForm();
    };
    
    const handleUpdateRecurring = async (recTransaction: Partial<RecurringTransaction> & { id: string }) => {
        const original = recurringTransactions.find(rt => rt.id === recTransaction.id);
        if (!original) return;
        const payload = {...original, ...recTransaction};
        payload.nextDueDate = calculateNextDueDate(payload.startDate, payload.frequency);
        
        const { data, error } = await supabase.from('recurring_transactions').update(payload).eq('id', recTransaction.id).select().single();
        if (error) console.error(error);
        else setRecurringTransactions(prev => prev.map(rt => rt.id === recTransaction.id ? data : rt));
        handleCloseForm();
    };

    const handleDeleteRecurring = async (id: string) => {
         if (window.confirm("¿Seguro que quieres eliminar este movimiento fijo?")) {
            const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
            if (error) console.error(error);
            else setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
        }
    };
    
    // Tasks
    const handleAddTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'transactionId' | 'createdAt' | 'completedAt'>, transactionData?: Omit<Transaction, 'id' | 'user_id' | 'description'>) => {
        let transactionId;
        if (transactionData) {
            const { data: newTransaction, error: tError } = await supabase.from('transactions').insert({ ...transactionData, description: taskData.title, user_id: session!.user.id }).select().single();
            if (tError) {
                console.error("Error creating associated transaction:", tError);
            } else {
                transactionId = newTransaction.id;
                setTransactions(prev => [newTransaction, ...prev]);
            }
        }

        const { data, error } = await supabase.from('tasks').insert({ ...taskData, transactionId, isCompleted: false, user_id: session!.user.id }).select().single();
        if (error) console.error(error);
        else setTasks(prev => [...prev, data]);
        handleCloseForm();
    };
    
    const handleUpdateTask = async (task: Partial<Task> & { id: string }) => {
        const { data, error } = await supabase.from('tasks').update(task).eq('id', task.id).select().single();
        if (error) console.error(error);
        else setTasks(prev => prev.map(t => t.id === task.id ? data : t));
        handleCloseForm();
    };

    const handleToggleTaskCompletion = (task: Task) => {
        if (!task.isCompleted && task.transactionId) {
            setTaskToComplete(task);
            return;
        }
        
        const updatedTask = {
            isCompleted: !task.isCompleted,
            completedAt: !task.isCompleted ? new Date().toISOString() : null,
        };
        handleUpdateTask({ id: task.id, ...updatedTask });
    };

    const handleDeleteTask = async (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta tarea?")) {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) console.error(error);
            else setTasks(prev => prev.filter(t => t.id !== id));
        }
    };
    
    // Budgets
    const handleAddBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => {
        const payload = { ...budget, period: 'monthly' as const, user_id: session!.user.id };
        const { data, error } = await supabase.from('budgets').insert(payload).select().single();
        if (error) console.error(error);
        else setBudgets(prev => [...prev, data]);
        handleCloseForm();
    };

    const handleUpdateBudget = async (budget: Partial<Budget> & { id: string }) => {
        const { data, error } = await supabase.from('budgets').update(budget).eq('id', budget.id).select().single();
        if (error) console.error(error);
        else setBudgets(prev => prev.map(b => b.id === budget.id ? data : b));
        handleCloseForm();
    };
    
    const handleDeleteBudget = async (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar este presupuesto?")) {
            const { error } = await supabase.from('budgets').delete().eq('id', id);
            if (error) console.error(error);
            else setBudgets(prev => prev.filter(b => b.id !== id));
        }
    };

    // --- Render Logic --- //
    
    // Auth screens
    if (!session) {
        if (authView === 'getStarted') {
            return <GetStarted onNavigateToAuth={(view) => { setInitialAuthView(view); setAuthView('auth'); }} />;
        }
        return <Auth initialView={initialAuthView} onBack={() => setAuthView('getStarted')} />;
    }
    
    // PIN lock screen
    if (isLocked && userProfile?.isPinEnabled && userProfile.pin) {
        return <PinLockScreen correctPin={userProfile.pin} onUnlock={() => setIsLocked(false)} />;
    }

    const renderContent = () => {
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
                    onToggleTaskCompletion={handleToggleTaskCompletion}
                />;
            case 'calendar':
                return <CalendarView 
                    transactions={transactions}
                    accounts={accounts}
                    onSelectTransaction={setSelectedTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                />
            case 'accounts':
                return <AccountsList 
                    accounts={accounts}
                    transactions={transactions}
                    accountBalances={accountBalances}
                    onAddAccount={() => handleOpenForm('account')}
                    onDeleteAccount={handleDeleteAccount}
                    onEditAccount={(acc) => handleOpenForm('account', acc)}
                    onUpdateAccount={handleUpdateAccount}
                    onSelectTransaction={setSelectedTransaction}
                    onAddMoneyToCard={(card) => {
                        setTransferPrefill({ toAccountId: card.id });
                        handleOpenForm('transfer');
                    }}
                />;
            case 'recurring':
                return <RecurringTransactionList 
                    recurringTransactions={recurringTransactions}
                    accounts={accounts}
                    onDelete={handleDeleteRecurring}
                    onEdit={(rt) => handleOpenForm('recurring', rt)}
                    onAdd={() => handleOpenForm('recurring')}
                />
            case 'tasks':
                return <TasksList
                    tasks={tasks}
                    onToggleCompletion={handleToggleTaskCompletion}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={(task) => handleOpenForm('task', task)}
                    onAddTask={() => handleOpenForm('task')}
                />;
            case 'budgets':
                return <BudgetsList
                    budgets={budgets}
                    transactions={transactions}
                    onAddBudget={() => handleOpenForm('budget')}
                    onEditBudget={(budget) => handleOpenForm('budget', budget)}
                    onDeleteBudget={handleDeleteBudget}
                />
            default:
                return <div>Not implemented</div>;
        }
    };
    
    const renderForm = () => {
        switch (formToShow) {
            case 'transaction':
                return <AddTransactionForm 
                            onAddTransaction={handleAddTransaction} 
                            onUpdateTransaction={handleUpdateTransaction}
                            transactionToEdit={editingData as Transaction | null}
                            accounts={accounts} 
                            defaultCurrency={userProfile?.default_currency}
                        />;
            case 'account':
                return <AddAccountForm 
                            onAddAccount={handleAddAccount}
                            onUpdateAccount={handleUpdateAccount}
                            accountToEdit={editingData as Account | null}
                        />;
            case 'transfer':
                return <AddTransferForm 
                            onAddTransfer={handleAddTransfer}
                            accounts={accounts}
                            defaultCurrency={userProfile?.default_currency}
                            prefillData={transferPrefill}
                       />;
            case 'recurring':
                return <AddRecurringTransactionForm
                            onAddRecurring={handleAddRecurring}
                            onUpdateRecurring={handleUpdateRecurring}
                            recurringTransactionToEdit={editingData as RecurringTransaction | null}
                            accounts={accounts}
                            defaultCurrency={userProfile?.default_currency}
                        />
            case 'task':
                return <AddTaskForm
                            onAddTask={handleAddTask}
                            onUpdateTask={handleUpdateTask}
                            taskToEdit={editingData as Task | null}
                            accounts={accounts}
                            defaultCurrency={userProfile?.default_currency}
                        />;
            case 'budget':
                return <AddBudgetForm
                            onAddBudget={handleAddBudget}
                            onUpdateBudget={handleUpdateBudget}
                            budgetToEdit={editingData as Budget | null}
                            existingBudgets={budgets}
                       />
            default:
                return renderContent();
        }
    };

    return (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen">
            <div className="container mx-auto px-4 pb-20">
                <Header 
                    userProfile={userProfile} 
                    onOpenSettings={() => setSettingsOpen(true)}
                    onOpenSearch={() => setSearchOpen(true)}
                    onOpenNotifications={() => setNotificationsOpen(o => !o)}
                    notificationCount={notifications.filter(n => !n.is_read).length}
                />
                <main>
                    {formToShow ? (
                         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 flex items-center justify-center p-4" onClick={handleCloseForm}>
                            <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                                {renderForm()}
                            </div>
                        </div>
                    ) : (
                        renderContent()
                    )}

                </main>
            </div>
            
            {/* Modals & Overlays */}
            <BottomNavBar
                activeView={activeView}
                setView={setActiveView}
                openAddMenu={() => setAddMenuOpen(true)}
                openFijosMenu={() => setFijosMenuOpen(true)}
            />
            {isAddMenuOpen && (
                <AddMenuModal
                    onClose={() => setAddMenuOpen(false)}
                    onSelect={(type) => {
                        handleOpenForm(type);
                    }}
                />
            )}
            {isFijosMenuOpen && (
                <FijosMenuModal
                    onClose={() => setFijosMenuOpen(false)}
                    setView={(view) => {
                        setActiveView(view);
                        setFijosMenuOpen(false);
                    }}
                />
            )}
            {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    accounts={accounts}
                    onClose={() => setSelectedTransaction(null)}
                    onDelete={handleDeleteTransaction}
                />
            )}
            {taskToComplete && (
                <CompleteTaskModal
                    task={taskToComplete}
                    onClose={() => setTaskToComplete(null)}
                    onCompleteOnly={() => {
                        handleUpdateTask({ id: taskToComplete.id, isCompleted: true, completedAt: new Date().toISOString() });
                        setTaskToComplete(null);
                    }}
                    onCompleteWithTransaction={() => {
                        // Logic to open transaction form pre-filled
                        setTaskToComplete(null);
                        // This would need more complex state management
                    }}
                />
            )}
            <SettingsPanel 
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                user={session.user}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onLogout={() => supabase.auth.signOut()}
            />
            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setSearchOpen(false)}
                transactions={transactions}
                accounts={accounts}
                onSelectTransaction={(t) => {
                    setSearchOpen(false);
                    setSelectedTransaction(t);
                }}
            />
             <NotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
                onMarkAsRead={(id) => {}} // Placeholder
                onMarkAllAsRead={() => {}} // Placeholder
            />
        </div>
    );
};

export default App;
