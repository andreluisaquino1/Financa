import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserAccount, Expense, ExpenseType, CoupleInfo, SavingsGoal, MonthlySummary, Income, Loan, Investment, InvestmentMovement, Trip, TripExpense, TripDeposit, GoalTransaction, UserProfileDB } from '@/types';
import { scheduleReminder, cancelReminder } from '@/notificationService';
import { getMonthYearKey, formatCurrency } from '@/domain/formatters';
import { calculateSummary, isExpenseInMonth } from '@/domain/financial';
import { validateExpense, validateIncome, validateGoal } from '@/domain/validation';
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
    const [goalTransactions, setGoalTransactions] = useState<GoalTransaction[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [investmentMovements, setInvestmentMovements] = useState<InvestmentMovement[]>([]);
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

                // 2. Load expenses
                const { data: expensesData } = await expenseService.getAll(activeHouseholdId);

                if (expensesData) {
                    setExpenses(expensesData);
                }

                // 3. Load goals
                const { data: goalsData } = await goalService.getAll(activeHouseholdId);

                if (goalsData) {
                    setGoals(goalsData);
                }

                // 3.5 Load Loans
                const { data: loansData } = await loanService.getAll(activeHouseholdId);

                if (loansData) {
                    setLoans(loansData);
                }

                // 3.6 Load Investments
                const { data: investmentsData } = await investmentService.getAll(activeHouseholdId);

                if (investmentsData) {
                    setInvestments(investmentsData);
                }

                // 4. Load incomes
                const { data: incomesData } = await incomeService.getAll(activeHouseholdId);

                if (incomesData) {
                    setIncomes(incomesData);
                }

                // 4.5 Load Trips
                const { data: tripsData } = await tripService.getAll(activeHouseholdId);

                if (tripsData) {
                    setTrips(tripsData);
                }

                // 4.6 Load Goal Transactions
                const { data: transactionsData } = await goalTransactionService.getAllByHousehold(activeHouseholdId);
                if (transactionsData) {
                    setGoalTransactions(transactionsData);

                    // Trigger goals migration if needed
                    if (goalsData && goalsData.length > 0) {
                        const updatedInfo = await migrationService.migrateToTransactions(user.id, activeHouseholdId, profile.couple_info);

                        // If anything changed (like zeroing emergency reserves), update state and cloud
                        if (JSON.stringify(updatedInfo) !== JSON.stringify(profile.couple_info)) {
                            setCoupleInfo(prev => ({ ...prev, ...updatedInfo }));
                            await profileService.update(activeHouseholdId, {
                                couple_info: updatedInfo,
                                updated_at: new Date().toISOString()
                            });
                        }

                        // Reload transactions if migration happened (or just reload to be safe if transactionsData was empty)
                        if (transactionsData.length === 0) {
                            const { data: migratedData } = await goalTransactionService.getAllByHousehold(activeHouseholdId);
                            if (migratedData) setGoalTransactions(migratedData);
                        }
                    }
                }

                // 4.7 Load Investment Movements
                const { data: invMovementsData } = await investmentMovementService.getAllByHousehold(activeHouseholdId);
                if (invMovementsData) {
                    setInvestmentMovements(invMovementsData);

                    // Trigger investments migration if needed
                    if (investmentsData && investmentsData.length > 0 && invMovementsData.length === 0) {
                        await migrationService.migrateInvestments(activeHouseholdId);
                        const { data: migratedInvData } = await investmentMovementService.getAllByHousehold(activeHouseholdId);
                        if (migratedInvData) setInvestmentMovements(migratedInvData);
                    }
                }

                // 5. Load monthly config
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
        return calculateSummary(expenses, incomes, coupleInfo, selectedMonth, goals, goalTransactions);
    }, [expenses, incomes, coupleInfo, selectedMonth, goals, goalTransactions]);

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

    const addExpense = useCallback(async (exp: Omit<Expense, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateExpense(exp);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

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
            const { data, error } = await expenseService.create({
                ...exp,
                household_id: activeHouseholdId,
                user_id: user.id
            });

            if (error) throw error;

            if (data) {
                const newExp: Expense = {
                    id: data.id,
                    date: data.date,
                    type: data.type as ExpenseType,
                    category: data.category,
                    description: data.description,
                    totalValue: data.totalValue,
                    installments: data.installments,
                    paidBy: data.paidBy,
                    createdAt: data.createdAt,
                    metadata: data.metadata,
                    household_id: data.household_id,
                    splitMethod: data.splitMethod,
                    splitPercentage1: data.splitPercentage1,
                    specificValueP1: data.specificValueP1,
                    specificValueP2: data.specificValueP2,
                    reminderDay: data.reminderDay
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

        // Partial validation for updates? Or assume frontend is correct?
        // Let's validate the resulting object conceptually or just the fields if we can.
        // For simplicity, we skip full schema validation on partial updates or check specific fields.
        // Actually updates here is full Omit<Expense...>, so we can validate!

        const validation = validateExpense(updates);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        try {
            const { data, error } = await expenseService.update(id, {
                date: updates.date,
                type: updates.type,
                category: updates.category,
                description: updates.description,
                totalValue: updates.totalValue,
                installments: updates.installments,
                paidBy: updates.paidBy,
                metadata: updates.metadata,
                splitPercentage1: updates.splitPercentage1,
                specificValueP1: updates.specificValueP1,
                specificValueP2: updates.specificValueP2,
                splitMethod: updates.splitMethod || undefined,
                reminderDay: updates.reminderDay
            });

            if (error) throw error;
            if (data) {
                const updatedExp = data;
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
            const { error } = await expenseService.softDelete(id);
            if (error) throw error;
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar: ' + err.message);
        }
    }, [user]);

    const addGoal = useCallback(async (goalData: Partial<SavingsGoal>) => {
        if (!user) return;
        try {
            const { data, error } = await goalService.create({
                user_id: user.id,
                household_id: householdId || user.id,
                title: goalData.title!,
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
                is_emergency: goalData.is_emergency || false,
                split_p1_percentage: goalData.split_p1_percentage || 50,
                split_p2_percentage: goalData.split_p2_percentage || 50,
                initial_withdrawal_p1: goalData.initial_withdrawal_p1 || 0,
                initial_withdrawal_p2: goalData.initial_withdrawal_p2 || 0,
            });
            if (error) throw error;
            if (data) setGoals(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao criar meta: ' + err.message);
        }
    }, [user, householdId]);

    const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
        if (!user) return;
        try {
            const { error } = await goalService.update(id, updates);
            if (error) throw error;
            setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        } catch (err: any) {
            alert('Erro ao atualizar meta: ' + err.message);
        }
    }, [user]);

    const addGoalTransaction = useCallback(async (transaction: Omit<GoalTransaction, 'id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await goalTransactionService.create(transaction);
            if (error) throw error;
            if (data) setGoalTransactions(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao registrar transação: ' + err.message);
        }
    }, [user]);

    const deleteGoalTransaction = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await goalTransactionService.delete(id);
            if (error) throw error;
            setGoalTransactions(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar transação: ' + err.message);
        }
    }, [user]);

    const deleteGoal = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await goalService.softDelete(id);
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
            // Using services for bulk updates
            await expenseService.softDeleteAll(activeHouseholdId);
            await incomeService.softDeleteAll(activeHouseholdId);
            await goalService.softDeleteAll(activeHouseholdId);
            await loanService.softDeleteAll(activeHouseholdId);
            await investmentService.softDeleteAll(activeHouseholdId);
            await tripService.softDeleteAll(activeHouseholdId);
            await monthlyConfigService.softDeleteByHousehold(activeHouseholdId);

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
            await expenseService.softDeleteByMonth(activeHouseholdId, monthKey);
            await incomeService.softDeleteByMonth(activeHouseholdId, monthKey);

            setExpenses(prev => prev.filter(e => !e.date.startsWith(monthKey)));
            setIncomes(prev => prev.filter(i => !i.date.startsWith(monthKey)));
        } catch (err: any) {
            alert('Erro ao apagar dados do mês: ' + err.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId]);

    const markAsSettled = useCallback(async (monthKey: string) => {
        if (!user) return;
        const activeHouseholdId = householdId || user.id;

        // 1. Identify expenses to settle (Reimbursements in the current view/logic)
        // Ideally, we settle everything that contributed to the 'transferAmount' of this month
        // or potentially all open reimbursements up to this month.
        // For simplicity and safety, let's settle expenses displayed in the current month.

        const expensesToSettle = expenses.filter(exp =>
            (exp.type === 'REIMBURSEMENT' || exp.type === 'REIMBURSEMENT_FIXED') &&
            exp.reimbursementStatus !== 'settled' &&
            isExpenseInMonth(exp, monthKey)
        );

        if (expensesToSettle.length === 0) {
            alert('Não há itens de reembolso pendentes para este mês.');
            return;
        }

        if (!confirm(`Deseja marcar ${expensesToSettle.length} itens como resolvidos/pagos? Isso zerará o valor de transferência.`)) {
            return;
        }

        try {
            await Promise.all(expensesToSettle.map(exp =>
                expenseService.update(exp.id, {
                    reimbursementStatus: 'settled',
                    settledAt: new Date().toISOString()
                })
            ));

            // Update local state
            setExpenses(prev => prev.map(e => {
                if (expensesToSettle.find(target => target.id === e.id)) {
                    return { ...e, reimbursementStatus: 'settled', settledAt: new Date().toISOString() } as Expense;
                }
                return e;
            }));

            alert('Acerto realizado com sucesso! 🎉');
        } catch (err: any) {
            alert('Erro ao realizar acerto: ' + err.message);
        }
    }, [user, householdId, expenses]);

    const addIncome = useCallback(async (inc: Omit<Income, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateIncome(inc);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        const activeHouseholdId = householdId || user.id;

        try {
            const { data, error } = await incomeService.create({
                user_id: user.id,
                household_id: activeHouseholdId,
                description: inc.description,
                value: inc.value,
                category: inc.category,
                paidBy: inc.paidBy,
                date: inc.date
            });

            if (error) throw error;
            if (data) {
                const newInc = data;
                setIncomes(prev => [newInc, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao salvar renda: ' + err.message);
        }
    }, [user, householdId]);

    const updateIncome = useCallback(async (id: string, updates: Omit<Income, 'id' | 'createdAt'>) => {
        if (!user) return;

        const validation = validateIncome(updates);
        if (!validation.success) {
            alert('Erro de validação: ' + validation.error.message);
            return;
        }

        try {
            const { data, error } = await incomeService.update(id, {
                description: updates.description,
                value: updates.value,
                category: updates.category,
                paidBy: updates.paidBy,
                date: updates.date
            });

            if (error) throw error;
            if (data) {
                const updatedInc = data;
                setIncomes(prev => prev.map(i => i.id === id ? updatedInc : i));
            }
        } catch (err: any) {
            alert('Erro ao atualizar: ' + err.message);
        }
    }, [user]);

    const deleteIncome = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await incomeService.softDelete(id);
            if (error) throw error;
            setIncomes(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar receita: ' + err.message);
        }
    }, [user]);

    const addLoan = useCallback(async (loan: Omit<Loan, 'id' | 'created_at'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await loanService.create({
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
            });

            if (error) throw error;
            if (data) {
                const newLoan = data;
                setLoans(prev => [newLoan, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao adicionar empréstimo: ' + err.message);
        }
    }, [user, householdId]);

    const updateLoan = useCallback(async (id: string, updates: Partial<Loan>) => {
        if (!user) return;
        try {
            const { data, error } = await loanService.update(id, updates);

            if (error) throw error;
            if (data) {
                const updatedLoan = data;
                setLoans(prev => prev.map(l => l.id === id ? updatedLoan : l));
            }
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

    const addInvestment = useCallback(async (inv: Omit<Investment, 'id' | 'created_at' | 'user_id' | 'household_id'>) => {
        if (!user || !householdId) return;
        try {
            const { data, error } = await investmentService.create({
                user_id: user.id,
                household_id: householdId,
                name: inv.name,
                type: inv.type,
                current_value: inv.current_value,
                invested_value: inv.invested_value,
                quantity: inv.quantity || 0,
                price_per_unit: inv.price_per_unit || 0,
                owner: inv.owner
            });

            if (error) throw error;
            if (data) {
                const newInv = data;
                setInvestments(prev => [newInv, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao adicionar investimento: ' + err.message);
        }
    }, [user, householdId]);

    const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
        if (!user) return;
        try {
            const { data, error } = await investmentService.update(id, {
                ...updates,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;
            if (data) {
                const updatedInv = data;
                setInvestments(prev => prev.map(i => i.id === id ? updatedInv : i));
            }
        } catch (err: any) {
            alert('Erro ao atualizar investimento: ' + err.message);
        }
    }, [user]);

    const addInvestmentMovement = useCallback(async (movement: Omit<InvestmentMovement, 'id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await investmentMovementService.create(movement);
            if (error) throw error;
            if (data) setInvestmentMovements(prev => [data, ...prev]);
        } catch (err: any) {
            alert('Erro ao registrar movimentação de investimento: ' + err.message);
        }
    }, [user]);

    const deleteInvestmentMovement = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await investmentMovementService.delete(id);
            if (error) throw error;
            setInvestmentMovements(prev => prev.filter(m => m.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar movimentação de investimento: ' + err.message);
        }
    }, [user]);

    const deleteInvestment = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await investmentService.softDelete(id);
            if (error) throw error;
            setInvestments(prev => prev.filter(i => i.id !== id));
        } catch (err: any) {
            alert('Erro ao deletar investimento: ' + err.message);
        }
    }, [user]);

    // Restore Data (Undelete) - new functionality
    const restoreData = useCallback(async () => {
        if (!user || !householdId) return;

        setDataLoading(true);
        try {
            await expenseService.restoreAll(householdId);
            await incomeService.restoreAll(householdId);
            await goalService.restoreAll(householdId);
            await loanService.restoreAll(householdId);
            await investmentService.restoreAll(householdId);
            await tripService.restoreAll(householdId);

            await loadData();
            alert('Dados restaurados com sucesso! ♻️');
        } catch (e: any) {
            alert('Erro ao restaurar: ' + e.message);
        } finally {
            setDataLoading(false);
        }
    }, [user, householdId, loadData]);

    // Trip Functions
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
                const newTrip = data;
                setTrips(prev => [newTrip, ...prev]);
            }
        } catch (err: any) {
            alert('Erro ao criar viagem: ' + err.message);
        }
    }, [user, householdId]);

    const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
        if (!user) return;
        try {
            const { data, error } = await tripService.update(id, {
                name: updates.name,
                budget: updates.budget,
                proportionType: updates.proportionType,
                customPercentage1: updates.customPercentage1
            });

            if (error) throw error;
            if (data) {
                // We need to keep existing expenses/deposits in state
                setTrips(prev => prev.map(t => t.id === id ? {
                    ...t,
                    name: data.name,
                    budget: data.budget,
                    proportionType: data.proportionType,
                    customPercentage1: data.customPercentage1
                } : t));
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
                description: expense.description,
                value: expense.value,
                paidBy: expense.paidBy,
                date: expense.date,
                category: expense.category
            });

            if (error) throw error;
            if (data) {
                const newExp: TripExpense = {
                    id: data.id,
                    trip_id: data.trip_id,
                    description: data.description,
                    value: Number(data.value),
                    paidBy: data.paidBy,
                    date: data.date,
                    category: data.category,
                    created_at: data.created_at
                };
                setTrips(prev => prev.map(t => {
                    if (t.id === tripId) {
                        return { ...t, expenses: [newExp, ...t.expenses] };
                    }
                    return t;
                }));
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
            setTrips(prev => prev.map(t => {
                if (t.id === tripId) {
                    return { ...t, expenses: t.expenses.filter(e => e.id !== expenseId) };
                }
                return t;
            }));
        } catch (err: any) {
            alert('Erro ao deletar gasto da viagem: ' + err.message);
        }
    }, [user]);

    const addTripDeposit = useCallback(async (tripId: string, deposit: Omit<TripDeposit, 'id' | 'trip_id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { data, error } = await tripService.deposits.create({
                trip_id: tripId,
                person: deposit.person,
                value: deposit.value,
                date: deposit.date,
                description: deposit.description
            });

            if (error) throw error;
            if (data) {
                const newDep: TripDeposit = {
                    id: data.id,
                    trip_id: data.trip_id,
                    person: data.person,
                    value: Number(data.value),
                    date: data.date,
                    description: data.description,
                    created_at: data.created_at
                };
                setTrips(prev => prev.map(t => {
                    if (t.id === tripId) {
                        return { ...t, deposits: [newDep, ...t.deposits] };
                    }
                    return t;
                }));
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
            setTrips(prev => prev.map(t => {
                if (t.id === tripId) {
                    return { ...t, deposits: t.deposits.filter(d => d.id !== depositId) };
                }
                return t;
            }));
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
        goalTransactions,
        loans,
        investments,
        trips,
        summary,
        selectedMonth,
        householdId,
        inviteCode,
        setSelectedMonth,
        saveCoupleInfo,
        addExpense,
        updateExpense,
        deleteExpense,
        deleteMonthData,
        deleteAllData,
        signOut,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalTransaction,
        deleteGoalTransaction,
        addIncome,
        updateIncome,
        deleteIncome,
        addLoan,
        updateLoan,
        deleteLoan,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addTrip,
        updateTrip,
        deleteTrip,
        addTripExpense,
        deleteTripExpense,
        addTripDeposit,
        deleteTripDeposit,
        investmentMovements,
        addInvestmentMovement,
        deleteInvestmentMovement,
        restoreData,
        markAsSettled
    };
};
