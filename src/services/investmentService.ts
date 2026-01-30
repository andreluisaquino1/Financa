import { supabase } from '@/supabaseClient';
import { Investment, InvestmentDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

const mapInvestment = (inv: InvestmentDB): Investment => ({
    ...inv,
    current_value: Number(inv.current_value),
    invested_value: Number(inv.invested_value),
    quantity: Number(inv.quantity || 0),
    price_per_unit: Number(inv.price_per_unit || 0)
});

export const investmentService = {
    async getAll(householdId: string): Promise<ServiceResponse<Investment[]>> {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const mappedData = data ? (data as unknown as InvestmentDB[]).map(mapInvestment) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(investment: Omit<Investment, 'id' | 'created_at'>): Promise<ServiceResponse<Investment>> {
        const { data, error } = await supabase
            .from('investments')
            .insert(investment)
            .select()
            .single();

        const mappedData = data ? mapInvestment(data as unknown as InvestmentDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Investment>): Promise<ServiceResponse<Investment>> {
        const { data, error } = await supabase
            .from('investments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapInvestment(data as unknown as InvestmentDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update({ deleted_at: null })
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
