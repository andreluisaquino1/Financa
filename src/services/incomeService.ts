import { supabase } from '@/supabaseClient';
import { Income, IncomeDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload, restorePayload } from './dbHelpers';
import { validateIncome, incomeSchema } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

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
        const validation = validateIncome(income);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

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
        if (Object.keys(updates).length > 0) {
            const validation = incomeSchema.partial().safeParse(updates);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbUpdates: any = {};
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.value !== undefined) dbUpdates.value = updates.value;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.paidBy !== undefined) dbUpdates.paid_by = updates.paidBy;
        if (updates.date !== undefined) dbUpdates.date = updates.date;

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
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update(softDeletePayload())
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async softDeleteByMonth(householdId: string, monthKey: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update(softDeletePayload())
            .eq('household_id', householdId)
            .like('date', `${monthKey}%`);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('incomes')
            .update(restorePayload())
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
