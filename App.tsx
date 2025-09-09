
import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Account, RecurringTransaction, View, User, Task } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { exampleAccounts, exampleTransactions, exampleRecurringTransactions, exampleUser, exampleTasks } from './data/exampleData';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MovementsView from './components/CalendarView';
import AccountsList from './components/AccountsList';
import RecurringTransactionList from './components/RecurringTransactionList';
import AddTransactionForm from './components/AddTransactionForm';
import AddTransferForm from './components/AddTransferForm';
import AddRecurringTransactionForm from './components/AddRecurringTransactionForm';
import AddAccountForm from './components/AddAccountForm';
import TransactionDetailModal from './components/TransactionDetailModal';
import AddMenuModal from './components/AddMenuModal';
import SettingsPanel from './components/SettingsPanel';
import BottomNavBar from './components/BottomNavBar';
import PinLockScreen from './components/PinLockScreen';
import PinSetupModal from './components/PinSetupModal';
import SearchModal from './components/SearchModal';
import NotificationsList from './components/NotificationsList';
import TasksList from './components/TasksList';
import AddTaskForm from './components/AddTaskForm';
import FijosMenuModal from './components/FijosMenuModal';
import CompleteTaskModal from './components/CompleteTaskModal';
import { X } from 'lucide-react';
import { COLOR_THEMES } from './constants';

