import { supabase } from '@/supabaseClient';
import { Loan, LoanDB } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload, restorePayload } from './dbHelpers';
import { validateLoan, loanSchema } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

const mapLoan = (l: LoanDB): Loan => ({
    ...l,
    total_value: Number(l.total_value),
    remaining_value: Number(l.remaining_value)
});

export const loanService = {
    async getAll(householdId: string): Promise<ServiceResponse<Loan[]>> {
        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const mappedData = data ? (data as unknown as LoanDB[]).map(mapLoan) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(loan: Omit<Loan, 'id' | 'created_at'>): Promise<ServiceResponse<Loan>> {
        const validation = validateLoan(loan);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

        const { data, error } = await supabase
            .from('loans')
            .insert(loan)
            .select()
            .single();

        const mappedData = data ? mapLoan(data as unknown as LoanDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Loan>): Promise<ServiceResponse<Loan>> {
        if (Object.keys(updates).length > 0) {
            const validation = loanSchema.partial().safeParse(updates);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbUpdates: any = {};
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.borrower_name !== undefined) dbUpdates.borrower_name = updates.borrower_name;
        if (updates.total_value !== undefined) dbUpdates.total_value = updates.total_value;
        if (updates.remaining_value !== undefined) dbUpdates.remaining_value = updates.remaining_value;
        if (updates.installments !== undefined) dbUpdates.installments = updates.installments;
        if (updates.paid_installments !== undefined) dbUpdates.paid_installments = updates.paid_installments;
        if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;
        if (updates.lender !== undefined) dbUpdates.lender = updates.lender;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('loans')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapLoan(data as unknown as LoanDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update(softDeletePayload())
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('loans')
            .update(restorePayload())
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    }
};
