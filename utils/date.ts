import type { RecurringFrequency } from '../types';

export const calculateNextDueDate = (startDateStr: string, frequency: RecurringFrequency): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

    let nextDate = new Date(startDateStr + 'T00:00:00'); // Ensure date is parsed in local timezone

    if (nextDate >= today) {
        return nextDate.toISOString().split('T')[0];
    }
    
    // If start date is in the past, calculate future occurrences
    switch (frequency) {
        case 'Semanal':
            while (nextDate < today) {
                nextDate.setDate(nextDate.getDate() + 7);
            }
            break;
        case 'Mensual':
            while (nextDate < today) {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;
        case 'Anual':
             while (nextDate < today) {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            break;
    }

    return nextDate.toISOString().split('T')[0];
};
