import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserAccount, Expense, ExpenseType, CoupleInfo, SavingsGoal, MonthlySummary, Income, Loan, Investment, Trip, TripExpense, TripDeposit } from '@/types';
import { supabase } from '@/supabaseClient';
import { scheduleReminder, cancelReminder } from '@/notificationService';
import { getMonthYearKey, calculateSummary, formatCurrency } from '@/utils';
import { useAuth } from '@/AuthContext';

export const useAppData = () => {
    const { user, loading: authLoading, signOut } = useAuth();

    const [coupleInfo, setCoupleInfo] = useState<CoupleInfo>({
        person1Name: 'André',
        person2Name: 'Luciana',
        salary1: 5000,
        salary2: 5000,
        categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']
    });

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(getMonthYearKey(new Date()));
    const [dataLoading, setDataLoading] = useState(true);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!user) {
            setDataLoading(false);
            return;
        }

        setDataLoading(true);
        try {
            // 1. Load user profile and household_id
            let { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                const initialProfile = {
                    id: user.id,
                    household_id: user.id,
                    couple_info: coupleInfo,
                    updated_at: new Date().toISOString()
                };
                await supabase.from('user_profiles').insert(initialProfile);
                profile = initialProfile;
            }

            if (profile) {
                const activeHouseholdId = profile.household_id || profile.id;
                setHouseholdId(activeHouseholdId);
                setInviteCode(profile.invite_code);

                if (!profile.invite_code) {
                    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    await supabase.from('user_profiles').update({ invite_code: newCode }).eq('id', user.id);
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
                        bankBalanceP1: info.bankBalanceP1 || 0,
                        bankBalanceP2: info.bankBalanceP2 || 0,
                        emergencyReserveP1: info.emergencyReserveP1 || 0,
                        emergencyReserveP2: info.emergencyReserveP2 || 0,
                        monthlySavingsP1: info.monthlySavingsP1 || 0,
                        monthlySavingsP2: info.monthlySavingsP2 || 0
                    }));
                }

                // 2. Load expenses
                const { data: expensesData } = await supabase
                    .from('expenses')
                    .select('*')
                    .is('deleted_at', null)
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (expensesData) {
                    setExpenses(expensesData.map(e => ({
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
                        splitMethod: e.split_method as 'proportional' | 'custom',
                        splitPercentage1: e.metadata?.splitPercentage1,
                        specificValueP1: e.metadata?.specificValueP1,
                        specificValueP2: e.metadata?.specificValueP2,
                        reminderDay: e.reminder_day ? Number(e.reminder_day) : undefined
                    })));
                }

                // 3. Load goals
                const { data: goalsData } = await supabase
                    .from('savings_goals')
                    .select('*')
                    .is('deleted_at', null)
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (goalsData) {
                    setGoals(goalsData.map((g: any) => ({
                        ...g,
                        target_value: Number(g.target_value),
                        current_value: Number(g.current_value),
                        monthly_contribution_p1: g.monthly_contribution_p1 ? Number(g.monthly_contribution_p1) : 0,
                        monthly_contribution_p2: g.monthly_contribution_p2 ? Number(g.monthly_contribution_p2) : 0,
                        current_savings_p1: g.current_savings_p1 ? Number(g.current_savings_p1) : 0,
                        current_savings_p2: g.current_savings_p2 ? Number(g.current_savings_p2) : 0,
                        interest_rate: g.interest_rate ? Number(g.interest_rate) : 0,
                        expected_monthly_expense: g.expected_monthly_expense ? Number(g.expected_monthly_expense) : 0,
                        split_p1_percentage: g.split_p1_percentage ? Number(g.split_p1_percentage) : 50,
                        split_p2_percentage: g.split_p2_percentage ? Number(g.split_p2_percentage) : 50,
                        initial_withdrawal_p1: g.initial_withdrawal_p1 ? Number(g.initial_withdrawal_p1) : 0,
                        initial_withdrawal_p2: g.initial_withdrawal_p2 ? Number(g.initial_withdrawal_p2) : 0,
                    })));
                }

                // 3.5 Load Loans
                const { data: loansData } = await supabase
                    .from('loans')
                    .select('*')
                    .is('deleted_at', null)
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (loansData) {
                    setLoans(loansData.map((l: any) => ({
                        ...l,
                        total_value: Number(l.total_value),
                        remaining_value: Number(l.remaining_value)
                    })));
                }

                // 3.6 Load Investments
                const { data: investmentsData } = await supabase
                    .from('investments')
                    .select('*')
                    .is('deleted_at', null)
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (investmentsData) {
                    setInvestments(investmentsData.map((inv: any) => ({
                        ...inv,
                        current_value: Number(inv.current_value),
                        invested_value: Number(inv.invested_value)
                    })));
                }

                // 4. Load incomes
                const { data: incomesData } = await supabase
                    .from('incomes')
                    .select('*')
                    .is('deleted_at', null)
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (incomesData) {
                    setIncomes(incomesData.map(i => ({
                        id: i.id,
                        description: i.description,
                        value: Number(i.value),
                        category: i.category || 'Salário',
                        paidBy: i.paid_by,
                        date: i.date,
                        household_id: i.household_id,
                        user_id: i.user_id,
                        createdAt: i.created_at
                    })));
                }

                // 4.5 Load Trips (NEW SQL)
                const { data: tripsData } = await supabase
                    .from('trips')
                    .select(`
                        *,
                        trip_expenses(*),
                        trip_deposits(*)
                    `)
                    .is('deleted_at', null)
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (tripsData) {
                    setTrips(tripsData.map((t: any) => ({
                        id: t.id,
                        household_id: t.household_id,
                        name: t.name,
                        budget: Number(t.budget),
                        proportionType: t.proportion_type,
                        customPercentage1: Number(t.custom_percentage_1),
                        created_at: t.created_at,
                        expenses: (t.trip_expenses || []).filter((e: any) => !e.deleted_at).map((e: any) => ({
                            id: e.id,
                            trip_id: e.trip_id,
                            description: e.description,
                            value: Number(e.value),
                            paidBy: e.paid_by,
                            date: e.date,
                            category: e.category,
                            created_at: e.created_at
                        })),
                        deposits: (t.trip_deposits || []).filter((d: any) => !d.deleted_at).map((d: any) => ({
                            id: d.id,
                            trip_id: d.trip_id,
                            person: d.person,
                            value: Number(d.value),
                            date: d.date,
                            description: d.description,
                            created_at: d.created_at
                        }))
                    })));
                }

                // 5. Load monthly config
                const { data: monthConfig } = await supabase
                    .from('monthly_configs')
                    .select('*')
                    .eq('household_id', activeHouseholdId)
                    .eq('month_key', selectedMonth)
                    .maybeSingle();

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
                        salary1: Number(info.salary1) || 5000,
                        salary2: Number(info.salary2) || 5000
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
        return calculateSummary(expenses, incomes, coupleInfo, selectedMonth, true); // Always true (feature unlocked) or removed from func logic
    }, [expenses, incomes, coupleInfo, selectedMonth]);

    const saveCoupleInfo = useCallback(async (newInfo: CoupleInfo, updateGlobal = false) => {
        setCoupleInfo(newInfo);
        if (user && householdId) {
            // Se for pra atualizar global, salva no perfil
            if (updateGlobal) {
                await supabase
                    .from('user_profiles')
                    .update({
                        couple_info: newInfo,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', householdId);

                // Propagate salary to future months
                await supabase
                    .from('monthly_configs')
                    .update({
                        salary1: newInfo.salary1,
                        salary2: newInfo.salary2
                    })
                    .eq('household_id', householdId)
                    .gt('month_key', selectedMonth);
            }

            // Save for current month
            await supabase
                .from('monthly_configs')
                .upsert({
                    household_id: householdId,
                    month_key: selectedMonth,
                    salary1: newInfo.salary1,
                    salary2: newInfo.salary2
                }, { onConflict: 'household_id, month_key' });
        }
    }, [user, householdId, selectedMonth]);

    const addExpense = useCallback(async (exp: Omit<Expense, 'id' | 'createdAt'>) => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        const tempId = 'temp-' + Date.now();
        const optimisticExp: Expense = {
            ...exp,
            id: tempId,
            createdAt: new Date().toISOString(),
            household_id: activeHouseholdId
        };

        setExpenses(prev => [optimisticExp, ...prev]);

        try {
            const { data, error } = await supabase
                .from('expenses')
                .insert({
                    user_id: user.id,
                    household_id: activeHouseholdId,
                    date: exp.date,
                    type: exp.type,
                    category: exp.category,
                    description: exp.description,
                    total_value: exp.totalValue,
                    installments: exp.installments,
                    paid_by: exp.paidBy,
                    metadata: {
                        ...(exp.metadata || {}),
                        splitPercentage1: exp.splitPercentage1,
                        specificValueP1: exp.specificValueP1,
                        specificValueP2: exp.specificValueP2
                    },
                    split_method: exp.splitMethod || null,
                    reminder_day: exp.reminderDay
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newExp: Expense = {
                    id: data.id,
                    date: data.date,
                    type: data.type as ExpenseType,
                    category: data.category,
                    description: data.description,
                    totalValue: Number(data.total_value),
                    installments: Number(data.installments || 1),
                    paidBy: data.paid_by as 'person1' | 'person2',
                    createdAt: data.created_at,
                    metadata: data.metadata,
                    household_id: data.household_id,
                    splitMethod: data.split_method as 'proportional' | 'custom',
                    splitPercentage1: data.metadata?.splitPercentage1,
                    specificValueP1: data.metadata?.specificValueP1,
                    specificValueP2: data.metadata?.specificValueP2,
                    reminderDay: data.reminder_day ? Number(data.reminder_day) : undefined
                };

                setExpenses(prev => prev.map(e => e.id === tempId ? newExp : e));
            }
        } catch (err: any) {
            setExpenses(prev => prev.filter(e => e.id !== tempId));
            alert('Erro ao salvar gasto: ' + err.message);
        }
    }, [user, householdId]);

    const updateExpense = useCallback(async (id: string, updates: Omit<Expense, 'id' | 'createdAt'>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('expenses')
                .update({
                    date: updates.date,
                    type: updates.type,
                    category: updates.category,
                    description: updates.description,
                    total_value: updates.totalValue,
                    installments: updates.installments,
                    paid_by: updates.paidBy,
                    metadata: {
                        ...(updates.metadata || {}),
                        splitPercentage1: updates.splitPercentage1,
                        specificValueP1: updates.specificValueP1,
                        specificValueP2: updates.specificValueP2
                    },
                    split_method: updates.splitMethod || null,
                    reminder_day: updates.reminderDay
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const updatedExp: Expense = {
                    id: data.id,
                    date: data.date,
                    type: data.type as ExpenseType,
                    category: data.category,
                    description: data.description,
                    totalValue: Number(data.total_value),
                    installments: Number(data.installments || 1),
                    paidBy: data.paid_by as 'person1' | 'person2',
                    createdAt: data.created_at,
                    metadata: data.metadata,
                    household_id: data.household_id,
                    splitMethod: data.split_method as 'proportional' | 'custom',
                    splitPercentage1: data.metadata?.splitPercentage1,
                    specificValueP1: data.metadata?.specificValueP1,
                    specificValueP2: data.metadata?.specificValueP2,
                    reminderDay: data.reminder_day ? Number(data.reminder_day) : undefined
                };
                setExpenses(prev => prev.map(e => e.id === id ? updatedExp : e));
            }
        } catch (err: any) {
            alert('Erro ao atualizar: ' + err.message);
        }
    }, [user]);

    const deleteExpense = useCallback(async (id: string) => {
        if (!user) return;
        try {
            await cancelReminder(id);
            const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar: ' + err.message);
        }
    }, [user]);

    const addGoal = useCallback(async (goalData: Partial<SavingsGoal>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('savings_goals')
                .insert({
                    user_id: user.id,
                    household_id: householdId || user.id,
                    title: goalData.title,
                    goal_type: goalData.goal_type || 'couple',
                    target_value: goalData.target_value || 0,
                    current_value: goalData.current_value || 0,
                    monthly_contribution_p1: goalData.monthly_contribution_p1 || 0,
                    monthly_contribution_p2: goalData.monthly_contribution_p2 || 0,
                    current_savings_p1: goalData.current_savings_p1 || 0,
                    current_savings_p2: goalData.current_savings_p2 || 0,
                    interest_rate: goalData.interest_rate || 0,
                    expected_monthly_expense: goalData.expected_monthly_expense || 0,
                    start_date: goalData.start_date || null,
                    deadline: goalData.deadline || null,
                    icon: goalData.icon || '💰',
                    priority: goalData.priority || 'medium',
                    investment_location_p1: goalData.investment_location_p1 || '',
                    investment_location_p2: goalData.investment_location_p2 || '',
                    last_contribution_month: goalData.last_contribution_month || null,
                    is_completed: false,
                    split_p1_percentage: goalData.split_p1_percentage || 50,
                    split_p2_percentage: goalData.split_p2_percentage || 50,
                    initial_withdrawal_p1: goalData.initial_withdrawal_p1 || 0,
                    initial_withdrawal_p2: goalData.initial_withdrawal_p2 || 0,
                    // Legacy field for backwards compatibility
                    monthly_contribution: (goalData.monthly_contribution_p1 || 0) + (goalData.monthly_contribution_p2 || 0)
                })
                .select()
                .single();
            if (error) throw error;
            if (data) setGoals(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao criar meta: ' + err.message);
        }
    }, [user, householdId]);

    const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('savings_goals')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
            setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        } catch (err: any) {
            alert('Erro ao atualizar meta: ' + err.message);
        }
    }, [user]);

    const deleteGoal = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('savings_goals').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar meta: ' + err.message);
        }
    }, [user]);

    const deleteAllData = useCallback(async () => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        const proceed = confirm("ATENÇÃO: Isso apagará permanentemente TODO o seu histórico (gastos, metas e configurações). Deseja continuar?");
        if (!proceed) return;

        setDataLoading(true);
        try {
            const now = new Date().toISOString();
            await supabase.from('expenses').update({ deleted_at: now }).eq('household_id', activeHouseholdId);
            await supabase.from('incomes').update({ deleted_at: now }).eq('household_id', activeHouseholdId);
            await supabase.from('savings_goals').update({ deleted_at: now }).eq('household_id', activeHouseholdId);
            await supabase.from('monthly_configs').delete().eq('household_id', activeHouseholdId);

            const defaultInfo: CoupleInfo = {
                person1Name: 'André',
                person2Name: 'Luciana',
                salary1: 5000,
                salary2: 5000,
                categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros'],
                theme: 'light'
            };

            await supabase.from('user_profiles').update({
                couple_info: defaultInfo,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);

            setExpenses([]);
            setIncomes([]);
            setGoals([]);
            setCoupleInfo(defaultInfo);
            alert('Todos os dados foram limpos com sucesso! 🧹');
        } catch (err: any) {
            alert('Erro ao apagar dados: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId]);

    const deleteMonthData = useCallback(async (monthKey: string) => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        setDataLoading(true);
        try {
            const now = new Date().toISOString();
            await supabase.from('expenses').update({ deleted_at: now }).eq('household_id', activeHouseholdId).like('date', `${monthKey}%`);
            await supabase.from('incomes').update({ deleted_at: now }).eq('household_id', activeHouseholdId).like('date', `${monthKey}%`);

            setExpenses(prev => prev.filter(e => !e.date.startsWith(monthKey)));
            setIncomes(prev => prev.filter(i => !i.date.startsWith(monthKey)));
        } catch (err: any) {
            alert('Erro ao apagar dados do mês: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId]);

    const addIncome = useCallback(async (inc: Omit<Income, 'id' | 'createdAt'>) => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        try {
            const { data, error } = await supabase
                .from('incomes')
                .insert({
                    user_id: user.id,
                    household_id: activeHouseholdId,
                    description: inc.description,
                    value: inc.value,
                    category: inc.category,
                    paid_by: inc.paidBy,
                    date: inc.date
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newInc: Income = {
                    id: data.id,
                    description: data.description,
                    value: Number(data.value),
                    category: data.category,
                    paidBy: data.paid_by,
                    date: data.date,
                    household_id: data.household_id,
                    user_id: data.user_id,
                    createdAt: data.created_at
                };
                setIncomes(prev => [newInc, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao adicionar receita: ' + err.message);
        }
    }, [user, householdId]);

    const updateIncome = useCallback(async (id: string, updates: Omit<Income, 'id' | 'createdAt'>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('incomes')
                .update({
                    description: updates.description,
                    value: updates.value,
                    category: updates.category,
                    paid_by: updates.paidBy,
                    date: updates.date
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const updatedInc: Income = {
                    id: data.id,
                    description: data.description,
                    value: Number(data.value),
                    category: data.category,
                    paidBy: data.paid_by,
                    date: data.date,
                    household_id: data.household_id,
                    user_id: data.user_id,
                    createdAt: data.created_at
                };
                setIncomes(prev => prev.map(i => i.id === id ? updatedInc : i));
            }
        } catch (err: any) {
            alert('Erro ao atualizar receita: ' + err.message);
        }
    }, [user]);

    const deleteIncome = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('incomes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setIncomes(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar receita: ' + err.message);
        }
    }, [user]);

    const addLoan = useCallback(async (loan: Omit<Loan, 'id' | 'created_at'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await supabase
                .from('loans')
                .insert({
                    user_id: user.id,
                    household_id: householdId,
                    borrower_name: loan.borrower_name,
                    description: loan.description,
                    total_value: loan.total_value,
                    remaining_value: loan.remaining_value,
                    installments: loan.installments || 1,
                    paid_installments: 0,
                    due_date: loan.due_date || null,
                    lender: loan.lender,
                    status: loan.status
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newLoan: Loan = {
                    ...data,
                    total_value: Number(data.total_value),
                    remaining_value: Number(data.remaining_value)
                };
                setLoans(prev => [newLoan, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao adicionar empréstimo: ' + err.message);
        }
    }, [user, householdId]);

    const updateLoan = useCallback(async (id: string, updates: Partial<Loan>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('loans')
                .update({
                    borrower_name: updates.borrower_name,
                    description: updates.description,
                    total_value: updates.total_value,
                    remaining_value: updates.remaining_value,
                    installments: updates.installments,
                    paid_installments: updates.paid_installments,
                    due_date: updates.due_date || null,
                    lender: updates.lender,
                    status: updates.status
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const updatedLoan: Loan = {
                    ...data,
                    total_value: Number(data.total_value),
                    remaining_value: Number(data.remaining_value)
                };
                setLoans(prev => prev.map(l => l.id === id ? updatedLoan : l));
            }
        } catch (err: any) {
            alert('Erro ao atualizar empréstimo: ' + err.message);
        }
    }, [user]);

    const deleteLoan = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('loans').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setLoans(prev => prev.filter(l => l.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar empréstimo: ' + err.message);
        }
    }, [user]);

    const addInvestment = useCallback(async (inv: Omit<Investment, 'id' | 'created_at' | 'user_id' | 'household_id'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await supabase
                .from('investments')
                .insert({
                    user_id: user.id,
                    household_id: householdId,
                    name: inv.name,
                    type: inv.type,
                    current_value: inv.current_value,
                    invested_value: inv.invested_value,
                    quantity: inv.quantity || 0,
                    price_per_unit: inv.price_per_unit || 0,
                    owner: inv.owner
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newInv: Investment = {
                    ...data,
                    current_value: Number(data.current_value),
                    invested_value: Number(data.invested_value),
                    quantity: Number(data.quantity || 0),
                    price_per_unit: Number(data.price_per_unit || 0)
                };
                setInvestments(prev => [newInv, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao adicionar investimento: ' + err.message);
        }
    }, [user, householdId]);

    const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('investments')
                .update({
                    name: updates.name,
                    type: updates.type,
                    current_value: updates.current_value,
                    invested_value: updates.invested_value,
                    quantity: updates.quantity,
                    price_per_unit: updates.price_per_unit,
                    owner: updates.owner,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const updatedInv: Investment = {
                    ...data,
                    current_value: Number(data.current_value),
                    invested_value: Number(data.invested_value),
                    quantity: Number(data.quantity || 0),
                    price_per_unit: Number(data.price_per_unit || 0)
                };
                setInvestments(prev => prev.map(i => i.id === id ? updatedInv : i));
            }
        } catch (err: any) {
            alert('Erro ao atualizar investimento: ' + err.message);
        }
    }, [user]);

    const deleteInvestment = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('investments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setInvestments(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar investimento: ' + err.message);
        }
    }, [user]);

    const restoreData = useCallback(async () => {
        if (!user || !householdId) return;
        const proceed = confirm("Deseja restaurar os últimos dados enviados para a lixeira?");
        if (!proceed) return;

        setDataLoading(true);
        try {
            // Find the most recent deletion timestamp to restore as a batch, 
            // or just restore EVERYTHING that was deleted. 
            // Usually simpler to restore everything deleted in the last hour or just everything.
            // Let's restore everything for now as a "Recycle Bin" feature.
            await supabase.from('expenses').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            await supabase.from('incomes').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            await supabase.from('savings_goals').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            await supabase.from('loans').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            await supabase.from('loans').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            await supabase.from('investments').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            await supabase.from('trips').update({ deleted_at: null }).eq('household_id', householdId).not('deleted_at', 'is', null);
            // We also need to restore expenses/deposits, but it's trickier. Usually cascading deletes handle cleanup, but soft deletes need explicit restore.
            // For now, let's just restore trips.


            await loadData();
            alert('Dados restaurados com sucesso! ♻️');
        } catch (err: any) {
            alert('Erro ao restaurar dados: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId, loadData]);

    // --- Trip CRUD ---

    const addTrip = useCallback(async (trip: Omit<Trip, 'id' | 'household_id' | 'created_at' | 'expenses' | 'deposits'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await supabase
                .from('trips')
                .insert({
                    household_id: householdId,
                    name: trip.name,
                    budget: trip.budget,
                    proportion_type: trip.proportionType,
                    custom_percentage_1: trip.customPercentage1
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newTrip: Trip = {
                    id: data.id,
                    household_id: data.household_id,
                    name: data.name,
                    budget: Number(data.budget),
                    proportionType: data.proportion_type,
                    customPercentage1: Number(data.custom_percentage_1),
                    created_at: data.created_at,
                    expenses: [],
                    deposits: []
                };
                setTrips(prev => [newTrip, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao criar viagem: ' + err.message);
        }
    }, [user, householdId]);

    const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    name: updates.name,
                    budget: updates.budget,
                    proportion_type: updates.proportionType,
                    custom_percentage_1: updates.customPercentage1
                })
                .eq('id', id);

            if (error) throw error;
            setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        } catch (err: any) {
            alert('Erro ao atualizar viagem: ' + err.message);
        }
    }, [user]);

    const deleteTrip = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('trips').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setTrips(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar viagem: ' + err.message);
        }
    }, [user]);

    const addTripExpense = useCallback(async (tripId: string, exp: Omit<TripExpense, 'id' | 'trip_id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('trip_expenses')
                .insert({
                    trip_id: tripId,
                    description: exp.description,
                    value: exp.value,
                    paid_by: exp.paidBy,
                    date: exp.date,
                    category: exp.category
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newExp: TripExpense = {
                    id: data.id,
                    trip_id: data.trip_id,
                    description: data.description,
                    value: Number(data.value),
                    paidBy: data.paid_by,
                    date: data.date,
                    category: data.category,
                    created_at: data.created_at
                };
                setTrips(prev => prev.map(t => t.id === tripId ? { ...t, expenses: [...t.expenses, newExp] } : t));
            }
        } catch (err: any) {
            alert('Erro ao adicionar gasto da viagem: ' + err.message);
        }
    }, [user]);

    const deleteTripExpense = useCallback(async (tripId: string, expenseId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('trip_expenses').update({ deleted_at: new Date().toISOString() }).eq('id', expenseId);
            if (error) throw error;
            setTrips(prev => prev.map(t => t.id === tripId ? { ...t, expenses: t.expenses.filter(e => e.id !== expenseId) } : t));
        } catch (err: any) {
            alert('Erro ao deletar gasto da viagem: ' + err.message);
        }
    }, [user]);

    const addTripDeposit = useCallback(async (tripId: string, dep: Omit<TripDeposit, 'id' | 'trip_id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('trip_deposits')
                .insert({
                    trip_id: tripId,
                    description: dep.description,
                    value: dep.value,
                    person: dep.person,
                    date: dep.date
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newDep: TripDeposit = {
                    id: data.id,
                    trip_id: data.trip_id,
                    description: data.description,
                    value: Number(data.value),
                    person: data.person,
                    date: data.date,
                    created_at: data.created_at
                };
                setTrips(prev => prev.map(t => t.id === tripId ? { ...t, deposits: [...t.deposits, newDep] } : t));
            }
        } catch (err: any) {
            alert('Erro ao adicionar aporte da viagem: ' + err.message);
        }
    }, [user]);

    const deleteTripDeposit = useCallback(async (tripId: string, depositId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('trip_deposits').update({ deleted_at: new Date().toISOString() }).eq('id', depositId);
            if (error) throw error;
            setTrips(prev => prev.map(t => t.id === tripId ? { ...t, deposits: t.deposits.filter(d => d.id !== depositId) } : t));
        } catch (err: any) {
            alert('Erro ao deletar aporte da viagem: ' + err.message);
        }
    }, [user]);

    return {
        user,
        authLoading,
        dataLoading,
        coupleInfo,
        expenses,
        incomes,
        goals,
        loans,
        selectedMonth,
        setSelectedMonth,
        householdId,
        inviteCode,
        summary,
        saveCoupleInfo,
        addExpense,
        updateExpense,
        deleteExpense,
        addGoal,
        updateGoal,
        deleteGoal,
        addIncome,
        updateIncome,
        deleteIncome,
        addLoan,
        updateLoan,
        deleteLoan,
        investments,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        // Trip
        trips,
        addTrip,
        updateTrip,
        deleteTrip,
        addTripExpense,
        deleteTripExpense,
        addTripDeposit,
        deleteTripDeposit,
        // System
        deleteAllData,
        deleteMonthData,
        restoreData,
        signOut,
        refreshData: loadData
    };
};
