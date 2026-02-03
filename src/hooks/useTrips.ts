import { useState, useCallback } from 'react';
import { Trip, TripExpense, TripDeposit } from '@/types';
import { tripService } from '@/services/tripService';

export const useTrips = (user: any, householdId: string | null) => {
    const [trips, setTrips] = useState<Trip[]>([]);

    const addTrip = useCallback(async (trip: Omit<Trip, 'id' | 'household_id' | 'created_at' | 'expenses' | 'deposits'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await tripService.create({
                household_id: householdId,
                name: trip.name,
                budget: trip.budget,
                proportionType: trip.proportionType,
                customPercentage1: trip.customPercentage1
            });

            if (error) throw error;
            if (data) {
                setTrips(prev => [data, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao criar viagem: ' + err.message);
        }
    }, [user, householdId]);

    const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
        if (!user) return;
        try {
            const { data, error } = await tripService.update(id, updates);

            if (error) throw error;
            if (data) {
                setTrips(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
            }
        } catch (err: any) {
            alert('Erro ao atualizar viagem: ' + err.message);
        }
    }, [user]);

    const deleteTrip = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await tripService.softDelete(id);
            if (error) throw error;
            setTrips(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar viagem: ' + err.message);
        }
    }, [user]);

    const addTripExpense = useCallback(async (tripId: string, expense: Omit<TripExpense, 'id' | 'trip_id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await tripService.expenses.create({
                trip_id: tripId,
                ...expense
            });

            if (error) throw error;
            if (data) {
                setTrips(prev => prev.map(t => t.id === tripId ? { ...t, expenses: [data, ...t.expenses] } : t));
            }
        } catch (err: any) {
            alert('Erro ao adicionar gasto da viagem: ' + err.message);
        }
    }, [user]);

    const deleteTripExpense = useCallback(async (tripId: string, expenseId: string) => {
        if (!user) return;
        try {
            const { error } = await tripService.expenses.delete(expenseId);
            if (error) throw error;
            setTrips(prev => prev.map(t => t.id === tripId ? { ...t, expenses: t.expenses.filter(e => e.id !== expenseId) } : t));
        } catch (err: any) {
            alert('Erro ao deletar gasto da viagem: ' + err.message);
        }
    }, [user]);

    const addTripDeposit = useCallback(async (tripId: string, deposit: Omit<TripDeposit, 'id' | 'trip_id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await tripService.deposits.create({
                trip_id: tripId,
                ...deposit
            });

            if (error) throw error;
            if (data) {
                setTrips(prev => prev.map(t => t.id === tripId ? { ...t, deposits: [data, ...t.deposits] } : t));
            }
        } catch (err: any) {
            alert('Erro ao adicionar aporte da viagem: ' + err.message);
        }
    }, [user]);

    const deleteTripDeposit = useCallback(async (tripId: string, depositId: string) => {
        if (!user) return;
        try {
            const { error } = await tripService.deposits.delete(depositId);
            if (error) throw error;
            setTrips(prev => prev.map(t => t.id === tripId ? { ...t, deposits: t.deposits.filter(d => d.id !== depositId) } : t));
        } catch (err: any) {
            alert('Erro ao deletar aporte da viagem: ' + err.message);
        }
    }, [user]);

    return { trips, setTrips, addTrip, updateTrip, deleteTrip, addTripExpense, deleteTripExpense, addTripDeposit, deleteTripDeposit };
};
