import { supabase } from '@/supabaseClient';
import { SavingsGoal, SavingsGoalDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

const mapGoal = (g: SavingsGoalDB): SavingsGoal => ({
    id: g.id,
    user_id: g.user_id,
    title: g.title,
    target_value: Number(g.target_value),
    current_value: Number(g.current_value),
    goal_type: g.goal_type as 'individual_p1' | 'individual_p2' | 'couple',
    monthly_contribution_p1: g.monthly_contribution_p1 ? Number(g.monthly_contribution_p1) : 0,
    monthly_contribution_p2: g.monthly_contribution_p2 ? Number(g.monthly_contribution_p2) : 0,
    current_savings_p1: g.current_savings_p1 ? Number(g.current_savings_p1) : 0,
    current_savings_p2: g.current_savings_p2 ? Number(g.current_savings_p2) : 0,
    interest_rate: g.interest_rate ? Number(g.interest_rate) : 0,
    expected_monthly_expense: g.expected_monthly_expense ? Number(g.expected_monthly_expense) : 0,
    start_date: g.start_date,
    deadline: g.deadline,
    icon: g.icon,
    priority: g.priority as 'low' | 'medium' | 'high',
    investment_location_p1: g.investment_location_p1,
    investment_location_p2: g.investment_location_p2,
    last_contribution_month: g.last_contribution_month,
    is_completed: g.is_completed,
    split_p1_percentage: g.split_p1_percentage ? Number(g.split_p1_percentage) : 50,
    split_p2_percentage: g.split_p2_percentage ? Number(g.split_p2_percentage) : 50,
    initial_withdrawal_p1: g.initial_withdrawal_p1 ? Number(g.initial_withdrawal_p1) : 0,
    initial_withdrawal_p2: g.initial_withdrawal_p2 ? Number(g.initial_withdrawal_p2) : 0,
    created_at: g.created_at,
    deletedAt: g.deleted_at || undefined
});

export const goalService = {
    async getAll(householdId: string): Promise<ServiceResponse<SavingsGoal[]>> {
        const { data, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const mappedData = data ? (data as unknown as SavingsGoalDB[]).map(mapGoal) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(goal: Omit<SavingsGoal, 'id' | 'created_at'> & { household_id: string }): Promise<ServiceResponse<SavingsGoal>> {
        // Goal inputs from hook are already mostly matching DB shape except for strict types.
        // We will just pass it, assuming caller logic is ok. But strictly we should map if keys differed.
        // The previous code passed 'goal' directly.
        // However, let's look at Types. SavingsGoal has 'target_value' (snake_case) already ? 
        // Yes, looking at types.ts, SavingsGoal ALREADY has snake_case property names for most things!
        // So mapping might be redundant for keys, but crucial for ensuring numbers are returned as numbers, not strings from DB.

        const { data, error } = await supabase
            .from('savings_goals')
            .insert(goal)
            .select()
            .single();

        const mappedData = data ? mapGoal(data as unknown as SavingsGoalDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<SavingsGoalDB>): Promise<ServiceResponse<SavingsGoal>> {
        const { data, error } = await supabase
            .from('savings_goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapGoal(data as unknown as SavingsGoalDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update({ deleted_at: null })
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
