
import type { Category, AccountType, RecurringFrequency, CardBrand, ThemeName } from './types';

export const CATEGORIES: Category[] = [
    // Income
    { name: 'Nómina', type: 'income' },
    { name: 'Inversiones', type: 'income' },
    { name: 'Regalos', type: 'income' },
    { name: 'Coro/Extra', type: 'income' },
    { name: 'Otros Ingresos', type: 'income' },
    // Expenses
    { name: 'Comida/Colmado', type: 'expense' },
    { name: 'Transporte/Carro', type: 'expense' },
    { name: 'Casa/Alquiler', type: 'expense' },
    { name: 'Servicios (Luz, Agua, etc.)', type: 'expense' },
    { name: 'Internet/Cable', type: 'expense' },
    { name: 'Préstamos/Deudas', type: 'expense' },
    { name: 'Entretenimiento/Junte', type: 'expense' },
    { name: 'Salud', type: 'expense' },
    { name: 'Educación', type: 'expense' },
    { name: 'Supermercado/Compras', type: 'expense' },
    { name: 'Otros Gastos', type: 'expense' },
];

export const ACCOUNT_TYPES: AccountType[] = [
    'Cuenta de Nómina',
    'Cuenta de Ahorro',
    'Cuenta Corriente',
    'Cuenta Empresarial',
    'Tarjeta de Crédito'
];

export const BANKS_DO: string[] = [
    'Efectivo',
    'Banco Popular',
    'Banreservas',
    'BHD',
    'Scotiabank',
    'Banco Santa Cruz',
    'Asociación Popular de Ahorros y Préstamos',
    'Asociación Cibao de Ahorros y Préstamos',
    'Otro'
];

export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
    'Semanal',
    'Mensual',
    'Anual'
];

export const CARD_BRANDS: CardBrand[] = [
    'Visa',
    'Mastercard',
    'American Express',
    'Otro'
];

export const COLOR_THEMES: { name: ThemeName; label: string; primary: string; secondary: string }[] = [
    { name: 'default', label: 'Predeterminado', primary: '79 70 229', secondary: '236 72 153' },
    { name: 'forest', label: 'Bosque', primary: '22 163 74', secondary: '249 115 22' },
    { name: 'sunset', label: 'Atardecer', primary: '147 51 234', secondary: '245 158 11' },
    { name: 'ocean', label: 'Océano', primary: '59 130 246', secondary: '20 184 166' },
];
