
import React, { useState, useEffect } from 'react';
import type { Transaction, Currency, Account } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { ArrowRightLeft } from 'lucide-react';

interface AddTransferFormProps {
  onAddTransfer: (transfer: Omit<Transaction, 'id' | 'type' | 'category' | 'description'>) => void;
  accounts: Account[];
  defaultCurrency?: Currency;
  prefillData?: { toAccountId: string } | null;
}

const AddTransferForm: React.FC<AddTransferFormProps> = ({ onAddTransfer, accounts, defaultCurrency = 'DOP', prefillData }) => {
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (accounts.length > 0) {
      if (prefillData?.toAccountId) {
        setToAccountId(prefillData.toAccountId);
        const firstAvailableFromAccount = accounts.find(acc => acc.id !== prefillData.toAccountId);
        if (firstAvailableFromAccount) {
          setFromAccountId(firstAvailableFromAccount.id);
        }
      } else {
        setFromAccountId(accounts[0].id);
        if (accounts.length > 1) {
          setToAccountId(accounts[1].id);
        }
      }
    }
  }, [accounts, prefillData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || !amount || !date) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    if (fromAccountId === toAccountId) {
        alert("La cuenta de origen y destino no pueden ser la misma.");
        return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        alert("Por favor, pon un monto válido.");
        return;
    }

    onAddTransfer({
      amount: amountValue,
      date,
      currency,
      accountId: fromAccountId,
      transferToAccountId: toAccountId,
    });
  };

  if (accounts.length < 2) {
    return (
        <Card>
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold text-white">¡Necesitas más cuentas!</h3>
                <p className="text-neutral-200 mt-2">Para hacer una transferencia, necesitas tener al menos dos cuentas registradas.</p>
            </div>
        </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center mb-6">
        <ArrowRightLeft className="w-6 h-6 mr-2 text-brand-primary" />
        <h3 className="text-xl font-semibold">Nueva Transferencia</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fromAccountId" className="block text-sm font-medium text-neutral-200 mb-1">Desde la Cuenta</label>
          <Select id="fromAccountId" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
            {accounts.filter(acc => acc.id !== toAccountId).map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="toAccountId" className="block text-sm font-medium text-neutral-200 mb-1">Hacia la Cuenta</label>
          <Select id="toAccountId" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
            {accounts.filter(acc => acc.id !== fromAccountId).map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-neutral-200 mb-1">Monto</label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required min="0.01" step="0.01" />
            </div>
            <div>
                 <label htmlFor="currency" className="block text-sm font-medium text-neutral-200 mb-1">Moneda</label>
                 <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                    <option value="DOP">RD$</option>
                    <option value="USD">US$</option>
                </Select>
            </div>
        </div>
        <div>
            <label htmlFor="date" className="block text-sm font-medium text-neutral-200 mb-1">Fecha</label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full !mt-6">
          Realizar Transferencia
        </Button>
      </form>
    </Card>
  );
};

export default AddTransferForm;
