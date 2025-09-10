
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { View, Transaction, Account, RecurringTransaction, Task, UserProfile, Budget, Notification } from './types';

// Import Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BottomNavBar from './components/BottomNavBar';
import AccountsList from './components/AccountsList';
import CalendarView from './components/CalendarView';
import RecurringTransactionList from './components/RecurringTransactionList';
import TasksList from './components/TasksList';
import BudgetsList from './components/BudgetsList';
import SettingsPanel from './components/SettingsPanel';
import TransactionDetailModal from './components/TransactionDetailModal';
import AddTransactionForm from './components/AddTransactionForm';
import AddAccountForm from './components/AddAccountForm';
import AddTransferForm from './components/AddTransferForm';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm';
import AddTaskForm from './components/AddTaskForm';
import AddBudgetForm from './components/AddBudgetForm';
import AddMenuModal from './components/AddMenuModal';
import FijosMenuModal from './components/FijosMenuModal';
import SearchModal from './components/SearchModal';
import NotificationsDropdown from './components/NotificationsDropdown';
import CompleteTaskModal from './components/CompleteTaskModal';
import GetStarted from './components/GetStarted';
import Auth from './components/Auth';
import PinLockScreen from './components/PinLockScreen';

// Import Utils
import { resizeImage } from './utils/image';
import { calculateNextDueDate } from './utils/date';

