
export type Currency = 'DOP' | 'USD';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type View = 'dashboard' | 'calendar' | 'accounts' | 'recurring' | 'tasks' | 'budgets';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  currency: Currency;
  receiptImage?: string; // URL to image
  accountId: string;
  transferToAccountId?: string;
}

export type AccountType = 
    'Cuenta de Nómina' | 
    'Cuenta de Ahorro' | 
    'Cuenta Corriente' | 
    'Cuenta Empresarial' | 
    'Tarjeta de Crédito';

export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  type: AccountType;
  currency: Currency;
  accountNumber?: string;
  cardNumber?: string;
  cardBrand?: CardBrand;
  isFrozen?: boolean;
}

export interface Category {
    name: string;
    type: 'income' | 'expense';
}

export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';

export interface RecurringTransaction {
    id: string;
    user_id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    currency: Currency;
    accountId: string;
    frequency: RecurringFrequency;
    startDate: string; // YYYY-MM-DD
    nextDueDate: string; // YYYY-MM-DD
}

export interface Task {
    id: string;
    user_id: string;
    title: string;
    dueDate: string; // YYYY-MM-DD
    time?: string; // HH:MM
    isCompleted: boolean;
    createdAt: string; // ISO string
    completedAt?: string; // ISO string
    transactionId?: string;
}

export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';

export interface UserProfile {
    id: string; // Should match user id
    first_name: string;
    last_name: string;
    avatar_url?: string;
    theme: ThemeName;
    pin?: string;
    isPinEnabled: boolean;
    default_currency?: Currency;
}

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: 'monthly'; // For future expansion
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    created_at: string;
    type: 'info' | 'warning' | 'reminder';
    title: string;
    message: string;
    is_read: boolean;
    related_url?: string;
}
