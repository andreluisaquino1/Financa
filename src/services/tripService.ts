import { supabase } from '@/supabaseClient';
import { Trip, TripDeposit, TripExpense } from '@/types';
import { handleServiceResponse, ServiceResponse } from './supabaseService';

export const tripService = {
    async getAll(householdId: string): Promise<ServiceResponse<Trip[]>> {
        const { data, error } = await supabase
            .from('trips')
            .select('*, expenses:trip_expenses(*), deposits:trip_deposits(*)')
            .eq('household_id', householdId)
            .is('deleted_at', null)
            .is('expenses.deleted_at', null)
            .is('deposits.deleted_at', null)
            .order('created_at', { ascending: false });

        // Filter out deleted sub-items from the response manually if database query doesn't handle inner join filtering perfectly on left joins
        const trips = data?.map(trip => ({
            ...trip,
            expenses: trip.expenses?.filter((e: any) => !e.deleted_at) || [],
            deposits: trip.deposits?.filter((d: any) => !d.deleted_at) || []
        })) as Trip[] | null;

        return handleServiceResponse(trips, error);
    },

    async create(trip: Omit<Trip, 'id' | 'created_at' | 'expenses' | 'deposits'>): Promise<ServiceResponse<Trip>> {
        const { data, error } = await supabase
            .from('trips')
            .insert(trip)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async update(id: string, updates: Partial<Trip>): Promise<ServiceResponse<Trip>> {
        const { data, error } = await supabase
            .from('trips')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return handleServiceResponse(data, error);
    },

    async softDelete(id: string): Promise<ServiceResponse<null>> {
        const { error } = await supabase
            .from('trips')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        return handleServiceResponse(null, error);
    },

    expenses: {
        async create(expense: Omit<TripExpense, 'id' | 'created_at'>): Promise<ServiceResponse<TripExpense>> {
            const { data, error } = await supabase
                .from('trip_expenses')
                .insert(expense)
                .select()
                .single();
            return handleServiceResponse(data, error);
        },
        async delete(id: string): Promise<ServiceResponse<null>> {
            const { error } = await supabase
                .from('trip_expenses')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            return handleServiceResponse(null, error);
        }
    },

    deposits: {
        async create(deposit: Omit<TripDeposit, 'id' | 'created_at'>): Promise<ServiceResponse<TripDeposit>> {
            const { data, error } = await supabase
                .from('trip_deposits')
                .insert(deposit)
                .select()
                .single();
            return handleServiceResponse(data, error);
        },
        async delete(id: string): Promise<ServiceResponse<null>> {
            const { error } = await supabase
                .from('trip_deposits')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            return handleServiceResponse(null, error);
        }
    }
};
