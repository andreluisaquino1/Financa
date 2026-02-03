import { supabase } from '@/supabaseClient';
import { SavingsGoal, SavingsGoalDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload, restorePayload } from './dbHelpers';
import { validateGoal, goalSchema } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

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
    is_emergency: g.is_emergency,
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

        const mappedData = data ? (data as unknown as SavingsGoalDB[]).map(mapGoal) : [];
        return handleServiceResponse(mappedData, error);
    },

    async create(goal: Omit<SavingsGoal, 'id' | 'created_at'> & { household_id: string }): Promise<ServiceResponse<SavingsGoal>> {
        const validation = validateGoal(goal);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }


        // Enforce single Emergency Reserve per household
        if (goal.is_emergency) {
            const { data: existingGoals } = await this.getAll(goal.household_id);
            if (existingGoals?.some(g => g.is_emergency)) {
                return handleServiceResponse(null, {
                    message: 'Já existe uma Reserva de Emergência ativa para este perfil.',
                    code: 'CONFLICT'
                } as any as PostgrestError);
            }
        }

        const { data, error } = await supabase
            .from('savings_goals')
            .insert(goal)
            .select()
            .single();

        const mappedData = data ? mapGoal(data as unknown as SavingsGoalDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<SavingsGoalDB>): Promise<ServiceResponse<SavingsGoal>> {
        if (Object.keys(updates).length > 0) {
            const validation = goalSchema.partial().safeParse(updates);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.target_value !== undefined) dbUpdates.target_value = updates.target_value;
        if (updates.current_value !== undefined) dbUpdates.current_value = updates.current_value;
        if (updates.goal_type !== undefined) dbUpdates.goal_type = updates.goal_type;
        if (updates.monthly_contribution_p1 !== undefined) dbUpdates.monthly_contribution_p1 = updates.monthly_contribution_p1;
        if (updates.monthly_contribution_p2 !== undefined) dbUpdates.monthly_contribution_p2 = updates.monthly_contribution_p2;
        if (updates.current_savings_p1 !== undefined) dbUpdates.current_savings_p1 = updates.current_savings_p1;
        if (updates.current_savings_p2 !== undefined) dbUpdates.current_savings_p2 = updates.current_savings_p2;
        if (updates.interest_rate !== undefined) dbUpdates.interest_rate = updates.interest_rate;
        if (updates.expected_monthly_expense !== undefined) dbUpdates.expected_monthly_expense = updates.expected_monthly_expense;
        if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.investment_location_p1 !== undefined) dbUpdates.investment_location_p1 = updates.investment_location_p1;
        if (updates.investment_location_p2 !== undefined) dbUpdates.investment_location_p2 = updates.investment_location_p2;
        if (updates.last_contribution_month !== undefined) dbUpdates.last_contribution_month = updates.last_contribution_month;
        if (updates.is_completed !== undefined) dbUpdates.is_completed = updates.is_completed;
        if (updates.is_emergency !== undefined) dbUpdates.is_emergency = updates.is_emergency;
        if (updates.split_p1_percentage !== undefined) dbUpdates.split_p1_percentage = updates.split_p1_percentage;
        if (updates.split_p2_percentage !== undefined) dbUpdates.split_p2_percentage = updates.split_p2_percentage;
        if (updates.initial_withdrawal_p1 !== undefined) dbUpdates.initial_withdrawal_p1 = updates.initial_withdrawal_p1;
        if (updates.initial_withdrawal_p2 !== undefined) dbUpdates.initial_withdrawal_p2 = updates.initial_withdrawal_p2;

        const { data, error } = await supabase
            .from('savings_goals')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapGoal(data as unknown as SavingsGoalDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update(softDeletePayload())
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('savings_goals')
            .update(restorePayload())
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
