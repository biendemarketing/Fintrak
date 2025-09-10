import React, { useState, useEffect, useMemo } from 'react';
import type { Budget } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { Target } from 'lucide-react';
import { CATEGORIES } from '../constants';

interface AddBudgetFormProps {
  onAddBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) => void;
  onUpdateBudget: (budget: Partial<Budget> & { id: string }) => void;
  budgetToEdit: Budget | null;
  existingBudgets: Budget[];
}

const AddBudgetForm: React.FC<AddBudgetFormProps> = ({ onAddBudget, onUpdateBudget, budgetToEdit, existingBudgets }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const isEditMode = !!budgetToEdit;

  const availableCategories = useMemo(() => {
    const expenseCategories = CATEGORIES.filter(c => c.type === 'expense');
    const budgetedCategories = existingBudgets.map(b => b.category);
    
    if (isEditMode) {
        // When editing, allow the current category plus any unbudgeted ones
        return expenseCategories.filter(c => !budgetedCategories.includes(c.name) || c.name === budgetToEdit.category);
    }
    // When adding, only show categories that don't have a budget yet
    return expenseCategories.filter(c => !budgetedCategories.includes(c.name));
  }, [existingBudgets, isEditMode, budgetToEdit]);

  useEffect(() => {
    if (budgetToEdit) {
      setCategory(budgetToEdit.category);
      setAmount(String(budgetToEdit.amount));
    } else {
      setCategory(availableCategories.length > 0 ? availableCategories[0].name : '');
      setAmount('');
    }
  }, [budgetToEdit, availableCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("El monto debe ser un número positivo.");
      return;
    }

    const budgetData = { category, amount: amountValue };

    if (isEditMode) {
      onUpdateBudget({ id: budgetToEdit.id, ...budgetData });
    } else {
      onAddBudget(budgetData);
    }
  };

  if (!isEditMode && availableCategories.length === 0) {
    return (
      <Card>
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold text-white">¡Todo Presupuestado!</h3>
          <p className="text-neutral-200 mt-2">Ya has creado un presupuesto para cada categoría de gasto disponible.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center mb-6">
        <Target className="w-6 h-6 mr-2 text-brand-primary" />
        <h3 className="text-xl font-semibold">{isEditMode ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-200 mb-1">Categoría de Gasto</label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required disabled={isEditMode}>
            {isEditMode && <option value={budgetToEdit.category}>{budgetToEdit.category}</option>}
            {availableCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
          </Select>
           {isEditMode && <p className="text-xs text-neutral-400 mt-1">La categoría no se puede cambiar. Para hacerlo, elimina este presupuesto y crea uno nuevo.</p>}
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-neutral-200 mb-1">Monto Mensual Límite</label>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required min="0.01" step="0.01" />
        </div>
        <Button type="submit" className="w-full !mt-6">
          {isEditMode ? 'Guardar Cambios' : 'Crear Presupuesto'}
        </Button>
      </form>
    </Card>
  );
};

export default AddBudgetForm;
