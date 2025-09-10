import type { User } from '@supabase/supabase-js';

export type TransactionType = 'income' | 'expense' | 'transfer';
export type Currency = 'DOP' | 'USD';
export type AccountType = 'Cuenta de Nómina' | 'Cuenta de Ahorro' | 'Cuenta Corriente' | 'Cuenta Empresarial' | 'Tarjeta de Crédito';
export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';
export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';
export type View = 'dashboard' | 'accounts' | 'calendar' | 'tasks' | 'recurring' | 'notifications' | 'budgets';

export interface UserProfile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    date_of_birth?: string | null;
    // Merged settings
    theme: ThemeName;
    defaultCurrency: Currency;
    pin: string | null;
    isPinEnabled: boolean;
}

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
    accountId: string;
    receiptImage?: string;
    transferToAccountId?: string;
}

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
    transactionId?: string;
    createdAt: string;
    completedAt?: string;
}

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: 'monthly'; // For future expansion
    created_at: string;
}
