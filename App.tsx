import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
// FIX: Add file extension to fix module resolution error.
import type { View, Transaction, Account, RecurringTransaction, Task, Budget, AppSettings, UserProfile } from './types.ts';
import { calculateNextDueDate } from './utils/date.ts';
import { resizeImage } from './utils/image.ts';

// Component Imports
import Header from './components/Header.tsx';
import BottomNavBar from './components/BottomNavBar.tsx';
import Dashboard from './components/Dashboard.tsx';
import CalendarView from './components/CalendarView.tsx';
import AccountsList from './components/AccountsList.tsx';
import RecurringTransactionList from './components/RecurringTransactionList.tsx';
import TasksList from './components/TasksList.tsx';
import BudgetsList from './components/BudgetsList.tsx';
import NotificationsList from './components/NotificationsList.tsx';

// Modal and Form Imports
import AddMenuModal from './components/AddMenuModal.tsx';
import FijosMenuModal from './components/FijosMenuModal.tsx';
import AddTransactionForm from './components/AddTransactionForm.tsx';
import AddTransferForm from './components/AddTransferForm.tsx';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm.tsx';
import AddTaskForm from './components/AddTaskForm.tsx';
import AddAccountForm from './components/AddAccountForm.tsx';
import AddBudgetForm from './components/AddBudgetForm.tsx';
import TransactionDetailModal from './components/TransactionDetailModal.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import PinLockScreen from './components/PinLockScreen.tsx';
import SearchModal from './components/SearchModal.tsx';
import GetStarted from './components/GetStarted.tsx';
import Auth from './components/Auth.tsx';
import CompleteTaskModal from './components/CompleteTaskModal.tsx';

