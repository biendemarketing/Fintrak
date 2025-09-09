
import type { Account, Transaction, RecurringTransaction, User, Task } from './types';

const account1Id = 'acc-1';
const account2Id = 'acc-2';
const account3Id = 'acc-3';
const account4Id = 'acc-4';
const card1Id = 'card-1';
const card2Id = 'card-2';
const card3Id = 'card-3';
const card4Id = 'card-4';


export const exampleUser: User = {
    name: 'Juan Dominicano',
    profilePic: undefined,
    theme: 'dark',
    themeStyle: 'default',
    pinEnabled: false,
    pin: undefined,
    notificationsEnabled: true,
    defaultCurrency: 'DOP',
};

export const exampleAccounts: Account[] = [
  {
    id: account1Id,
    name: 'Nómina Popular',
    bank: 'Banco Popular',
    type: 'Cuenta de Nómina',
    currency: 'DOP',
    accountNumber: '123456789',
  },
  {
    id: account3Id,
    name: 'Mi Billetera',
    bank: 'Efectivo',
    type: 'Cuenta de Ahorro',
    currency: 'DOP',
  },
  {
    id: account2Id,
    name: 'Cuenta Corriente BHD',
    bank: 'BHD',
    type: 'Cuenta Corriente',
    currency: 'DOP',
    accountNumber: '55556666',
  },
   {
    id: account4Id,
    name: 'Ahorros en Dólares',
    bank: 'Scotiabank',
    type: 'Cuenta de Ahorro',
    currency: 'USD',
    accountNumber: '987654321',
  },
  {
    id: card1Id,
    name: 'Tarjeta Gold BHD',
    bank: 'BHD',
    type: 'Tarjeta de Crédito',
    currency: 'DOP',
    cardBrand: 'Visa',
    cardNumber: '4321',
    isFrozen: false,
  },
  {
    id: card2Id,
    name: 'Mastercard Black',
    bank: 'Banreservas',
    type: 'Tarjeta de Crédito',
    currency: 'USD',
    cardBrand: 'Mastercard',
    cardNumber: '8876',
    isFrozen: false,
  },
  {
    id: card3Id,
    name: 'APAP Visa',
    bank: 'Asociación Popular de Ahorros y Préstamos',
    type: 'Tarjeta de Crédito',
    currency: 'DOP',
    cardBrand: 'Visa',
    cardNumber: '1122',
    isFrozen: true,
  },
  {
    id: card4Id,
    name: 'Amex Scotiabank',
    bank: 'Scotiabank',
    type: 'Tarjeta de Crédito',
    currency: 'DOP',
    cardBrand: 'American Express',
    cardNumber: '5555',
    isFrozen: false,
  }
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(today.getDate() - 3);
const fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(today.getDate() - 5);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const inFiveDays = new Date(today);
inFiveDays.setDate(today.getDate() + 5);


export const exampleTransactions: Transaction[] = [
  {
    id: 'txn-1',
    description: 'Salario Quincena',
    amount: 35000,
    type: 'income',
    category: 'Nómina',
    date: yesterday.toISOString().split('T')[0],
    time: '09:05',
    currency: 'DOP',
    accountId: account1Id,
  },
  {
    id: 'txn-2',
    description: 'Compra en el Nacional',
    amount: 4500.50,
    type: 'expense',
    category: 'Supermercado/Compras',
    date: threeDaysAgo.toISOString().split('T')[0],
    time: '18:30',
    currency: 'DOP',
    accountId: card1Id,
  },
  {
    id: 'txn-4',
    description: 'Gasolina',
    amount: 1500,
    type: 'expense',
    category: 'Transporte/Carro',
    date: yesterday.toISOString().split('T')[0],
    time: '12:15',
    currency: 'DOP',
    accountId: card3Id,
  },
  {
    id: 'txn-5',
    description: 'Cena en La Dolcerie',
    amount: 3200,
    type: 'expense',
    category: 'Comida/Colmado',
    date: fiveDaysAgo.toISOString().split('T')[0],
    time: '20:45',
    currency: 'DOP',
    accountId: card1Id,
  },
  {
    id: 'txn-3',
    description: `Pago Tarjeta Gold BHD`,
    amount: 5000,
    type: 'transfer',
    category: 'Transferencia',
    date: today.toISOString().split('T')[0],
    time: '11:00',
    currency: 'DOP',
    accountId: account1Id, // From Nómina
    transferToAccountId: card1Id, // To the credit card
  },
];

export const exampleRecurringTransactions: RecurringTransaction[] = [
    {
        id: 'rec-1',
        description: 'Pago Internet Altice',
        amount: 2500,
        type: 'expense',
        category: 'Internet/Cable',
        currency: 'DOP',
        accountId: account1Id,
        frequency: 'Mensual',
        startDate: new Date(today.getFullYear(), today.getMonth(), 28).toISOString().split('T')[0],
        nextDueDate: new Date(today.getFullYear(), today.getMonth(), 28).toISOString().split('T')[0],
    },
    {
        id: 'rec-2',
        description: 'Suscripción Netflix',
        amount: 12.99,
        type: 'expense',
        category: 'Entretenimiento/Junte',
        currency: 'USD',
        accountId: card2Id,
        frequency: 'Mensual',
        startDate: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
        nextDueDate: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
    }
];

export const exampleTasks: Task[] = [
    {
        id: 'task-1',
        title: 'Pagar factura de la luz',
        dueDate: tomorrow.toISOString().split('T')[0],
        time: '18:00',
        isCompleted: false,
        createdAt: threeDaysAgo.toISOString(),
        completedAt: null,
    },
    {
        id: 'task-2',
        title: 'Llamar al banco por cargo extraño',
        dueDate: inFiveDays.toISOString().split('T')[0],
        time: '10:30',
        isCompleted: false,
        createdAt: yesterday.toISOString(),
        completedAt: null,
    },
    {
        id: 'task-3',
        title: 'Comprar regalo de cumpleaños para María',
        dueDate: today.toISOString().split('T')[0],
        isCompleted: false,
        createdAt: today.toISOString(),
        completedAt: null,
    },
    {
        id: 'task-4',
        title: 'Revisar presupuesto mensual',
        dueDate: yesterday.toISOString().split('T')[0],
        isCompleted: true,
        createdAt: fiveDaysAgo.toISOString(),
        completedAt: yesterday.toISOString(),
    }
];

export type { Account, Transaction, RecurringTransaction, User, Task };