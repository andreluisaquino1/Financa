import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserAccount, Expense, ExpenseType, CoupleInfo, SavingsGoal, MonthlySummary, Income, Loan, Investment, InvestmentMovement, Trip, TripExpense, TripDeposit, GoalTransaction, UserProfileDB } from '@/types';
import { getMonthYearKey } from '@/domain/formatters';
import { calculateSummary } from '@/domain/financial';
import { useAuth } from '@/AuthContext';
import { expenseService } from '@/services/expenseService';
import { incomeService } from '@/services/incomeService';
import { goalService } from '@/services/goalService';
import { loanService } from '@/services/loanService';
import { investmentService } from '@/services/investmentService';
import { investmentMovementService } from '@/services/investmentMovementService';
import { tripService } from '@/services/tripService';
import { profileService } from '@/services/profileService';
import { monthlyConfigService } from '@/services/monthlyConfigService';
import { goalTransactionService } from '@/services/goalTransactionService';
import { migrationService } from '@/services/migrationService';

import { useExpenses } from './useExpenses';
import { useIncomes } from './useIncomes';
import { useGoals } from './useGoals';
import { useTrips } from './useTrips';
import { useInvestments } from './useInvestments';

export const useAppData = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(getMonthYearKey(new Date()));

    const [coupleInfo, setCoupleInfo] = useState<CoupleInfo>({
        person1Name: 'André',
        person2Name: 'Luciana',
        salary1: 5000,
        salary2: 5000,
        categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']
    });

    const [loans, setLoans] = useState<Loan[]>([]);

    const expenseHook = useExpenses(user, householdId);
    const incomeHook = useIncomes(user, householdId);
    const goalHook = useGoals(user, householdId);
    const tripHook = useTrips(user, householdId);
    const investmentHook = useInvestments(user, householdId);

    const loadData = useCallback(async () => {
        if (!user) {
            setDataLoading(false);
            return;
        }

        setDataLoading(true);
        try {
            let { data: profile, error: profileError } = await profileService.get(user.id);

            if (profileError && profileError.code === 'PGRST116') {
                const initialProfile = {
                    id: user.id,
                    household_id: user.id,
                    invite_code: null,
                    couple_info: coupleInfo,
                    updated_at: new Date().toISOString()
                } as UserProfileDB;
                const { data: newProfile } = await profileService.create(initialProfile);
                profile = newProfile || initialProfile;
            }

            if (profile) {
                const activeHouseholdId = profile.household_id || profile.id;
                setHouseholdId(activeHouseholdId);
                setInviteCode(profile.invite_code);

                if (!profile.invite_code) {
                    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    await profileService.update(user.id, { invite_code: newCode });
                    setInviteCode(newCode);
                }

                if (profile.couple_info) {
                    const info = profile.couple_info as any;
                    setCoupleInfo(prev => ({
                        ...prev,
                        person1Name: info.person1Name || 'André',
                        person2Name: info.person2Name || 'Luciana',
                        categories: info.categories || prev.categories,
                        customSplitMode: info.customSplitMode,
                        manualPercentage1: info.manualPercentage1,
                        theme: info.theme || 'light',
                        person1Color: info.person1Color || '#2563eb',
                        person2Color: info.person2Color || '#ec4899',
                        salary1Description: info.salary1Description,
                        salary2Description: info.salary2Description,
                        person1RecurringIncomes: info.person1RecurringIncomes || [],
                        person2RecurringIncomes: info.person2RecurringIncomes || [],
                        trips: info.trips || [],
                        bankBalanceP1: info.bankBalanceP1 ?? 0,
                        bankBalanceP2: info.bankBalanceP2 ?? 0,
                        emergencyReserveP1: info.emergencyReserveP1 ?? 0,
                        emergencyReserveP2: info.emergencyReserveP2 ?? 0,
                        monthlySavingsP1: info.monthlySavingsP1 ?? 0,
                        monthlySavingsP2: info.monthlySavingsP2 ?? 0
                    }));
                }

                const [expensesRes, goalsRes, loansRes, investmentsRes, incomesRes, tripsRes, transactionsRes, invMovementsRes] = await Promise.all([
                    expenseService.getAll(activeHouseholdId),
                    goalService.getAll(activeHouseholdId),
                    loanService.getAll(activeHouseholdId),
                    investmentService.getAll(activeHouseholdId),
                    incomeService.getAll(activeHouseholdId),
                    tripService.getAll(activeHouseholdId),
                    goalTransactionService.getAllByHousehold(activeHouseholdId),
                    investmentMovementService.getAllByHousehold(activeHouseholdId)
                ]);

                if (expensesRes.data) expenseHook.setExpenses(expensesRes.data);
                if (goalsRes.data) goalHook.setGoals(goalsRes.data);
                if (loansRes.data) setLoans(loansRes.data);
                if (investmentsRes.data) investmentHook.setInvestments(investmentsRes.data);
                if (incomesRes.data) incomeHook.setIncomes(incomesRes.data);
                if (tripsRes.data) tripHook.setTrips(tripsRes.data);
                if (transactionsRes.data) goalHook.setGoalTransactions(transactionsRes.data);
                if (invMovementsRes.data) investmentHook.setInvestmentMovements(invMovementsRes.data);

                // Migrations
                if (goalsRes.data && goalsRes.data.length > 0) {
                    const updatedInfo = await goalHook.migrateGoalsIfNeeded(activeHouseholdId, profile.couple_info, goalsRes.data);
                    if (updatedInfo) setCoupleInfo(prev => ({ ...prev, ...updatedInfo }));
                }

                if (investmentsRes.data && investmentsRes.data.length > 0 && (!invMovementsRes.data || invMovementsRes.data.length === 0)) {
                    await migrationService.migrateInvestments(activeHouseholdId);
                    const { data: migratedInvData } = await investmentMovementService.getAllByHousehold(activeHouseholdId);
                    if (migratedInvData) investmentHook.setInvestmentMovements(migratedInvData);
                }

                // Monthly config
                const { data: monthConfig } = await monthlyConfigService.get(activeHouseholdId, selectedMonth);
                if (monthConfig) {
                    setCoupleInfo(prev => ({
                        ...prev,
                        salary1: Number(monthConfig.salary1),
                        salary2: Number(monthConfig.salary2)
                    }));
                } else if (profile.couple_info) {
                    const info = profile.couple_info as any;
                    setCoupleInfo(prev => ({
                        ...prev,
                        salary1: Number(info.salary1 ?? 5000),
                        salary2: Number(info.salary2 ?? 5000)
                    }));
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setDataLoading(false);
        }
    }, [user, selectedMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const summary = useMemo(() => {
        return calculateSummary(expenseHook.expenses, incomeHook.incomes, coupleInfo, selectedMonth, goalHook.goals, goalHook.goalTransactions);
    }, [expenseHook.expenses, incomeHook.incomes, coupleInfo, selectedMonth, goalHook.goals, goalHook.goalTransactions]);

    const saveCoupleInfo = useCallback(async (newInfo: CoupleInfo, updateGlobal = false) => {
        setCoupleInfo(newInfo);
        if (user && householdId) {
            if (updateGlobal) {
                await profileService.update(householdId, {
                    couple_info: newInfo,
                    updated_at: new Date().toISOString()
                });
                await monthlyConfigService.updateGlobalSalaries(householdId, selectedMonth, newInfo.salary1, newInfo.salary2);
            }
            await monthlyConfigService.upsert({
                household_id: householdId,
                month_key: selectedMonth,
                salary1: newInfo.salary1,
                salary2: newInfo.salary2
            });
        }
    }, [user, householdId, selectedMonth]);

    const addLoan = useCallback(async (loan: Omit<Loan, 'id' | 'created_at'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await loanService.create({
                user_id: user.id,
                household_id: householdId,
                ...loan,
                paid_installments: 0
            });
            if (error) throw error;
            if (data) setLoans(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao adicionar empréstimo: ' + err.message);
        }
    }, [user, householdId]);

    const updateLoan = useCallback(async (id: string, updates: Partial<Loan>) => {
        if (!user) return;
        try {
            const { data, error } = await loanService.update(id, updates);
            if (error) throw error;
            if (data) setLoans(prev => prev.map(l => l.id === id ? data : l));
        } catch (err: any) {
            alert('Erro ao atualizar empréstimo: ' + err.message);
        }
    }, [user]);

    const deleteLoan = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await loanService.softDelete(id);
            if (error) throw error;
            setLoans(prev => prev.filter(l => l.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar empréstimo: ' + err.message);
        }
    }, [user]);

    const deleteAllData = useCallback(async () => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        const proceed = confirm("ATENÇÃO: Isso apagará permanentemente TODO o seu histórico (gastos, metas e configurações). Deseja continuar?");
        if (!proceed) return;

        setDataLoading(true);
        try {
            await Promise.all([
                expenseService.softDeleteAll(activeHouseholdId),
                incomeService.softDeleteAll(activeHouseholdId),
                goalService.softDeleteAll(activeHouseholdId),
                loanService.softDeleteAll(activeHouseholdId),
                investmentService.softDeleteAll(activeHouseholdId),
                tripService.softDeleteAll(activeHouseholdId),
                monthlyConfigService.softDeleteByHousehold(activeHouseholdId)
            ]);

            const defaultInfo: CoupleInfo = {
                person1Name: 'André',
                person2Name: 'Luciana',
                salary1: 5000,
                salary2: 5000,
                categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros'],
                theme: 'light'
            };

            await profileService.update(user.id, {
                couple_info: defaultInfo,
                updated_at: new Date().toISOString()
            });

            expenseHook.setExpenses([]);
            incomeHook.setIncomes([]);
            goalHook.setGoals([]);
            setLoans([]);
            investmentHook.setInvestments([]);
            setCoupleInfo(defaultInfo);
            alert('Todos os dados foram limpos com sucesso! 🧹');
        } catch (err: any) {
            alert('Erro ao apagar dados: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId, expenseHook, incomeHook, goalHook, investmentHook]);

    const deleteMonthData = useCallback(async (monthKey: string) => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        setDataLoading(true);
        try {
            await Promise.all([
                expenseService.softDeleteByMonth(activeHouseholdId, monthKey),
                incomeService.softDeleteByMonth(activeHouseholdId, monthKey)
            ]);

            expenseHook.setExpenses(prev => prev.filter(e => !e.date.startsWith(monthKey)));
            incomeHook.setIncomes(prev => prev.filter(i => !i.date.startsWith(monthKey)));
        } catch (err: any) {
            alert('Erro ao apagar dados do mês: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId, expenseHook, incomeHook]);

    const restoreData = useCallback(async () => {
        if (!user || !householdId) return;
        setDataLoading(true);
        try {
            await Promise.all([
                expenseService.restoreAll(householdId),
                incomeService.restoreAll(householdId),
                goalService.restoreAll(householdId),
                loanService.restoreAll(householdId),
                investmentService.restoreAll(householdId),
                tripService.restoreAll(householdId)
            ]);
            await loadData();
            alert('Dados restaurados com sucesso! ♻️');
        } catch (e: any) {
            alert('Erro ao restaurar: ' + e.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId, loadData]);

    return {
        user,
        authLoading,
        dataLoading,
        coupleInfo,
        expenses: expenseHook.expenses,
        incomes: incomeHook.incomes,
        goals: goalHook.goals,
        goalTransactions: goalHook.goalTransactions,
        loans,
        investments: investmentHook.investments,
        trips: tripHook.trips,
        summary,
        selectedMonth,
        householdId,
        inviteCode,
        setSelectedMonth,
        saveCoupleInfo,
        addExpense: expenseHook.addExpense,
        updateExpense: expenseHook.updateExpense,
        deleteExpense: expenseHook.deleteExpense,
        deleteMonthData,
        deleteAllData,
        signOut,
        addGoal: goalHook.addGoal,
        updateGoal: goalHook.updateGoal,
        deleteGoal: goalHook.deleteGoal,
        addGoalTransaction: goalHook.addGoalTransaction,
        deleteGoalTransaction: goalHook.deleteGoalTransaction,
        addIncome: incomeHook.addIncome,
        updateIncome: incomeHook.updateIncome,
        deleteIncome: incomeHook.deleteIncome,
        addLoan,
        updateLoan,
        deleteLoan,
        addInvestment: investmentHook.addInvestment,
        updateInvestment: investmentHook.updateInvestment,
        deleteInvestment: investmentHook.deleteInvestment,
        addTrip: tripHook.addTrip,
        updateTrip: tripHook.updateTrip,
        deleteTrip: tripHook.deleteTrip,
        addTripExpense: tripHook.addTripExpense,
        deleteTripExpense: tripHook.deleteTripExpense,
        addTripDeposit: tripHook.addTripDeposit,
        deleteTripDeposit: tripHook.deleteTripDeposit,
        investmentMovements: investmentHook.investmentMovements,
        addInvestmentMovement: investmentHook.addInvestmentMovement,
        deleteInvestmentMovement: investmentHook.deleteInvestmentMovement,
        restoreData,
        markAsSettled: expenseHook.markAsSettled
    };
};