const App: React.FC = () => {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<'getStarted' | 'signIn' | 'signUp' | null>('getStarted');
  const [isUnlocked, setUnlocked] = useState(false);

  // UI State
  const [view, setView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'default',
    defaultCurrency: 'DOP',
    pinLock: null,
    notifications: { paymentReminders: true, budgetAlerts: true, newFeatures: false },
  });

  // Modal/Form State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [entityToEdit, setEntityToEdit] = useState<any | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [transferPrefill, setTransferPrefill] = useState<{ toAccountId: string } | null>(null);

  // Auth effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
            setAuthView('getStarted');
            setIsLoading(false);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setAuthView('getStarted');
        setUnlocked(false);
        // Clear all data on logout
        setTransactions([]);
        setAccounts([]);
        setRecurringTransactions([]);
        setTasks([]);
        setBudgets([]);
        setUserProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Data fetching effect
  useEffect(() => {
    if (user) {
      setAuthView(null);
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [
        transactionsRes,
        accountsRes,
        recurringRes,
        tasksRes,
        budgetsRes,
        profileRes,
        settingsRes,
      ] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('name'),
        supabase.from('recurring_transactions').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('settings').select('*').eq('user_id', user.id).single(),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      setTransactions(transactionsRes.data as Transaction[]);

      if (accountsRes.error) throw accountsRes.error;
      setAccounts(accountsRes.data as Account[]);

      if (recurringRes.error) throw recurringRes.error;
      setRecurringTransactions(recurringRes.data as RecurringTransaction[]);
      
      if (tasksRes.error) throw tasksRes.error;
      setTasks(tasksRes.data as Task[]);

      if (budgetsRes.error) throw budgetsRes.error;
      setBudgets(budgetsRes.data as Budget[]);

      if (profileRes.error) throw profileRes.error;
      setUserProfile(profileRes.data as UserProfile);
      
      if (settingsRes.data) {
        setSettings(settingsRes.data.settings_data as AppSettings);
      } else {
        const { data: newSettingsData, error: newSettingsError } = await supabase.from('settings').insert({ user_id: user.id, settings_data: settings }).select().single();
        if (newSettingsError) throw newSettingsError;
        if (newSettingsData) setSettings(newSettingsData.settings_data as AppSettings);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const accountBalances = useMemo(() => {
    const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
    accounts.forEach(acc => {
      balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
    });
    
    transactions.forEach(t => {
      const balance = balances[t.accountId];
      if (!balance) return;

      const currencyKey = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
      
      if (t.type === 'income') {
        balance[currencyKey] += t.amount;
      } else if (t.type === 'expense') {
        balance[currencyKey] -= t.amount;
      } else if (t.type === 'transfer') {
        balance[currencyKey] -= t.amount;
        if (t.transferToAccountId) {
            const toBalance = balances[t.transferToAccountId];
            if (toBalance) {
              toBalance[currencyKey] += t.amount;
            }
        }
      }
    });
    return balances;
  }, [transactions, accounts]);

  const closeModal = () => {
      setActiveModal(null);
      setEntityToEdit(null);
      setTransferPrefill(null);
  };
  
    const uploadReceipt = async (file: File): Promise<string | undefined> => {
        if (!user) return undefined;
        try {
            const resizedImage = await resizeImage(file, 800);
            const blob = await (await fetch(resizedImage)).blob();
            const filePath = `${user.id}/${new Date().getTime()}-${file.name}`;
            const { data, error } = await supabase.storage.from('receipts').upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(data.path);
            return publicUrl;
        } catch (error) {
            console.error("Error uploading receipt:", error);
            alert('Hubo un error al subir la imagen.');
            return undefined;
        }
    };

    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'transferToAccountId'>, receiptFile?: File) => {
        if (!user) return;
        let receiptImageUrl: string | undefined;
        if (receiptFile) {
            receiptImageUrl = await uploadReceipt(receiptFile);
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({ ...transaction, user_id: user.id, receiptImage: receiptImageUrl })
            .select()
            .single();
        if (error) {
            console.error(error);
            alert('Error al agregar movimiento.');
        } else if (data) {
            setTransactions(prev => [data as Transaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            closeModal();
        }
    };

    const handleUpdateTransaction = async (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => {
        let receiptImageUrl: string | undefined = transaction.receiptImage;
        if (receiptFile) {
            receiptImageUrl = await uploadReceipt(receiptFile);
        }
        const { data, error } = await supabase.from('transactions').update({ ...transaction, receiptImage: receiptImageUrl }).eq('id', transaction.id).select().single();
        if (error) {
            alert('Error al actualizar movimiento.');
        } else if (data) {
            setTransactions(prev => prev.map(t => t.id === data.id ? data as Transaction : t));
            closeModal();
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return;
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
            alert('Error al eliminar movimiento.');
        } else {
            setTransactions(prev => prev.filter(t => t.id !== id));
            setSelectedTransaction(null);
        }
    };
    
    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('accounts').insert({ ...account, user_id: user.id }).select().single();
        if (error) alert('Error al agregar cuenta.');
        else if (data) {
            setAccounts(prev => [...prev, data as Account]);
            closeModal();
        }
    };
    
    const handleUpdateAccount = async (account: Partial<Account> & { id: string }) => {
        const { data, error } = await supabase.from('accounts').update(account).eq('id', account.id).select().single();
        if (error) alert('Error al actualizar cuenta.');
        else if (data) {
            setAccounts(prev => prev.map(a => a.id === data.id ? data as Account : a));
            closeModal();
        }
    };
    
    const handleDeleteAccount = async (id: string) => {
        const associatedTransactions = transactions.filter(t => t.accountId === id || t.transferToAccountId === id);
        if (associatedTransactions.length > 0) {
            alert('No se puede eliminar la cuenta porque tiene movimientos asociados. Por favor, elimínalos primero.');
            return;
        }
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) return;
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) alert('Error al eliminar cuenta.');
        else setAccounts(prev => prev.filter(a => a.id !== id));
    };
    
    const handleAddTransfer = async (transfer: Omit<Transaction, 'id' | 'user_id' | 'type' | 'category' | 'description'>) => {
        if (!user) return;
        const transferData = {
            ...transfer,
            user_id: user.id,
            type: 'transfer' as const,
            category: 'Transferencia',
            description: 'Transferencia entre cuentas'
        };
        const { data, error } = await supabase.from('transactions').insert(transferData).select().single();
        if (error) alert('Error al realizar transferencia.');
        else if (data) {
            setTransactions(prev => [data as Transaction, ...prev]);
            closeModal();
        }
    };

    const handleAddRecurring = async (rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => {
        if (!user) return;
        const nextDueDate = calculateNextDueDate(rec.startDate, rec.frequency);
        const { data, error } = await supabase.from('recurring_transactions').insert({ ...rec, user_id: user.id, nextDueDate }).select().single();
        if (error) alert('Error al agregar gasto fijo.');
        else if (data) {
            setRecurringTransactions(prev => [...prev, data as RecurringTransaction]);
            closeModal();
        }
    };
    
    const handleUpdateRecurring = async (rec: Partial<RecurringTransaction> & { id: string }) => {
        let payload: any = { ...rec };
        if (rec.startDate && rec.frequency) {
            payload.nextDueDate = calculateNextDueDate(rec.startDate, rec.frequency);
        }
        const { data, error } = await supabase.from('recurring_transactions').update(payload).eq('id', rec.id).select().single();
        if (error) alert('Error al actualizar gasto fijo.');
        else if (data) {
            setRecurringTransactions(prev => prev.map(r => r.id === data.id ? data as RecurringTransaction : r));
            closeModal();
        }
    };
    
    const handleDeleteRecurring = async (id: string) => {
        if (!window.confirm('¿Eliminar este gasto/ingreso fijo?')) return;
        const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
        if (error) alert('Error al eliminar.');
        else setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    };

    const handleAddTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'transactionId' | 'createdAt' | 'completedAt'>, transactionData?: Omit<Transaction, 'id' | 'user_id' | 'description'>) => {
        if (!user) return;

        let transactionId: string | undefined = undefined;

        if (transactionData) {
            const { data: tData, error: tError } = await supabase
                .from('transactions')
                .insert({ ...transactionData, user_id: user.id, description: taskData.title })
                .select()
                .single();
            if (tError) {
                alert('Error al crear el movimiento asociado a la tarea.');
                return;
            }
            if (tData) {
                transactionId = tData.id;
                setTransactions(prev => [tData as Transaction, ...prev]);
            }
        }

        const taskPayload = { ...taskData, user_id: user.id, isCompleted: false, transactionId: transactionId };
        const { data, error } = await supabase.from('tasks').insert(taskPayload).select().single();
        if (error) alert('Error al crear tarea.');
        else if (data) {
            setTasks(prev => [...prev, data as Task]);
            closeModal();
        }
    };

    const handleUpdateTask = async (task: Partial<Task> & { id: string }) => {
        const { data, error } = await supabase.from('tasks').update(task).eq('id', task.id).select().single();
        if (error) alert('Error al actualizar tarea.');
        else if (data) {
            setTasks(prev => prev.map(t => t.id === data.id ? data as Task : t));
            closeModal();
        }
    };

    const handleToggleTaskCompletion = async (task: Task) => {
        if (!task.isCompleted && task.transactionId && !transactions.find(t => t.id === task.transactionId)) {
            setTaskToComplete(task);
            return; 
        }
        
        const isCompleted = !task.isCompleted;
        const completedAt = isCompleted ? new Date().toISOString() : null;
        
        const { data, error } = await supabase.from('tasks').update({ isCompleted, completedAt }).eq('id', task.id).select().single();
        if (error) alert('Error al actualizar estado de la tarea.');
        else if (data) {
            setTasks(prev => prev.map(t => t.id === data.id ? data as Task : t));
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!window.confirm('¿Eliminar esta tarea?')) return;
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) alert('Error al eliminar tarea.');
        else setTasks(prev => prev.filter(t => t.id !== id));
    };
    
    const handleAddBudget = async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('budgets').insert({ ...budget, user_id: user.id, period: 'monthly' }).select().single();
        if (error) alert('Error al crear presupuesto.');
        else if (data) {
            setBudgets(prev => [...prev, data as Budget]);
            closeModal();
        }
    };
    
    const handleUpdateBudget = async (budget: Partial<Budget> & { id: string }) => {
        const { data, error } = await supabase.from('budgets').update(budget).eq('id', budget.id).select().single();
        if (error) alert('Error al actualizar presupuesto.');
        else if (data) {
            setBudgets(prev => prev.map(b => b.id === data.id ? data as Budget : b));
            closeModal();
        }
    };
    
    const handleDeleteBudget = async (id: string) => {
        if (!window.confirm('¿Eliminar este presupuesto?')) return;
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) alert('Error al eliminar presupuesto.');
        else setBudgets(prev => prev.filter(b => b.id !== id));
    };

    const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
        if (!user) return;
        const updatedSettings = { ...settings, ...newSettings };
        const { data, error } = await supabase.from('settings').update({ settings_data: updatedSettings }).eq('user_id', user.id).select().single();
        if (error) {
            alert('Error al guardar los ajustes.');
        } else if (data) {
            setSettings(data.settings_data as AppSettings);
        }
    };
    
  if (isLoading) {
    return <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div></div>;
  }

  if (!session) {
    const handleNavigation = (view: 'signIn' | 'signUp') => setAuthView(view);
    if (authView === 'getStarted') return <GetStarted onNavigateToAuth={handleNavigation} />;
    return <Auth initialView={authView === 'signIn' ? 'signIn' : 'signUp'} onBack={authView !== 'getStarted' ? () => setAuthView('getStarted') : undefined} />;
  }
  
  if (settings.pinLock && !isUnlocked) {
    return <PinLockScreen correctPin={settings.pinLock} onUnlock={() => setUnlocked(true)} />;
  }

  const renderView = () => {
    switch (view) {
        case 'dashboard': return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
        case 'calendar': return <CalendarView transactions={transactions} accounts={accounts} onSelectTransaction={setSelectedTransaction} onDeleteTransaction={handleDeleteTransaction} />;
        case 'accounts': return <AccountsList accounts={accounts} transactions={transactions} accountBalances={accountBalances} onAddAccount={() => setActiveModal('addAccount')} onDeleteAccount={handleDeleteAccount} onEditAccount={(acc) => { setEntityToEdit(acc); setActiveModal('addAccount'); }} onUpdateAccount={handleUpdateAccount} onSelectTransaction={setSelectedTransaction} onAddMoneyToCard={(card) => { setTransferPrefill({ toAccountId: card.id }); setActiveModal('addTransfer'); }} />;
        case 'tasks': return <TasksList tasks={tasks} onToggleCompletion={handleToggleTaskCompletion} onDeleteTask={handleDeleteTask} onEditTask={(task) => { setEntityToEdit(task); setActiveModal('addTask'); }} onAddTask={() => setActiveModal('addTask')} />;
        case 'recurring': return <RecurringTransactionList recurringTransactions={recurringTransactions} accounts={accounts} onDelete={handleDeleteRecurring} onEdit={(rt) => { setEntityToEdit(rt); setActiveModal('addRecurring'); }} onAdd={() => setActiveModal('addRecurring')} />;
        case 'budgets': return <BudgetsList budgets={budgets} transactions={transactions} onAddBudget={() => setActiveModal('addBudget')} onEditBudget={(b) => { setEntityToEdit(b); setActiveModal('addBudget'); }} onDeleteBudget={handleDeleteBudget} />;
        case 'notifications': return <NotificationsList />;
        default: return <Dashboard transactions={transactions} accounts={accounts} tasks={tasks} budgets={budgets} accountBalances={accountBalances} onDeleteTransaction={handleDeleteTransaction} onSelectTransaction={setSelectedTransaction} onViewCalendar={() => setView('calendar')} onViewTasks={() => setView('tasks')} onViewBudgets={() => setView('budgets')} onToggleTaskCompletion={handleToggleTaskCompletion} />;
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;

    const formProps = {
        accounts,
        defaultCurrency: settings.defaultCurrency
    };

    switch (activeModal) {
      case 'addTransaction': return <AddTransactionForm onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={entityToEdit} {...formProps} />;
      case 'addTransfer': return <AddTransferForm onAddTransfer={handleAddTransfer} accounts={accounts} defaultCurrency={settings.defaultCurrency} prefillData={transferPrefill} />;
      case 'addRecurring': return <AddRecurringTransactionForm onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} recurringTransactionToEdit={entityToEdit} {...formProps} />;
      case 'addTask': return <AddTaskForm onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} taskToEdit={entityToEdit} {...formProps} />;
      case 'addAccount': return <AddAccountForm onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} accountToEdit={entityToEdit} />;
      case 'addBudget': return <AddBudgetForm onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} budgetToEdit={entityToEdit} existingBudgets={budgets} />;
      default: return null;
    }
  };
  
  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 min-h-screen text-neutral-900 dark:text-white pb-20">
      <Header onOpenSettings={() => setSettingsOpen(true)} onOpenSearch={() => setSearchOpen(true)} setView={setView} />
      
      <main className="container mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="text-center py-20">Cargando tus datos...</div>
        ) : (
          renderView()
        )}
      </main>

      <BottomNavBar 
        activeView={view} 
        setView={setView} 
        openAddMenu={() => setActiveModal('addMenu')}
        openFijosMenu={() => setActiveModal('fijosMenu')}
      />

      {/* Modals and Panels */}
      {activeModal === 'addMenu' && <AddMenuModal onClose={closeModal} onSelect={(type) => setActiveModal(`add${type.charAt(0).toUpperCase() + type.slice(1)}`)} />}
      {activeModal === 'fijosMenu' && <FijosMenuModal onClose={closeModal} setView={setView} />}
      {activeModal && activeModal.startsWith('add') && activeModal !== 'addMenu' && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={closeModal}>
              <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
                 {renderModal()}
              </div>
          </div>
      )}
      
      {selectedTransaction && <TransactionDetailModal transaction={selectedTransaction} accounts={accounts} onClose={() => setSelectedTransaction(null)} onDelete={handleDeleteTransaction} />}
      
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onUpdateSettings={handleUpdateSettings} userProfile={userProfile} />

      <SearchModal isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} transactions={transactions} accounts={accounts} onSelectTransaction={(t) => { setSearchOpen(false); setSelectedTransaction(t); }} />

      {taskToComplete && <CompleteTaskModal task={taskToComplete} onClose={() => setTaskToComplete(null)} onCompleteOnly={() => {handleToggleTaskCompletion({...taskToComplete, transactionId: undefined}); setTaskToComplete(null);}} onCompleteWithTransaction={() => {console.log("Not implemented"); setTaskToComplete(null);}}/>}
    </div>
  );
};

export default App;
