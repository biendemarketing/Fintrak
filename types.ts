
export type TransactionType = 'income' | 'expense' | 'transfer';
export type Currency = 'DOP' | 'USD';
export type AccountType = 'Cuenta de Nómina' | 'Cuenta de Ahorro' | 'Cuenta Corriente' | 'Cuenta Empresarial' | 'Tarjeta de Crédito';
export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';
export type View = 'dashboard' | 'calendar' | 'accounts' | 'recurring' | 'notifications' | 'tasks';
export type Theme = 'light' | 'dark';
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';
export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';


export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  currency: Currency;
  accountNumber?: string;
  // Card-specific properties, optional
  cardNumber?: string;
  cardBrand?: CardBrand;
  isFrozen?: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  time?: string; // Hora de la transacción
  currency: Currency;
  accountId?: string; // ID of the account or card
  receiptImage?: string; // Base64 encoded image string
  transferToAccountId?: string; // ID of the account receiving the transfer
}

export interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    currency: Currency;
    accountId: string; // Recurring transactions are assumed to be from bank accounts
    frequency: RecurringFrequency;
    startDate: string;
    nextDueDate: string;
}

export interface Category {
    name: string;
    type: 'income' | 'expense';
}

export interface User {
  name: string;
  profilePic?: string; // Base64 encoded image string
  theme?: Theme;
  themeStyle?: ThemeName;
  pinEnabled?: boolean;
  pin?: string; // 4-digit string
  notificationsEnabled?: boolean;
  defaultCurrency?: Currency;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  time?: string; // Hora de vencimiento
  isCompleted: boolean;
  createdAt: string; // ISO string
  completedAt: string | null; // ISO string
  transactionId?: string; // Optional linked transaction
}