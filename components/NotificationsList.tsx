import React from 'react';
import { Bell, CreditCard, Landmark, GraduationCap } from 'lucide-react';
import Card from './ui/Card';

const NotificationItem: React.FC<{icon: React.ElementType, title: string, time: string, isRead?: boolean}> = ({icon: Icon, title, time, isRead = false}) => (
    <li className={`flex items-start p-4 transition-colors ${isRead ? 'opacity-60' : 'bg-brand-primary/5 dark:bg-brand-primary/10'}`}>
        <div className="flex-shrink-0 mt-1">
            <Icon className="w-6 h-6 text-brand-primary" />
        </div>
        <div className="ml-4 flex-1">
            <p className="font-medium text-neutral-900 dark:text-white">{title}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{time}</p>
        </div>
        {!isRead && (
            <div className="w-2.5 h-2.5 bg-brand-primary rounded-full mt-2 ml-4 flex-shrink-0" aria-label="No leído"></div>
        )}
    </li>
);

const NotificationsList: React.FC = () => {
  return (
    <Card>
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 mr-2 text-brand-secondary" />
        <h3 className="text-xl font-semibold">Todas las Notificaciones</h3>
      </div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700/50 overflow-hidden rounded-lg">
        <NotificationItem 
            icon={Landmark}
            title="Se acerca el pago de tu préstamo del Popular."
            time="hace 2 horas"
        />
        <NotificationItem 
            icon={CreditCard}
            title="Tu suscripción de Netflix se renovará pronto."
            time="ayer"
        />
         <NotificationItem 
            icon={GraduationCap}
            title="Recordatorio: Pago del colegio vence en 3 días."
            time="hace 2 días"
        />
        <NotificationItem 
            icon={CreditCard}
            title="Se ha procesado tu pago a la tarjeta Gold BHD."
            time="hace 3 días"
            isRead={true}
        />
        <NotificationItem 
            icon={Landmark}
            title="Has recibido tu salario de la quincena."
            time="hace 4 días"
            isRead={true}
        />
        <NotificationItem 
            icon={CreditCard}
            title="Alerta: Compra inusual en tu Tarjeta Mastercard Black."
            time="la semana pasada"
            isRead={true}
        />
      </ul>
    </Card>
  );
};

export default NotificationsList;