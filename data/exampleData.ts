
// FIX: This file was missing. Added example data.
// FIX: Add file extension to fix module resolution error.
import type { Transaction, Account, RecurringTransaction, Task } from '../types.ts';

export const exampleAccounts: Omit<Account, 'id' | 'user_id'>[] = [
    { name: 'Cuenta Principal', bank: 'Banco Popular', type: 'Cuenta de Ahorro', currency: 'DOP', accountNumber: '**** 1234' },
    { name: 'Tarjeta Gold', bank: 'BHD', type: 'Tarjeta de Crédito', currency: 'DOP', cardNumber: '5678', cardBrand: 'Visa' },
    { name: 'Ahorros Dólares', bank: 'Scotiabank', type: 'Cuenta de Ahorro', currency: 'USD', accountNumber: '**** 9012' },
    { name: 'Efectivo', bank: 'Efectivo', type: 'Cuenta Corriente', currency: 'DOP' },
];

export const exampleTransactions: Omit<Transaction, 'id' | 'user_id' | 'accountId'>[] = [
    { description: 'Salario Quincena', amount: 50000, type: 'income', category: 'Nómina', date: '2023-10-15', currency: 'DOP' },
    { description: 'Compra Supermercado', amount: 4500, type: 'expense', category: 'Supermercado/Compras', date: '2023-10-16', currency: 'DOP' },
    { description: 'Pago Netflix', amount: 15, type: 'expense', category: 'Entretenimiento/Junte', date: '2023-10-18', currency: 'USD' },
    { description: 'Gasolina', amount: 1500, type: 'expense', category: 'Transporte/Carro', date: '2023-10-20', currency: 'DOP' },
];

export const exampleRecurringTransactions: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate' | 'accountId'>[] = [
    { description: 'Pago Alquiler', amount: 25000, type: 'expense', category: 'Casa/Alquiler', currency: 'DOP', frequency: 'Mensual', startDate: '2023-10-01' },
    { description: 'Suscripción Gym', amount: 2500, type: 'expense', category: 'Salud', currency: 'DOP', frequency: 'Mensual', startDate: '2023-10-05' },
];

export const exampleTasks: Omit<Task, 'id' | 'user_id' | 'createdAt' | 'completedAt' >[] = [
    { title: 'Pagar factura de luz', dueDate: '2023-10-25', isCompleted: false },
    { title: 'Llamar al banco por nueva tarjeta', dueDate: '2023-10-22', isCompleted: true },
];