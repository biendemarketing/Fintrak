// FIX: This file was missing. Added all necessary type definitions.
export type View = 'dashboard' | 'calendar' | 'accounts' | 'recurring' | 'notifications' | 'tasks' | 'budgets';

export type Currency = 'DOP' | 'USD';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';
export type AccountType = 'Cuenta de Nómina' | 'Cuenta de Ahorro' | 'Cuenta Corriente' | 'Cuenta Empresarial' | 'Tarjeta de Crédito';
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';
export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';

export interface Category {
    name: string;
    type: 'income' | 'expense';
}

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
    receiptImage?: string | null;
    accountId: string;
    transferToAccountId?: string | null;
}

export interface Account {
    id: string;
    user_id: string;
    name: string;
    bank: string;
    type: AccountType;
    currency: Currency;
    accountNumber?: string | null;
    cardNumber?: string | null;
    cardBrand?: CardBrand | null;
    isFrozen?: boolean;
}

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
    time?: string | null; // HH:MM
    isCompleted: boolean;
    transactionId?: string | null;
    createdAt: string; // ISO 8601
    completedAt?: string | null; // ISO 8601
}

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: 'monthly'; // For now, only monthly
    created_at: string;
}

export interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    date_of_birth?: string;
}

export interface AppSettings {
    theme: ThemeName;
    defaultCurrency: Currency;
    pin: string | null;
    pinEnabled: boolean;
}
