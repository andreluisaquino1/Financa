import React from 'react';
import { CoupleInfo, MonthlySummary, SavingsGoal } from '@/types';
import { formatCurrency } from '@/utils';

interface Props {
    coupleInfo: CoupleInfo;
    summary: MonthlySummary;
    goals: SavingsGoal[];
}

const ClosingBreakdown: React.FC<Props> = ({ coupleInfo, summary }) => {
    const totalIncomeCombined = summary.person1TotalIncome + summary.person2TotalIncome;
    const totalSharedPlusReimb = (summary.totalFixed || 0) + (summary.totalCommon || 0) + (summary.totalEqual || 0) + (summary.totalReimbursement || 0);

    const p1Name = coupleInfo.person1Name.split(' ')[0];
    const p2Name = coupleInfo.person2Name.split(' ')[0];

    const p1RatioInIncome = totalIncomeCombined > 0 ? (summary.person1TotalIncome / totalIncomeCombined) * 100 : 50;
    const p2RatioInIncome = totalIncomeCombined > 0 ? (summary.person2TotalIncome / totalIncomeCombined) * 100 : 50;

    const CalcRow = ({ label, value, type = 'normal', subText }: { label: string, value: number, type?: 'normal' | 'minus' | 'plus' | 'total', subText?: string }) => (
        <div className="flex justify-between items-center py-2.5">
            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{label}</span>
                {subText && <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{subText}</span>}
            </div>
            <span className={`text-sm font-black ${type === 'minus' ? 'text-red-500' : type === 'plus' ? 'text-emerald-500' : type === 'total' ? 'text-brand' : 'text-slate-700 dark:text-slate-200'}`}>
                {type === 'minus' ? '-' : type === 'plus' ? '+' : ''}{formatCurrency(Math.abs(value))}
            </span>
        </div>
    );

    const PersonFlow = ({ name, income, responsibility, paid, color, breakdown }: { name: string, income: number, responsibility: number, paid: number, color: string, breakdown: any }) => {
        const diff = responsibility - paid;
        return (
            <div className="bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl space-y-6">
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${color} mb-4`}>Fluxo {name}</p>
                    <div className="space-y-1">
                        <CalcRow label="Renda Bruta" value={income} />
                        <div className="ml-4 border-l border-slate-200 dark:border-white/10 pl-4 py-1 space-y-0.5">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                <span>Real (Nf/Pix)</span>
                                <span>{formatCurrency(breakdown.salaryReal)}</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                <span>Virtual (Projetado)</span>
                                <span>{formatCurrency(breakdown.salaryRecurring)}</span>
                            </div>
                            {breakdown.other > 0 && (
                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                    <span>Outras Entradas</span>
                                    <span>{formatCurrency(breakdown.other)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cálculo do Acerto</p>
                    <CalcRow label="Minha Responsabilidade" value={responsibility} subText="O que eu deveria pagar" />
                    <CalcRow label="O que eu já paguei" value={paid} type="minus" subText="Saídas da minha conta" />
                    <div className={`mt-2 p-3 rounded-xl border ${diff > 0 ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className={diff > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                {diff > 0 ? 'Diferença a Pagar' : 'Diferença a Receber'}
                            </span>
                            <span className={diff > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                {formatCurrency(Math.abs(diff))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <CalcRow label="Fixos" value={summary.totalFixed || 0} subText="Aluguel, etc." />
                            <CalcRow label="Variáveis" value={summary.totalCommon || 0} subText="Mercado, etc." />
                            <CalcRow label="Iguais" value={summary.totalEqual || 0} subText="Divisão 50/50" />
                            <CalcRow label="Reembolsos" value={summary.totalReimbursement || 0} subText="Ajustes de fluxo" />
                            <div className="pt-2 border-t border-slate-50 dark:border-white/5 col-span-full">
                                <CalcRow label="Total Movimentado pela Casa" value={totalSharedPlusReimb} type="total" />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Details by Person */}
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-widest">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">02</span>
                            Detalhamento por Pessoa
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <PersonFlow
                                name={p1Name}
                                income={summary.person1TotalIncome}
                                responsibility={summary.person1Responsibility}
                                paid={summary.person1Paid}
                                color="text-p1"
                                breakdown={summary.p1IncomeBreakdown}
                            />
                            <PersonFlow
                                name={p2Name}
                                income={summary.person2TotalIncome}
                                responsibility={summary.person2Responsibility}
                                paid={summary.person2Paid}
                                color="text-p2"
                                breakdown={summary.p2IncomeBreakdown}
                            />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 bg-slate-900 dark:bg-slate-950 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-lg shadow-inner">⚡</div>
                        <p className="text-[11px] font-medium leading-relaxed opacity-80">
                            <strong>Transparência total:</strong> O acerto é a diferença entre sua <strong>Responsabilidade</strong> (baseada na divisão dos gastos) e o que você <strong>já pagou</strong> do seu bolso. Quem pagou menos do que devia, transfere para quem pagou mais.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ClosingBreakdown);
