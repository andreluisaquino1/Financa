
import React, { useMemo } from 'react';
import { CoupleInfo, Expense, ExpenseType } from '../types';
import { formatCurrency, parseSafeDate } from '../utils';

interface Props {
    person: 'person1' | 'person2';
    coupleInfo: CoupleInfo;
    expenses: Expense[];
    monthKey: string;
    onAddExpense: (type: ExpenseType, exp: Expense | null) => void;
    onUpdateExpense: (id: string, exp: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

const PersonalWallet: React.FC<Props> = ({
    person,
    coupleInfo,
    expenses,
    monthKey,
    onAddExpense,
    onUpdateExpense,
    onDeleteExpense
}) => {
    const name = person === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name;
    const type = person === 'person1' ? ExpenseType.PERSONAL_P1 : ExpenseType.PERSONAL_P2;
    const accentBg = person === 'person1' ? 'bg-p1' : 'bg-p2';
    const accentText = person === 'person1' ? 'text-p1' : 'text-p2';

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.type === type && e.date.startsWith(monthKey));
    }, [expenses, type, monthKey]);

    const total = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => acc + curr.totalValue, 0);
    }, [filteredExpenses]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <span className={`w-3 h-8 rounded-full ${accentBg}`}></span>
                        Carteira de {name.split(' ')[0]}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lançamentos individuais para o mês</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm text-center">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Gasto</p>
                        <p className={`text-xl font-black ${accentText} tracking-tight`}>{formatCurrency(total)}</p>
                    </div>
                    <button
                        onClick={() => onAddExpense(type, null)}
                        className="bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        <span className="hidden sm:inline">Lançar</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{exp.description}</p>
                                        <p className="sm:hidden text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">{exp.category}</p>
                                    </td>
                                    <td className="px-6 py-5 hidden sm:table-cell">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 px-3 py-1.5 rounded-xl">{exp.category}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right whitespace-nowrap font-black text-slate-900 dark:text-slate-100 text-sm">
                                        {formatCurrency(exp.totalValue)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onUpdateExpense(exp.id, exp)} className={`p-2 text-slate-400 hover:${accentText} hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-2xl mb-4 grayscale opacity-50">👛</div>
                                            <p className="text-slate-400 dark:text-slate-600 font-bold">Nenhum gasto individual</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PersonalWallet;
