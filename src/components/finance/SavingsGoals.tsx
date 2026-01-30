
import React, { useState, useMemo } from 'react';
import { SavingsGoal, CoupleInfo, MonthlySummary, GoalTransaction } from '@/types';
import { formatCurrency, formatAsBRL, parseBRL } from '@/utils';
import { calculateGoalStats } from '@/domain/goals';

interface Props {
    goals: SavingsGoal[];
    goalTransactions: GoalTransaction[];
    onAddGoal: (goal: Partial<SavingsGoal>) => void;
    onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
    onDeleteGoal: (id: string) => void;
    onAddTransaction: (transaction: Omit<GoalTransaction, 'id' | 'created_at'>) => void;
    onDeleteTransaction: (id: string) => void;
    coupleInfo: CoupleInfo;
    summary: MonthlySummary;
    onUpdateCoupleInfo: (info: CoupleInfo, updateGlobal: boolean) => void;
}

type GoalType = 'couple' | 'individual_p1' | 'individual_p2';

const SavingsGoals: React.FC<Props> = ({ goals, goalTransactions, onAddGoal, onUpdateGoal, onDeleteGoal, onAddTransaction, onDeleteTransaction, coupleInfo, summary, onUpdateCoupleInfo }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [whatIfContributions, setWhatIfContributions] = useState<Record<string, number>>({});

    // Help calculate months and required values
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Form state
    const [title, setTitle] = useState('');
    const [goalType, setGoalType] = useState<GoalType>('couple');
    const [target, setTarget] = useState('');
    const [contributionP1, setContributionP1] = useState('');
    const [contributionP2, setContributionP2] = useState('');
    const [savingsP1, setSavingsP1] = useState('');
    const [savingsP2, setSavingsP2] = useState('');
    const [interestRate, setInterestRate] = useState('10,00');
    const [monthlyExpense, setMonthlyExpense] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('💰');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [investmentLocationP1, setInvestmentLocationP1] = useState('');
    const [investmentLocationP2, setInvestmentLocationP2] = useState('');
    const [splitP1, setSplitP1] = useState(50);
    const [splitP2, setSplitP2] = useState(50);
    const [initialWithdrawP1, setInitialWithdrawP1] = useState('');
    const [initialWithdrawP2, setInitialWithdrawP2] = useState('');

    // Financial Hub Edit Mode
    const [isEditingHub, setIsEditingHub] = useState(false);
    const [hubBankP1, setHubBankP1] = useState(formatAsBRL(Math.round((coupleInfo.bankBalanceP1 || 0) * 100).toString()));
    const [hubBankP2, setHubBankP2] = useState(formatAsBRL(Math.round((coupleInfo.bankBalanceP2 || 0) * 100).toString()));
    const [hubReserveP1, setHubReserveP1] = useState(formatAsBRL(Math.round((coupleInfo.emergencyReserveP1 || 0) * 100).toString()));
    const [hubReserveP2, setHubReserveP2] = useState(formatAsBRL(Math.round((coupleInfo.emergencyReserveP2 || 0) * 100).toString()));
    const [hubSavingsP1, setHubSavingsP1] = useState(formatAsBRL(Math.round((coupleInfo.monthlySavingsP1 || 0) * 100).toString()));
    const [hubSavingsP2, setHubSavingsP2] = useState(formatAsBRL(Math.round((coupleInfo.monthlySavingsP2 || 0) * 100).toString()));

    // Calculations
    const p1Name = coupleInfo.person1Name.split(' ')[0];
    const p2Name = coupleInfo.person2Name.split(' ')[0];

    const p1Surplus = summary.person1TotalIncome - summary.person1Responsibility - summary.person1PersonalTotal;
    const p2Surplus = summary.person2TotalIncome - summary.person2Responsibility - summary.person2PersonalTotal;
    const totalSurplus = p1Surplus + p2Surplus;

    const monthlySpending = summary.totalFixed + summary.totalCommon + summary.totalEqual;
    const suggestedEmergencyFund = monthlySpending * 6;

    const emergencyGoal = useMemo(() => goals.find(g => g.is_emergency || g.title.toLowerCase().includes('reserva de emergência')), [goals]);

    const emergencyStats = useMemo(() => {
        if (!emergencyGoal) return { p1: 0, p2: 0, total: 0 };
        const stats = calculateGoalStats(emergencyGoal, goalTransactions.filter(t => t.goal_id === emergencyGoal.id));
        return { p1: stats.p1Balance, p2: stats.p2Balance, total: stats.totalBalance };
    }, [emergencyGoal, goalTransactions]);

    const currentTotalReserve = useMemo(() => {
        return emergencyStats.total;
    }, [emergencyStats]);

    const hasEmergencyGoal = useMemo(() => {
        const goalExists = goals.some(g => !g.is_completed && (g.title.toLowerCase().includes('emergência') || g.title.toLowerCase().includes('reserva')));
        // If they already have 90% or more of the recommended reserve (In Hub + Goals), we consider it "done" for suggestion purposes
        if (currentTotalReserve >= (suggestedEmergencyFund * 0.9)) return true;
        return goalExists;
    }, [goals, currentTotalReserve, suggestedEmergencyFund]);

    // Calculate total contributions from all goals
    const goalSummary = useMemo(() => {
        let p1MonthlyTotal = 0;
        let p2MonthlyTotal = 0;
        let p1SavingsTotal = 0;
        let p2SavingsTotal = 0;
        let p1Withdrawals = 0;
        let p2Withdrawals = 0;

        goals.forEach(g => {
            const stats = calculateGoalStats(g, goalTransactions.filter(t => t.goal_id === g.id));
            if (!stats.isCompleted) {
                p1MonthlyTotal += g.monthly_contribution_p1 || 0;
                p2MonthlyTotal += g.monthly_contribution_p2 || 0;
            }
            p1SavingsTotal += stats.p1Balance;
            p2SavingsTotal += stats.p2Balance;
            p1Withdrawals += g.initial_withdrawal_p1 || 0;
            p2Withdrawals += g.initial_withdrawal_p2 || 0;
        });

        const combinedSavings = p1SavingsTotal + p2SavingsTotal;
        const availableBankP1 = (coupleInfo.bankBalanceP1 || 0) - emergencyStats.p1 - p1SavingsTotal;
        const availableBankP2 = (coupleInfo.bankBalanceP2 || 0) - emergencyStats.p2 - p2SavingsTotal;

        return {
            p1MonthlyTotal,
            p2MonthlyTotal,
            p1SavingsTotal,
            p2SavingsTotal,
            p1Withdrawals,
            p2Withdrawals,
            combinedSavings,
            availableBankP1,
            availableBankP2,
            combinedMonthly: p1MonthlyTotal + p2MonthlyTotal
        };
    }, [goals, goalTransactions, coupleInfo]);

    const icons = ['💰', '🏠', '🚗', '✈️', '💍', '👶', '🎮', '🏖️', '🎓', '🛡️', '💎', '🏝️', '📱', '💻', '🏋️'];

    const resetForm = () => {
        setTitle('');
        setGoalType('couple');
        setTarget('');
        setContributionP1('');
        setContributionP2('');
        setSavingsP1('');
        setSavingsP2('');
        setInterestRate('10,00');
        setMonthlyExpense('');
        setStartDate('');
        setDeadline('');
        setIcon('💰');
        setPriority('medium');
        setInvestmentLocationP1('');
        setInvestmentLocationP2('');
        setSplitP1(50);
        setSplitP2(50);
        setInitialWithdrawP1('');
        setInitialWithdrawP2('');
    };

    // --- SMART CALCULATIONS ---
    const monthsRemaining = useMemo(() => {
        if (!deadline) return 0;
        const start = startDate ? new Date(startDate + '-01') : new Date();
        const end = new Date(deadline + (deadline.length === 7 ? '-01' : ''));

        const years = end.getFullYear() - start.getFullYear();
        const months = end.getMonth() - start.getMonth();
        const total = (years * 12) + months;

        return Math.max(1, total);
    }, [startDate, deadline]);

    const requiredMonthlyTotal = useMemo(() => {
        const totalTarget = parseBRL(target);
        if (totalTarget <= 0) return 0;

        const currentSaved = parseBRL(savingsP1) + parseBRL(savingsP2) + parseBRL(initialWithdrawP1) + parseBRL(initialWithdrawP2);
        const needed = Math.max(0, totalTarget - currentSaved);

        if (monthsRemaining <= 0) return 0;

        // Simples sem juros para a sugestão de formulário
        return needed / monthsRemaining;
    }, [target, savingsP1, savingsP2, initialWithdrawP1, initialWithdrawP2, monthsRemaining]);

    const incomeSplitP1 = useMemo(() => {
        const totalIncome = (summary.person1TotalIncome || 0) + (summary.person2TotalIncome || 0);
        if (totalIncome <= 0) return 50;
        return Math.round((summary.person1TotalIncome / totalIncome) * 100);
    }, [summary.person1TotalIncome, summary.person2TotalIncome]);

    const handleApplyIncomeSplit = () => {
        setSplitP1(incomeSplitP1);
        setSplitP2(100 - incomeSplitP1);

        if (requiredMonthlyTotal > 0) {
            const p1Part = requiredMonthlyTotal * (incomeSplitP1 / 100);
            const p2Part = requiredMonthlyTotal * ((100 - incomeSplitP1) / 100);
            setContributionP1(formatAsBRL(Math.round(p1Part * 100).toString()));
            setContributionP2(formatAsBRL(Math.round(p2Part * 100).toString()));
        }
    };

    const handleSplitChange = (p1: number) => {
        setSplitP1(p1);
        setSplitP2(100 - p1);

        // Se temos um total necessário definido pelo prazo e valor da meta, calculamos os Reais na hora
        if (requiredMonthlyTotal > 0) {
            const p1Part = requiredMonthlyTotal * (p1 / 100);
            const p2Part = requiredMonthlyTotal * ((100 - p1) / 100);
            setContributionP1(formatAsBRL(Math.round(p1Part * 100).toString()));
            setContributionP2(formatAsBRL(Math.round(p2Part * 100).toString()));
        }
    };

    const handleValueContributionChange = (who: 'p1' | 'p2', val: string) => {
        const numVal = parseBRL(val);
        const formatted = formatAsBRL(Math.round(numVal * 100).toString());

        if (who === 'p1') {
            setContributionP1(formatted);
            // Se temos um total necessário, o outro assume o resto automaticamente pela "Responsabilidade Geral"
            if (requiredMonthlyTotal > 0) {
                const p2Needed = Math.max(0, requiredMonthlyTotal - numVal);
                setContributionP2(formatAsBRL(Math.round(p2Needed * 100).toString()));

                // Atualiza os sliders de porcentagem
                const perc1 = Math.round((numVal / requiredMonthlyTotal) * 100);
                setSplitP1(perc1);
                setSplitP2(100 - perc1);
            }
        } else {
            setContributionP2(formatted);
            if (requiredMonthlyTotal > 0) {
                const p1Needed = Math.max(0, requiredMonthlyTotal - numVal);
                setContributionP1(formatAsBRL(Math.round(p1Needed * 100).toString()));

                const perc1 = Math.round((p1Needed / requiredMonthlyTotal) * 100);
                setSplitP1(perc1);
                setSplitP2(100 - perc1);
            }
        }
    };

    const handleSaveHub = () => {
        onUpdateCoupleInfo({
            ...coupleInfo,
            bankBalanceP1: parseBRL(hubBankP1),
            bankBalanceP2: parseBRL(hubBankP2),
            // Reserva de Emergência is now strictly managed via Goals/Transactions
            emergencyReserveP1: 0,
            emergencyReserveP2: 0,
            monthlySavingsP1: parseBRL(hubSavingsP1),
            monthlySavingsP2: parseBRL(hubSavingsP2)
        }, true);
        setIsEditingHub(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !target) return;



        const goalData: Partial<SavingsGoal> = {
            title,
            goal_type: goalType,
            target_value: parseBRL(target),
            monthly_contribution_p1: goalType === 'individual_p2' ? 0 : parseBRL(contributionP1),
            monthly_contribution_p2: goalType === 'individual_p1' ? 0 : parseBRL(contributionP2),
            current_savings_p1: goalType === 'individual_p2' ? 0 : parseBRL(savingsP1),
            current_savings_p2: goalType === 'individual_p1' ? 0 : parseBRL(savingsP2),
            interest_rate: parseFloat(interestRate.replace(',', '.')) || 0,
            expected_monthly_expense: parseBRL(monthlyExpense),
            start_date: startDate || undefined,
            deadline: deadline || undefined,
            icon,
            priority,
            investment_location_p1: investmentLocationP1,
            investment_location_p2: investmentLocationP2,
            current_value: 0,
            is_completed: false,
            split_p1_percentage: splitP1,
            split_p2_percentage: splitP2,
            initial_withdrawal_p1: parseBRL(initialWithdrawP1),
            initial_withdrawal_p2: parseBRL(initialWithdrawP2),
        };

        // If we have initial withdrawals, we should also increment current_savings
        // IMPORTANT: Only do this for NEW goals or if we explicitly want to add more.
        // For edits, we usually don't want to re-add what was already withdrawn.
        if (!editingId) {
            goalData.current_savings_p1 = (goalData.current_savings_p1 || 0) + (goalData.initial_withdrawal_p1 || 0);
            goalData.current_savings_p2 = (goalData.current_savings_p2 || 0) + (goalData.initial_withdrawal_p2 || 0);
        }

        if (editingId) {
            onUpdateGoal(editingId, goalData);
            setEditingId(null);
        } else {
            onAddGoal(goalData);
        }
        resetForm();
        setIsAdding(false);
    };

    const createEmergencyGoal = () => {
        // The goal target should be the recommendation MINUS what they already have set in the Hub
        const missingAmount = Math.max(0, suggestedEmergencyFund - currentTotalReserve);

        const goalData: Partial<SavingsGoal> = {
            title: 'Reserva de Emergência',
            goal_type: 'couple',
            target_value: missingAmount > 0 ? missingAmount : suggestedEmergencyFund,
            monthly_contribution_p1: Math.round(totalSurplus * 0.1 * (summary.person1TotalIncome / (summary.person1TotalIncome + summary.person2TotalIncome || 1))),
            monthly_contribution_p2: Math.round(totalSurplus * 0.1 * (summary.person2TotalIncome / (summary.person1TotalIncome + summary.person2TotalIncome || 1))),
            interest_rate: 10,
            icon: '🛡️',
            priority: 'high',
            is_completed: false,
            is_emergency: true
        };
        onAddGoal(goalData);
        alert('Meta de Reserva de Emergência criada com sucesso! 🛡️');
    };

    const loadGoalForEdit = (goal: SavingsGoal) => {
        setEditingId(goal.id);
        setTitle(goal.title);
        setGoalType(goal.goal_type || 'couple');
        setTarget(formatAsBRL(Math.round(goal.target_value * 100).toString()));
        setContributionP1(formatAsBRL(Math.round((goal.monthly_contribution_p1 || 0) * 100).toString()));
        setContributionP2(formatAsBRL(Math.round((goal.monthly_contribution_p2 || 0) * 100).toString()));
        setSavingsP1(formatAsBRL(Math.round((goal.current_savings_p1 || 0) * 100).toString()));
        setSavingsP2(formatAsBRL(Math.round((goal.current_savings_p2 || 0) * 100).toString()));
        setInterestRate((goal.interest_rate || 0).toString().replace('.', ','));
        setMonthlyExpense(formatAsBRL(Math.round((goal.expected_monthly_expense || 0) * 100).toString()));
        setStartDate(goal.start_date || '');
        setDeadline(goal.deadline || '');
        setIcon(goal.icon || '💰');
        setPriority(goal.priority || 'medium');
        setInvestmentLocationP1(goal.investment_location_p1 || '');
        setInvestmentLocationP2(goal.investment_location_p2 || '');
        setSplitP1(goal.split_p1_percentage || 50);
        setSplitP2(goal.split_p2_percentage || 50);
        // Reset initial withdraw fields when editing, as the previous withdraw is already in the current_savings balance
        setInitialWithdrawP1('');
        setInitialWithdrawP2('');
        setIsAdding(true);
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetForm();
        setIsAdding(false);
    };

    // Calculate time to reach goal
    const calculateTimeToGoal = (goal: SavingsGoal, overriddenMonthly?: number) => {
        const totalMonthly = overriddenMonthly !== undefined ? overriddenMonthly : ((goal.monthly_contribution_p1 || 0) + (goal.monthly_contribution_p2 || 0));
        const currentTotal = (goal.current_savings_p1 || 0) + (goal.current_savings_p2 || 0) + (goal.current_value || 0);
        const remaining = goal.target_value - currentTotal;

        if (remaining <= 0) return { months: 0, reached: true };
        if (totalMonthly <= 0) return { months: Infinity, reached: false };

        const monthlyRate = (goal.interest_rate || 0) / 100 / 12;

        if (monthlyRate > 0) {
            // Compound interest formula
            const months = Math.log((remaining * monthlyRate / totalMonthly) + 1) / Math.log(1 + monthlyRate);
            return { months: Math.ceil(months), reached: false };
        } else {
            return { months: Math.ceil(remaining / totalMonthly), reached: false };
        }
    };

    const calculateBottleneck = (goal: Partial<SavingsGoal>) => {
        const target = goal.target_value || 0;
        const p1Perc = goal.split_p1_percentage || 50;
        const p2Perc = 100 - p1Perc;

        const p1Target = target * (p1Perc / 100);
        const p2Target = target * (p2Perc / 100);

        const p1Remaining = Math.max(0, p1Target - (goal.current_savings_p1 || 0));
        const p2Remaining = Math.max(0, p2Target - (goal.current_savings_p2 || 0));

        const p1Months = (goal.monthly_contribution_p1 || 0) > 0 ? p1Remaining / goal.monthly_contribution_p1! : (p1Remaining > 0 ? Infinity : 0);
        const p2Months = (goal.monthly_contribution_p2 || 0) > 0 ? p2Remaining / goal.monthly_contribution_p2! : (p2Remaining > 0 ? Infinity : 0);

        const diff = Math.abs(p1Months - p2Months);
        const isBottleneck = diff > 2 && p1Months !== Infinity && p2Months !== Infinity;

        return {
            p1Months: Math.ceil(p1Months),
            p2Months: Math.ceil(p2Months),
            bottleneck: isBottleneck,
            who: p1Months > p2Months ? 'p1' : 'p2',
            diff: Math.ceil(diff),
            totalMonths: Math.ceil(Math.max(p1Months, p2Months))
        };
    };

    const getGoalTypeLabel = (type: GoalType) => {
        switch (type) {
            case 'couple': return '💑 Casal';
            case 'individual_p1': return `👤 ${p1Name}`;
            case 'individual_p2': return `👤 ${p2Name}`;
        }
    };

    const getGoalTypeColor = (type: GoalType) => {
        switch (type) {
            case 'couple': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
            case 'individual_p1': return 'bg-p1/10 text-p1';
            case 'individual_p2': return 'bg-p2/10 text-p2';
        }
    };

    const getPriorityLabel = (p: string) => {
        switch (p) {
            case 'low': return 'Baixa';
            case 'medium': return 'Média';
            case 'high': return 'Alta';
            default: return 'Média';
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'low': return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400';
            case 'medium': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
            case 'high': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    const handleCheckIn = (goal: SavingsGoal) => {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        if (goal.last_contribution_month === monthKey) {
            alert('Você já realizou o aporte deste mês para esta meta! ✨');
            return;
        }

        const p1Aporte = goal.monthly_contribution_p1 || 0;
        const p2Aporte = goal.monthly_contribution_p2 || 0;

        const isEmergency = goal.title.toLowerCase().includes('emergência') || goal.title.toLowerCase().includes('reserva');
        const confirmMsg = isEmergency
            ? `Confirmar aporte de ${formatCurrency(p1Aporte + p2Aporte)}? Este valor será movido do seu Saldo Livre para sua Reserva de Emergência.`
            : `Confirmar aporte mensal de ${formatCurrency(p1Aporte + p2Aporte)}? O valor será descontado do seu Saldo no Banco.`;

        if (confirm(confirmMsg)) {
            // Register Transactions
            if (p1Aporte > 0) {
                onAddTransaction({
                    goal_id: goal.id,
                    type: 'deposit',
                    value: p1Aporte,
                    person: 'person1',
                    date: now.toISOString().split('T')[0],
                    description: `Aporte Mensal - ${monthKey}`
                });
            }
            if (p2Aporte > 0) {
                onAddTransaction({
                    goal_id: goal.id,
                    type: 'deposit',
                    value: p2Aporte,
                    person: 'person2',
                    date: now.toISOString().split('T')[0],
                    description: `Aporte Mensal - ${monthKey}`
                });
            }

            // Update Goal last check-in
            onUpdateGoal(goal.id, {
                last_contribution_month: monthKey
            });

            // Update Hub Balance if it's a normal goal (money leaving the bank)
            // For emergency goals, the money stays in the bank asset pool but moves from "Free" to "Reserve"
            if (!isEmergency) {
                const updatedInfo = { ...coupleInfo };
                updatedInfo.bankBalanceP1 = (updatedInfo.bankBalanceP1 || 0) - p1Aporte;
                updatedInfo.bankBalanceP2 = (updatedInfo.bankBalanceP2 || 0) - p2Aporte;
                onUpdateCoupleInfo(updatedInfo, true);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header com Status e Botão principal */}
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden`}>
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Planejador de Metas
                        </h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                        Defina objetivos, gerencie suas economias e acompanhe a evolução do seu patrimônio
                    </p>
                </div>

                <div className="flex items-center gap-6 w-full lg:w-auto z-10">
                    <div className="hidden sm:flex flex-col items-end pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Patrimônio Alocado</span>
                        <span className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">{formatCurrency(goalSummary.combinedSavings)}</span>
                    </div>

                    <button
                        onClick={() => {
                            if (isAdding) cancelEdit();
                            else setIsAdding(true);
                        }}
                        className={`flex-1 lg:flex-none ${isAdding ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-slate-900 dark:bg-brand text-white shadow-brand/30 shadow-2xl'} hover:brightness-110 px-10 py-5 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        {isAdding ? 'Cancelar' : 'Nova Meta'}
                    </button>
                </div>

                {/* Efeitos visuais de fundo */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
            </div>

            {/* Centro Financeiro - Bank & Reserves Hub */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-brand/20">🏦</div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Centro Financeiro</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão de Saldo e Reservas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => isEditingHub ? handleSaveHub() : setIsEditingHub(true)}
                        className={`px-8 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${isEditingHub ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 active:scale-95'}`}
                    >
                        {isEditingHub ? '✅ Salvar' : '✏️ Ajustar Saldos'}
                    </button>
                </div>

                {/* Visual context info */}
                {!isEditingHub && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Disponível</span>
                            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{formatCurrency((coupleInfo.bankBalanceP1 || 0) + (coupleInfo.bankBalanceP2 || 0))}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Reservas</span>
                            <span className="text-lg font-black text-emerald-500">{formatCurrency(emergencyStats.total)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Investido em Metas</span>
                            <span className="text-lg font-black text-brand">{formatCurrency(goalSummary.combinedSavings - emergencyStats.total)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Geral</span>
                            <span className="text-lg font-black text-slate-900 dark:text-slate-100">{formatCurrency((coupleInfo.bankBalanceP1 || 0) + (coupleInfo.bankBalanceP2 || 0))}</span>
                        </div>
                    </div>
                )}

                {!isEditingHub ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* P1 Column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-p1 shadow-sm"></div>
                                    <span className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-tighter">{p1Name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total no Banco</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(coupleInfo.bankBalanceP1 || 0)}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-xl border border-transparent hover:border-emerald-200 transition-all cursor-help" title="Espelhado da Meta Reserva de Emergência">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1 flex items-center gap-1">
                                            Reserva Emerg. <span className="text-[8px] opacity-60">(Meta)</span>
                                        </p>
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(emergencyStats.p1)}</p>
                                    </div>
                                    <div className="bg-brand/5 dark:bg-brand/5 transition-all">
                                        <p className="text-[9px] font-black text-brand uppercase mb-1">Outras Metas</p>
                                        <p className="text-sm font-black text-brand">{formatCurrency(goalSummary.p1SavingsTotal - emergencyStats.p1)}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-transparent border-dashed">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sobra Mensal</p>
                                        <p className={`text-sm font-black ${p1Surplus - goalSummary.p1MonthlyTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {formatCurrency(p1Surplus - goalSummary.p1MonthlyTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-white/5 pt-3">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Disponível p/ Metas</p>
                                        <p className="text-xs font-black text-brand">{formatCurrency(goalSummary.availableBankP1)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Aportes Planejados</p>
                                        <div className="flex flex-col">
                                            <p className={`text-xs font-black ${goalSummary.p1MonthlyTotal > (coupleInfo.monthlySavingsP1 || p1Surplus) ? 'text-red-500' : 'text-p1'}`}>
                                                {formatCurrency(goalSummary.p1MonthlyTotal)}
                                            </p>
                                            <p className="text-[7px] text-slate-400 font-bold leading-none uppercase">de {formatCurrency(coupleInfo.monthlySavingsP1 || p1Surplus)}/mês</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* P2 Column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-p2 shadow-sm"></div>
                                    <span className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-tighter">{p2Name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total no Banco</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(coupleInfo.bankBalanceP2 || 0)}</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-xl border border-transparent hover:border-emerald-200 transition-all cursor-help" title="Espelhado da Meta Reserva de Emergência">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1 flex items-center gap-1">
                                            Reserva Emerg. <span className="text-[8px] opacity-60">(Meta)</span>
                                        </p>
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(emergencyStats.p2)}</p>
                                    </div>
                                    <div className="bg-brand/5 dark:bg-brand/5 transition-all">
                                        <p className="text-[9px] font-black text-brand uppercase mb-1">Outras Metas</p>
                                        <p className="text-sm font-black text-brand">{formatCurrency(goalSummary.p2SavingsTotal - emergencyStats.p2)}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-transparent border-dashed">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sobra Mensal</p>
                                        <p className={`text-sm font-black ${p2Surplus - goalSummary.p2MonthlyTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {formatCurrency(p2Surplus - goalSummary.p2MonthlyTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-white/5 pt-3">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Disponível p/ Metas</p>
                                        <p className="text-xs font-black text-brand">{formatCurrency(goalSummary.availableBankP2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Aportes Planejados</p>
                                        <div className="flex flex-col">
                                            <p className={`text-xs font-black ${goalSummary.p2MonthlyTotal > (coupleInfo.monthlySavingsP2 || p2Surplus) ? 'text-red-500' : 'text-p2'}`}>
                                                {formatCurrency(goalSummary.p2MonthlyTotal)}
                                            </p>
                                            <p className="text-[7px] text-slate-400 font-bold leading-none uppercase">de {formatCurrency(coupleInfo.monthlySavingsP2 || p2Surplus)}/mês</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Combined Row */}
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="bg-slate-900 dark:bg-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">👫</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo do Casal</p>
                                        <p className="text-xl font-black text-white tracking-tighter">Patrimônio em Metas: {formatCurrency(goalSummary.combinedSavings)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 pr-2">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Investido/mês</p>
                                        <p className="text-sm font-black text-white">{formatCurrency(goalSummary.combinedMonthly)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Sobra do Casal</p>
                                        <p className={`text-sm font-black ${totalSurplus - goalSummary.combinedMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {formatCurrency(totalSurplus - goalSummary.combinedMonthly)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {/* Edit P1 */}
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-p1/20">
                            <p className="font-black text-p1 uppercase text-[10px] tracking-widest">{p1Name}</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Total no Banco hoje</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubBankP1} onChange={e => setHubBankP1(formatAsBRL(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-brand"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Reserva Emerg. (Mirrored)</label>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800/50 px-3 py-2 rounded-xl font-bold text-sm text-slate-400 border border-transparent cursor-not-allowed">
                                        {formatCurrency(emergencyStats.p1)}
                                    </div>
                                    <p className="text-[8px] text-brand font-bold mt-1 px-1">Edite esta valor na aba de Metas</p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Deseja investir/mês</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubSavingsP1} onChange={e => setHubSavingsP1(formatAsBRL(e.target.value))}
                                        placeholder={formatCurrency(p1Surplus)}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-brand"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Edit P2 */}
                        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-p2/20">
                            <p className="font-black text-p2 uppercase text-[10px] tracking-widest">{p2Name}</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Total no Banco hoje</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubBankP2} onChange={e => setHubBankP2(formatAsBRL(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-p2"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Reserva Emerg. (Mirrored)</label>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800/50 px-3 py-2 rounded-xl font-bold text-sm text-slate-400 border border-transparent cursor-not-allowed">
                                        {formatCurrency(emergencyStats.p2)}
                                    </div>
                                    <p className="text-[8px] text-brand font-bold mt-1 px-1">Edite esta valor na aba de Metas</p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Deseja investir/mês</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubSavingsP2} onChange={e => setHubSavingsP2(formatAsBRL(e.target.value))}
                                        placeholder={formatCurrency(p2Surplus)}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-p2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Emergency Fund Suggestion */}
            {!hasEmergencyGoal && (
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-lg shadow-lg">🛡️</div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            Falta uma Reserva de Emergência! Sugestão: <span className="font-black">{formatCurrency(suggestedEmergencyFund)}</span> (6 meses).
                        </p>
                    </div>
                    <button onClick={createEmergencyGoal} className="px-4 py-2 bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95">Criar agora</button>
                </div>
            )}

            {/* Goals Active / Progress Summary */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase tracking-widest text-xs opacity-50">Minhas Metas Ativas</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-brand">{goals.filter(g => !g.is_completed).length} Metas</span>
                </div>
            </div>
            <div className="bg-gradient-to-br from-brand to-purple-600 p-5 rounded-2xl text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">🎯</div>
                    <div>
                        <p className="font-black">Metas Ativas</p>
                        <p className="text-[9px] font-bold text-white/60 uppercase">Progresso Geral</p>
                    </div>
                </div>
                <div className="text-center py-2">
                    <p className="text-4xl font-black">{goals.filter(g => !g.is_completed).length}</p>
                    <p className="text-xs text-white/60 mt-1">
                        {goals.filter(g => g.is_completed).length} concluídas
                    </p>
                </div>
            </div>

            {/* Add/Edit Goal Form */}
            {
                isAdding && (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-lg space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${editingId ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-brand/10'}`}>{icon}</div>
                            <div className="flex-1">
                                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">
                                    {editingId ? '✏️ Editando Meta' : 'Nova Meta Financeira'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {editingId ? 'Atualize os detalhes da sua meta' : 'Defina os detalhes do seu objetivo'}
                                </p>
                            </div>
                            {editingId && (
                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-full">
                                    Modo Edição
                                </span>
                            )}
                        </div>

                        {/* Goal Type Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">De quem é essa meta?</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['couple', 'individual_p1', 'individual_p2'] as GoalType[]).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setGoalType(type)}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all ${goalType === type
                                            ? 'bg-brand text-white shadow-lg'
                                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {getGoalTypeLabel(type)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade (Termômetro)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['low', 'medium', 'high'] as const).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${priority === p
                                            ? p === 'high' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : p === 'medium' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-600 text-white shadow-lg'
                                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {p === 'high' ? '🔥' : p === 'medium' ? '⚡' : '❄️'} {getPriorityLabel(p)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Basic Info */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Meta</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ex: Casa Própria"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold dark:text-slate-100"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={target}
                                    onChange={e => setTarget(formatAsBRL(e.target.value))}
                                    placeholder="R$ 0,00"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold text-brand"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rentabilidade (% a.a)</label>
                                <input
                                    type="text"
                                    value={interestRate}
                                    onChange={e => setInterestRate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold dark:text-slate-100"
                                />
                            </div>
                        </div>

                        {/* Contributions Section */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aportes Mensais</p>
                                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                                    <button
                                        type="button" onClick={() => { setSplitP1(50); setSplitP2(50); }}
                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${splitP1 === 50 ? 'bg-brand text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        50/50
                                    </button>
                                    <button
                                        type="button" onClick={() => {
                                            const p1perc = Math.round((coupleInfo.salary1 / (coupleInfo.salary1 + coupleInfo.salary2 || 1)) * 100);
                                            setSplitP1(p1perc); setSplitP2(100 - p1perc);
                                        }}
                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${splitP1 !== 50 && splitP1 !== 100 && splitP1 !== 0 ? 'bg-brand text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        Prop.
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between px-1">
                                        <span className="text-[9px] font-bold text-p1 uppercase">{p1Name} Split</span>
                                        <span className="text-[9px] font-black text-p1">{splitP1}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100" value={splitP1}
                                        onChange={e => handleSplitChange(Number(e.target.value))}
                                        className="w-full accent-p1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between px-1">
                                        <span className="text-[9px] font-bold text-p2 uppercase">{p2Name} Split</span>
                                        <span className="text-[9px] font-black text-p2">{splitP2}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100" value={splitP2}
                                        onChange={e => handleSplitChange(100 - Number(e.target.value))}
                                        className="w-full accent-p2"
                                    />
                                </div>
                            </div>

                            {requiredMonthlyTotal > 0 && (
                                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-black text-brand uppercase tracking-widest">Calculadora de Prazo</p>
                                        <span className="text-[10px] font-bold text-slate-500">{monthsRemaining} meses restantes</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-tight">
                                        Para atingir <span className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(parseBRL(target))}</span> no prazo definido, vocês precisam investir <span className="font-extrabold text-brand">{formatCurrency(requiredMonthlyTotal)}/mês</span> no total.
                                    </p>

                                    {(() => {
                                        const b = calculateBottleneck({
                                            target_value: parseBRL(target),
                                            split_p1_percentage: splitP1,
                                            current_savings_p1: parseBRL(savingsP1) + parseBRL(initialWithdrawP1),
                                            current_savings_p2: parseBRL(savingsP2) + parseBRL(initialWithdrawP2),
                                            monthly_contribution_p1: parseBRL(contributionP1),
                                            monthly_contribution_p2: parseBRL(contributionP2)
                                        });
                                        if (b.bottleneck && goalType === 'couple') {
                                            return (
                                                <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                                                    <span className="text-sm">⚠️</span>
                                                    <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-snug">
                                                        Atenção: {b.who === 'p1' ? p1Name : p2Name} é o gargalo! Vai demorar <span className="text-amber-600 font-extrabold">{b.diff} meses a mais</span> que o parceiro para bater a sua parte da meta.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <button
                                        type="button"
                                        onClick={handleApplyIncomeSplit}
                                        className="w-full py-2 bg-brand/10 hover:bg-brand text-brand dark:text-brand hover:text-white border border-brand/20 rounded-lg text-[10px] font-black uppercase transition-all"
                                    >
                                        ✨ Aplicar divisão sugerida pela renda ({incomeSplitP1}% / {100 - incomeSplitP1}%)
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                                {goalType !== 'individual_p2' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-p1">{p1Name} - Investir/mês</label>
                                            {requiredMonthlyTotal > 0 && (
                                                <span className="text-[8px] font-black text-slate-400 uppercase">Sugestão: {formatCurrency(requiredMonthlyTotal * (splitP1 / 100))}</span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={contributionP1}
                                            onChange={e => handleValueContributionChange('p1', e.target.value)}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-p1/20 focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                                {goalType !== 'individual_p1' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-p2">{p2Name} - Investir/mês</label>
                                            {requiredMonthlyTotal > 0 && (
                                                <span className="text-[8px] font-black text-slate-400 uppercase">Sugestão: {formatCurrency(requiredMonthlyTotal * (splitP2 / 100))}</span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={contributionP2}
                                            onChange={e => handleValueContributionChange('p2', e.target.value)}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-p2/20 focus:border-p2 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Withdrawal from Bank Section */}
                        <div className="bg-brand/5 dark:bg-brand/10 p-4 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏦</span>
                                <p className="text-[10px] font-black text-brand uppercase tracking-widest">Alocar do Saldo em Banco (Disponível)</p>
                            </div>
                            <p className="text-[10px] text-brand/60 leading-tight">Escolha quanto do seu dinheiro parado no banco será usado agora para iniciar esta meta.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goalType !== 'individual_p2' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <label className="font-bold text-slate-500">{p1Name} Retira</label>
                                            <span className="font-medium">Disp: {formatCurrency(goalSummary.availableBankP1)}</span>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={initialWithdrawP1}
                                            onChange={e => setInitialWithdrawP1(formatAsBRL(e.target.value))}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-brand/10 dark:border-brand/20 focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                                {goalType !== 'individual_p1' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <label className="font-bold text-slate-500">{p2Name} Retira</label>
                                            <span className="font-medium">Disp: {formatCurrency(goalSummary.availableBankP2)}</span>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={initialWithdrawP2}
                                            onChange={e => setInitialWithdrawP2(formatAsBRL(e.target.value))}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-brand/10 dark:border-brand/20 focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Savings and Investment Locations */}
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl space-y-4">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">💰 Poupança e Investimento</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goalType !== 'individual_p2' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{p1Name} - Saldo Atual / Inicial</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={savingsP1}
                                                onChange={e => setSavingsP1(formatAsBRL(e.target.value))}
                                                placeholder="R$ 0,00"
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Onde {p1Name} investe?</label>
                                            <input
                                                type="text"
                                                value={investmentLocationP1}
                                                onChange={e => setInvestmentLocationP1(e.target.value)}
                                                placeholder="Ex: NuBank, Corretora..."
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-500/10 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-all font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                                {goalType !== 'individual_p1' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{p2Name} - Saldo Atual / Inicial</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={savingsP2}
                                                onChange={e => setSavingsP2(formatAsBRL(e.target.value))}
                                                placeholder="R$ 0,00"
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Onde {p2Name} investe?</label>
                                            <input
                                                type="text"
                                                value={investmentLocationP2}
                                                onChange={e => setInvestmentLocationP2(e.target.value)}
                                                placeholder="Ex: CDB, Caixinha..."
                                                className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-500/10 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-all font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Optional: Monthly Expense */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">📊 Gasto Mensal Previsto</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={monthlyExpense}
                                    onChange={e => setMonthlyExpense(formatAsBRL(e.target.value))}
                                    placeholder="R$ 0,00 (opcional)"
                                    className="w-full bg-orange-50 dark:bg-orange-500/10 border-2 border-orange-200 dark:border-orange-500/30 focus:border-orange-500 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Início (Opcional)</label>
                                <input
                                    type="month"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Final</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand rounded-xl px-4 py-3 outline-none transition-all font-bold text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Icons */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ícone</label>
                            <div className="flex flex-wrap gap-2">
                                {icons.map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setIcon(i)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${icon === i ? 'bg-brand text-white shadow-lg scale-110' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className={`w-full font-black py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all active:scale-[0.98] ${editingId ? 'bg-amber-500 text-white' : 'bg-slate-900 dark:bg-brand text-white'}`}>
                            {editingId ? '💾 Salvar Alterações' : 'Criar Meta Financeira'}
                        </button>
                    </form>
                )
            }

            {/* Goals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {goals.filter(g => !g.is_completed).map(goal => {
                    const goalTransactionsForGoal = goalTransactions.filter(t => t.goal_id === goal.id);
                    const stats = calculateGoalStats(goal, goalTransactionsForGoal);

                    const { totalBalance, p1Balance, p2Balance, progress } = stats;

                    const extraP1 = whatIfContributions[`${goal.id}_p1`] || 0;
                    const extraP2 = whatIfContributions[`${goal.id}_p2`] || 0;

                    const originalContribution = (goal.monthly_contribution_p1 || 0) + (goal.monthly_contribution_p2 || 0);
                    const whatIfContribution = originalContribution + extraP1 + extraP2;

                    const timeToGoal = calculateTimeToGoal(goal);
                    const whatIfTimeToGoal = calculateTimeToGoal(goal, whatIfContribution);

                    return (
                        <div key={goal.id} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all group/card">
                            {/* Header */}
                            <div className="p-5 pb-4 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-2xl">
                                        {goal.icon || '💰'}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-slate-100">{goal.title}</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getGoalTypeColor(goal.goal_type || 'couple')}`}>
                                                {getGoalTypeLabel(goal.goal_type || 'couple')}
                                            </span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getPriorityColor(goal.priority || 'medium')}`}>
                                                {goal.priority === 'high' ? '🔥 Alta' : goal.priority === 'low' ? '❄️ Baixa' : '⚡ Média'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            if (confirm('Marcar esta meta como concluída?')) {
                                                onUpdateGoal(goal.id, { is_completed: true });
                                            }
                                        }}
                                        className="text-slate-300 hover:text-emerald-500 transition-all p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90"
                                        title="Concluir meta"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => loadGoalForEdit(goal)}
                                        className="text-slate-300 hover:text-amber-500 transition-all p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90"
                                        title="Editar meta"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Tem certeza que deseja excluir esta meta?')) {
                                                onDeleteGoal(goal.id);
                                            }
                                        }}
                                        className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90"
                                        title="Excluir meta"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Milestone Badge */}
                            <div className="px-5 mb-2">
                                {progress >= 100 ? (
                                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase py-1 px-3 rounded-lg">
                                        🏆 Meta Alcançada! Incrível!
                                    </div>
                                ) : progress >= 75 ? (
                                    <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase py-1 px-3 rounded-lg">
                                        ⭐ Quase lá! 75% concluído!
                                    </div>
                                ) : progress >= 50 ? (
                                    <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase py-1 px-3 rounded-lg">
                                        ⚡ Metade do caminho conquistada!
                                    </div>
                                ) : progress >= 25 ? (
                                    <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase py-1 px-3 rounded-lg">
                                        🎯 Primeiros passos firmes! 25% +
                                    </div>
                                ) : null}
                            </div>

                            {/* Progress */}
                            <div className="px-5 pb-4">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="font-bold text-slate-500">{progress.toFixed(1)}% completo</span>
                                    <span className="font-black text-brand">{formatCurrency(goal.target_value)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Financial Summary & Quick Add */}
                            <div className="px-5 pb-4 space-y-3">
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                                    <div className="grid grid-cols-2 gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Total</p>
                                            <p className="text-sm font-black text-emerald-500">{formatCurrency(totalBalance)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plano Mensal</p>
                                            <p className="text-sm font-black text-brand">{formatCurrency(originalContribution)}</p>
                                            {(stats.p1LastDeposit + stats.p2LastDeposit) > 0 && (
                                                <p className="text-[9px] font-bold text-emerald-500 mt-1">
                                                    Já depositado: {formatCurrency(stats.p1LastDeposit + stats.p2LastDeposit)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Row for P1 */}
                                        {(goal.goal_type === 'couple' || goal.goal_type === 'individual_p1' || !goal.goal_type) && (
                                            <div className="flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-p1"></div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400">{p1Name}</span>
                                                        <span className="text-[9px] text-slate-400 italic leading-none">{goal.investment_location_p1 || 'Sem local'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="block font-black text-slate-900 dark:text-slate-100">{formatCurrency(p1Balance)}</span>
                                                        <span className="text-[8px] text-p1 font-bold">Aporte: {formatCurrency(goal.monthly_contribution_p1 || 0)}/mês</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const val = prompt(`Adicionar saldo extra para ${p1Name}:`);
                                                            if (val) {
                                                                const num = parseBRL(val);
                                                                if (num > 0) onAddTransaction({
                                                                    goal_id: goal.id,
                                                                    type: 'deposit',
                                                                    value: num,
                                                                    person: 'person1',
                                                                    date: new Date().toISOString().split('T')[0],
                                                                    description: 'Aporte Extra'
                                                                });
                                                            }
                                                        }}
                                                        className="w-6 h-6 bg-p1/10 text-p1 rounded-lg flex items-center justify-center hover:bg-p1 hover:text-white transition-all font-black text-xs"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row for P2 */}
                                        {(goal.goal_type === 'couple' || goal.goal_type === 'individual_p2' || !goal.goal_type) && (
                                            <div className="flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-p2"></div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-600 dark:text-slate-400">{p2Name}</span>
                                                        <span className="text-[9px] text-slate-400 italic leading-none">{goal.investment_location_p2 || 'Sem local'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="block font-black text-slate-900 dark:text-slate-100">{formatCurrency(p2Balance)}</span>
                                                        <span className="text-[8px] text-p2 font-bold">Aporte: {formatCurrency(goal.monthly_contribution_p2 || 0)}/mês</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const val = prompt(`Adicionar saldo extra para ${p2Name}:`);
                                                            if (val) {
                                                                const num = parseBRL(val);
                                                                if (num > 0) onAddTransaction({
                                                                    goal_id: goal.id,
                                                                    type: 'deposit',
                                                                    value: num,
                                                                    person: 'person2',
                                                                    date: new Date().toISOString().split('T')[0],
                                                                    description: 'Aporte Extra'
                                                                });
                                                            }
                                                        }}
                                                        className="w-6 h-6 bg-p2/10 text-p2 rounded-lg flex items-center justify-center hover:bg-p2 hover:text-white transition-all font-black text-xs"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row for Legacy/Extra Adjustment if exists */}
                                        {(goal.current_value || 0) !== 0 && (
                                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-white/5 opacity-60">
                                                <span className="font-bold text-slate-500">Ajuste Manual:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black">{formatCurrency(goal.current_value || 0)}</span>
                                                    <button
                                                        onClick={() => onUpdateGoal(goal.id, { current_value: 0 })}
                                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottleneck Warning in Card */}
                                {(() => {
                                    const b = calculateBottleneck(goal);
                                    if (b.bottleneck && goal.goal_type === 'couple') {
                                        return (
                                            <div className="mx-5 mb-4 p-2.5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl flex items-start gap-2">
                                                <div className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">⚠️</div>
                                                <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight leading-normal">
                                                    Equilíbrio: {b.who === 'p1' ? p1Name : p2Name} é o gargalo. <br />
                                                    Vai demorar <span className="text-amber-700 dark:text-amber-300">+{b.diff} meses</span> para concluir sua parte.
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>


                            {/* What-If Simulator (Quick Toggle) */}
                            <div className="px-5 pb-4">
                                <details className="bg-blue-50 dark:bg-blue-500/5 rounded-xl transition-all">
                                    <summary className="p-2 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-500/10 list-none flex items-center gap-2">
                                        <span>🔍 Simulador "What If"</span>
                                        {(extraP1 + extraP2 > 0) && <span className="bg-blue-500 text-white px-1.5 rounded-full text-[8px]">Ativo</span>}
                                    </summary>
                                    <div className="p-3 space-y-4 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">E se você aumentasse o aporte?</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {goal.goal_type !== 'individual_p2' && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-p1">{p1Name} +{formatCurrency(extraP1)}</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="2000" step="50"
                                                        value={extraP1}
                                                        onChange={(e) => setWhatIfContributions(prev => ({ ...prev, [`${goal.id}_p1`]: parseInt(e.target.value) }))}
                                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-p1"
                                                    />
                                                </div>
                                            )}
                                            {goal.goal_type !== 'individual_p1' && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-bold text-p2">{p2Name} +{formatCurrency(extraP2)}</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="2000" step="50"
                                                        value={extraP2}
                                                        onChange={(e) => setWhatIfContributions(prev => ({ ...prev, [`${goal.id}_p2`]: parseInt(e.target.value) }))}
                                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-p2"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {(extraP1 + extraP2 > 0) && (
                                            <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-500/20 p-2 rounded-lg">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-500">Novo tempo:</span>
                                                    <span className="font-black text-blue-500">
                                                        {whatIfTimeToGoal.months} meses
                                                        <span className="text-emerald-500 ml-1">
                                                            (-{timeToGoal.months - whatIfTimeToGoal.months} meses!)
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </div>

                            {/* Time Estimate and Check-in */}
                            <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 flex items-center justify-between bg-slate-900 dark:bg-slate-700 text-white p-3 rounded-xl border border-white/5 shadow-inner">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Previsão Real:</span>
                                    <span className="font-black text-sm">
                                        {(() => {
                                            const b = calculateBottleneck(goal);
                                            return b.totalMonths === Infinity ? '♾️' : `${b.totalMonths} meses`;
                                        })()}
                                    </span>
                                </div>

                                {!goal.is_completed && (
                                    <button
                                        onClick={() => handleCheckIn(goal)}
                                        disabled={goal.last_contribution_month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                                        className={`flex-[2] p-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${goal.last_contribution_month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-not-allowed'
                                            : 'bg-emerald-500 text-white hover:brightness-110 shadow-lg shadow-emerald-500/20'
                                            }`}
                                    >
                                        {goal.last_contribution_month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? '✓ Mês Pago' : '💰 Pagar Aporte'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {goals.filter(g => !g.is_completed).length === 0 && !isAdding && (
                    <div className="col-span-full py-16 bg-white dark:bg-slate-800/40 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl opacity-50">🎯</div>
                        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">Nenhuma meta planejada ainda</p>
                    </div>
                )}
            </div>

            {/* Completed Goals */}
            {
                goals.filter(g => g.is_completed).length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-slate-400 dark:text-slate-600">✅ Metas Concluídas</h3>
                            <button
                                onClick={() => {
                                    if (confirm('Excluir todas as metas concluídas? Esta ação não pode ser desfeita.')) {
                                        goals.filter(g => g.is_completed).forEach(g => onDeleteGoal(g.id));
                                    }
                                }}
                                className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Limpar Histórico
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {goals.filter(g => g.is_completed).map(goal => (
                                <div key={goal.id} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl flex items-center justify-between group/completed opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{goal.icon || '💰'}</span>
                                        <div>
                                            <p className="font-bold text-slate-600 dark:text-slate-400 line-through">{goal.title}</p>
                                            <p className="text-xs text-slate-400">{formatCurrency(goal.target_value)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Excluir esta meta concluída?')) {
                                                onDeleteGoal(goal.id);
                                            }
                                        }}
                                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/completed:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                        title="Excluir meta concluída"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
};

export default SavingsGoals;
