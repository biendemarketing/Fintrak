import React from 'react';
import type { Transaction, Account, Currency } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { X, Trash2 } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction;
  accounts: Account[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const options = { style: 'currency', currency };
    const locale = currency === 'DOP' ? 'es-DO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
};

const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const DetailRow: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-neutral-200 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-200 flex-shrink-0 mr-4">{label}</p>
        <p className="font-semibold text-neutral-900 dark:text-white text-right">{value || 'N/A'}</p>
    </div>
);

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, accounts, onClose, onDelete }) => {
  const { id, description, amount, type, category, date, time, currency, receiptImage, accountId, transferToAccountId } = transaction;

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
        onDelete(id);
    }
  }
  
  const title = type === 'transfer' ? 'Detalle de Transferencia' : description;
  
  const fromAccount = accounts.find(a => a.id === accountId);
  const toAccount = accounts.find(a => a.id === transferToAccountId);
  
  const sourceAccount = accounts.find(a => a.id === accountId);
  const sourceName = sourceAccount ? `${sourceAccount.name} (${sourceAccount.bank})` : 'N/A';
  
  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
    >
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 id="transaction-detail-title" className="text-xl font-bold truncate">{title}</h3>
                <button 
                    onClick={onClose} 
                    className="p-2 text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors"
                    aria-label="Cerrar detalles"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="space-y-2 mb-6">
                <DetailRow label="Monto" value={`${type === 'income' ? '+' : type === 'expense' ? '-' : ''} ${formatCurrency(amount, currency)}`} />
                {type !== 'transfer' && <DetailRow label="Categoría" value={category} />}
                {type === 'transfer' ? (
                    <>
                        <DetailRow label="Desde" value={fromAccount ? `${fromAccount.name} (${fromAccount.bank})` : 'N/A'} />
                        <DetailRow label="Hacia" value={toAccount ? `${toAccount.name} (${toAccount.bank})` : 'N/A'} />
                    </>
                ) : (
                    <DetailRow label="Cuenta / Tarjeta" value={sourceName} />
                )}
                <DetailRow label="Fecha" value={new Date(date + 'T00:00:00').toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <DetailRow label="Hora" value={formatTime(time)} />
                <DetailRow label="Tipo" value={type === 'income' ? 'Entrada' : type === 'expense' ? 'Salida' : 'Transferencia'} />
            </div>

            {receiptImage && (
                <div className="mb-6">
                    <p className="text-sm text-neutral-600 dark:text-neutral-200 mb-2">Factura Adjunta</p>
                    <img 
                        src={receiptImage} 
                        alt={`Factura de ${description}`} 
                        className="rounded-lg w-full h-auto max-h-60 object-contain bg-neutral-200 dark:bg-neutral-700"
                    />
                </div>
            )}
            
            <Button onClick={handleDelete} className="w-full bg-expense hover:bg-expense/90 flex items-center justify-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <span>Eliminar Movimiento</span>
            </Button>
        </Card>
    </div>
  );
};

export default TransactionDetailModal;