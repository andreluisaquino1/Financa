import { supabase } from '@/supabaseClient';
import { SavingsGoal } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const goalService = {
    async getAll(householdId: string): Promise<ServiceResponse<SavingsGoal[]>> {
        const { data, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        return handleServiceResponse(data, error);
    },

    async create(goal: Omit<SavingsGoal, 'id' | 'created_at'>): Promise<ServiceResponse<SavingsGoal>> {
        const { data, error } = await supabase
            .from('savings_goals')
            .insert(goal)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(id: string, updates: Partial<SavingsGoal>): Promise<ServiceResponse<SavingsGoal>> {
        const { data, error } = await supabase
            .from('savings_goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
