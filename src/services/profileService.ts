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
    }
};
