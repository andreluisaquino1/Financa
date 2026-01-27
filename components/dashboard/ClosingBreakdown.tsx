
import React from 'react';
import { CoupleInfo, MonthlySummary } from '../../types';
import { formatCurrency } from '../../utils';

interface Props {
    coupleInfo: CoupleInfo;
    summary: MonthlySummary;
}

const ClosingBreakdown: React.FC<Props> = ({ coupleInfo, summary }) => {
    const totalShared = summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement;

    const totalIncomeCombined = summary.person1TotalIncome + summary.person2TotalIncome;
    const p1Ratio = totalIncomeCombined > 0 ? (summary.person1TotalIncome / totalIncomeCombined) : 0.5;
    const p2Ratio = totalIncomeCombined > 0 ? (summary.person2TotalIncome / totalIncomeCombined) : 0.5;

    // No fixed mode, ratios are different
    const actualRatio1 = coupleInfo.customSplitMode === 'fixed' ? (coupleInfo.manualPercentage1 || 50) / 100 : p1Ratio;
    const actualRatio2 = coupleInfo.customSplitMode === 'fixed' ? (100 - (coupleInfo.manualPercentage1 || 50)) / 100 : p2Ratio;

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
                        <span className="text-slate-400 dark:text-slate-500 uppercase">Sua Parte ({(ratio * 100).toFixed(0)}%)</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatCurrency(responsibility)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400 dark:text-slate-500 uppercase">Já pagou</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatCurrency(paid)}</span>
                    </div>
                    <div className="h-px bg-slate-200/50 dark:bg-white/5 my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {isDebtor ? 'Deve transferir' : 'Deve receber'}
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
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Como chegamos ao valor final</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Compartilhado</p>
                    <p className="text-lg font-black text-slate-950 dark:text-slate-100 tracking-tighter">{formatCurrency(totalShared)}</p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <BreakdownItem
                    name={coupleInfo.person1Name}
                    ratio={actualRatio1}
                    paid={summary.person1Paid}
                    responsibility={summary.person1Responsibility}
                    color="p1"
                />
                <BreakdownItem
                    name={coupleInfo.person2Name}
                    ratio={actualRatio2}
                    paid={summary.person2Paid}
                    responsibility={summary.person2Responsibility}
                    color="p2"
                />
            </div>

            <div className="px-8 py-4 bg-slate-900 dark:bg-slate-950 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-p1 text-lg">💡</span>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80">
                        A soma das rendas é {formatCurrency(totalIncomeCombined)}. A divisão é baseada na sua
                        {coupleInfo.customSplitMode === 'fixed' ? ' porcentagem fixa definida' : ' renda proporcional'}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClosingBreakdown;
