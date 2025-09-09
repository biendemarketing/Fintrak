import React, { useState, useMemo } from 'react';
import { X, Search, Filter } from 'lucide-react';
import type { Transaction, Account, TransactionType } from '../types';
import Input from './ui/Input';
import Select from './ui/Select';
import TransactionItem from './TransactionItem';
import { CATEGORIES } from '../constants';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  onSelectTransaction: (transaction: Transaction) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, transactions, accounts, onSelectTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: [] as TransactionType[],
    accounts: [] as string[],
    categories: [] as string[],
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (filterName: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      
      // Text search
      if (searchTerm && !t.description.toLowerCase().includes(lowerCaseSearch)) {
        return false;
      }
      
      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(t.type)) {
        return false;
      }
      
      // Account filter
      if (filters.accounts.length > 0 && !filters.accounts.includes(t.accountId || '')) {
         if (t.type !== 'transfer' || !filters.accounts.includes(t.transferToAccountId || '')) {
            return false;
         }
      }
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(t.category)) {
        return false;
      }
      
      // Date filter
      const transactionDate = new Date(t.date);
      if (filters.dateFrom && transactionDate < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && transactionDate > new Date(filters.dateTo)) {
        return false;
      }
      
      // Amount filter
      const min = parseFloat(filters.amountMin);
      const max = parseFloat(filters.amountMax);
      if (!isNaN(min) && t.amount < min) {
        return false;
      }
      if (!isNaN(max) && t.amount > max) {
        return false;
      }
      
      return true;
    });
  }, [transactions, searchTerm, filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900 z-50 flex flex-col" role="dialog" aria-modal="true">
      <header className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center space-x-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <Input 
                type="text"
                placeholder="Buscar por detalle..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 !bg-neutral-200 dark:!bg-neutral-800"
                autoFocus
            />
        </div>
        <button onClick={() => setShowFilters(f => !f)} className={`p-2 rounded-md transition-colors ${showFilters ? 'bg-brand-primary/20 text-brand-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
            <Filter className="w-5 h-5" />
        </button>
        <button onClick={onClose} className="p-2 rounded-md bg-neutral-200 dark:bg-neutral-700">
            <X className="w-5 h-5" />
        </button>
      </header>

      {showFilters && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 space-y-4 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block mb-1 font-medium">Tipo</label>
                    <Select multiple={false} value={filters.type[0] || ''} onChange={e => handleFilterChange('type', e.target.value ? [e.target.value] : [])}>
                        <option value="">Todos</option>
                        <option value="expense">Salida</option>
                        <option value="income">Entrada</option>
                        <option value="transfer">Transferencia</option>
                    </Select>
                </div>
                <div>
                    <label className="block mb-1 font-medium">Cuenta</label>
                    <Select multiple={false} value={filters.accounts[0] || ''} onChange={e => handleFilterChange('accounts', e.target.value ? [e.target.value] : [])}>
                        <option value="">Todas</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block mb-1 font-medium">Desde</label>
                    <Input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} />
                </div>
                 <div>
                    <label className="block mb-1 font-medium">Hasta</label>
                    <Input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} />
                </div>
                 <div>
                    <label className="block mb-1 font-medium">Monto Mín.</label>
                    <Input type="number" placeholder="0.00" value={filters.amountMin} onChange={e => handleFilterChange('amountMin', e.target.value)} />
                </div>
                 <div>
                    <label className="block mb-1 font-medium">Monto Máx.</label>
                    <Input type="number" placeholder="1000.00" value={filters.amountMax} onChange={e => handleFilterChange('amountMax', e.target.value)} />
                </div>
            </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4">
        {filteredTransactions.length > 0 ? (
          <ul className="space-y-3">
            {filteredTransactions.map(t => (
              <TransactionItem 
                key={t.id}
                transaction={t}
                accounts={accounts}
                onSelect={onSelectTransaction}
                onDelete={() => {}} // No delete from search
              />
            ))}
          </ul>
        ) : (
          <div className="text-center py-20">
            <p className="text-neutral-500">No se encontraron resultados.</p>
            <p className="text-sm text-neutral-400">Intenta con otros filtros o términos de búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchModal;