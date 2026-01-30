import { supabase } from '@/supabaseClient';
import { Loan, LoanDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

const mapLoan = (l: LoanDB): Loan => ({
    ...l,
    total_value: Number(l.total_value),
    remaining_value: Number(l.remaining_value)
});

export const loanService = {
    async getAll(householdId: string): Promise<ServiceResponse<Loan[]>> {
        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const mappedData = data ? (data as unknown as LoanDB[]).map(mapLoan) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(loan: Omit<Loan, 'id' | 'created_at'>): Promise<ServiceResponse<Loan>> {
        const { data, error } = await supabase
            .from('loans')
            .insert(loan)
            .select()
            .single();

        const mappedData = data ? mapLoan(data as unknown as LoanDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Loan>): Promise<ServiceResponse<Loan>> {
        const { data, error } = await supabase
            .from('loans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapLoan(data as unknown as LoanDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update({ deleted_at: null })
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
