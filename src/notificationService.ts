
import { LocalNotifications } from '@capacitor/local-notifications';
import { Expense } from './types';

export const scheduleReminder = async (expense: Expense) => {
    const isNative = (window as any).Capacitor?.isNative;
    if (!isNative || !expense.reminderDay) return;

    try {
        const hasPermission = await LocalNotifications.checkPermissions();
        if (hasPermission.display !== 'granted') {
            await LocalNotifications.requestPermissions();
        }

        // Schedule monthly reminder
        await LocalNotifications.schedule({
            notifications: [
                {
                    id: parseInt(expense.id.slice(0, 8), 16) % 1000000, // Small numeric ID
                    title: 'Lembrete de Pagamento 💰',
                    body: `Hoje vence a conta "${expense.description}" no valor de R$ ${expense.totalValue.toFixed(2)}.`,
                    schedule: {
                        on: {
                            day: expense.reminderDay,
                            hour: 9,
                            minute: 0
                        },
                        repeats: true,
                        allowWhileIdle: true
                    },
                    sound: 'default',
                    actionTypeId: 'OPEN_APP'
                }
            ]
        });

    } catch (e) {
        console.error('Error scheduling notification:', e);
    }
};

export const cancelReminder = async (expenseId: string) => {
    const isNative = (window as any).Capacitor?.isNative;
    if (!isNative) return;

    try {
        await LocalNotifications.cancel({
            notifications: [{ id: parseInt(expenseId.slice(0, 8), 16) % 1000000 }]
        });
    } catch (e) {
        console.error('Error cancelling notification:', e);
    }
};
