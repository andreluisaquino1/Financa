import { supabase } from '@/supabaseClient';
import { Expense } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const expenseService = {
    async getAll(householdId: string): Promise<ServiceResponse<Expense[]>> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        return handleServiceResponse(data, error);
    },

    async create(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<ServiceResponse<Expense>> {
        const { data, error } = await supabase
            .from('expenses')
            .insert(expense)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(id: string, updates: Partial<Expense>): Promise<ServiceResponse<Expense>> {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async hardDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
