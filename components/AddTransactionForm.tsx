import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, TransactionType, Currency, Account } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import FileInput from './ui/FileInput';
import { PlusCircle } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { resizeImage } from '../utils/image';

interface AddTransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  accounts: Account[];
  defaultCurrency?: Currency;
  prefillData?: { description: string; date: string; type: TransactionType } | null;
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onAddTransaction, accounts, defaultCurrency = 'DOP', prefillData }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [accountId, setAccountId] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>();

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(c => c.type === type);
  }, [type]);

  useEffect(() => {
    // Set default source
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (prefillData) {
        setDescription(prefillData.description);
        setDate(prefillData.date);
        setType(prefillData.type);
    } else {
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setType('expense');
    }
  }, [prefillData]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === category)) {
        setCategory('');
    }
  }, [type, filteredCategories, category]);
  
  const handleFileChange = async (file: File | null) => {
    if (file) {
      try {
        const resizedImage = await resizeImage(file, 800);
        setReceiptImage(resizedImage);
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("Hubo un error al procesar la imagen.");
      }
    } else {
        setReceiptImage(undefined);
    }
  };


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

    onAddTransaction({
      description,
      amount: amountValue,
      type,
      category,
      date,
      time,
      currency,
      accountId: accountId,
      receiptImage,
    });
  };
  
  if (accounts.length === 0) {
    return (
        <Card>
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold text-white">¡Primero una cuenta!</h3>
                <p className="text-neutral-200 mt-2">Necesitas agregar una cuenta o tarjeta antes de registrar un movimiento.</p>
                <p className="text-sm text-neutral-600">Ve a la sección de 'Cuentas' para empezar.</p>
            </div>
        </Card>
    );
  }
  
  const { cards, bankAccounts } = useMemo(() => {
    const cards = accounts.filter(acc => acc.type === 'Tarjeta de Crédito');
    const bankAccounts = accounts.filter(acc => acc.type !== 'Tarjeta de Crédito');
    return { cards, bankAccounts };
  }, [accounts]);

  return (
    <Card>
      <div className="flex items-center mb-6">
        <PlusCircle className="w-6 h-6 mr-2 text-brand-primary" />
        <h3 className="text-xl font-semibold">Registrar Movimiento</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-200 mb-1">Detalle</label>
          <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Coro en la zona" required />
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
            <Select id="type" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value="expense">Salida</option>
                <option value="income">Entrada</option>
            </Select>
        </div>
        <div>
            <label htmlFor="source" className="block text-sm font-medium text-neutral-200 mb-1">Cuenta / Tarjeta</label>
            <Select id="source" value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                {cards.length > 0 && <optgroup label="Tarjetas de Crédito">
                    {cards.map(card => (
                        <option key={card.id} value={card.id}>{card.name}</option>
                    ))}
                </optgroup>}
                {bankAccounts.length > 0 && <optgroup label="Cuentas Bancarias">
                    {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                    ))}
                </optgroup>}
            </Select>
        </div>
        <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-200 mb-1">Categoría</label>
            <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="" disabled>Seleccione una categoría</option>
                {filteredCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-neutral-200 mb-1">Fecha</label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="time" className="block text-sm font-medium text-neutral-200 mb-1">Hora</label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
        </div>
        {type === 'expense' && (
            <div>
                <label htmlFor="receipt" className="block text-sm font-medium text-neutral-200 mb-1">Foto de la Factura (Opcional)</label>
                <FileInput id="receipt" onChange={handleFileChange} />
            </div>
        )}
        <Button type="submit" className="w-full !mt-6">
          Agregar Movimiento
        </Button>
      </form>
    </Card>
  );
};

export default AddTransactionForm;