import { supabase } from '@/supabaseClient';
import { Expense, ExpenseDB, ExpenseType } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload, restorePayload } from './dbHelpers';
import { validateExpense, expenseSchema } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

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
        // Zod Validation
        const validation = validateExpense(expense);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

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
        // Partial Zod Validation
        if (Object.keys(updates).length > 0) {
            const validation = expenseSchema.partial().safeParse(updates);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbUpdates: any = {};
        if (updates.date !== undefined) dbUpdates.date = updates.date;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.totalValue !== undefined) dbUpdates.total_value = updates.totalValue;
        if (updates.installments !== undefined) dbUpdates.installments = updates.installments;
        if (updates.paidBy !== undefined) dbUpdates.paid_by = updates.paidBy;
        if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
        if (updates.splitMethod !== undefined) dbUpdates.split_method = updates.splitMethod;
        if (updates.reminderDay !== undefined) dbUpdates.reminder_day = updates.reminderDay;

        // Handle metadata merging for split-related fields
        if (updates.splitMethod !== undefined || updates.splitPercentage1 !== undefined || updates.specificValueP1 !== undefined || updates.specificValueP2 !== undefined) {
            const isCustom = (updates.splitMethod ?? updates.splitMethod) === 'custom';
            
            dbUpdates.metadata = {
                ...(dbUpdates.metadata || updates.metadata || {}),
                // If switching away from custom, we should ideally clear these, 
                // but since they are in a JSONB, we just ensure they are updated if present.
                // The domain logic will handle the 'proportional' case by ignoring them.
                ...(updates.splitPercentage1 !== undefined && { splitPercentage1: updates.splitPercentage1 }),
                ...(updates.specificValueP1 !== undefined && { specificValueP1: updates.specificValueP1 }),
                ...(updates.specificValueP2 !== undefined && { specificValueP2: updates.specificValueP2 })
            };

            // If we are explicitly setting splitMethod to 'proportional' or null, 
            // we should probably clear the specific values in metadata to avoid confusion,
            // although the financial.ts logic change will also handle this.
            if (updates.splitMethod === 'proportional' || updates.splitMethod === null) {
                dbUpdates.metadata.splitPercentage1 = undefined;
                dbUpdates.metadata.specificValueP1 = undefined;
                dbUpdates.metadata.specificValueP2 = undefined;
            }
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
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update(softDeletePayload())
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async softDeleteByMonth(householdId: string, monthKey: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update(softDeletePayload())
            .eq('household_id', householdId)
            .like('date', `${monthKey}%`);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('expenses')
            .update(restorePayload())
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
    },

    async createBatch(expenses: Omit<Expense, 'id' | 'createdAt'>[]): Promise<ServiceResponse<Expense[]>> {
        // Validate all expenses first
        for (const exp of expenses) {
            const validation = validateExpense(exp);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: `Erro em um dos itens: ${validation.error.issues[0].message}`,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbExpenses = expenses.map(expense => ({
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
        }));

        const { data, error } = await supabase
            .from('expenses')
            .insert(dbExpenses)
            .select();

        const mappedData = data ? (data as unknown as ExpenseDB[]).map(mapExpense) : null;
        return handleServiceResponse(mappedData, error);
    }
};
