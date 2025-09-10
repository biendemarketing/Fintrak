
import React, { useState, useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Account, Currency, Transaction } from '../types.ts';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import { Landmark, Trash2, CreditCard, PiggyBank, Briefcase, HandCoins, Pencil, CircleDollarSign } from 'lucide-react';
import SegmentedControl from './ui/SegmentedControl.tsx';
import CardsView from './CardsView.tsx';

interface AccountsListProps {
  accounts: Account[];
  transactions: Transaction[];
  accountBalances: { [key: string]: { balanceDOP: number; balanceUSD: number } };
  onAddAccount: () => void;
  onDeleteAccount: (id: string) => void;
  onEditAccount: (account: Account) => void;
  onUpdateAccount: (account: Partial<Account> & { id: string }) => void;
  onSelectTransaction: (transaction: Transaction) => void;
  onAddMoneyToCard: (card: Account) => void;
}

const AccountIcon = ({ type, bank }: { type: Account['type'], bank: Account['bank'] }) => {
    if (bank === 'Efectivo') {
        return <HandCoins className="w-8 h-8 text-income" />;
    }
    switch (type) {
        case 'Tarjeta de Crédito':
            return <CreditCard className="w-8 h-8 text-indigo-400" />;
        case 'Cuenta de Nómina':
            return <CircleDollarSign className="w-8 h-8 text-income" />;
        case 'Cuenta de Ahorro':
            return <PiggyBank className="w-8 h-8 text-brand-primary" />;
        case 'Cuenta Corriente':
            return <Briefcase className="w-8 h-8 text-brand-primary" />;
        default:
            return <Landmark className="w-8 h-8 text-neutral-500 dark:text-neutral-600" />;
    }
};

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const maskAccountNumber = (number?: string) => {
    if (!number || number.length <= 4) return number;
    return `**** ${number.slice(-4)}`;
};

const AccountsListView: React.FC<{
    accounts: Account[];
    balances: AccountsListProps['accountBalances'];
    onDeleteAccount: AccountsListProps['onDeleteAccount'];
    onEditAccount: AccountsListProps['onEditAccount'];
}> = ({ accounts, balances, onDeleteAccount, onEditAccount }) => (
     <ul className="space-y-4">
      {accounts.map(account => {
        const accountBalance = balances[account.id] || { balanceDOP: 0, balanceUSD: 0 };
        const primaryBalance = account.currency === 'DOP' ? accountBalance.balanceDOP : accountBalance.balanceUSD;
        return (
            <li 
                key={account.id} 
                className="flex items-center justify-between p-4 bg-neutral-100/50 dark:bg-neutral-800/60 rounded-lg"
            >
              <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                <AccountIcon type={account.type} bank={account.bank} />
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{account.name}</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-200">{account.bank} - <span className="text-xs text-neutral-500 dark:text-neutral-600">{account.type}</span></p>
                  {account.accountNumber && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-600 pt-1 font-mono tracking-wider">{maskAccountNumber(account.accountNumber)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                 <div className="text-right">
                    <p className="font-semibold text-income text-sm">{formatCurrency(primaryBalance, account.currency)}</p>
                 </div>
                  <button
                    onClick={() => onEditAccount(account)}
                    className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors duration-200"
                    aria-label={`Editar cuenta ${account.name}`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDeleteAccount(account.id)}
                    className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-expense hover:bg-expense/10 rounded-full transition-colors duration-200"
                    aria-label={`Eliminar cuenta ${account.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
              </div>
            </li>
        )
       })}
    </ul>
);

const AccountsList: React.FC<AccountsListProps> = (props) => {
  const [activeView, setActiveView] = useState<'accounts' | 'cards'>('accounts');
  
  const { bankAccounts, creditCards } = useMemo(() => {
    const bankAccounts = props.accounts.filter(acc => acc.type !== 'Tarjeta de Crédito');
    const creditCards = props.accounts.filter(acc => acc.type === 'Tarjeta de Crédito');
    return { bankAccounts, creditCards };
  }, [props.accounts]);

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Mis Cuentas</h3>
            <Button onClick={props.onAddAccount} className="w-auto px-4 py-2 text-sm !transform-none">
                Agregar
            </Button>
        </div>
        
        <div className="mb-6">
             <SegmentedControl
                options={[{label: 'Cuentas', value: 'accounts'}, {label: 'Tarjetas', value: 'cards'}]}
                value={activeView}
                onChange={(value) => setActiveView(value as 'accounts' | 'cards')}
            />
        </div>
      
      {activeView === 'accounts' && (
          bankAccounts.length === 0 ? (
            <Card>
                <div className="text-center py-10">
                    <p className="text-neutral-700 dark:text-neutral-200">No has agregado ninguna cuenta bancaria.</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-600">¡Crea tu primera cuenta para empezar!</p>
                </div>
            </Card>
          ) : (
            <AccountsListView accounts={bankAccounts} balances={props.accountBalances} onDeleteAccount={props.onDeleteAccount} onEditAccount={props.onEditAccount} />
          )
      )}

       {activeView === 'cards' && (
          creditCards.length === 0 ? (
             <Card>
                <div className="text-center py-10">
                    <p className="text-neutral-700 dark:text-neutral-200">No has agregado ninguna tarjeta.</p>
                     <p className="text-sm text-neutral-500 dark:text-neutral-600">Agrega una cuenta de tipo 'Tarjeta de Crédito'.</p>
                </div>
            </Card>
          ) : (
            <CardsView 
                cards={creditCards} 
                accounts={props.accounts}
                transactions={props.transactions}
                balances={props.accountBalances}
                onEditCard={props.onEditAccount}
                onUpdateCard={props.onUpdateAccount}
                onSelectTransaction={props.onSelectTransaction}
                onAddMoneyToCard={props.onAddMoneyToCard}
            />
          )
      )}
    </div>
  );
};

export default AccountsList;