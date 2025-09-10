// FIX: This file was missing. Added full type definitions for the application.

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Currency = 'DOP' | 'USD';

export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';

export type AccountType = 
    'Cuenta de Nómina' |
    'Cuenta de Ahorro' |
    'Cuenta Corriente' |
    'Cuenta Empresarial' |
    'Tarjeta de Crédito';
    
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';

export interface Category {
    name: string;
    type: 'income' | 'expense';
}

export interface Transaction {
    id: string;
    user_id: string; // From Supabase auth
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:MM
    currency: Currency;
    accountId: string;
    receiptImage?: string; // URL to image in Supabase storage
    transferToAccountId?: string;
}

export interface Account {
    id: string;
    user_id: string; // From Supabase auth
    name: string;
    bank: string;
    type: AccountType;
    currency: Currency;
    accountNumber?: string;
    // Card specific
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

export type View = 
    'dashboard' | 
    'calendar' | 
    'accounts' | 
    'recurring' | 
    'notifications' |
    'tasks';

export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';

export interface UserSettings {
    theme: ThemeName;
    defaultCurrency: Currency;
    pinEnabled: boolean;
    pin: string | null;
}

export interface Task {
    id: string;
    user_id: string;
    title: string;
    dueDate: string; // YYYY-MM-DD
    time?: string; // HH:MM
    isCompleted: boolean;
    transactionId?: string | null;
    createdAt: string; // ISO string
    completedAt?: string | null; // ISO string
}
