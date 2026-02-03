import { useState, useCallback } from 'react';
import { SavingsGoal, GoalTransaction } from '@/types';
import { goalService } from '@/services/goalService';
import { goalTransactionService } from '@/services/goalTransactionService';
import { migrationService } from '@/services/migrationService';
import { profileService } from '@/services/profileService';

export const useGoals = (user: any, householdId: string | null) => {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [goalTransactions, setGoalTransactions] = useState<GoalTransaction[]>([]);

    const addGoal = useCallback(async (goalData: Partial<SavingsGoal>) => {
        if (!user) return;
        try {
            const { data, error } = await goalService.create({
                user_id: user.id,
                household_id: householdId || user.id,
                title: goalData.title!,
                goal_type: goalData.goal_type || 'couple',
                target_value: goalData.target_value || 0,
                current_value: goalData.current_value || 0,
                monthly_contribution_p1: goalData.monthly_contribution_p1 || 0,
                monthly_contribution_p2: goalData.monthly_contribution_p2 || 0,
                current_savings_p1: goalData.current_savings_p1 || 0,
                current_savings_p2: goalData.current_savings_p2 || 0,
                interest_rate: goalData.interest_rate || 0,
                expected_monthly_expense: goalData.expected_monthly_expense || 0,
                start_date: goalData.start_date || null,
                deadline: goalData.deadline || null,
                icon: goalData.icon || '💰',
                priority: goalData.priority || 'medium',
                investment_location_p1: goalData.investment_location_p1 || '',
                investment_location_p2: goalData.investment_location_p2 || '',
                last_contribution_month: goalData.last_contribution_month || null,
                is_completed: false,
                is_emergency: goalData.is_emergency || false,
                split_p1_percentage: goalData.split_p1_percentage || 50,
                split_p2_percentage: goalData.split_p2_percentage || 50,
                initial_withdrawal_p1: goalData.initial_withdrawal_p1 || 0,
                initial_withdrawal_p2: goalData.initial_withdrawal_p2 || 0,
            });
            if (error) throw error;
            if (data) setGoals(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao criar meta: ' + err.message);
        }
    }, [user, householdId]);

    const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
        if (!user) return;
        try {
            const { error } = await goalService.update(id, updates);
            if (error) throw error;
            setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        } catch (err: any) {
            alert('Erro ao atualizar meta: ' + err.message);
        }
    }, [user]);

    const deleteGoal = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await goalService.softDelete(id);
            if (error) throw error;
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar meta: ' + err.message);
        }
    }, [user]);

    const addGoalTransaction = useCallback(async (transaction: Omit<GoalTransaction, 'id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await goalTransactionService.create(transaction);
            if (error) throw error;
            if (data) setGoalTransactions(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao registrar transação: ' + err.message);
        }
    }, [user]);

    const deleteGoalTransaction = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await goalTransactionService.delete(id);
            if (error) throw error;
            setGoalTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar transação: ' + err.message);
        }
    }, [user]);

    const migrateGoalsIfNeeded = useCallback(async (activeHouseholdId: string, coupleInfo: any, goalsData: SavingsGoal[]) => {
        if (goalsData && goalsData.length > 0) {
            const updatedInfo = await migrationService.migrateToTransactions(user.id, activeHouseholdId, coupleInfo);

            if (JSON.stringify(updatedInfo) !== JSON.stringify(coupleInfo)) {
                await profileService.update(activeHouseholdId, {
                    couple_info: updatedInfo,
                    updated_at: new Date().toISOString()
                });
                return updatedInfo;
            }
        }
        return null;
    }, [user]);

    return {
        goals, setGoals, addGoal, updateGoal, deleteGoal,
        goalTransactions, setGoalTransactions, addGoalTransaction, deleteGoalTransaction,
        migrateGoalsIfNeeded
    };
};
