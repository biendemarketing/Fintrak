import React, { useState, useEffect } from 'react';
import type { Account, AccountType, CardBrand, Currency } from '../types';
import CardUI from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { Landmark, CreditCard } from 'lucide-react';
import { ACCOUNT_TYPES, BANKS_DO, CARD_BRANDS } from '../constants';

interface AddAccountFormProps {
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (account: Partial<Account> & { id: string }) => void;
  accountToEdit: Account | null;
}

const AddAccountForm: React.FC<AddAccountFormProps> = ({ onAddAccount, onUpdateAccount, accountToEdit }) => {
  const [name, setName] = useState('');
  const [bank, setBank] = useState(BANKS_DO[0]);
  const [type, setType] = useState<AccountType>(ACCOUNT_TYPES[0]);
  const [currency, setCurrency] = useState<Currency>('DOP');
  const [accountNumber, setAccountNumber] = useState('');
  
  // Card-specific fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardBrand, setCardBrand] = useState<CardBrand>(CARD_BRANDS[0]);

  const isEditMode = !!accountToEdit;
  const isCard = type === 'Tarjeta de Crédito';

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setBank(accountToEdit.bank);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency);
      setAccountNumber(accountToEdit.accountNumber || '');
      setCardNumber(accountToEdit.cardNumber || '');
      setCardBrand(accountToEdit.cardBrand || CARD_BRANDS[0]);
    } else {
      // Reset form for new account
      setName('');
      setBank(BANKS_DO[0]);
      setType(ACCOUNT_TYPES[0]);
      setCurrency('DOP');
      setAccountNumber('');
      setCardNumber('');
      setCardBrand(CARD_BRANDS[0]);
    }
  }, [accountToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bank || !type) {
      alert('Por favor, llena todos los campos de la cuenta.');
      return;
    }

    const accountData = {
        name,
        bank,
        type,
        currency,
        accountNumber: isCard ? undefined : accountNumber,
        cardNumber: isCard ? cardNumber : undefined,
        cardBrand: isCard ? cardBrand : undefined,
    };

    if (isEditMode) {
        onUpdateAccount({ id: accountToEdit.id, ...accountData });
    } else {
        onAddAccount(accountData);
    }
  };
  
  const title = isEditMode ? "Editar Cuenta" : "Agregar Nueva Cuenta";
  const icon = isCard ? <CreditCard className="w-6 h-6 mr-2 text-brand-primary" /> : <Landmark className="w-6 h-6 mr-2 text-brand-primary" />;

  return (
    <CardUI>
      <div className="flex items-center mb-6">
        {icon}
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="accountName" className="block text-sm font-medium text-neutral-200 mb-1">Nombre</label>
          <Input id="accountName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ahorros Personales" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="accountType" className="block text-sm font-medium text-neutral-200 mb-1">Tipo</label>
                <Select id="accountType" value={type} onChange={(e) => setType(e.target.value as AccountType)} required>
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>
             <div>
                <label htmlFor="accountCurrency" className="block text-sm font-medium text-neutral-200 mb-1">Moneda</label>
                <Select id="accountCurrency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} required>
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                </Select>
            </div>
        </div>

        <div>
          <label htmlFor="bank" className="block text-sm font-medium text-neutral-200 mb-1">Banco o Entidad</label>
          <Select id="bank" value={bank} onChange={(e) => setBank(e.target.value)} required>
             {BANKS_DO.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>
        
        {isCard ? (
            <>
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-neutral-200 mb-1">Últimos 4 dígitos (Opcional)</label>
                  <Input id="cardNumber" type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))} maxLength={4} placeholder="1234" />
                </div>
                <div>
                  <label htmlFor="cardBrand" className="block text-sm font-medium text-neutral-200 mb-1">Marca de la Tarjeta</label>
                  <Select id="cardBrand" value={cardBrand} onChange={(e) => setCardBrand(e.target.value as CardBrand)} required>
                     {CARD_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </div>
            </>
        ) : (
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-neutral-200 mb-1">Número de Cuenta (Opcional)</label>
              <Input id="accountNumber" type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Ej: **** 1234" />
            </div>
        )}
        
        <Button type="submit" className="w-full !mt-6">
          {isEditMode ? 'Guardar Cambios' : 'Crear Cuenta'}
        </Button>
      </form>
    </CardUI>
  );
};

export default AddAccountForm;