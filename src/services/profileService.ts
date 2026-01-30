import { supabase } from '@/supabaseClient';
import { CoupleInfo, UserAccount } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const profileService = {
    async get(userId: string): Promise<ServiceResponse<any>> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        return handleServiceResponse(data, error);
    },

    async create(profile: any): Promise<ServiceResponse<any>> {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert(profile)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(userId: string, updates: any): Promise<ServiceResponse<any>> {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async joinHousehold(userId: string, householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('user_profiles')
            .update({ household_id: householdId })
            .eq('id', userId);
        return handleServiceResponse(null, error);
    },

    async getByInviteCode(code: string): Promise<ServiceResponse<any>> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('household_id, id')
            .eq('invite_code', code)
            .single();
        return handleServiceResponse(data, error);
    },

    async checkHasData(householdId: string): Promise<boolean> {
        // Check main tables
        const tables = ['expenses', 'incomes', 'savings_goals', 'loans', 'investments', 'trips'];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .eq('household_id', householdId)
                .is('deleted_at', null);

            if (!error && (count || 0) > 0) return true;
        }

        return false;
    },

    async migrateHouseholdData(oldId: string, newId: string): Promise<ServiceResponse<null>> {
        const tables = ['expenses', 'incomes', 'savings_goals', 'loans', 'investments', 'trips', 'monthly_configs'];

        try {
            for (const table of tables) {
                const { error } = await supabase
                    .from(table)
                    .update({ household_id: newId })
                    .eq('household_id', oldId);

                if (error) throw error;
            }
            return handleServiceResponse(null, null);
        } catch (error: any) {
            return handleServiceResponse(null, error);
        }
    }
};
