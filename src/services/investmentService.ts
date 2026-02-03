import { supabase } from '@/supabaseClient';
import { Investment, InvestmentDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload, restorePayload } from './dbHelpers';
import { validateInvestment, investmentSchema } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

const mapInvestment = (inv: InvestmentDB): Investment => ({
    ...inv,
    current_value: Number(inv.current_value),
    invested_value: Number(inv.invested_value),
    quantity: Number(inv.quantity ?? 0),
    price_per_unit: Number(inv.price_per_unit ?? 0)
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
        const validation = validateInvestment(investment);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

        const { data, error } = await supabase
            .from('investments')
            .insert(investment)
            .select()
            .single();

        const mappedData = data ? mapInvestment(data as unknown as InvestmentDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Investment>): Promise<ServiceResponse<Investment>> {
        if (Object.keys(updates).length > 0) {
            const validation = investmentSchema.partial().safeParse(updates);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.current_value !== undefined) dbUpdates.current_value = updates.current_value;
        if (updates.invested_value !== undefined) dbUpdates.invested_value = updates.invested_value;
        if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
        if (updates.price_per_unit !== undefined) dbUpdates.price_per_unit = updates.price_per_unit;
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;

        const { data, error } = await supabase
            .from('investments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapInvestment(data as unknown as InvestmentDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update(softDeletePayload())
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('investments')
            .update(restorePayload())
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