const App: React.FC = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [accounts, setAccounts] = useLocalStorage<Account[]>('accounts', []);
  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>('recurringTransactions', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [user, setUser] = useLocalStorage<User>('user', exampleUser);
  const [view, setView] = useState<View>('dashboard');
  
  const [isAddTransactionFormOpen, setAddTransactionFormOpen] = useState(false);
  const [isAddTransferFormOpen, setAddTransferFormOpen] = useState(false);
  const [isAddRecurringFormOpen, setAddRecurringFormOpen] = useState(false);
  const [isAddAccountFormOpen, setAddAccountFormOpen] = useState(false);
  const [isAddTaskFormOpen, setAddTaskFormOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const [isFijosMenuOpen, setFijosMenuOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingRecurringTransaction, setEditingRecurringTransaction] = useState<RecurringTransaction | null>(null);

  const [isLocked, setIsLocked] = useState(user.pinEnabled);
  const [isPinSetupOpen, setPinSetupOpen] = useState(false);
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [prefillDataForTransaction, setPrefillDataForTransaction] = useState<{description: string, date: string, type: 'expense' | 'income' } | null>(null);


  const [prefillTransfer, setPrefillTransfer] = useState<{toAccountId: string} | null>(null);

  useEffect(() => {
    // Cargar datos de ejemplo si es la primera vez que se usa la app
    const isFirstRun = localStorage.getItem('isFirstRun') === null;
    if (isFirstRun) {
      setAccounts(exampleAccounts);
      setTransactions(exampleTransactions);
      setRecurringTransactions(exampleRecurringTransactions);
      setTasks(exampleTasks);
      setUser(exampleUser);
      localStorage.setItem('isFirstRun', 'false');
    }
  }, []);

  useEffect(() => {
    // Aplicar tema claro/oscuro y de color
    const root = window.document.documentElement;
    if (user.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const selectedTheme = COLOR_THEMES.find(t => t.name === user.themeStyle) || COLOR_THEMES[0];
    root.style.setProperty('--color-brand-primary', selectedTheme.primary);
    root.style.setProperty('--color-brand-secondary', selectedTheme.secondary);

  }, [user.theme, user.themeStyle]);
  
  const handleUpdateUser = (updatedUser: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión? Se borrarán todos tus datos de forma permanente.')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleResetSettings = () => {
    setUser(prev => ({
        name: prev.name,
        profilePic: prev.profilePic,
        theme: exampleUser.theme,
        themeStyle: exampleUser.themeStyle,
        pinEnabled: exampleUser.pinEnabled,
        pin: exampleUser.pin,
        notificationsEnabled: exampleUser.notificationsEnabled,
        defaultCurrency: exampleUser.defaultCurrency,
    }));
  };

  const handleSetPin = (pin: string) => {
    handleUpdateUser({ pin, pinEnabled: true });
    setPinSetupOpen(false);
  };
  
  const handleTogglePin = (enabled: boolean) => {
    if(enabled) {
        setPinSetupOpen(true);
    } else {
        handleUpdateUser({ pin: undefined, pinEnabled: false });
    }
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>, taskIdToLink?: string) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      ...transaction,
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.time || '').localeCompare(a.time || '')));
    
    if (taskIdToLink) {
        // Find the task and mark it as complete, and link the transaction
        const task = tasks.find(t => t.id === taskIdToLink);
        if (task) {
            updateTask({id: taskIdToLink, transactionId: newTransaction.id, isCompleted: true });
        }
    }

    setAddTransactionFormOpen(false);
    setPrefillDataForTransaction(null);

    return newTransaction;
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (selectedTransaction?.id === id) {
      setSelectedTransaction(null);
    }
    // Also unlink from any task
    setTasks(prev => prev.map(task => task.transactionId === id ? { ...task, transactionId: undefined } : task));
  };
  
  const addTransfer = (transfer: Omit<Transaction, 'id' | 'type' | 'category' | 'description'>) => {
    const toAccountName = accounts.find(a => a.id === transfer.transferToAccountId)?.name;

    const transferId = crypto.randomUUID();
    const expense: Transaction = {
      id: transferId,
      description: `Transferencia a ${toAccountName}`,
      amount: transfer.amount,
      type: 'transfer',
      category: 'Transferencia',
      date: transfer.date,
      time: transfer.time,
      currency: transfer.currency,
      accountId: transfer.accountId,
      transferToAccountId: transfer.transferToAccountId,
    };
    
    setTransactions(prev => [expense, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.time || '').localeCompare(a.time || '')));
    setAddTransferFormOpen(false);
    setAddMenuOpen(false);
    setPrefillTransfer(null);
  };
  
  const addRecurringTransaction = (recTransaction: Omit<RecurringTransaction, 'id' | 'nextDueDate'>) => {
    const newRecTransaction: RecurringTransaction = {
      ...recTransaction,
      id: crypto.randomUUID(),
      nextDueDate: recTransaction.startDate, // Initial due date is the start date
    };
    setRecurringTransactions(prev => [newRecTransaction, ...prev]);
    setAddRecurringFormOpen(false);
    setAddMenuOpen(false);
  };

  const updateRecurringTransaction = (recTransactionToUpdate: Partial<RecurringTransaction> & { id: string }) => {
    setRecurringTransactions(prev => prev.map(rt => rt.id === recTransactionToUpdate.id ? { ...rt, ...recTransactionToUpdate } : rt));
    setEditingRecurringTransaction(null);
    setAddRecurringFormOpen(false);
  };

  const handleEditRecurringTransaction = (recTransaction: RecurringTransaction) => {
    setEditingRecurringTransaction(recTransaction);
    setAddRecurringFormOpen(true);
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = { ...account, id: crypto.randomUUID() };
    setAccounts(prev => [newAccount, ...prev]);
    setAddAccountFormOpen(false);
  };
  
  const updateAccount = (accountToUpdate: Partial<Account> & { id: string }) => {
    setAccounts(prev => prev.map(acc => acc.id === accountToUpdate.id ? { ...acc, ...accountToUpdate } : acc));
    setEditingAccount(null);
    setAddAccountFormOpen(false);
  };

  const deleteAccount = (id: string) => {
    setTransactions(prev => prev.filter(t => t.accountId !== id && t.transferToAccountId !== id));
    setRecurringTransactions(prev => prev.filter(rt => rt.accountId !== id));
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAddAccountFormOpen(true);
  };

  const handleAddMoneyToCard = (card: Account) => {
    setPrefillTransfer({ toAccountId: card.id });
    setAddTransferFormOpen(true);
  };
  
  const deleteRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
  };
  
  const handleAddTask = (taskData: Omit<Task, 'id' | 'isCompleted' | 'transactionId' | 'createdAt' | 'completedAt'>, transactionData?: Omit<Transaction, 'id' | 'description'>) => {
    let transactionId: string | undefined = undefined;
    if (transactionData) {
        const newTransaction = addTransaction({ ...transactionData, description: `Tarea: ${taskData.title}` });
        transactionId = newTransaction.id;
    }

    const newTask: Task = {
        id: crypto.randomUUID(),
        ...taskData,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        transactionId,
    };

    setTasks(prev => [newTask, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    setAddTaskFormOpen(false);
    setAddMenuOpen(false);
  };

  const updateTask = (taskToUpdate: Partial<Task> & { id: string }) => {
    const now = new Date().toISOString();
    setTasks(prev => prev.map(task => {
        if (task.id === taskToUpdate.id) {
            const wasCompleted = task.isCompleted;
            const isNowCompleted = taskToUpdate.isCompleted;
            let completedAt = task.completedAt;

            if (isNowCompleted === true && wasCompleted === false) {
                completedAt = now;
            } else if (isNowCompleted === false && wasCompleted === true) {
                completedAt = null;
            }

            return { ...task, ...taskToUpdate, completedAt };
        }
        return task;
    }));
    setEditingTask(null);
    setAddTaskFormOpen(false);
  };

  const handleToggleTaskCompletion = (task: Task) => {
    if (!task.isCompleted && !task.transactionId) {
        setTaskToComplete(task);
    } else {
        updateTask({ id: task.id, isCompleted: !task.isCompleted });
    }
  };

  const handleCompleteTaskWithTransaction = () => {
      if (!taskToComplete) return;
      setPrefillDataForTransaction({
          description: taskToComplete.title,
          date: taskToComplete.dueDate,
          type: 'expense', // Default to expense, user can change it
      });
      setAddTransactionFormOpen(true);
      // The task ID is stored in taskToComplete state and passed to addTransaction
  };

  const handleCompleteTaskOnly = () => {
      if (!taskToComplete) return;
      updateTask({ id: taskToComplete.id, isCompleted: true });
      setTaskToComplete(null);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setAddTaskFormOpen(true);
  };

  const accountBalances = useMemo(() => {
    const balances: { [key: string]: { balanceDOP: number; balanceUSD: number } } = {};
    accounts.forEach(acc => {
      balances[acc.id] = { balanceDOP: 0, balanceUSD: 0 };
    });

    transactions.forEach(t => {
      const currencyKey = t.currency === 'DOP' ? 'balanceDOP' : 'balanceUSD';
      
      if (t.accountId && balances[t.accountId]) {
        const sourceAccount = accounts.find(a => a.id === t.accountId);
        if (sourceAccount) {
          if (sourceAccount.type === 'Tarjeta de Crédito') {
            if (t.type === 'expense') balances[t.accountId][currencyKey] += t.amount;
            else if (t.type === 'income') balances[t.accountId][currencyKey] -= t.amount;
          } else {
            if (t.type === 'income') balances[t.accountId][currencyKey] += t.amount;
            else if (t.type === 'expense' || t.type === 'transfer') balances[t.accountId][currencyKey] -= t.amount;
          }
        }
      }

      if (t.type === 'transfer' && t.transferToAccountId && balances[t.transferToAccountId]) {
          const destAccount = accounts.find(a => a.id === t.transferToAccountId);
          if(destAccount) {
            if(destAccount.type === 'Tarjeta de Crédito') {
                balances[t.transferToAccountId][currencyKey] -= t.amount;
            } else {
                balances[t.transferToAccountId][currencyKey] += t.amount;
            }
          }
      }
    });
    return balances;
  }, [transactions, accounts]);
  
  const handleCloseAccountForm = () => {
    setAddAccountFormOpen(false);
    setEditingAccount(null);
  };

  const handleCloseRecurringForm = () => {
    setAddRecurringFormOpen(false);
    setEditingRecurringTransaction(null);
  };

  const handleCloseTaskForm = () => {
    setAddTaskFormOpen(false);
    setEditingTask(null);
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard':
        return <Dashboard 
                  user={user} 
                  accounts={accounts} 
                  accountBalances={accountBalances} 
                  transactions={transactions} 
                  tasks={tasks}
                  setView={setView}
                  onToggleTaskCompletion={handleToggleTaskCompletion}
                />;
      case 'calendar':
        return <MovementsView 
                  transactions={transactions} 
                  accounts={accounts} 
                  onSelectTransaction={setSelectedTransaction}
                  onDeleteTransaction={deleteTransaction} 
                />;
      case 'accounts':
        return (
            <AccountsList 
                accounts={accounts}
                transactions={transactions}
                accountBalances={accountBalances} 
                onAddAccount={() => { setEditingAccount(null); setAddAccountFormOpen(true); }} 
                onDeleteAccount={deleteAccount}
                onEditAccount={handleEditAccount}
                onUpdateAccount={updateAccount}
                onSelectTransaction={setSelectedTransaction}
                onAddMoneyToCard={handleAddMoneyToCard}
            />
        );
      case 'tasks':
        return <TasksList 
                  tasks={tasks} 
                  onToggleCompletion={handleToggleTaskCompletion}
                  onDeleteTask={deleteTask}
                  onEditTask={handleEditTask}
                  onAddTask={() => { setEditingTask(null); setAddTaskFormOpen(true); }}
               />;
      case 'recurring':
        return <RecurringTransactionList 
                  recurringTransactions={recurringTransactions} 
                  accounts={accounts} 
                  onDelete={deleteRecurringTransaction} 
                  onEdit={handleEditRecurringTransaction}
                  onAdd={() => { setEditingRecurringTransaction(null); setAddRecurringFormOpen(true); }}
                />;
      case 'notifications':
        return <NotificationsList />;
      default:
        return <Dashboard user={user} accounts={accounts} accountBalances={accountBalances} transactions={transactions} tasks={tasks} setView={setView} onToggleTaskCompletion={handleToggleTaskCompletion} />;
    }
  }
  
  const FormModal: React.FC<{isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode}> = ({isOpen, onClose, title, children}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                <button 
                    onClick={onClose} 
                    className="absolute -top-10 right-0 text-white bg-neutral-700 rounded-full p-2 hover:bg-neutral-600 transition-colors"
                    aria-label={`Cerrar ${title}`}
                >
                    <X className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    );
  };

  if (isLocked) {
    return <PinLockScreen correctPin={user.pin!} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen font-sans pb-24">
      <Header 
        onOpenSettings={() => setSettingsOpen(true)} 
        onOpenSearch={() => setSearchModalOpen(true)} 
        setView={setView}
      />

      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          transactions={transactions}
          accounts={accounts}
          onSelectTransaction={(t) => {
            setSelectedTransaction(t);
            setSearchModalOpen(false);
          }}
        />
      )}

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setSettingsOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onTogglePin={handleTogglePin}
        onLogout={handleLogout}
        onResetSettings={handleResetSettings}
      />

      {isPinSetupOpen && (
        <PinSetupModal
            onClose={() => setPinSetupOpen(false)}
            onSetPin={handleSetPin}
        />
      )}

      <main className="container mx-auto p-4 md:p-8">
        {renderView()}
      </main>

      <FormModal isOpen={isAddTransactionFormOpen} onClose={() => {setAddTransactionFormOpen(false); setPrefillDataForTransaction(null); setTaskToComplete(null);}} title="formulario de transacción">
        <AddTransactionForm 
            onAddTransaction={(t) => addTransaction(t, taskToComplete?.id)} 
            accounts={accounts} 
            defaultCurrency={user.defaultCurrency} 
            prefillData={prefillDataForTransaction}
        />
      </FormModal>

      <FormModal isOpen={isAddTransferFormOpen} onClose={() => { setAddTransferFormOpen(false); setPrefillTransfer(null); }} title="formulario de transferencia">
        <AddTransferForm onAddTransfer={addTransfer} accounts={accounts} defaultCurrency={user.defaultCurrency} prefillData={prefillTransfer}/>
      </FormModal>

      <FormModal isOpen={isAddRecurringFormOpen} onClose={handleCloseRecurringForm} title="formulario de transacción fija">
        <AddRecurringTransactionForm 
            onAddRecurring={addRecurringTransaction} 
            onUpdateRecurring={updateRecurringTransaction}
            recurringTransactionToEdit={editingRecurringTransaction}
            accounts={accounts} 
            defaultCurrency={user.defaultCurrency} />
      </FormModal>

      <FormModal isOpen={isAddAccountFormOpen} onClose={handleCloseAccountForm} title="formulario de cuenta">
        <AddAccountForm 
          onAddAccount={addAccount} 
          onUpdateAccount={updateAccount}
          accountToEdit={editingAccount}
        />
      </FormModal>

      <FormModal isOpen={isAddTaskFormOpen} onClose={handleCloseTaskForm} title="formulario de tarea">
          <AddTaskForm 
            onAddTask={handleAddTask}
            onUpdateTask={updateTask}
            taskToEdit={editingTask}
            accounts={accounts}
            defaultCurrency={user.defaultCurrency}
          />
      </FormModal>
      
      {selectedTransaction && (
        <TransactionDetailModal 
          transaction={selectedTransaction} 
          accounts={accounts}
          onClose={() => setSelectedTransaction(null)} 
          onDelete={deleteTransaction}
        />
      )}

      {taskToComplete && !isAddTransactionFormOpen && (
          <CompleteTaskModal
              task={taskToComplete}
              onClose={() => setTaskToComplete(null)}
              onCompleteWithTransaction={handleCompleteTaskWithTransaction}
              onCompleteOnly={handleCompleteTaskOnly}
          />
      )}

      {isAddMenuOpen && (
        <AddMenuModal 
            onClose={() => setAddMenuOpen(false)}
            onSelect={(type) => {
                if (type === 'transaction') setAddTransactionFormOpen(true);
                if (type === 'transfer') setAddTransferFormOpen(true);
                if (type === 'recurring') { setEditingRecurringTransaction(null); setAddRecurringFormOpen(true); }
                if (type === 'task') { setEditingTask(null); setAddTaskFormOpen(true); }
                setAddMenuOpen(false);
            }}
        />
      )}
      
       {isFijosMenuOpen && (
        <FijosMenuModal
            onClose={() => setFijosMenuOpen(false)}
            setView={setView}
        />
       )}

      <BottomNavBar 
        activeView={view} 
        setView={setView} 
        openAddMenu={() => setAddMenuOpen(true)}
        openFijosMenu={() => setFijosMenuOpen(true)}
      />
    </div>
  );
};

export default App;