
import React from 'react';
import { formatCurrency } from '@/utils';

interface SalaryCardProps {
    name: string;
    value: number;
    color: 'p1' | 'p2';
    onClick?: () => void;
}

const SalaryCard: React.FC<SalaryCardProps> = ({ name, value, color, onClick }) => {
    const accentColor = color === 'p1' ? 'text-p1' : 'text-p2';
    const bgColor = color === 'p1' ? 'bg-p1/5' : 'bg-p2/5';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-md transition-all group`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Renda Mensal Total</p>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{name}</h4>
                </div>
                <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center text-slate-400 group-hover:text-p1 transition-colors`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </div>
            </div>

            <div className="flex items-baseline gap-1">
                <p className={`text-4xl font-black tracking-tighter ${accentColor}`}>
                    {formatCurrency(value)}
                </p>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 tracking-normal uppercase">BRL</span>
            </div>

            <p className="mt-4 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                Toque para gerenciar fontes de renda
            </p>
        </button>
    );
};

export default React.memo(SalaryCard);
