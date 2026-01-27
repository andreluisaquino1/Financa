import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserAccount, Expense, ExpenseType, CoupleInfo, SavingsGoal, MonthlySummary, Income } from '../types';
import { supabase } from '../supabaseClient';
import { scheduleReminder, cancelReminder } from '../notificationService';
import { getMonthYearKey, calculateSummary, formatCurrency } from '../utils';
import { useAuth } from '../AuthContext';

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
    const [selectedMonth, setSelectedMonth] = useState(getMonthYearKey(new Date()));
    const [dataLoading, setDataLoading] = useState(true);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState(false);

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

                // Check premium status at household level
                const { data: householdProfiles } = await supabase
                    .from('user_profiles')
                    .select('is_premium')
                    .eq('household_id', activeHouseholdId);

                const isHouseholdPremium = householdProfiles?.some(h => !!h.is_premium) || false;
                setIsPremium(isHouseholdPremium);

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
                        salary2Description: info.salary2Description
                    }));
                }

                // 2. Load expenses
                const { data: expensesData } = await supabase
                    .from('expenses')
                    .select('*')
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
                        installments: e.installments,
                        paidBy: e.paid_by as 'person1' | 'person2',
                        createdAt: e.created_at,
                        metadata: e.metadata,
                        household_id: e.household_id,
                        splitMethod: e.split_method as 'proportional' | 'equal'
                    })));
                }

                // 3. Load goals
                const { data: goalsData } = await supabase
                    .from('savings_goals')
                    .select('*')
                    .eq('household_id', activeHouseholdId)
                    .order('created_at', { ascending: false });

                if (goalsData) {
                    setGoals(goalsData);
                }

                // 4. Load incomes
                const { data: incomesData } = await supabase
                    .from('incomes')
                    .select('*')
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
        return calculateSummary(expenses, incomes, coupleInfo, selectedMonth);
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
                    metadata: exp.metadata || {},
                    split_method: exp.splitMethod || null,
                    reminder_day: exp.reminderDay || null
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
                    installments: data.installments,
                    paidBy: data.paid_by as 'person1' | 'person2',
                    createdAt: data.created_at,
                    metadata: data.metadata,
                    household_id: data.household_id,
                    splitMethod: data.split_method as 'proportional' | 'equal',
                    reminderDay: exp.reminderDay // Keep in local state if passed, but don't save to DB yet
                };

                // Replace temp with real ID
                setExpenses(prev => prev.map(e => e.id === tempId ? newExp : e));

                if (newExp.reminderDay) {
                    scheduleReminder(newExp);
                }

                // Force a background refresh to ensure total sync
                loadData();
            }
        } catch (err: any) {
            console.error('Error adding expense:', err);
            setExpenses(prev => prev.filter(e => e.id !== tempId));
            alert('Erro ao salvar gasto: ' + err.message);
        }
    }, [user, householdId, loadData]);

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
                    metadata: updates.metadata || {},
                    split_method: updates.splitMethod || null,
                    reminder_day: updates.reminderDay || null
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
                    installments: data.installments,
                    paidBy: data.paid_by as 'person1' | 'person2',
                    createdAt: data.created_at,
                    metadata: data.metadata,
                    household_id: data.household_id,
                    splitMethod: data.split_method as 'proportional' | 'equal',
                    reminderDay: data.reminder_day
                };
                setExpenses(prev => prev.map(e => e.id === id ? updatedExp : e));

                // Update reminder
                await cancelReminder(id);
                if (updatedExp.reminderDay) {
                    await scheduleReminder(updatedExp);
                }
            }
        } catch (err: any) {
            alert('Erro ao atualizar: ' + err.message);
        }
    }, [user]);

    const deleteExpense = useCallback(async (id: string) => {
        if (!user) return;
        try {
            await cancelReminder(id);
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar: ' + err.message);
        }
    }, [user]);

    const addGoal = useCallback(async (title: string, target: number, monthly: number, rate: number, deadline?: string, icon?: string) => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('savings_goals')
                .insert({
                    user_id: user.id,
                    household_id: householdId || user.id,
                    title,
                    target_value: target,
                    monthly_contribution: monthly,
                    interest_rate: rate,
                    deadline: deadline || null,
                    icon: icon || '💰',
                    current_value: 0,
                    is_completed: false
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
            const { error } = await supabase.from('savings_goals').delete().eq('id', id);
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
            // 1. Delete all expenses
            await supabase.from('expenses').delete().eq('household_id', activeHouseholdId);

            // 2. Delete all incomes
            await supabase.from('incomes').delete().eq('household_id', activeHouseholdId);

            // 3. Delete all goals
            await supabase.from('savings_goals').delete().eq('household_id', activeHouseholdId);

            // 4. Delete all monthly config
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
            await supabase.from('expenses').delete().eq('household_id', activeHouseholdId).like('date', `${monthKey}%`);
            await supabase.from('incomes').delete().eq('household_id', activeHouseholdId).like('date', `${monthKey}%`);

            setExpenses(prev => prev.filter(e => !e.date.startsWith(monthKey)));
            setIncomes(prev => prev.filter(i => !i.date.startsWith(monthKey)));
        } catch (err: any) {
            alert('Erro ao apagar dados do mês: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId, loadData]);

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
            const { error } = await supabase.from('incomes').delete().eq('id', id);
            if (error) throw error;
            setIncomes(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar receita: ' + err.message);
        }
    }, [user]);

    const updatePremiumStatus = useCallback(async (status: boolean) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ is_premium: status })
                .eq('id', user.id);
            if (error) throw error;
            setIsPremium(status);
        } catch (err: any) {
            console.error('Error updating premium status:', err);
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
        selectedMonth,
        setSelectedMonth,
        householdId,
        inviteCode,
        isPremium,
        setIsPremium,
        updatePremiumStatus,
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
        deleteAllData,
        deleteMonthData,
        signOut,
        refreshData: loadData
    };
};
