import { supabase } from '@/supabaseClient';
import { InvestmentMovement, InvestmentMovementDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload } from './dbHelpers';
import { validateInvestmentMovement } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

const mapMovement = (m: InvestmentMovementDB): InvestmentMovement => ({
    ...m,
    value: Number(m.value),
    quantity: m.quantity ? Number(m.quantity) : undefined,
    price_per_unit: m.price_per_unit ? Number(m.price_per_unit) : undefined,
    deleted_at: m.deleted_at || undefined
});

export const investmentMovementService = {
    async getByInvestment(investmentId: string): Promise<ServiceResponse<InvestmentMovement[]>> {
        const { data, error } = await supabase
            .from('investment_movements')
            .select('*')
            .eq('investment_id', investmentId)
            .is('deleted_at', null)
            .order('date', { ascending: false });

        const mappedData = data ? (data as unknown as InvestmentMovementDB[]).map(mapMovement) : null;
        return handleServiceResponse(mappedData, error);
    },

    async getAllByHousehold(householdId: string): Promise<ServiceResponse<InvestmentMovement[]>> {
        // First get all investments for the household
        const { data: investments, error: invError } = await supabase
            .from('investments')
            .select('id')
            .eq('household_id', householdId);

        if (invError) return handleServiceResponse(null, invError);
        if (!investments || investments.length === 0) return handleServiceResponse([], null);

        const invIds = investments.map(i => i.id);

        const { data, error } = await supabase
            .from('investment_movements')
            .select('*')
            .in('investment_id', invIds)
            .is('deleted_at', null)
            .order('date', { ascending: false });

        const mappedData = data ? (data as unknown as InvestmentMovementDB[]).map(mapMovement) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(movement: Omit<InvestmentMovement, 'id' | 'created_at'>): Promise<ServiceResponse<InvestmentMovement>> {
        const validation = validateInvestmentMovement(movement);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

        const { data, error } = await supabase
            .from('investment_movements')
            .insert(movement)
            .select()
            .single();

        const mappedData = data ? mapMovement(data as unknown as InvestmentMovementDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<InvestmentMovement>): Promise<ServiceResponse<InvestmentMovement>> {
        const { data, error } = await supabase
            .from('investment_movements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapMovement(data as unknown as InvestmentMovementDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async delete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investment_movements')
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAllByInvestment(investmentId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investment_movements')
            .update(softDeletePayload())
            .eq('investment_id', investmentId);

        return handleServiceResponse(null, error);
    }
};
