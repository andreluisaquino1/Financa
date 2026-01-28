
import React from 'react';
import { CoupleInfo, MonthlySummary } from '../../types';
import { formatCurrency } from '../../utils';

interface Props {
    coupleInfo: CoupleInfo;
    summary: MonthlySummary;
}

const ClosingBreakdown: React.FC<Props> = ({ coupleInfo, summary }) => {
    const totalSharedRaw = summary.totalFixed + summary.totalCommon + summary.totalEqual;
    const totalSharedPlusReimb = totalSharedRaw + summary.totalReimbursement;

    const totalIncomeCombined = summary.person1TotalIncome + summary.person2TotalIncome;

    // Percentual médio de responsabilidade sobre o gasto compartilhado (incluindo reembolsos)
    const effectiveRatio1 = totalSharedPlusReimb > 0 ? (summary.person1Responsibility / totalSharedPlusReimb) : (totalIncomeCombined > 0 ? summary.person1TotalIncome / totalIncomeCombined : 0.5);
    const effectiveRatio2 = totalSharedPlusReimb > 0 ? (summary.person2Responsibility / totalSharedPlusReimb) : (totalIncomeCombined > 0 ? summary.person2TotalIncome / totalIncomeCombined : 0.5);

    const BreakdownItem = ({ name, ratio, paid, responsibility, color }: any) => {
        const isDebtor = responsibility > paid;
        const diff = Math.abs(responsibility - paid);

        return (
            <div className={`p-6 rounded-[2rem] border transition-all ${color === 'p1' ? 'bg-p1/5 border-p1/10' : 'bg-p2/5 border-p2/10'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-[10px] ${color === 'p1' ? 'bg-p1' : 'bg-p2'}`}>
                        {name.slice(0, 1).toUpperCase()}
                    </div>
                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">{name}</h4>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400 dark:text-slate-500 uppercase">Sua Responsabilidade ({(ratio * 100).toFixed(0)}%)</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatCurrency(responsibility)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400 dark:text-slate-500 uppercase">Total já Pago</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatCurrency(paid)}</span>
                    </div>
                    <div className="h-px bg-slate-200/50 dark:bg-white/5 my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {isDebtor ? 'Diferença a Pagar' : 'Diferença a Receber'}
                        </span>
                        <span className={`text-sm font-black ${isDebtor ? 'text-red-500' : 'text-emerald-500'}`}>
                            {formatCurrency(diff)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Cálculo Detalhado</h3>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Divisão ponderada por item</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Movimentado</p>
                    <p className="text-lg font-black text-slate-950 dark:text-slate-100 tracking-tighter">{formatCurrency(totalSharedPlusReimb)}</p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <BreakdownItem
                    name={coupleInfo.person1Name}
                    ratio={effectiveRatio1}
                    paid={summary.person1Paid}
                    responsibility={summary.person1Responsibility}
                    color="p1"
                />
                <BreakdownItem
                    name={coupleInfo.person2Name}
                    ratio={effectiveRatio2}
                    paid={summary.person2Paid}
                    responsibility={summary.person2Responsibility}
                    color="p2"
                />
            </div>

            <div className="px-8 py-5 bg-slate-900 dark:bg-slate-950 text-white flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shadow-inner">🧠</div>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80">
                        O cálculo agora é feito <strong>individualmente por item</strong>.
                        A responsabilidade total mostrada acima é a soma da sua parte em cada gasto,
                        seja ela definida por renda ({((totalIncomeCombined > 0 ? (summary.person1TotalIncome / totalIncomeCombined) : 0.5) * 100).toFixed(0)}% / {((totalIncomeCombined > 0 ? (summary.person2TotalIncome / totalIncomeCombined) : 0.5) * 100).toFixed(0)}%) ou personalizada.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ClosingBreakdown);
