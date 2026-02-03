import React from 'react';
import { MonthlySummary, CoupleInfo, SavingsGoal } from '@/types';
import { formatCurrency } from '@/utils';

interface Props {
    summary: MonthlySummary;
    coupleInfo: CoupleInfo;
    goals: SavingsGoal[];
}

const MonthlyInsights: React.FC<Props> = ({ summary, coupleInfo, goals }) => {
    const totalIncome = summary.person1TotalIncome + summary.person2TotalIncome;
    const totalSharedExpenses = (summary.totalFixed || 0) + (summary.totalCommon || 0) + (summary.totalEqual || 0) + (summary.totalReimbursement || 0);
    const totalPersonalExpenses = (summary.person1PersonalTotal || 0) + (summary.person2PersonalTotal || 0);
    const totalGoalContribution = summary.person1GoalContribution + summary.person2GoalContribution;

    // Total Realized vs Total Planned for goals in this specific month
    // We use planned for "Comprometimento" as it represents the budget intent
    const grandTotal = totalSharedExpenses + totalPersonalExpenses + totalGoalContribution;

    const commitmentRate = totalIncome > 0 ? ((totalSharedExpenses + totalGoalContribution) / totalIncome) * 100 : 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - grandTotal) / totalIncome) * 100 : 0;
    const residual = totalIncome - grandTotal;

    // Phase 5: Alertas e Insights
    const alerts: { icon: string, title: string, text: string, type: 'warning' | 'info' | 'success' }[] = [];

    // Alert 1: Missing paidBy (Crucial for correct settlement)
    if (summary.unspecifiedPaidByCount > 0) {
        alerts.push({
            icon: '⚠️',
            title: 'Gastos sem Pagador',
            text: `Existem ${summary.unspecifiedPaidByCount} gastos onde não foi marcado "Quem pagou". Isso distorce o cálculo do acerto final.`,
            type: 'warning'
        });
    }

    // Alert 2: Ambitious Goals (Planned > Remaining target)
    const ambitiousGoals = goals.filter(g => {
        if (g.is_completed) return false;
        const remaining = g.target_value - g.current_value;
        const monthly = (g.monthly_contribution_p1 || 0) + (g.monthly_contribution_p2 || 0);
        return monthly > remaining && remaining > 0;
    });
    if (ambitiousGoals.length > 0) {
        alerts.push({
            icon: '🚀',
            title: 'Metas na Reta Final',
            text: `Vocês estão aportando mais do que o necessário para ${ambitiousGoals.length} meta(s). Talvez seja hora de reajustar os valores mensais!`,
            type: 'success'
        });
    }

    // Alert 3: Critical commitment
    if (commitmentRate > 85) {
        alerts.push({
            icon: '📉',
            title: 'Orçamento Apertado',
            text: 'Mais de 85% da renda está comprometida com a casa e metas. Pouca margem para imprevistos.',
            type: 'warning'
        });
    }

    // Color based on commitment
    const getStatusColor = (rate: number) => {
        if (rate < 50) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (rate < 75) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Commitment Card */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative shrink-0 w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-900" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                                strokeDasharray={364}
                                strokeDashoffset={364 - (364 * Math.min(commitmentRate, 100)) / 100}
                                className={`${commitmentRate > 80 ? 'text-red-500' : 'text-brand'} transition-all duration-1000`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black tracking-tighter">{commitmentRate.toFixed(0)}%</span>
                            <span className="text-[8px] font-black uppercase text-slate-400">Comprometido</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto no Orçamento</h4>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {commitmentRate < 50 ? 'Excelente! Vocês estão com as contas sob controle e boa margem.' :
                                    commitmentRate < 80 ? 'Atenção. O custo de vida está consumindo boa parte da renda.' :
                                        'Crítico. Quase toda a renda está indo para as contas da casa.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Custo Casa</span>
                                <p className="text-sm font-black">{formatCurrency(totalSharedExpenses)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Aporte Sonhos</span>
                                <p className="text-sm font-black text-brand">{formatCurrency(totalGoalContribution)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Pessoal</span>
                                <p className="text-sm font-black">{formatCurrency(totalPersonalExpenses)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Savings Potentital Card */}
                <div className={`rounded-3xl p-6 border flex flex-col justify-between ${getStatusColor(commitmentRate)}`}>
                    <div className="flex justify-between items-start">
                        <span className="text-2xl">🌱</span>
                        <span className="text-[8px] font-black uppercase px-2 py-1 bg-white/20 rounded-full">Projeção de Sobra</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tighter mb-1">{formatCurrency(residual)}</h3>
                        <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
                            {residual > 0 ? 'Disponível para Investir / Lazer' : 'Orçamento Apertado'}
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-current/10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span>Taxa de Poupança</span>
                            <span>{savingsRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1 bg-current/10 rounded-full mt-2 overflow-hidden">
                            <div style={{ width: `${Math.max(0, savingsRate)}%` }} className="h-full bg-current rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertas Card */}
            {alerts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.map((alert, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border flex gap-4 items-start ${alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-700' :
                            alert.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-700' :
                                'bg-blue-500/5 border-blue-500/10 text-blue-700'
                            }`}>
                            <span className="text-xl mt-0.5">{alert.icon}</span>
                            <div>
                                <h5 className="text-[10px] font-black uppercase mb-1">{alert.title}</h5>
                                <p className="text-xs font-bold leading-relaxed opacity-80">{alert.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(MonthlyInsights);
