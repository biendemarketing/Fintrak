import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase.ts';
// FIX: Add file extensions to fix module resolution errors.
import type { View, Transaction, Account, RecurringTransaction, Task, UserProfile, Notification, Budget } from './types.ts';
import { calculateNextDueDate } from './utils/date.ts';
import { resizeImage } from './utils/image.ts';

// Main View Components
import Dashboard from './components/Dashboard.tsx';
import CalendarView from './components/CalendarView.tsx';
import AccountsList from './components/AccountsList.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import TasksList from './components/TasksList.tsx';
import BudgetsList from './components/BudgetsList.tsx';

// UI Components
import Header from './components/Header.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import SearchModal from './components/SearchModal.tsx';
import NotificationsDropdown from './components/NotificationsDropdown.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import GetStarted from './components/GetStarted.tsx';
import Auth from './components/Auth.tsx';

// Modal Form Components
import AddMenuModal from './components/AddMenuModal.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';

function App() {
  // State Management
  // Auth & Profile
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // App Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // UI State
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(!localStorage.getItem('hasSeenGetStarted'));
  const [authView, setAuthView] = useState<'signIn' | 'signUp'>('signIn');
  
  // Modal & Panel State
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const [isFijosMenuOpen, setFijosMenuOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);


  // Effects for Auth and Data Loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Reset state on logout
        setUserProfile(null);
        setTransactions([]);
        setAccounts([]);
        setRecurringTransactions([]);
        setTasks([]);
        setBudgets([]);
        setNotifications([]);
        setIsUnlocked(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async (user: User) => {
    setLoading(true);
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) setUserProfile(profile);

    const tables = ['transactions', 'accounts', 'recurring_transactions', 'tasks', 'budgets', 'notifications'];
    const setters = [setTransactions, setAccounts, setRecurringTransactions, setTasks, setBudgets, setNotifications];
    const fetches = tables.map(table => supabase.from(table).select('*').eq('user_id', user.id));
    
    const results = await Promise.all(fetches);
    results.forEach((res, index) => {
      if (res.data) {
        if (tables[index] === 'notifications') {
          res.data.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        setters[index](res.data as any);
      }
    });
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchData(session.user);
    }
  }, [session, fetchData]);

  // Derived State
  const accountBalances = useMemo(() => {
    const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
    accounts.forEach(acc => {
        balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
    });

    transactions.forEach(t => {
        const amount = t.amount;
        const balanceKey = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';

        if (t.type === 'income') {
            if (balances[t.accountId]) balances[t.accountId][balanceKey] += amount;
        } else if (t.type === 'expense') {
            if (balances[t.accountId]) balances[t.accountId][balanceKey] -= amount;
        } else if (t.type === 'transfer' && t.transferToAccountId) {
            if (balances[t.accountId]) balances[t.accountId][balanceKey] -= amount;
            if (balances[t.transferToAccountId]) balances[t.transferToAccountId][balanceKey] += amount;
        }
    });
    return balances;
  }, [transactions, accounts]);

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  // Handlers for CRUD operations
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id'>, receiptFile?: File) => {
    if (!session?.user) return;
    let receiptImage;
    if (receiptFile) {
        const filePath = `${session.user.id}/${Date.now()}-${receiptFile.name}`;
        const resizedDataUrl = await resizeImage(receiptFile, 1024);
        const blob = await (await fetch(resizedDataUrl)).blob();
        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, blob);
        if (uploadError) {
          console.error("Error uploading receipt:", uploadError.message);
        } else {
           const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath);
           receiptImage = publicUrl;
        }
    }

    const { data, error } = await supabase.from('transactions').insert([{ ...transaction, user_id: session.user.id, receiptImage }]).select();
    if (data) setTransactions(prev => [...prev, data[0]]);
    setModalContent(null);
  };
  
  const handleDeleteTransaction = async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
      setSelectedTransaction(null);
  };
  
  const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('accounts').insert([{ ...account, user_id: session.user.id }]).select();
    if (data) setAccounts(prev => [...prev, data[0]]);
    setModalContent(null);
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta cuenta? Se eliminarán todos sus movimientos.')) {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (!error) {
            setAccounts(prev => prev.filter(a => a.id !== id));
            setTransactions(prev => prev.filter(t => t.accountId !== id && t.transferToAccountId !== id));
        }
    }
  };
  
  const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => {
    const { data, error } = await supabase.from('accounts').update(account).eq('id', account.id).select();
    if (data) {
        setAccounts(prev => prev.map(a => a.id === account.id ? data[0] : a));
    }
    setModalContent(null);
  };

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>, avatarFile?: File | null) => {
      if (!session?.user) return;
      let avatar_url;
      if (avatarFile) {
          const filePath = `${session.user.id}/avatar`;
          await supabase.storage.from('avatars').remove([filePath]);
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
          if (uploadError) console.error(uploadError);
          else {
              const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
              avatar_url = `${publicUrl}?t=${new Date().getTime()}`;
          }
      }

      const profileData = { ...updatedProfile };
      if (avatar_url) profileData.avatar_url = avatar_url;
      
      const { data, error } = await supabase.from('profiles').update(profileData).eq('id', session.user.id).select().single();
      if (data) setUserProfile(data);
  };
  
  // UI Handlers
  const openFormModal = (formType: string, editData: any = null) => {
    const commonProps = { defaultCurrency: userProfile?.default_currency || 'DOP', accounts };
    switch(formType) {
        case 'transaction':
            setModalContent(<AddTransactionForm onAddTransaction={handleAddTransaction as any} onUpdateTransaction={() => {}} transactionToEdit={editData} {...commonProps} />);
            break;
        case 'account':
            setModalContent(<AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={editData} />);
            break;
        case 'transfer':
            setModalContent(<AddTransferForm onAddTransfer={handleAddTransaction as any} prefillData={transferPrefill} {...commonProps} />);
            setTransferPrefill(null);
            break;
    }
    setAddMenuOpen(false);
  };
  
  // Main Render
  const renderView = () => {
    const sortedTransactions = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    switch(activeView) {
        case 'dashboard': return <Dashboard transactions={sortedTransactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setActiveView('calendar')} onViewTasks={() => setActiveView('tasks')} onViewBudgets={() => setActiveView('budgets')} onToggleTaskCompletion={() => {}} />;
        case 'calendar': return <CalendarView transactions={sortedTransactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={handleDeleteTransaction} />;
        case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => openFormModal('account')} onDeleteAccount={handleDeleteAccount} onEditAccount={(acc) => openFormModal('account', acc)} onUpdateAccount={handleUpdateAccount} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={(card) => { setTransferPrefill({ toAccountId: card.id }); openFormModal('transfer'); }} />;
        case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={() => {}} onEdit={() => {}} onAdd={() => {}} />;
        case 'tasks': return <TasksList tasks={tasks} onToggleCompletion={() => {}} onDeleteTask={() => {}} onEditTask={() => {}} onAddTask={() => {}} />;
        case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => {}} onEditBudget={() => {}} onDeleteBudget={() => {}} />;
        default: return <Dashboard transactions={sortedTransactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setActiveView('calendar')} onViewTasks={() => setActiveView('tasks')} onViewBudgets={() => setActiveView('budgets')} onToggleTaskCompletion={() => {}} />;
    }
  };

  if (loading && !session) {
    return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center text-white">Cargando...</div>;
  }
  
  if (showGetStarted) {
    return <GetStarted onNavigateToAuth={(view) => {
        setAuthView(view);
        setShowGetStarted(false);
        localStorage.setItem('hasSeenGetStarted', 'true');
    }} />;
  }

  if (!session) {
    return <Auth initialView={authView} />;
  }

  if (userProfile?.isPinEnabled && !isUnlocked) {
    return <PinLockScreen correctPin={userProfile.pin!} onUnlock={() => setIsUnlocked(true)} />;
  }
  
  return (
    <div className={`font-sans bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white min-h-screen pb-24 theme-${userProfile?.theme || 'default'}`}>
        <Header 
            userProfile={userProfile} 
            unreadNotifications={unreadNotifications}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenNotifications={() => setNotificationsOpen(true)}
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

        {/* Modals and Panels */}
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} user={session.user} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onLogout={() => supabase.auth.signOut()} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} />
        <NotificationsDropdown isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} notifications={notifications} onMarkAsRead={() => {}} onMarkAllAsRead={() => {}} />
        {isAddMenuOpen && <AddMenuModal onClose={() => setAddMenuOpen(false)} onSelect={(type) => openFormModal(type)} />}
        {isFijosMenuOpen && <FijosMenuModal onClose={() => setFijosMenuOpen(false)} setView={(v) => { setActiveView(v); setFijosMenuOpen(false); }} />}
        {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} />}
        {modalContent && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalContent(null)}>
                <div onClick={e => e.stopPropagation()}>
                    {modalContent}
                </div>
            </div>
        )}
    </div>
  );
}

export default App;
