
import React from 'react';
import { formatCurrency } from '@/utils';

interface BalanceCardProps {
    name: string;
    personal: number;
    left: number;
    color: 'p1' | 'p2';
}

const BalanceCard: React.FC<BalanceCardProps> = ({ name, personal, left, color }) => {
    const accentColor = color === 'p1' ? 'text-p1' : 'text-p2';
    const accentBg = color === 'p1' ? 'bg-p1/5' : 'bg-p2/5';
    const accentIconBg = color === 'p1' ? 'bg-p1' : 'bg-p2';

    return (
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none group hover:shadow-md transition-all relative overflow-hidden">
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${accentBg} rounded-full -mr-12 -mt-12 blur-xl opacity-30`}></div>

            <div className="flex items-center justify-between mb-6 relative">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${accentIconBg} shadow-md rounded-xl flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">{name.split(' ')[0]}</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resumo de Carteira</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">Gastos Solo</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">{formatCurrency(personal)}</p>
                </div>
                <div className={`p-4 ${accentBg} rounded-xl border border-transparent`}>
                    <p className={`text-[10px] font-black ${accentColor} uppercase tracking-widest mb-1 opacity-80`}>Disponível</p>
                    <p className={`text-xl font-black ${accentColor} tracking-tighter`}>{formatCurrency(left)}</p>
                </div>
            </div>
        </div>
    );
};

export default React.memo(BalanceCard);
