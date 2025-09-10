import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Currency, Account } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import FileInput from './ui/FileInput';
import { PlusCircle } from 'lucide-react';
import { CATEGORIES } from '../constants';

interface AddTransactionFormProps {
  // FIX: Omit user_id as it is handled by the parent component.
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'transferToAccountId'>, receiptFile?: File) => void;
  onUpdateTransaction: (transaction: Partial<Transaction> & { id: string }, receiptFile?: File) => void;
  transactionToEdit: Transaction | null;
  accounts: Account[];
  defaultCurrency?: Currency;
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onAddTransaction, onUpdateTransaction, transactionToEdit, accounts, defaultCurrency = 'DOP' }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [accountId, setAccountId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const isEditMode = !!transactionToEdit;

  const filteredCategories = useMemo(() => CATEGORIES.filter(c => c.type === type), [type]);
  
  useEffect(() => {
    if (transactionToEdit) {
        setDescription(transactionToEdit.description);
        setAmount(String(transactionToEdit.amount));
        setType(transactionToEdit.type as 'income' | 'expense');
        setCategory(transactionToEdit.category);
        setDate(transactionToEdit.date);
        setTime(transactionToEdit.time || '');
        setCurrency(transactionToEdit.currency);
        setAccountId(transactionToEdit.accountId);
    } else {
        // Reset form
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('');
        setCurrency(defaultCurrency);
        setAccountId(accounts.length > 0 ? accounts[0].id : '');
        setReceiptFile(null);
    }
  }, [transactionToEdit, accounts, defaultCurrency]);

  useEffect(() => {
      // Auto-select first category when type changes or on initial load
      if (!category && filteredCategories.length > 0) {
          setCategory(filteredCategories[0].name);
      }
      // If the selected category is not in the new list, reset it
      if (category && !filteredCategories.some(c => c.name === category)) {
          setCategory(filteredCategories.length > 0 ? filteredCategories[0].name : '');
      }
  }, [type, filteredCategories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !date || !accountId) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("Por favor, pon un monto válido.");
      return;
    }

    const transactionData = {
      description,
      amount: amountValue,
      type,
      category,
      date,
      time: time || undefined,
      currency,
      accountId,
      receiptImage: transactionToEdit?.receiptImage // Preserve existing image if not changed
    };

    if (isEditMode) {
        onUpdateTransaction({ id: transactionToEdit.id, ...transactionData }, receiptFile || undefined);
    } else {
        onAddTransaction(transactionData, receiptFile || undefined);
    }
  };

  if (accounts.length === 0) {
    return (
        <Card>
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold text-white">¡Necesitas una cuenta!</h3>
                <p className="text-neutral-200 mt-2">Debes tener al menos una cuenta para registrar un movimiento.</p>
            </div>
        </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center mb-6">
        <PlusCircle className="w-6 h-6 mr-2 text-brand-primary" />
        <h3 className="text-xl font-semibold">{isEditMode ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-200 mb-1">Detalle</label>
            <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Compra en el supermercado" required />
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
            <label htmlFor="accountId" className="block text-sm font-medium text-neutral-200 mb-1">Cuenta / Tarjeta</label>
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
                <label htmlFor="date" className="block text-sm font-medium text-neutral-200 mb-1">Fecha</label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="time" className="block text-sm font-medium text-neutral-200 mb-1">Hora (Opcional)</label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-neutral-200 mb-1">Adjuntar Factura (Opcional)</label>
            <FileInput id="receipt" onChange={setReceiptFile} />
             {isEditMode && transactionToEdit?.receiptImage && (
                <p className="text-xs text-neutral-400 mt-2">Sube una nueva imagen para reemplazar la existente.</p>
            )}
        </div>
        <Button type="submit" className="w-full !mt-6">
          {isEditMode ? 'Guardar Cambios' : 'Registrar Movimiento'}
        </Button>
      </form>
    </Card>
  );
};

export default AddTransactionForm;
