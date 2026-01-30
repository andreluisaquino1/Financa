import { supabase } from '@/supabaseClient';
import { Loan } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const loanService = {
    async getAll(householdId: string): Promise<ServiceResponse<Loan[]>> {
        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        return handleServiceResponse(data, error);
    },

    async create(loan: Omit<Loan, 'id' | 'created_at'>): Promise<ServiceResponse<Loan>> {
        const { data, error } = await supabase
            .from('loans')
            .insert(loan)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(id: string, updates: Partial<Loan>): Promise<ServiceResponse<Loan>> {
        const { data, error } = await supabase
            .from('loans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
