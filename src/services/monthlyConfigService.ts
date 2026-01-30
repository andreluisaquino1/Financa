import { supabase } from '@/supabaseClient';
import { MonthlyConfig } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const monthlyConfigService = {
    async get(householdId: string, monthKey: string): Promise<ServiceResponse<MonthlyConfig>> {
        const { data, error } = await supabase
            .from('monthly_configs')
            .select('*')
            .eq('household_id', householdId)
            .eq('month_key', monthKey)
            .is('deleted_at', null)
            .maybeSingle();

        return handleServiceResponse(data, error);
    },

    async upsert(config: Partial<MonthlyConfig>): Promise<ServiceResponse<MonthlyConfig>> {
        const { data, error } = await supabase
            .from('monthly_configs')
            .upsert(config, { onConflict: 'household_id, month_key' })
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async updateGlobalSalaries(householdId: string, startMonthKey: string, salary1: number, salary2: number): Promise<ServiceResponse<void>> {
        const { error } = await supabase
            .from('monthly_configs')
            .update({
                salary1: salary1,
                salary2: salary2
            })
            .eq('household_id', householdId)
            .gt('month_key', startMonthKey);

        return handleServiceResponse(null, error);
    },

    async softDeleteByHousehold(householdId: string): Promise<ServiceResponse<void>> {
        const { error } = await supabase
            .from('monthly_configs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('monthly_configs')
            .update({ deleted_at: null })
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
