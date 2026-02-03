import { supabase } from '@/supabaseClient';
import { Trip, TripDB, TripExpense, TripDeposit } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';
import { softDeletePayload, restorePayload } from './dbHelpers';
import { validateTrip, validateTripExpense, validateTripDeposit, tripSchema } from '@/domain/validation';
import { PostgrestError } from '@supabase/supabase-js';

const mapTrip = (t: TripDB): Trip => ({
    id: t.id,
    household_id: t.household_id,
    name: t.name,
    budget: Number(t.budget),
    proportionType: (t as any).proportion_type,
    customPercentage1: (t as any).custom_percentage_1 ? Number((t as any).custom_percentage_1) : undefined,
    created_at: t.created_at,
    expenses: (t.expenses || []).map((e: any) => ({
        id: e.id,
        trip_id: e.trip_id,
        description: e.description,
        value: Number(e.value),
        paidBy: e.paid_by,
        date: e.date,
        category: e.category,
        created_at: e.created_at
    })),
    deposits: (t.deposits || []).map((d: any) => ({
        id: d.id,
        trip_id: d.trip_id,
        person: d.person,
        value: Number(d.value),
        date: d.date,
        description: d.description,
        created_at: d.created_at
    }))
});

export const tripService = {
    async getAll(householdId: string): Promise<ServiceResponse<Trip[]>> {
        const { data, error } = await supabase
            .from('trips')
            .select(`
                *,
                expenses:trip_expenses(*),
                deposits:trip_deposits(*)
            `)
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .is('expenses.deleted_at', null)
            .is('deposits.deleted_at', null)
            .order('created_at', { ascending: false });

        const mappedData = data ? (data as unknown as TripDB[]).map(mapTrip) : null;
        return handleServiceResponse(mappedData, error);
    },

    async create(trip: Omit<Trip, 'id' | 'created_at' | 'expenses' | 'deposits'>): Promise<ServiceResponse<Trip>> {
        const validation = validateTrip(trip);
        if (!validation.success) {
            return handleServiceResponse(null, {
                message: validation.error.issues[0].message,
                code: 'VALIDATION_ERROR'
            } as any as PostgrestError);
        }

        const dbTrip = {
            household_id: trip.household_id,
            name: trip.name,
            budget: trip.budget,
            proportion_type: trip.proportionType,
            custom_percentage_1: trip.customPercentage1
        };

        const { data, error } = await supabase
            .from('trips')
            .insert(dbTrip)
            .select()
            .single();

        const mappedData = data ? mapTrip(data as unknown as TripDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async update(id: string, updates: Partial<Trip>): Promise<ServiceResponse<Trip>> {
        if (Object.keys(updates).length > 0) {
            const validation = tripSchema.partial().safeParse(updates);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }
        }

        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
        if (updates.proportionType !== undefined) dbUpdates.proportion_type = updates.proportionType;
        if (updates.customPercentage1 !== undefined) dbUpdates.custom_percentage_1 = updates.customPercentage1;

        const { data, error } = await supabase
            .from('trips')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        const mappedData = data ? mapTrip(data as unknown as TripDB) : null;
        return handleServiceResponse(mappedData, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('trips')
            .update(softDeletePayload())
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    async softDeleteAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('trips')
            .update(softDeletePayload())
            .eq('household_id', householdId);

        return handleServiceResponse(null, error);
    },

    async restoreAll(householdId: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('trips')
            .update(restorePayload())
            .eq('household_id', householdId)
            .not('deleted_at', 'is', null);

        return handleServiceResponse(null, error);
    },

    expenses: {
        async create(expense: Omit<TripExpense, 'id' | 'created_at'>): Promise<ServiceResponse<TripExpense>> {
            const validation = validateTripExpense(expense);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }

            const dbExpense = {
                trip_id: expense.trip_id,
                description: expense.description,
                value: expense.value,
                paid_by: expense.paidBy,
                date: expense.date,
                category: expense.category
            };

            const { data, error } = await supabase
                .from('trip_expenses')
                .insert(dbExpense)
                .select()
                .single();

            const mappedData: TripExpense | null = data ? {
                id: data.id,
                trip_id: data.trip_id,
                description: data.description,
                value: Number(data.value),
                paidBy: data.paid_by,
                date: data.date,
                category: data.category,
                created_at: data.created_at
            } : null;
            return handleServiceResponse(mappedData, error);
        },
        async delete(id: string): Promise<ServiceResponse<null>> {
            const { error } = await supabase
                .from('trip_expenses')
                .update(softDeletePayload())
                .eq('id', id);
            return handleServiceResponse(null, error);
        }
    },

    deposits: {
        async create(deposit: Omit<TripDeposit, 'id' | 'created_at'>): Promise<ServiceResponse<TripDeposit>> {
            const validation = validateTripDeposit(deposit);
            if (!validation.success) {
                return handleServiceResponse(null, {
                    message: validation.error.issues[0].message,
                    code: 'VALIDATION_ERROR'
                } as any as PostgrestError);
            }

            const dbDeposit = {
                trip_id: deposit.trip_id,
                person: deposit.person,
                value: deposit.value,
                date: deposit.date,
                description: deposit.description
            };
            const { data, error } = await supabase
                .from('trip_deposits')
                .insert(dbDeposit)
                .select()
                .single();

            const mappedData: TripDeposit | null = data ? {
                id: data.id,
                trip_id: data.trip_id,
                person: data.person,
                value: Number(data.value),
                date: data.date,
                description: data.description,
                created_at: data.created_at
            } : null;
            return handleServiceResponse(mappedData, error);
        },
        async delete(id: string): Promise<ServiceResponse<null>> {
            const { error } = await supabase
                .from('trip_deposits')
                .update(softDeletePayload())
                .eq('id', id);
            return handleServiceResponse(null, error);
        }
    }
};
