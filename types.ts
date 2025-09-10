export type TransactionType = 'income' | 'expense' | 'transfer';
export type Currency = 'DOP' | 'USD';
export type RecurringFrequency = 'Semanal' | 'Mensual' | 'Anual';
export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Otro';
export type AccountType = 'Cuenta de Nómina' | 'Cuenta de Ahorro' | 'Cuenta Corriente' | 'Cuenta Empresarial' | 'Tarjeta de Crédito';
export type ThemeName = 'default' | 'forest' | 'sunset' | 'ocean';
export type View = 'dashboard' | 'calendar' | 'accounts' | 'tasks' | 'recurring' | 'notifications' | 'budgets';

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
    transferToAccountId?: string | null;
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
    frequency: RecurringFrequency;
    startDate: string; // YYYY-MM-DD
    nextDueDate: string; // YYYY-MM-DD
    accountId: string;
}

export interface Task {
    id: string;
    user_id: string;
    title: string;
    dueDate: string; // YYYY-MM-DD
    time?: string; // HH:MM
    isCompleted: boolean;
    createdAt: string; // ISO 8601
    completedAt?: string | null; // ISO 8601
    transactionId?: string | null;
}

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: 'monthly';
    created_at: string; // ISO 8601
}

export interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    date_of_birth?: string; // YYYY-MM-DD
}

export interface AppSettings {
    theme: ThemeName;
    defaultCurrency: Currency;
    pinLock: string | null;
    notifications: {
        paymentReminders: boolean;
        budgetAlerts: boolean;
        newFeatures: boolean;
    };
}
