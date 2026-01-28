
import React, { useState, useMemo } from 'react';
import { SavingsGoal, CoupleInfo, MonthlySummary } from '../types';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface Props {
    goals: SavingsGoal[];
    onAddGoal: (goal: Partial<SavingsGoal>) => void;
    onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
    onDeleteGoal: (id: string) => void;
    isPremium?: boolean;
    coupleInfo: CoupleInfo;
    summary: MonthlySummary;
    onUpdateCoupleInfo: (info: CoupleInfo, updateGlobal: boolean) => void;
}

type GoalType = 'couple' | 'individual_p1' | 'individual_p2';

const SavingsGoals: React.FC<Props> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, isPremium, coupleInfo, summary, onUpdateCoupleInfo }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [whatIfContributions, setWhatIfContributions] = useState<Record<string, number>>({});

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

    const currentTotalReserve = (coupleInfo.emergencyReserveP1 || 0) + (coupleInfo.emergencyReserveP2 || 0);
    const hasEmergencyGoal = useMemo(() => {
        const goalExists = goals.some(g => g.title.toLowerCase().includes('emergência') || g.title.toLowerCase().includes('reserva'));
        // If they already have 90% or more of the recommended reserve in the Hub, we consider it "done" for suggestion purposes
        if (currentTotalReserve >= (suggestedEmergencyFund * 0.9)) return true;
        return goalExists;
    }, [goals, currentTotalReserve, suggestedEmergencyFund]);

    // Calculate total contributions from all goals
    const goalSummary = useMemo(() => {
        let p1Total = 0;
        let p2Total = 0;
        let p1Savings = 0;
        let p2Savings = 0;
        let p1Withdrawals = 0;
        let p2Withdrawals = 0;

        goals.forEach(g => {
            if (!g.is_completed) {
                p1Total += g.monthly_contribution_p1 || 0;
                p2Total += g.monthly_contribution_p2 || 0;
                p1Savings += g.current_savings_p1 || 0;
                p2Savings += g.current_savings_p2 || 0;
                p1Withdrawals += g.initial_withdrawal_p1 || 0;
                p2Withdrawals += g.initial_withdrawal_p2 || 0;
            }
        });

        // Available Bank Balance (Total Bank - Emergency Reserve - Already Allocated for current goals)
        const availableBankP1 = (coupleInfo.bankBalanceP1 || 0) - (coupleInfo.emergencyReserveP1 || 0) - p1Withdrawals;
        const availableBankP2 = (coupleInfo.bankBalanceP2 || 0) - (coupleInfo.emergencyReserveP2 || 0) - p2Withdrawals;

        return {
            p1MonthlyTotal: p1Total,
            p2MonthlyTotal: p2Total,
            p1SavingsTotal: p1Savings,
            p2SavingsTotal: p2Savings,
            p1Withdrawals,
            p2Withdrawals,
            combinedMonthly: p1Total + p2Total,
            combinedSavings: p1Savings + p2Savings,
            availableBankP1,
            availableBankP2
        };
    }, [goals, coupleInfo]);

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

    const handleSaveHub = () => {
        onUpdateCoupleInfo({
            ...coupleInfo,
            bankBalanceP1: parseBRL(hubBankP1),
            bankBalanceP2: parseBRL(hubBankP2),
            emergencyReserveP1: parseBRL(hubReserveP1),
            emergencyReserveP2: parseBRL(hubReserveP2),
            monthlySavingsP1: parseBRL(hubSavingsP1),
            monthlySavingsP2: parseBRL(hubSavingsP2)
        }, true);
        setIsEditingHub(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !target) return;

        if (!isPremium && goals.length >= 2) {
            alert('Você atingiu o limite de 2 metas no plano gratuito. Seja PRO para planejar todos os seus sonhos!');
            return;
        }

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
        goalData.current_savings_p1 = (goalData.current_savings_p1 || 0) + (goalData.initial_withdrawal_p1 || 0);
        goalData.current_savings_p2 = (goalData.current_savings_p2 || 0) + (goalData.initial_withdrawal_p2 || 0);

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
            is_completed: false
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
        setInitialWithdrawP1(formatAsBRL(Math.round((goal.initial_withdrawal_p1 || 0) * 100).toString()));
        setInitialWithdrawP2(formatAsBRL(Math.round((goal.initial_withdrawal_p2 || 0) * 100).toString()));
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

        if (confirm(`Confirmar aporte mensal de ${formatCurrency(p1Aporte + p2Aporte)}? O valor será descontado do seu Saldo no Banco.`)) {
            // Update Goal
            onUpdateGoal(goal.id, {
                current_savings_p1: (goal.current_savings_p1 || 0) + p1Aporte,
                current_savings_p2: (goal.current_savings_p2 || 0) + p2Aporte,
                last_contribution_month: monthKey
            });

            // Update Hub Balance
            onUpdateCoupleInfo({
                ...coupleInfo,
                bankBalanceP1: (coupleInfo.bankBalanceP1 || 0) - p1Aporte,
                bankBalanceP2: (coupleInfo.bankBalanceP2 || 0) - p2Aporte
            }, true);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-100">Planejador Financeiro</h2>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Metas individuais e do casal</p>
                </div>
                <button
                    onClick={() => {
                        if (isAdding) {
                            cancelEdit();
                        } else {
                            setIsAdding(true);
                        }
                    }}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${isAdding ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-p1 text-white shadow-p1/20'}`}
                >
                    {isAdding ? 'Cancelar' : '+ Nova Meta'}
                </button>
            </div>

            {/* Centro Financeiro - Bank & Reserves Hub */}
            <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">🏦</div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tighter">Centro Financeiro</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Gestão de Saldo e Reservas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => isEditingHub ? handleSaveHub() : setIsEditingHub(true)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${isEditingHub ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                    >
                        {isEditingHub ? '✅ Salvar' : '✏️ Ajustar Saldos'}
                    </button>
                </div>

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
                                    <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-xl border border-transparent hover:border-emerald-200 transition-all">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Reserva Emerg.</p>
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(coupleInfo.emergencyReserveP1 || 0)}</p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-500/5 p-3 rounded-xl border border-transparent hover:border-indigo-200 transition-all">
                                        <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Já Alocado Metas</p>
                                        <p className="text-sm font-black text-indigo-600">{formatCurrency(goalSummary.p1SavingsTotal)}</p>
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
                                        <p className="text-xs font-black text-indigo-500">{formatCurrency(goalSummary.availableBankP1)}</p>
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
                                    <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-xl border border-transparent hover:border-emerald-200 transition-all">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Reserva Emerg.</p>
                                        <p className="text-sm font-black text-emerald-600">{formatCurrency(coupleInfo.emergencyReserveP2 || 0)}</p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-500/5 p-3 rounded-xl border border-transparent hover:border-indigo-200 transition-all">
                                        <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Já Alocado Metas</p>
                                        <p className="text-sm font-black text-indigo-600">{formatCurrency(goalSummary.p2SavingsTotal)}</p>
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
                                        <p className="text-xs font-black text-indigo-500">{formatCurrency(goalSummary.availableBankP2)}</p>
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
                                <div className="absolute top-0 right-0 w-32 h-32 bg-p1/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
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
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-p1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Parte para Reserva Emerg.</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubReserveP1} onChange={e => setHubReserveP1(formatAsBRL(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-p1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Deseja investir/mês</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubSavingsP1} onChange={e => setHubSavingsP1(formatAsBRL(e.target.value))}
                                        placeholder={formatCurrency(p1Surplus)}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-p1"
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
                                    <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Parte para Reserva Emerg.</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={hubReserveP2} onChange={e => setHubReserveP2(formatAsBRL(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-800 px-3 py-2 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-p2"
                                    />
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
                    <span className="text-xs font-black text-indigo-500">{goals.filter(g => !g.is_completed).length} Metas</span>
                </div>
            </div>
            <div className="bg-gradient-to-br from-p1 to-purple-600 p-5 rounded-2xl text-white">
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
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${editingId ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-p1/10'}`}>{icon}</div>
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
                                            ? 'bg-p1 text-white shadow-lg'
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
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold dark:text-slate-100"
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
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold text-p1"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rentabilidade (% a.a)</label>
                                <input
                                    type="text"
                                    value={interestRate}
                                    onChange={e => setInterestRate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold dark:text-slate-100"
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
                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${splitP1 === 50 ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        50/50
                                    </button>
                                    <button
                                        type="button" onClick={() => {
                                            const p1perc = Math.round((coupleInfo.salary1 / (coupleInfo.salary1 + coupleInfo.salary2 || 1)) * 100);
                                            setSplitP1(p1perc); setSplitP2(100 - p1perc);
                                        }}
                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${splitP1 !== 50 && splitP1 !== 100 && splitP1 !== 0 ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
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
                                        onChange={e => { setSplitP1(Number(e.target.value)); setSplitP2(100 - Number(e.target.value)); }}
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
                                        onChange={e => { setSplitP2(Number(e.target.value)); setSplitP1(100 - Number(e.target.value)); }}
                                        className="w-full accent-p2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/5 pt-4">
                                {goalType !== 'individual_p2' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-p1">{p1Name} - Investir/mês</label>
                                            <button
                                                type="button" onClick={() => {
                                                    const totalReq = parseBRL(target) / 12; // Example 12 months if no deadline
                                                    const p1Part = totalReq * (splitP1 / 100);
                                                    setContributionP1(formatAsBRL(Math.round(p1Part * 100).toString()));
                                                }}
                                                className="text-[9px] font-black text-indigo-500 uppercase hover:underline"
                                            >
                                                Sugerir
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={contributionP1}
                                            onChange={e => setContributionP1(formatAsBRL(e.target.value))}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-p1/20 focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                                {goalType !== 'individual_p1' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-p2">{p2Name} - Investir/mês</label>
                                            <button
                                                type="button" onClick={() => {
                                                    const totalReq = parseBRL(target) / 12;
                                                    const p2Part = totalReq * (splitP2 / 100);
                                                    setContributionP2(formatAsBRL(Math.round(p2Part * 100).toString()));
                                                }}
                                                className="text-[9px] font-black text-indigo-500 uppercase hover:underline"
                                            >
                                                Sugerir
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={contributionP2}
                                            onChange={e => setContributionP2(formatAsBRL(e.target.value))}
                                            placeholder="R$ 0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-p2/20 focus:border-p2 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Withdrawal from Bank Section */}
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏦</span>
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Alocar do Saldo em Banco (Disponível)</p>
                            </div>
                            <p className="text-[10px] text-indigo-400 leading-tight">Escolha quanto do seu dinheiro parado no banco será usado agora para iniciar esta meta.</p>
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
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-500/20 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all font-bold"
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
                                            className="w-full bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-500/20 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-all font-bold"
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
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo Final</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold text-slate-500"
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
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${icon === i ? 'bg-p1 text-white shadow-lg scale-110' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className={`w-full font-black py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all active:scale-[0.98] ${editingId ? 'bg-amber-500 text-white' : 'bg-slate-900 dark:bg-p1 text-white'}`}>
                            {editingId ? '💾 Salvar Alterações' : 'Criar Meta Financeira'}
                        </button>
                    </form>
                )
            }

            {/* Goals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {goals.filter(g => !g.is_completed).map(goal => {
                    const extraP1 = whatIfContributions[`${goal.id}_p1`] || 0;
                    const extraP2 = whatIfContributions[`${goal.id}_p2`] || 0;

                    const originalContribution = (goal.monthly_contribution_p1 || 0) + (goal.monthly_contribution_p2 || 0);
                    const whatIfContribution = originalContribution + extraP1 + extraP2;

                    const timeToGoal = calculateTimeToGoal(goal);
                    const whatIfTimeToGoal = calculateTimeToGoal(goal, whatIfContribution);

                    const totalSaved = (goal.current_savings_p1 || 0) + (goal.current_savings_p2 || 0) + (goal.current_value || 0);
                    const progress = goal.target_value > 0 ? (totalSaved / goal.target_value) * 100 : 0;

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
                                        className="text-slate-300 hover:text-emerald-500 transition-colors p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                        title="Concluir meta"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => loadGoalForEdit(goal)}
                                        className="text-slate-300 hover:text-amber-500 transition-colors p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
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
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
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
                                    <span className="font-black text-p1">{formatCurrency(goal.target_value)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-p1 to-purple-500 rounded-full transition-all duration-500"
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
                                            <p className="text-sm font-black text-emerald-500">{formatCurrency(totalSaved)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plano Mensal</p>
                                            <p className="text-sm font-black text-p1">{formatCurrency(originalContribution)}</p>
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
                                                        <span className="block font-black text-slate-900 dark:text-slate-100">{formatCurrency(goal.current_savings_p1 || 0)}</span>
                                                        <span className="text-[8px] text-p1 font-bold">Aporte: {formatCurrency(goal.monthly_contribution_p1 || 0)}/mês</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const val = prompt(`Adicionar saldo extra para ${p1Name}:`);
                                                            if (val) {
                                                                const num = parseBRL(val);
                                                                if (num > 0) onUpdateGoal(goal.id, { current_savings_p1: (goal.current_savings_p1 || 0) + num });
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
                                                        <span className="block font-black text-slate-900 dark:text-slate-100">{formatCurrency(goal.current_savings_p2 || 0)}</span>
                                                        <span className="text-[8px] text-p2 font-bold">Aporte: {formatCurrency(goal.monthly_contribution_p2 || 0)}/mês</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const val = prompt(`Adicionar saldo extra para ${p2Name}:`);
                                                            if (val) {
                                                                const num = parseBRL(val);
                                                                if (num > 0) onUpdateGoal(goal.id, { current_savings_p2: (goal.current_savings_p2 || 0) + num });
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
                                <div className="flex-1 flex items-center justify-between bg-slate-900 dark:bg-slate-700 text-white p-3 rounded-xl">
                                    <span className="text-xs font-bold">Tempo Real:</span>
                                    <span className="font-black text-xs">
                                        {timeToGoal.reached ? '✅ Ok!' : timeToGoal.months === Infinity ? '♾️' : `${timeToGoal.months}m`}
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
