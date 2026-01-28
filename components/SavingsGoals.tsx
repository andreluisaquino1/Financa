
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
}

type GoalType = 'couple' | 'individual_p1' | 'individual_p2';

const SavingsGoals: React.FC<Props> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, isPremium, coupleInfo, summary }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

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

    // Calculations
    const p1Name = coupleInfo.person1Name.split(' ')[0];
    const p2Name = coupleInfo.person2Name.split(' ')[0];

    const p1Surplus = summary.person1TotalIncome - summary.person1Responsibility - summary.person1PersonalTotal;
    const p2Surplus = summary.person2TotalIncome - summary.person2Responsibility - summary.person2PersonalTotal;
    const totalSurplus = p1Surplus + p2Surplus;

    // Calculate total contributions from all goals
    const goalSummary = useMemo(() => {
        let p1Total = 0;
        let p2Total = 0;
        let p1Savings = 0;
        let p2Savings = 0;

        goals.forEach(g => {
            if (!g.is_completed) {
                p1Total += g.monthly_contribution_p1 || 0;
                p2Total += g.monthly_contribution_p2 || 0;
                p1Savings += g.current_savings_p1 || 0;
                p2Savings += g.current_savings_p2 || 0;
            }
        });

        return {
            p1MonthlyTotal: p1Total,
            p2MonthlyTotal: p2Total,
            p1SavingsTotal: p1Savings,
            p2SavingsTotal: p2Savings,
            combinedMonthly: p1Total + p2Total,
            combinedSavings: p1Savings + p2Savings
        };
    }, [goals]);

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
            current_value: parseBRL(savingsP1) + parseBRL(savingsP2),
            is_completed: false
        };

        if (editingId) {
            onUpdateGoal(editingId, goalData);
            setEditingId(null);
        } else {
            onAddGoal(goalData);
        }
        resetForm();
        setIsAdding(false);
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
        setIsAdding(true);
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetForm();
        setIsAdding(false);
    };

    // Calculate time to reach goal
    const calculateTimeToGoal = (goal: SavingsGoal) => {
        const totalMonthly = (goal.monthly_contribution_p1 || 0) + (goal.monthly_contribution_p2 || 0);
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

        if (confirm(`Confirmar aporte mensal de ${formatCurrency(p1Aporte + p2Aporte)}?`)) {
            onUpdateGoal(goal.id, {
                current_savings_p1: (goal.current_savings_p1 || 0) + p1Aporte,
                current_savings_p2: (goal.current_savings_p2 || 0) + p2Aporte,
                last_contribution_month: monthKey
            });
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Person 1 Summary */}
                <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-p1/10 rounded-xl flex items-center justify-center text-lg">👤</div>
                        <div>
                            <p className="font-black text-slate-800 dark:text-slate-100">{p1Name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Contribuição Mensal</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-500">Aportes/mês:</span>
                            <span className="font-bold text-p1">{formatCurrency(goalSummary.p1MonthlyTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-500">Poupança alocada:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(goalSummary.p1SavingsTotal)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                            <span className="text-xs text-slate-500">Sobra livre:</span>
                            <span className={`font-bold ${p1Surplus - goalSummary.p1MonthlyTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(p1Surplus - goalSummary.p1MonthlyTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Person 2 Summary */}
                <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-p2/10 rounded-xl flex items-center justify-center text-lg">👤</div>
                        <div>
                            <p className="font-black text-slate-800 dark:text-slate-100">{p2Name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Contribuição Mensal</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-500">Aportes/mês:</span>
                            <span className="font-bold text-p2">{formatCurrency(goalSummary.p2MonthlyTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-500">Poupança alocada:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(goalSummary.p2SavingsTotal)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                            <span className="text-xs text-slate-500">Sobra livre:</span>
                            <span className={`font-bold ${p2Surplus - goalSummary.p2MonthlyTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(p2Surplus - goalSummary.p2MonthlyTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Combined Summary */}
                <div className="bg-slate-900 dark:bg-slate-800 p-5 rounded-2xl text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">💰</div>
                        <div>
                            <p className="font-black">Total do Casal</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Investimento Mensal</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Aportes/mês:</span>
                            <span className="font-bold text-p1">{formatCurrency(goalSummary.combinedMonthly)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Poupança total:</span>
                            <span className="font-bold">{formatCurrency(goalSummary.combinedSavings)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-white/10">
                            <span className="text-xs text-slate-400">Sobra livre:</span>
                            <span className={`font-bold ${totalSurplus - goalSummary.combinedMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(totalSurplus - goalSummary.combinedMonthly)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Goals Progress */}
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
            </div>

            {/* Add/Edit Goal Form */}
            {isAdding && (
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
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aportes Mensais</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goalType !== 'individual_p2' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-p1">{p1Name} - Aporte Mensal</label>
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
                                    <label className="text-xs font-bold text-p2">{p2Name} - Aporte Mensal</label>
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

                    {/* Current Savings and Investment Locations */}
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl space-y-4">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">💰 Poupança e Investimento</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goalType !== 'individual_p2' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{p1Name} - Valor Guardado</label>
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
                                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{p2Name} - Valor Guardado</label>
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
            )}

            {/* Goals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {goals.filter(g => !g.is_completed).map(goal => {
                    const timeToGoal = calculateTimeToGoal(goal);
                    const totalContribution = (goal.monthly_contribution_p1 || 0) + (goal.monthly_contribution_p2 || 0);
                    const totalSaved = (goal.current_savings_p1 || 0) + (goal.current_savings_p2 || 0) + (goal.current_value || 0);
                    const progress = goal.target_value > 0 ? (totalSaved / goal.target_value) * 100 : 0;

                    return (
                        <div key={goal.id} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all">
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

                            {/* Stats */}
                            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl relative group/stat">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Valor Guardado</p>
                                    <div className="flex items-center justify-between">
                                        <p className="font-black text-emerald-500">{formatCurrency(totalSaved)}</p>
                                        <button
                                            onClick={() => {
                                                const extra = prompt('Quanto deseja adicionar à poupança desta meta?');
                                                if (extra) {
                                                    const val = parseBRL(extra);
                                                    if (val > 0) {
                                                        onUpdateGoal(goal.id, { current_value: (goal.current_value || 0) + val });
                                                    }
                                                }
                                            }}
                                            className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover/stat:opacity-100 transition-opacity"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Aporte Mensal</p>
                                    <p className="font-black text-p1">{formatCurrency(totalContribution)}</p>
                                </div>
                            </div>

                            {/* Contributions Breakdown */}
                            {(goal.goal_type === 'couple' || !goal.goal_type) && (
                                <div className="px-5 pb-4">
                                    <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-xl">
                                        <p className="text-[9px] font-black text-purple-600 dark:text-purple-300 uppercase mb-2">Contribuições</p>
                                        <div className="flex justify-between text-xs gap-4">
                                            <div className="flex flex-col flex-1">
                                                <span className="text-p1 font-bold truncate">{p1Name}: {formatCurrency(goal.monthly_contribution_p1 || 0)}</span>
                                                <span className="text-[9px] opacity-60 font-medium truncate">{goal.investment_location_p1 || 'Não definido'}</span>
                                            </div>
                                            <div className="flex flex-col flex-1 text-right">
                                                <span className="text-p2 font-bold truncate">{p2Name}: {formatCurrency(goal.monthly_contribution_p2 || 0)}</span>
                                                <span className="text-[9px] opacity-60 font-medium truncate">{goal.investment_location_p2 || 'Não definido'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Individual Investment for individual goals */}
                            {goal.goal_type && goal.goal_type !== 'couple' && (
                                <div className="px-5 pb-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Onde está guardado:</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            🏦 {goal.goal_type === 'individual_p1' ? goal.investment_location_p1 : goal.investment_location_p2 || 'Ainda não definido'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Time Estimate and Check-in */}
                            <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 flex items-center justify-between bg-slate-900 dark:bg-slate-700 text-white p-3 rounded-xl">
                                    <span className="text-xs font-bold">Tempo:</span>
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
                                                : 'bg-emerald-500 text-white hover:brightness-110'
                                            }`}
                                    >
                                        {goal.last_contribution_month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? '✓ Feito' : '💰 Aporte'}
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
            {goals.filter(g => g.is_completed).length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-black text-slate-400 dark:text-slate-600 mb-4">✅ Metas Concluídas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {goals.filter(g => g.is_completed).map(goal => (
                            <div key={goal.id} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl flex items-center gap-3 opacity-60">
                                <span className="text-2xl">{goal.icon || '💰'}</span>
                                <div>
                                    <p className="font-bold text-slate-600 dark:text-slate-400 line-through">{goal.title}</p>
                                    <p className="text-xs text-slate-400">{formatCurrency(goal.target_value)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsGoals;
