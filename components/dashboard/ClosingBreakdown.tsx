import React from 'react';
import { CoupleInfo, MonthlySummary, SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils';

interface Props {
    coupleInfo: CoupleInfo;
    summary: MonthlySummary;
    goals: SavingsGoal[];
}

const ClosingBreakdown: React.FC<Props> = ({ coupleInfo, summary, goals }) => {
    const totalIncomeCombined = summary.person1TotalIncome + summary.person2TotalIncome;
    const totalSharedPlusReimb = (summary.totalFixed || 0) + (summary.totalCommon || 0) + (summary.totalEqual || 0) + (summary.totalReimbursement || 0);

    const p1Name = coupleInfo.person1Name.split(' ')[0];
    const p2Name = coupleInfo.person2Name.split(' ')[0];

    // Calc goal contributions for this month
    const p1GoalContribution = goals.filter(g => !g.is_completed).reduce((sum, g) => sum + (g.monthly_contribution_p1 || 0), 0);
    const p2GoalContribution = goals.filter(g => !g.is_completed).reduce((sum, g) => sum + (g.monthly_contribution_p2 || 0), 0);

    const p1RatioInIncome = totalIncomeCombined > 0 ? (summary.person1TotalIncome / totalIncomeCombined) * 100 : 50;
    const p2RatioInIncome = totalIncomeCombined > 0 ? (summary.person2TotalIncome / totalIncomeCombined) * 100 : 50;

    const CalcRow = ({ label, value, type = 'normal', subText }: { label: string, value: number, type?: 'normal' | 'minus' | 'plus' | 'total', subText?: string }) => (
        <div className="flex justify-between items-center py-2.5">
            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{label}</span>
                {subText && <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{subText}</span>}
            </div>
            <span className={`text-sm font-black ${type === 'minus' ? 'text-red-500' : type === 'plus' ? 'text-emerald-500' : type === 'total' ? 'text-p1' : 'text-slate-700 dark:text-slate-200'}`}>
                {type === 'minus' ? '-' : type === 'plus' ? '+' : ''}{formatCurrency(Math.abs(value))}
            </span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 text-center">Planilha de Fechamento</h3>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center">Entenda cada centavo do cálculo</p>
                </div>

                <div className="p-8 space-y-10">
                    {/* Step 1: Origin of Costs */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-widest">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">01</span>
                            Origem dos Gastos Compartilhados
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <CalcRow label="Custos Fixos" value={summary.totalFixed || 0} subText="Aluguel, Internet, etc." />
                            <CalcRow label="Custos Variáveis" value={summary.totalCommon || 0} subText="Mercado, Lazer, etc." />
                            <CalcRow label="Reembolsos" value={summary.totalReimbursement || 0} subText="Pagos e a receber" />
                            <div className="pt-2 border-t border-slate-50 dark:border-white/5 md:col-span-2">
                                <CalcRow label="Total Movimentado pela Casa" value={totalSharedPlusReimb} type="total" />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Base of Proportion */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-widest">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">02</span>
                            Base de Proporção (Rendas)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            <CalcRow label={`Renda de ${p1Name}`} value={summary.person1TotalIncome} subText={`${p1RatioInIncome.toFixed(1)}% do total`} />
                            <CalcRow label={`Renda de ${p2Name}`} value={summary.person2TotalIncome} subText={`${p2RatioInIncome.toFixed(1)}% do total`} />
                        </div>
                    </div>

                    {/* Step 3: The Math of Peace */}
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-widest">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">03</span>
                            Matemática da Sobra Individual
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* P1 Column */}
                            <div className="bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-p1 mb-4">Fluxo {p1Name}</p>
                                <CalcRow label="Sua Renda Bruta" value={summary.person1TotalIncome} />
                                <CalcRow label="Sua Parte na Casa" value={summary.person1Responsibility} type="minus" subText="Baseado na divisão item a item" />
                                <CalcRow label="Seus Gastos Pessoais" value={summary.person1PersonalTotal} type="minus" />
                                <CalcRow label="Seus Sonhos (Metas)" value={p1GoalContribution} type="minus" />
                                <div className="mt-4 pt-4 border-t border-p1/10">
                                    <CalcRow label="Sua Sobra Final" value={summary.person1TotalIncome - summary.person1Responsibility - summary.person1PersonalTotal - p1GoalContribution} type="total" />
                                </div>
                            </div>

                            {/* P2 Column */}
                            <div className="bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-p2 mb-4">Fluxo {p2Name}</p>
                                <CalcRow label="Sua Renda Bruta" value={summary.person2TotalIncome} />
                                <CalcRow label="Sua Parte na Casa" value={summary.person2Responsibility} type="minus" subText="Baseado na divisão item a item" />
                                <CalcRow label="Seus Gastos Pessoais" value={summary.person2PersonalTotal} type="minus" />
                                <CalcRow label="Seus Sonhos (Metas)" value={p2GoalContribution} type="minus" />
                                <div className="mt-4 pt-4 border-t border-p2/10">
                                    <CalcRow label="Sua Sobra Final" value={summary.person2TotalIncome - summary.person2Responsibility - summary.person2PersonalTotal - p2GoalContribution} type="total" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 bg-slate-900 dark:bg-slate-950 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-p1/20 flex items-center justify-center text-lg shadow-inner">⚡</div>
                        <p className="text-[11px] font-medium leading-relaxed opacity-80">
                            <strong>Transparência total:</strong> Cada gasto compartilhado foi dividido conforme sua configuração (Proporcional, 50/50 ou Personalizado). O "Acerto" no card superior garante que, após as transferências, ambos terminem exatamente com a <strong>Sobra Final</strong> calculada acima.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ClosingBreakdown);
