import { supabase } from '@/supabaseClient';
import { Expense, ExpenseDB, ExpenseType } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

const mapExpense = (e: ExpenseDB): Expense => ({
    id: e.id,
    date: e.date,
    type: e.type as ExpenseType,
    category: e.category,
    description: e.description,
    totalValue: Number(e.total_value),
    installments: Number(e.installments || 1),
    paidBy: e.paid_by as 'person1' | 'person2',
    createdAt: e.created_at,
    metadata: e.metadata,
    household_id: e.household_id,
    splitMethod: e.split_method as 'proportional' | 'custom' | undefined,
    splitPercentage1: e.metadata?.splitPercentage1,
    specificValueP1: e.metadata?.specificValueP1,
    specificValueP2: e.metadata?.specificValueP2,
    user_id: e.user_id,
    reminderDay: e.reminder_day ? Number(e.reminder_day) : undefined
});

export const expenseService = {
    async getAll(householdId: string): Promise<ServiceResponse<Expense[]>> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const mappedData = data ? (data as unknown as ExpenseDB[]).map(mapExpense) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<ServiceResponse<Expense>> {
        // Map frontend model back to DB model for insertion
        const dbExpense = {
            household_id: expense.household_id,
            user_id: expense.user_id,
            date: expense.date,
            type: expense.type,
            category: expense.category,
            description: expense.description,
            total_value: expense.totalValue,
            installments: expense.installments,
            paid_by: expense.paidBy,
            metadata: {
                ...(expense.metadata || {}),
                splitPercentage1: expense.splitPercentage1,
                specificValueP1: expense.specificValueP1,
                specificValueP2: expense.specificValueP2
            },
            split_method: expense.splitMethod || null,
            reminder_day: expense.reminderDay
        };

        const { data, error } = await supabase
            .from('expenses')
            .insert(dbExpense)
            .select()
            .single();

        const mappedData = data ? mapExpense(data as unknown as ExpenseDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Expense>): Promise<ServiceResponse<Expense>> {
        const dbUpdates: any = {};
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.type) dbUpdates.type = updates.type;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.totalValue) dbUpdates.total_value = updates.totalValue;
        if (updates.installments) dbUpdates.installments = updates.installments;
        if (updates.paidBy) dbUpdates.paid_by = updates.paidBy;
        if (updates.metadata) dbUpdates.metadata = updates.metadata;
        if (updates.splitMethod) dbUpdates.split_method = updates.splitMethod;
        if (updates.reminderDay) dbUpdates.reminder_day = updates.reminderDay;

        // Handle metadata merging if needed, but for now direct assignment
        if (updates.splitPercentage1 || updates.specificValueP1 || updates.specificValueP2) {
            dbUpdates.metadata = {
                ...(updates.metadata || {}),
                splitPercentage1: updates.splitPercentage1,
                specificValueP1: updates.specificValueP1,
                specificValueP2: updates.specificValueP2
            };
        }

        const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapExpense(data as unknown as ExpenseDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async softDeleteByMonth(householdId: string, monthKey: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: new Date().toISOString() })
            .eq('household_id', householdId)
            .like('date', `${monthKey}%`);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update({ deleted_at: null })
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    },

    async hardDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        return handleServiceResponse(null, error);
    }
};
