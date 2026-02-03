import { useState, useCallback } from 'react';
import { Expense, ExpenseType } from '@/types';
import { expenseService } from '@/services/expenseService';
import { validateExpense } from '@/domain/validation';
import { cancelReminder } from '@/notificationService';
import { isExpenseInMonth } from '@/domain/financial';

export const useExpenses = (user: any, householdId: string | null) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const addExpense = useCallback(async (exp: Omit<Expense, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateExpense(exp);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        const activeHouseholdId = householdId || user.id;

        const tempId = 'temp-' + Date.now();
        const optimisticExp: Expense = {
            ...exp,
            id: tempId,
            createdAt: new Date().toISOString(),
            household_id: activeHouseholdId
        };

        setExpenses(prev => [optimisticExp, ...prev]);

        try {
            const { data, error } = await expenseService.create({
                ...exp,
                household_id: activeHouseholdId,
                user_id: user.id
            });

            if (error) throw error;

            if (data) {
                setExpenses(prev => prev.map(e => e.id === tempId ? data : e));
            }
        } catch (err: any) {
            setExpenses(prev => prev.filter(e => e.id !== tempId));
            alert('Erro ao salvar gasto: ' + err.message);
        }
    }, [user, householdId]);

    const updateExpense = useCallback(async (id: string, updates: Omit<Expense, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateExpense(updates);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        try {
            const { data, error } = await expenseService.update(id, updates);

            if (error) throw error;
            if (data) {
                setExpenses(prev => prev.map(e => e.id === id ? data : e));
            }
        } catch (err: any) {
            alert('Erro ao atualizar: ' + err.message);
        }
    }, [user]);

    const deleteExpense = useCallback(async (id: string) => {
        if (!user) return;
        try {
            await cancelReminder(id);
            const { error } = await expenseService.softDelete(id);
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar: ' + err.message);
        }
    }, [user]);

    const markAsSettled = useCallback(async (monthKey: string) => {
        if (!user || !householdId) return;

        const expensesToSettle = expenses.filter(exp =>
            (exp.type === 'REIMBURSEMENT' || exp.type === 'REIMBURSEMENT_FIXED') &&
            exp.reimbursementStatus !== 'settled' &&
            isExpenseInMonth(exp, monthKey)
        );

        if (expensesToSettle.length === 0) {
            alert('Não há itens de reembolso pendentes para este mês.');
            return;
        }

        if (!confirm(`Deseja marcar ${expensesToSettle.length} itens como resolvidos/pagos? Isso zerará o valor de transferência.`)) {
            return;
        }

        try {
            await Promise.all(expensesToSettle.map(exp =>
                expenseService.update(exp.id, {
                    reimbursementStatus: 'settled',
                    settledAt: new Date().toISOString()
                })
            ));

            setExpenses(prev => prev.map(e => {
                if (expensesToSettle.find(target => target.id === e.id)) {
                    return { ...e, reimbursementStatus: 'settled', settledAt: new Date().toISOString() } as Expense;
                }
                return e;
            }));

            alert('Acerto realizado com sucesso! 🎉');
        } catch (err: any) {
            alert('Erro ao realizar acerto: ' + err.message);
        }
    }, [user, householdId, expenses]);

    return { expenses, setExpenses, addExpense, updateExpense, deleteExpense, markAsSettled };
};
