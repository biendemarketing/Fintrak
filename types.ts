
import type { User } from '@supabase/supabase-js';

export type Currency = 'DOP' | 'USD';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type View = 'dashboard' | 'calendar' | 'accounts' | 'tasks' | 'recurring' | 'notifications' | 'budgets' | 'settings' | 'auth' | 'get-started';

export interface Category {
    name: string;
    type: 'income' | 'expense';
}

export type AccountType = 
    'Cuenta de Nómina' |
    'Cuenta de Ahorro' |
    'Cuenta Corriente' |
    'Cuenta Empresarial' |
    'Tarjeta de Crédito';

export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';

export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';

export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';

export interface Transaction {
    id: string;
    user_id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    currency: Currency;
    accountId: string;
    transferToAccountId?: string;
    receiptImage?: string;
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
    time?: string; // HH:mm
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
    period: 'monthly'; // For now, only monthly
    created_at: string;
}

export interface Profile {
    id: string; // This is the user_id
    first_name: string;
    last_name: string;
    avatar_url?: string;
    date_of_birth?: string;
    updated_at: string;
}

export type AppUser = User;
