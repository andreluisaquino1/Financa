import { supabase } from '@/supabaseClient';
import { Investment } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const investmentService = {
    async getAll(householdId: string): Promise<ServiceResponse<Investment[]>> {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        return handleServiceResponse(data, error);
    },

    async create(investment: Omit<Investment, 'id' | 'created_at'>): Promise<ServiceResponse<Investment>> {
        const { data, error } = await supabase
            .from('investments')
            .insert(investment)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(id: string, updates: Partial<Investment>): Promise<ServiceResponse<Investment>> {
        const { data, error } = await supabase
            .from('investments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
