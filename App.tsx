// FIX: This file was missing. Added full implementation for the main App component.
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { Transaction, Account, View, UserSettings, RecurringTransaction, Task } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BottomNavBar from './components/BottomNavBar';
import AddTransactionForm from './components/AddTransactionForm';
import AddAccountForm from './components/AddAccountForm';
import AccountsList from './components/AccountsList';
import TransactionDetailModal from './components/TransactionDetailModal';
import SettingsPanel from './components/SettingsPanel';
import PinLockScreen from './components/PinLockScreen';
import AddMenuModal from './components/AddMenuModal';
import AddTransferForm from './components/AddTransferForm';
import RecurringTransactionList from './components/RecurringTransactionList';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm';
import CalendarView from './components/CalendarView';
import SearchModal from './components/SearchModal';
import NotificationsList from './components/NotificationsList';
import GetStarted from './components/GetStarted';
import Auth from './components/Auth';
import TasksList from './components/TasksList';
import AddTaskForm from './components/AddTaskForm';
import FijosMenuModal from './components/FijosMenuModal';
import CompleteTaskModal from './components/CompleteTaskModal';

// A helper function for handling Supabase responses.
// FIX: Changed `Promise` to `PromiseLike` to accommodate Supabase's thenable query builders.
const handleSupabaseResponse = async (query: PromiseLike<{ data?: any, error: any; [key: string]: any; }>) => {
  const { data, error } = await query;
  if (error) {
    console.error('Supabase error:', error.message);
    alert(`Error: ${error.message}`);
    return null;
  }
  return data;
}