const App: React.FC = () => {
  // Auth & Session State
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');


  // UI State
  const [view, setView] = useState<View>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isFijosMenuOpen, setIsFijosMenuOpen] = useState(false);

  // Modal & Form State
  const [formType, setFormType] = useState<'transaction' | 'transfer' | 'account' | 'recurring' | 'task' | 'budget' | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Transaction | Account | RecurringTransaction | Task | Budget | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);


  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Handlers
  const handleSetView = (newView: View) => {
    setView(newView);
    setIsFijosMenuOpen(false); // Close menu on selection
  };
  
  const openForm = (type: 'transaction' | 'transfer' | 'account' | 'recurring' | 'task' | 'budget', item?: any) => {
    setFormType(type);
    setItemToEdit(item || null);
    setIsAddMenuOpen(false);
  };
  
  const closeForm = () => {
    setFormType(null);
    setItemToEdit(null);
    setTransferPrefill(null);
  };
  
  // Effects
  useEffect(() => {
    const hasSeenGetStarted = localStorage.getItem('hasSeenGetStarted');
    if (!hasSeenGetStarted) {
      setShowGetStarted(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user).then(profile => {
          if (profile?.isPinEnabled && profile?.pin) {
            setIsLocked(true);
          }
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserProfile(null);
        setIsLocked(false);
        // Clear all data on logout
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
  
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile(session.user);
      fetchAllData(session.user.id);
    }
  }, [session]);
  
  useEffect(() => {
    // Apply theme from user profile
    if (userProfile?.theme) {
      const root = document.documentElement;
      const themeColors = {
        default: { primary: '79 70 229', secondary: '236 72 153' },
        forest: { primary: '22 163 74', secondary: '249 115 22' },
        sunset: { primary: '147 51 234', secondary: '245 158 11' },
        ocean: { primary: '59 130 246', secondary: '20 184 166' },
      };
      const { primary, secondary } = themeColors[userProfile.theme] || themeColors.default;
      root.style.setProperty('--color-brand-primary', primary);
      root.style.setProperty('--color-brand-secondary', secondary);
    }
    // Apply dark mode
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile?.theme]);

  // Data Fetching
  const fetchUserProfile = async (user: User) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) console.error('Error fetching profile:', error);
    else setUserProfile(data);
    return data;
  };
  
  const fetchAllData = async (userId: string) => {
    const [
      transactionsRes,
      accountsRes,
      recurringRes,
      tasksRes,
      budgetsRes,
      notificationsRes
    ] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).order('time', { ascending: false }),
      supabase.from('accounts').select('*').eq('user_id', userId).order('name'),
      supabase.from('recurring_transactions').select('*').eq('user_id', userId).order('description'),
      supabase.from('tasks').select('*').eq('user_id', userId).order('dueDate'),
      supabase.from('budgets').select('*').eq('user_id', userId).order('category'),
      supabase.from('notifications').select('*').eq('user_id', userId).eq('is_read', false).order('created_at', { ascending: false }),
    ]);

    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
    if (recurringRes.data) {
        const updatedRecurring = recurringRes.data.map(rt => ({
            ...rt,
            nextDueDate: calculateNextDueDate(rt.startDate, rt.frequency)
        }));
        setRecurringTransactions(updatedRecurring);
    }
    if (tasksRes.data) setTasks(tasksRes.data);
    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (notificationsRes.data) setNotifications(notificationsRes.data);
  };
  
  // Data Handlers
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'transferToAccountId'>, receiptFile?: File) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleUpdateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleDeleteTransaction = async (id: string) => { /* ... implementation ... */ setSelectedTransaction(null); fetchAllData(session!.user.id); };
  const handleAddTransfer = async (transfer: Omit<Transaction, 'id' | 'user_id' | 'type' | 'category' | 'description'>) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleDeleteAccount = async (id: string) => { /* ... implementation ... */ fetchAllData(session!.user.id); };
  const handleAddRecurring = async (transaction: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleUpdateRecurring = async (transaction: Partial<RecurringTransaction> & { id: string }) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleDeleteRecurring = async (id: string) => { /* ... implementation ... */ fetchAllData(session!.user.id); };
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'transactionId' | 'createdAt' | 'completedAt'>, transactionData?: Omit<Transaction, 'id' | 'user_id' | 'description'>) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleUpdateTask = async (task: Partial<Task> & { id: string }) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleDeleteTask = async (id: string) => { /* ... implementation ... */ fetchAllData(session!.user.id); };
  const handleToggleTask = async (task: Task) => { /* ... implementation ... */ };
  const handleAddBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleUpdateBudget = async (budget: Partial<Budget> & { id: string }) => { /* ... implementation ... */ closeForm(); fetchAllData(session!.user.id); };
  const handleDeleteBudget = async (id: string) => { /* ... implementation ... */ fetchAllData(session!.user.id); };
  const handleUpdateProfile = async (profileUpdate: Partial<UserProfile>, avatarFile?: File | null) => { /* ... implementation ... */ fetchUserProfile(session!.user); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Memoized calculations
  const accountBalances = useMemo(() => {
    const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
    accounts.forEach(acc => {
      balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
    });
    
    transactions.forEach(t => {
      const balanceKey = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
      if (t.type === 'income') {
        if (balances[t.accountId]) balances[t.accountId][balanceKey] += t.amount;
      } else if (t.type === 'expense') {
        if (balances[t.accountId]) balances[t.accountId][balanceKey] -= t.amount;
      } else if (t.type === 'transfer') {
        if (balances[t.accountId]) balances[t.accountId][balanceKey] -= t.amount;
        if (t.transferToAccountId && balances[t.transferToAccountId]) {
          balances[t.transferToAccountId][balanceKey] += t.amount;
        }
      }
    });
    return balances;
  }, [transactions, accounts]);

  const renderView = () => {
    switch(view) {
        case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={handleToggleTask} />;
        case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={handleDeleteTransaction} />;
        case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => openForm('account')} onDeleteAccount={handleDeleteAccount} onEditAccount={(acc) => openForm('account', acc)} onUpdateAccount={handleUpdateAccount} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={(card) => { setTransferPrefill({ toAccountId: card.id }); openForm('transfer'); }} />;
        case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onAdd={() => openForm('recurring')} onEdit={(rt) => openForm('recurring', rt)} onDelete={handleDeleteRecurring} />;
        case 'tasks': return <TasksList tasks={tasks} onAddTask={() => openForm('task')} onEditTask={(task) => openForm('task', task)} onDeleteTask={handleDeleteTask} onToggleCompletion={handleToggleTask} />;
        case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => openForm('budget')} onEditBudget={(b) => openForm('budget', b)} onDeleteBudget={handleDeleteBudget} />;
        default: return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={handleToggleTask} />;
    }
  };
  
  const renderFormModal = () => {
      if (!formType) return null;

      const forms = {
          transaction: <AddTransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={itemToEdit as Transaction | null} accounts={accounts} defaultCurrency={userProfile?.default_currency} />,
          account: <AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={itemToEdit as Account | null} />,
          transfer: <AddTransferForm onAddTransfer={handleAddTransfer} accounts={accounts} defaultCurrency={userProfile?.default_currency} prefillData={transferPrefill} />,
          recurring: <AddRecurringTransactionForm onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} recurringTransactionToEdit={itemToEdit as RecurringTransaction | null} accounts={accounts} defaultCurrency={userProfile?.default_currency} />,
          task: <AddTaskForm onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} taskToEdit={itemToEdit as Task | null} accounts={accounts} defaultCurrency={userProfile?.default_currency} />,
          budget: <AddBudgetForm onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} budgetToEdit={itemToEdit as Budget | null} existingBudgets={budgets} />,
      };
      
      return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeForm}>
              <div onClick={(e) => e.stopPropagation()}>{forms[formType]}</div>
          </div>
      )
  };

  if (loading) {
    return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;
  }
  
  if (showGetStarted) {
    return <GetStarted onNavigateToAuth={(view) => {
      localStorage.setItem('hasSeenGetStarted', 'true');
      setShowGetStarted(false);
      setAuthView(view);
    }}/>;
  }
  
  if (!session) {
    return <Auth initialView={authView} onNavigateToGetStarted={() => setShowGetStarted(true)} />;
  }

  if (isLocked && userProfile?.pin) {
    return <PinLockScreen correctPin={userProfile.pin} onUnlock={() => setIsLocked(false)} />;
  }
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-white pb-24">
        <Header 
            userProfile={userProfile} 
            unreadNotifications={notifications.filter(n => !n.is_read).length}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(o => !o)}
            onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <main className="container mx-auto p-4">
            {renderView()}
        </main>
        <BottomNavBar 
            activeView={view} 
            setView={setView} 
            openAddMenu={() => setIsAddMenuOpen(true)}
            openFijosMenu={() => setIsFijosMenuOpen(true)}
        />
        
        {/* Modals & Panels */}
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={session.user} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} />
        <NotificationsDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkAsRead={() => {}} onMarkAllAsRead={() => {}} />
        {isAddMenuOpen && <AddMenuModal onClose={() => setIsAddMenuOpen(false)} onSelect={(type) => openForm(type)} />}
        {isFijosMenuOpen && <FijosMenuModal onClose={() => setIsFijosMenuOpen(false)} setView={handleSetView} />}
        {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} />}
        {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={()=>{}} onCompleteWithTransaction={()=>{}} />}
        {renderFormModal()}
    </div>
  );
};

export default App;
