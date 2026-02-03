import { useState, useCallback } from 'react';
import { Investment, InvestmentMovement } from '@/types';
import { investmentService } from '@/services/investmentService';
import { investmentMovementService } from '@/services/investmentMovementService';

export const useInvestments = (user: any, householdId: string | null) => {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [investmentMovements, setInvestmentMovements] = useState<InvestmentMovement[]>([]);

    const addInvestment = useCallback(async (inv: Omit<Investment, 'id' | 'created_at' | 'user_id' | 'household_id'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await investmentService.create({
                user_id: user.id,
                household_id: householdId,
                ...inv
            });

            if (error) throw error;
            if (data) {
                setInvestments(prev => [data, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao adicionar investimento: ' + err.message);
        }
    }, [user, householdId]);

    const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
        if (!user) return;
        try {
            const { data, error } = await investmentService.update(id, {
                ...updates,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;
            if (data) {
                setInvestments(prev => prev.map(i => i.id === id ? data : i));
            }
        } catch (err: any) {
            alert('Erro ao atualizar investimento: ' + err.message);
        }
    }, [user]);

    const deleteInvestment = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await investmentService.softDelete(id);
            if (error) throw error;
            setInvestments(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar investimento: ' + err.message);
        }
    }, [user]);

    const addInvestmentMovement = useCallback(async (movement: Omit<InvestmentMovement, 'id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await investmentMovementService.create(movement);
            if (error) throw error;
            if (data) setInvestmentMovements(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao registrar movimentação de investimento: ' + err.message);
        }
    }, [user]);

    const deleteInvestmentMovement = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await investmentMovementService.delete(id);
            if (error) throw error;
            setInvestmentMovements(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar movimentação de investimento: ' + err.message);
        }
    }, [user]);

    return { investments, setInvestments, updateInvestment, addInvestment, deleteInvestment, investmentMovements, setInvestmentMovements, addInvestmentMovement, deleteInvestmentMovement };
};
