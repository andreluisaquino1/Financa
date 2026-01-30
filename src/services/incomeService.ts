import { supabase } from '@/supabaseClient';
import { Income, IncomeDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

const mapIncome = (i: IncomeDB): Income => ({
    id: i.id,
    description: i.description,
    value: Number(i.value),
    category: i.category,
    paidBy: i.paid_by as 'person1' | 'person2',
    date: i.date,
    household_id: i.household_id,
    user_id: i.user_id,
    createdAt: i.created_at
});

export const incomeService = {
    async getAll(householdId: string): Promise<ServiceResponse<Income[]>> {
        const { data, error } = await supabase
            .from('incomes')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('date', { ascending: false });

        const mappedData = data ? (data as unknown as IncomeDB[]).map(mapIncome) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(income: Omit<Income, 'id' | 'createdAt'>): Promise<ServiceResponse<Income>> {
        const dbIncome = {
            household_id: income.household_id,
            user_id: income.user_id,
            description: income.description,
            value: income.value,
            category: income.category,
            paid_by: income.paidBy,
            date: income.date
        };

        const { data, error } = await supabase
            .from('incomes')
            .insert(dbIncome)
            .select()
            .single();

        const mappedData = data ? mapIncome(data as unknown as IncomeDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Income>): Promise<ServiceResponse<Income>> {
        const dbUpdates: any = {};
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.value) dbUpdates.value = updates.value;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.paidBy) dbUpdates.paid_by = updates.paidBy;
        if (updates.date) dbUpdates.date = updates.date;

        const { data, error } = await supabase
            .from('incomes')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapIncome(data as unknown as IncomeDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async softDeleteByMonth(householdId: string, monthKey: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId)
            .like('date', `${monthKey}%`);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update({ deleted_at: null })
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
