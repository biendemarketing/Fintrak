
import React, { useState, useEffect, useMemo } from 'react';
// FIX: Add file extension to fix module resolution error.
import type { Task, Transaction, Account, Currency, TransactionType } from '../types.ts';
import Card from './ui/Card.tsx';
import Input from './ui/Input.tsx';
import Button from './ui/Button.tsx';
import Select from './ui/Select.tsx';
import ToggleSwitch from './ui/ToggleSwitch.tsx';
import { ListChecks } from 'lucide-react';
import { CATEGORIES } from '../constants.ts';

interface AddTaskFormProps {
  // FIX: Omit user_id as it is handled by the parent component.
  onAddTask: (taskData: Omit<Task, 'id' | 'user_id' | 'isCompleted' | 'transactionId' | 'createdAt' | 'completedAt'>, transactionData?: Omit<Transaction, 'id' | 'user_id' | 'description'>) => void;
  onUpdateTask: (task: Partial<Task> & { id: string }) => void;
  taskToEdit: Task | null;
  accounts: Account[];
  defaultCurrency?: Currency;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask, onUpdateTask, taskToEdit, accounts, defaultCurrency }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [showTransaction, setShowTransaction] = useState(false);
  
  // Transaction fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency || 'DOP');
  const [accountId, setAccountId] = useState('');

  const isEditMode = !!taskToEdit;
  const filteredCategories = useMemo(() => CATEGORIES.filter(c => c.type === type), [type]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDueDate(taskToEdit.dueDate);
      setTime(taskToEdit.time || '');
      // Note: Editing a task with an existing transaction is not supported in this form for simplicity.
      setShowTransaction(false);
    } else {
      setTitle('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setTime('');
    }
  }, [taskToEdit]);
  
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === category)) {
        setCategory('');
    }
  }, [type, filteredCategories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      alert('Por favor, completa el título y la fecha de la tarea.');
      return;
    }
    
    let transactionData;
    if (showTransaction) {
      if (!amount || !category || !accountId) {
        alert("Por favor, completa todos los campos del movimiento.");
        return;
      }
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        alert("Por favor, pon un monto válido para el movimiento.");
        return;
      }
      transactionData = {
        amount: amountValue,
        type,
        category,
        date: dueDate, // The transaction date is the same as the task due date
        time, // Also pass the task time
        currency,
        accountId,
      };
    }
    
    const taskPayload = { title, dueDate, time: time || undefined };

    if (isEditMode) {
      onUpdateTask({ id: taskToEdit.id, ...taskPayload });
    } else {
      onAddTask(taskPayload, transactionData);
    }
  };

  return (
    <Card>
      <div className="flex items-center mb-6">
        <ListChecks className="w-6 h-6 mr-2 text-brand-primary" />
        <h3 className="text-xl font-semibold">{isEditMode ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium text-neutral-200 mb-1">Título</label>
          <Input id="taskTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Pagar el internet" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-200 mb-1">Fecha de Vencimiento</label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="dueTime" className="block text-sm font-medium text-neutral-200 mb-1">Hora (Opcional)</label>
                <Input id="dueTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
        </div>
        
        {!isEditMode && (
          <div className="pt-2">
            <div className="flex justify-between items-center bg-neutral-200/50 dark:bg-neutral-700/50 p-3 rounded-lg">
                <label htmlFor="add-transaction" className="font-medium">Asociar Gasto/Ingreso</label>
                <ToggleSwitch id="add-transaction" isChecked={showTransaction} onChange={setShowTransaction} />
            </div>
            
            {showTransaction && (
              <div className="mt-4 space-y-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-b-lg">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Monto</label>
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Moneda</label>
                        <Select value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
                            <option value="DOP">RD$</option>
                            <option value="USD">US$</option>
                        </Select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <Select value={type} onChange={e => setType(e.target.value as TransactionType)}>
                        <option value="expense">Salida</option>
                        <option value="income">Entrada</option>
                    </Select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Cuenta / Tarjeta</label>
                    <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
                        <option value="" disabled>Seleccione...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <Select value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="" disabled>Seleccione...</option>
                        {filteredCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </Select>
                 </div>
              </div>
            )}
          </div>
        )}
        
        <Button type="submit" className="w-full !mt-6">
          {isEditMode ? 'Guardar Cambios' : 'Crear Tarea'}
        </Button>
      </form>
    </Card>
  );
};

export default AddTaskForm;