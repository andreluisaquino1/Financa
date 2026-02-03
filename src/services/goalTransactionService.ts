import { supabase } from '@/supabaseClient';
import { GoalTransaction, GoalTransactionDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload } from './dbHelpers';
import { validateGoalTransaction } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

const mapTransaction = (t: GoalTransactionDB): GoalTransaction => ({
    id: t.id,
    goal_id: t.goal_id,
    type: t.type as 'deposit' | 'withdraw',
    value: Number(t.value),
    person: t.person as 'person1' | 'person2',
    date: t.date,
    description: t.description,
    created_at: t.created_at,
    deleted_at: t.deleted_at || undefined
});

export const goalTransactionService = {
    async getByGoal(goalId: string): Promise<ServiceResponse<GoalTransaction[]>> {
        const { data, error } = await supabase
            .from('goal_transactions')
            .select('*')
            .eq('goal_id', goalId)
            .is('deleted_at', null)
            .order('date', { ascending: false });

        const mappedData = data ? (data as unknown as GoalTransactionDB[]).map(mapTransaction) : null;
        return handleServiceResponse(mappedData, error);
    },

    async getAllByHousehold(householdId: string): Promise<ServiceResponse<GoalTransaction[]>> {
        // First get all goals for the household
        const { data: goals, error: goalsError } = await supabase
            .from('savings_goals')
            .select('id')
            .eq('household_id', householdId);

        if (goalsError) return handleServiceResponse(null, goalsError);
        if (!goals || goals.length === 0) return handleServiceResponse([], null);

        const goalIds = goals.map(g => g.id);

        const { data, error } = await supabase
            .from('goal_transactions')
            .select('*')
            .in('goal_id', goalIds)
            .is('deleted_at', null)
            .order('date', { ascending: false });

        const mappedData = data ? (data as unknown as GoalTransactionDB[]).map(mapTransaction) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(transaction: Omit<GoalTransaction, 'id' | 'created_at'>): Promise<ServiceResponse<GoalTransaction>> {
        const validation = validateGoalTransaction(transaction);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

        // Prevent negative balance on withdraw
        if (transaction.type === 'withdraw') {
            const { data: goal } = await supabase
                .from('savings_goals')
                .select('current_value')
                .eq('id', transaction.goal_id)
                .single();

            if (goal && (goal.current_value < transaction.value)) {
                return handleServiceResponse(null, {
                    message: `Saldo insuficiente. Disponível: R$ ${goal.current_value}`,
                    code: 'INSUFFICIENT_FUNDS'
                } as any as PostgrestError);
            }
        }

        const { data, error } = await supabase
            .from('goal_transactions')
            .insert(transaction)
            .select()
            .single();

        const mappedData = data ? mapTransaction(data as unknown as GoalTransactionDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async delete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('goal_transactions')
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
