import { useState, useCallback } from 'react';
import { Income } from '@/types';
import { incomeService } from '@/services/incomeService';
import { validateIncome } from '@/domain/validation';

export const useIncomes = (user: any, householdId: string | null) => {
    const [incomes, setIncomes] = useState<Income[]>([]);

    const addIncome = useCallback(async (inc: Omit<Income, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateIncome(inc);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        const activeHouseholdId = householdId || user.id;

        try {
            const { data, error } = await incomeService.create({
                ...inc,
                user_id: user.id,
                household_id: activeHouseholdId
            });

            if (error) throw error;
            if (data) {
                setIncomes(prev => [data, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao salvar renda: ' + err.message);
        }
    }, [user, householdId]);

    const updateIncome = useCallback(async (id: string, updates: Omit<Income, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateIncome(updates);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        try {
            const { data, error } = await incomeService.update(id, updates);

            if (error) throw error;
            if (data) {
                setIncomes(prev => prev.map(i => i.id === id ? data : i));
            }
        } catch (err: any) {
            alert('Erro ao atualizar: ' + err.message);
        }
    }, [user]);

    const deleteIncome = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await incomeService.softDelete(id);
            if (error) throw error;
            setIncomes(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar receita: ' + err.message);
        }
    }, [user]);

    return { incomes, setIncomes, addIncome, updateIncome, deleteIncome };
};
