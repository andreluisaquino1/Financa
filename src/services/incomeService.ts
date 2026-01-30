import { supabase } from '@/supabaseClient';
import { Income } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const incomeService = {
    async getAll(householdId: string): Promise<ServiceResponse<Income[]>> {
        const { data, error } = await supabase
            .from('incomes')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        return handleServiceResponse(data, error);
    },

    async create(income: Omit<Income, 'id' | 'createdAt'>): Promise<ServiceResponse<Income>> {
        const { data, error } = await supabase
            .from('incomes')
            .insert(income)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(id: string, updates: Partial<Income>): Promise<ServiceResponse<Income>> {
        const { data, error } = await supabase
            .from('incomes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