const App: React.FC = () => {
  // Authentication State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // UI State
  const [view, setView] = useState<View>('dashboard');
  const [modal, setModal] = useState<'transaction' | 'account' | 'transfer' | 'recurring' | 'task' | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const [isFijosMenuOpen, setFijosMenuOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Transaction | Account | RecurringTransaction | Task | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  
  // Pre-Authentication UI State
  const [preAuthStep, setPreAuthStep] = useState<'loading' | 'getStarted' | 'auth'>('loading');
  const [authInitialView, setAuthInitialView] = useState<'signIn' | 'signUp'>('signIn');
  
  // User Settings
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'default',
    defaultCurrency: 'DOP',
    pinEnabled: false,
    pin: null,
  });

  useEffect(() => {
    const hasSeenGetStarted = localStorage.getItem('hasSeenGetStarted');
    if (hasSeenGetStarted) {
      setPreAuthStep('auth');
    } else {
      setPreAuthStep('getStarted');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  
  // Fetch all user data
  const fetchData = async (currentUser: User) => {
    const [accountsData, transactionsData, recurringData, tasksData, settingsData] = await Promise.all([
      handleSupabaseResponse(supabase.from('accounts').select('*').eq('user_id', currentUser.id)),
      handleSupabaseResponse(supabase.from('transactions').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }).order('time', { ascending: false, nullsFirst: true })),
      handleSupabaseResponse(supabase.from('recurring_transactions').select('*').eq('user_id', currentUser.id)),
      handleSupabaseResponse(supabase.from('tasks').select('*').eq('user_id', currentUser.id)),
      handleSupabaseResponse(supabase.from('profiles').select('*').eq('id', currentUser.id).single()),
    ]);
    
    if (accountsData) setAccounts(accountsData);
    if (transactionsData) setTransactions(transactionsData);
    if (recurringData) setRecurringTransactions(recurringData);
    if (tasksData) setTasks(tasksData);
    if (settingsData) setSettings(settingsData);
  };

  useEffect(() => {
    if (session?.user) {
      fetchData(session.user);
    }
  }, [session]);
  
  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand-primary', COLOR_THEMES.find(t => t.name === settings.theme)?.primary || '79 70 229');
    document.documentElement.style.setProperty('--color-brand-secondary', COLOR_THEMES.find(t => t.name === settings.theme)?.secondary || '236 72 153');
  }, [settings.theme]);

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    if (user) {
      await handleSupabaseResponse(supabase.from('profiles').update(newSettings).eq('id', user.id));
    }
  };

  const handleNavigateToAuth = (view: 'signIn' | 'signUp') => {
    localStorage.setItem('hasSeenGetStarted', 'true');
    setAuthInitialView(view);
    setPreAuthStep('auth');
  };

  const handleBackToGetStarted = () => {
    localStorage.removeItem('hasSeenGetStarted');
    setPreAuthStep('getStarted');
  };

  const closeModal = () => {
    setModal(null);
    setItemToEdit(null);
    setPrefillData(null);
  };
  
  const openModal = (type: 'transaction' | 'account' | 'transfer' | 'recurring' | 'task', item?: any) => {
    setItemToEdit(item || null);
    setModal(type);
  };

  const accountBalances = useMemo(() => {
    const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
    accounts.forEach(acc => {
      balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
    });

    transactions.forEach(t => {
      const isDOP = t.currency === 'DOP';
      if (t.type === 'income') {
        if (balances[t.accountId]) {
          isDOP ? balances[t.accountId].balanceDOP += t.amount : balances[t.accountId].balanceUSD += t.amount;
        }
      } else if (t.type === 'expense') {
        if (balances[t.accountId]) {
          isDOP ? balances[t.accountId].balanceDOP -= t.amount : balances[t.accountId].balanceUSD -= t.amount;
        }
      } else if (t.type === 'transfer' && t.transferToAccountId) {
        if (balances[t.accountId]) {
          isDOP ? balances[t.accountId].balanceDOP -= t.amount : balances[t.accountId].balanceUSD -= t.amount;
        }
        if (balances[t.transferToAccountId]) {
          isDOP ? balances[t.transferToAccountId].balanceDOP += t.amount : balances[t.transferToAccountId].balanceUSD += t.amount;
        }
      }
    });

    return balances;
  }, [transactions, accounts]);

  const handleDelete = async (table: string, id: string) => {
    if (!user) return;
    if (!window.confirm('¿Estás seguro de que quieres eliminar esto?')) return;
    
    await handleSupabaseResponse(supabase.from(table).delete().eq('id', id));
    fetchData(user);
    if (selectedTransaction?.id === id) setSelectedTransaction(null);
  };

  const handleToggleTaskCompletion = async (task: Task) => {
    if(task.transactionId && !task.isCompleted) {
        setTaskToComplete(task);
        return;
    }
    await handleAddOrUpdate('tasks', { isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date().toISOString() : null }, task.id);
  };
  
  const completeTaskOnly = async (task: Task) => {
    await handleAddOrUpdate('tasks', { isCompleted: true, completedAt: new Date().toISOString() }, task.id);
    setTaskToComplete(null);
  }
  
  const completeTaskWithTransaction = async (task: Task) => {
      const linkedTransaction = transactions.find(t => t.id === task.transactionId);
      if(linkedTransaction) {
          await handleAddOrUpdate('transactions', { ...linkedTransaction, date: new Date().toISOString().split('T')[0] });
      }
      await handleAddOrUpdate('tasks', { isCompleted: true, completedAt: new Date().toISOString() }, task.id);
      setTaskToComplete(null);
  };

  if (loading || preAuthStep === 'loading') return <div className="bg-neutral-100 dark:bg-neutral-900 min-h-screen"></div>;
  
  if (!session) {
    if (preAuthStep === 'getStarted') {
        return <GetStarted onNavigateToAuth={handleNavigateToAuth} />;
    }
    return <Auth initialView={authInitialView} onBack={handleBackToGetStarted} />;
  }
  
  if (settings.pinEnabled && !isUnlocked && settings.pin) return <PinLockScreen correctPin={settings.pin} onUnlock={() => setIsUnlocked(true)} />;
  
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} accountBalances={accountBalances} onDeleteTransaction={(id) => handleDelete('transactions', id)} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onToggleTaskCompletion={handleToggleTaskCompletion}/>;
      case 'calendar':
        return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={(id) => handleDelete('transactions', id)}/>
      case 'accounts':
        return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => openModal('account')} onDeleteAccount={(id) => handleDelete('accounts', id)} onEditAccount={(acc) => openModal('account', acc)} onUpdateAccount={(acc) => handleAddOrUpdate('accounts', acc, acc.id)} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={(card) => { setPrefillData({ toAccountId: card.id }); openModal('transfer'); }}/>;
      case 'recurring':
        return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={(id) => handleDelete('recurring_transactions', id)} onEdit={(rt) => openModal('recurring', rt)} onAdd={() => openModal('recurring')}/>
      case 'tasks':
        return <TasksList tasks={tasks} onToggleCompletion={handleToggleTaskCompletion} onDeleteTask={(id) => handleDelete('tasks', id)} onEditTask={(task) => openModal('task', task)} onAddTask={() => openModal('task')}/>
      case 'notifications':
        return <NotificationsList />;
      default: return null;
    }
  }

  const handleAddOrUpdate = async (table: string, data: any, id?: string) => {
    if (!user) return;
    id 
      ? await handleSupabaseResponse(supabase.from(table).update(data).eq('id', id))
      : await handleSupabaseResponse(supabase.from(table).insert({ ...data, user_id: user.id }));
    
    fetchData(user);
    closeModal();
  };

  const handleAddOrUpdateTask = async (taskData: any, transactionData?: any) => {
    if (!user) return;
    let newTransactionId = null;
    if (transactionData) {
        const newTransaction = await handleSupabaseResponse(supabase.from('transactions').insert({ ...transactionData, user_id: user.id, description: taskData.title }).select('id').single());
        if (newTransaction) newTransactionId = newTransaction.id;
    }
    await handleAddOrUpdate('tasks', { ...taskData, transactionId: newTransactionId });
  };
  
  const handleSelectAddMenu = (type: 'transaction' | 'transfer' | 'recurring' | 'task') => {
    setAddMenuOpen(false);
    openModal(type);
  };
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen pb-20">
      <Header onOpenSettings={() => setSettingsOpen(true)} onOpenSearch={() => setSearchOpen(true)} setView={setView}/>
      <main className="container mx-auto p-4 md:p-8">{renderView()}</main>

      {modal === 'transaction' && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}><div onClick={(e) => e.stopPropagation()}><AddTransactionForm onAddTransaction={(t, f) => handleAddOrUpdate('transactions', t)} onUpdateTransaction={(t, f) => handleAddOrUpdate('transactions', t, t.id)} transactionToEdit={itemToEdit as Transaction | null} accounts={accounts} defaultCurrency={settings.defaultCurrency}/></div></div>}
      {modal === 'account' && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}><div onClick={(e) => e.stopPropagation()}><AddAccountForm onAddAccount={(acc) => handleAddOrUpdate('accounts', acc)} onUpdateAccount={(acc) => handleAddOrUpdate('accounts', acc, acc.id)} accountToEdit={itemToEdit as Account | null}/></div></div>}
      {modal === 'transfer' && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}><div onClick={(e) => e.stopPropagation()}><AddTransferForm onAddTransfer={(t) => handleAddOrUpdate('transactions', {...t, type: 'transfer', description: 'Transferencia', category: 'Transferencia'})} accounts={accounts} defaultCurrency={settings.defaultCurrency} prefillData={prefillData}/></div></div>}
      {modal === 'recurring' && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}><div onClick={(e) => e.stopPropagation()}><AddRecurringTransactionForm onAddRecurring={(rt) => handleAddOrUpdate('recurring_transactions', rt)} onUpdateRecurring={(rt) => handleAddOrUpdate('recurring_transactions', rt, rt.id)} recurringTransactionToEdit={itemToEdit as RecurringTransaction | null} accounts={accounts} defaultCurrency={settings.defaultCurrency}/></div></div>}
      {modal === 'task' && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}><div onClick={(e) => e.stopPropagation()}><AddTaskForm onAddTask={handleAddOrUpdateTask} onUpdateTask={(t) => handleAddOrUpdate('tasks', t, t.id)} taskToEdit={itemToEdit as Task | null} accounts={accounts} defaultCurrency={settings.defaultCurrency}/></div></div>}
      {isSettingsOpen && <SettingsPanel user={user} settings={settings} onUpdateSettings={handleUpdateSettings} onClose={() => setSettingsOpen(false)} />}
      {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={(id) => handleDelete('transactions', id)}/>}
      {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={(t) => { setSearchOpen(false); setSelectedTransaction(t); }}/>}
      {isAddMenuOpen && <AddMenuModal onClose={() => setAddMenuOpen(false)} onSelect={handleSelectAddMenu} />}
      {isFijosMenuOpen && <FijosMenuModal onClose={() => setFijosMenuOpen(false)} setView={setView} />}
      {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={() => completeTaskOnly(taskToComplete)} onCompleteWithTransaction={() => completeTaskWithTransaction(taskToComplete)} />}

      <BottomNavBar activeView={view} setView={setView} openAddMenu={() => setAddMenuOpen(true)} openFijosMenu={() => setFijosMenuOpen(true)}/>
    </div>
  );
};

// A helper constant for theme colors used in JS.
const COLOR_THEMES = [
    { name: 'default', primary: '79 70 229', secondary: '236 72 153' },
    { name: 'forest', primary: '22 163 74', secondary: '249 115 22' },
    { name: 'sunset', primary: '147 51 234', secondary: '245 158 11' },
    { name: 'ocean', primary: '59 130 246', secondary: '20 184 166' },
];

export default App;