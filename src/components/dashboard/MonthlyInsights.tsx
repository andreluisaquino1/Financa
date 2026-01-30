
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
    const totalSharedExpenses = summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement;
    const totalPersonalExpenses = summary.person1PersonalTotal + summary.person2PersonalTotal;

    const totalGoalContribution = goals.filter(g => !g.is_completed).reduce((sum, g) =>
        sum + (g.monthly_contribution_p1 || 0) + (g.monthly_contribution_p2 || 0), 0
    );

    const grandTotal = totalSharedExpenses + totalPersonalExpenses + totalGoalContribution;

    const commitmentRate = totalIncome > 0 ? ((totalSharedExpenses + totalGoalContribution) / totalIncome) * 100 : 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - grandTotal) / totalIncome) * 100 : 0;
    const residual = Math.max(0, totalIncome - grandTotal);

    // Color based on commitment
    const getStatusColor = (rate: number) => {
        if (rate < 50) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (rate < 75) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Commitment Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="relative shrink-0 w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-900" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                            strokeDasharray={364}
                            strokeDashoffset={364 - (364 * Math.min(commitmentRate, 100)) / 100}
                            className={`${commitmentRate > 80 ? 'text-red-500' : 'text-p1'} transition-all duration-1000`}
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
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
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
                            <p className="text-sm font-black text-p1">{formatCurrency(totalGoalContribution)}</p>
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
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Disponível para Investir / Lazer</p>
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
    );
};

export default React.memo(MonthlyInsights);
