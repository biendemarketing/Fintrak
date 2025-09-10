
import React, { useState, useMemo, useEffect } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { RecurringTransaction, Currency, Account } from '../types.ts';
import Card from './ui/Card.tsx';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';
import Select from './ui/Select.tsx';
import { Repeat } from 'lucide-react';
import { CATEGORIES, RECURRING_FREQUENCIES } from '../constants.ts';

interface AddRecurringTransactionFormProps {
  // FIX: Omit user_id as it is handled by the parent component.
  onAddRecurring: (transaction: Omit<RecurringTransaction, 'id' | 'user_id' | 'nextDueDate'>) => void;
  onUpdateRecurring: (transaction: Partial<RecurringTransaction> & { id: string }) => void;
  recurringTransactionToEdit: RecurringTransaction | null;
  accounts: Account[];
  defaultCurrency?: Currency;
}

const AddRecurringTransactionForm: React.FC<AddRecurringTransactionFormProps> = ({ onAddRecurring, onUpdateRecurring, recurringTransactionToEdit, accounts, defaultCurrency = 'DOP' }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [accountId, setAccountId] = useState<string>('');
  const [frequency, setFrequency] = useState(RECURRING_FREQUENCIES[1]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const isEditMode = !!recurringTransactionToEdit;

  const filteredCategories = useMemo(() => CATEGORIES.filter(c => c.type === type), [type]);

  useEffect(() => {
    if (recurringTransactionToEdit) {
      setDescription(recurringTransactionToEdit.description);
      setAmount(String(recurringTransactionToEdit.amount));
      setType(recurringTransactionToEdit.type);
      setCategory(recurringTransactionToEdit.category);
      setCurrency(recurringTransactionToEdit.currency);
      setAccountId(recurringTransactionToEdit.accountId);
      setFrequency(recurringTransactionToEdit.frequency);
      setStartDate(recurringTransactionToEdit.startDate);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setCategory('');
      setCurrency(defaultCurrency);
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setFrequency(RECURRING_FREQUENCIES[1]);
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [recurringTransactionToEdit, accounts, defaultCurrency]);
  
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === category)) setCategory('');
  }, [type, filteredCategories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !startDate || !accountId) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("Por favor, pon un monto válido.");
      return;
    }

    const payload = { description, amount: amountValue, type, category, currency, accountId, frequency, startDate };
    
    if (isEditMode) {
        onUpdateRecurring({ id: recurringTransactionToEdit.id, ...payload });
    } else {
        onAddRecurring(payload);
    }
  };

  if (accounts.length === 0) {
    return (
      <Card>
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold text-white">¡Necesitas una cuenta!</h3>
          <p className="text-neutral-200 mt-2">Debes tener al menos una cuenta para crear un movimiento fijo.</p>
        </div>
      </Card>
    );
  }

  const title = isEditMode ? 'Editar Movimiento Fijo' : 'Nuevo Gasto/Ingreso Fijo';
  const buttonText = isEditMode ? 'Guardar Cambios' : 'Guardar Movimiento Fijo';

  return (
    <Card>
      <div className="flex items-center mb-6">
        <Repeat className="w-6 h-6 mr-2 text-brand-primary" />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
       <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-200 mb-1">Detalle</label>
            <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Pago de Alquiler" required />
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
            <label htmlFor="type" className="block text-sm font-medium text-neutral-200 mb-1">Tipo</label>
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')}>
                <option value="expense">Salida</option>
                <option value="income">Entrada</option>
            </Select>
        </div>
        <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-neutral-200 mb-1">Cuenta</label>
            <Select id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>)}
            </Select>
        </div>
        <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-200 mb-1">Categoría</label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>Seleccione una categoría</option>
                {filteredCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-neutral-200 mb-1">Frecuencia</label>
                <Select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                    {RECURRING_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </Select>
            </div>
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-neutral-200 mb-1">Fecha de Inicio</label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
        </div>
        <Button type="submit" className="w-full !mt-6">{buttonText}</Button>
      </form>
    </Card>
  );
};

export default AddRecurringTransactionForm;