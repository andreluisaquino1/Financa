
import React, { useMemo } from 'react';
import { CoupleInfo, Expense, ExpenseType, MonthlySummary } from '../types';
import { formatCurrency, parseSafeDate, isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo } from '../utils';

interface Props {
    person: 'person1' | 'person2';
    coupleInfo: CoupleInfo;
    expenses: Expense[];
    monthKey: string;
    summary: MonthlySummary;
    onAddExpense: (type: ExpenseType, exp: Expense | null) => void;
    onUpdateExpense: (id: string, exp: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

const PersonalWallet: React.FC<Props> = ({
    person,
    coupleInfo,
    expenses,
    monthKey,
    summary,
    onAddExpense,
    onUpdateExpense,
    onDeleteExpense
}) => {
    const name = person === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name;
    const type = person === 'person1' ? ExpenseType.PERSONAL_P1 : ExpenseType.PERSONAL_P2;
    const accentBg = person === 'person1' ? 'bg-p1' : 'bg-p2';
    const accentText = person === 'person1' ? 'text-p1' : 'text-p2';

    const income = person === 'person1' ? summary.person1TotalIncome : summary.person2TotalIncome;
    const responsibility = person === 'person1' ? summary.person1Responsibility : summary.person2Responsibility;

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.type === type && isExpenseInMonth(e, monthKey));
    }, [expenses, type, monthKey]);

    const totalPersonal = useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => acc + getMonthlyExpenseValue(curr, monthKey), 0);
    }, [filteredExpenses, monthKey]);

    const left = income - responsibility - totalPersonal;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <span className={`w-3 h-8 rounded-full ${accentBg} shadow-[0_0_15px_rgba(0,0,0,0.1)]`}></span>
                        Carteira de {name.split(' ')[0]}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Controle de gastos individuais e pessoais</p>
                </div>

                <div className="w-full sm:w-auto">
                    <button
                        onClick={() => onAddExpense(type, null)}
                        className={`w-full sm:w-auto bg-p1 hover:bg-p1/90 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-p1/20 transition-all active:scale-95 flex items-center justify-center gap-2`}
                    >
                        <span>+</span> Novo Gasto Individual
                    </button>
                </div>
            </div>

            {/* Resumo de Saldo */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm shadow-slate-200/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Renda</p>
                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">{formatCurrency(income)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contas da Casa</p>
                        <p className="text-lg font-black text-red-400">-{formatCurrency(responsibility)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos Pessoais</p>
                        <p className="text-lg font-black text-red-400">-{formatCurrency(totalPersonal)}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${left >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'} border ${left >= 0 ? 'border-emerald-100 dark:border-emerald-500/20' : 'border-red-100 dark:border-red-500/20'} flex flex-col justify-center`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${left >= 0 ? 'text-emerald-500' : 'text-red-500'} mb-1`}>
                            {left >= 0 ? 'Sobra Livre' : 'Diferença'}
                        </p>
                        <p className={`text-xl font-black ${left >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(left)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="block lg:hidden space-y-4">
                {filteredExpenses.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                        <p className="text-slate-400 font-bold italic">Nenhum gasto este mês.</p>
                    </div>
                ) : filteredExpenses.map(exp => (
                    <div key={exp.id} className="bg-white dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <span className={`w-10 h-10 rounded-2xl ${accentBg}/10 ${accentText} flex items-center justify-center text-lg shadow-sm border border-white/10`}>
                                    {(() => {
                                        const cat = (coupleInfo.categories || []).find(c =>
                                            typeof c === 'string' ? c === exp.category : c.name === exp.category
                                        );
                                        const customIcon = typeof cat === 'object' ? cat.icon : null;
                                        if (customIcon) return customIcon;
                                        if (exp.category === 'Lazer') return '🎮';
                                        if (exp.category === 'Saúde') return '🏥';
                                        if (exp.category === 'Alimentação') return '🥗';
                                        if (exp.category === 'Compras') return '🛍️';
                                        return '👤';
                                    })()}
                                </span>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{exp.description}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                            {typeof exp.category === 'string' ? exp.category : (exp.category as any)?.name || 'Outros'}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-300 dark:text-slate-600">•</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">
                                            {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-black text-lg ${accentText}`}>{formatCurrency(getMonthlyExpenseValue(exp, monthKey))}</p>
                                {getInstallmentInfo(exp, monthKey) && (
                                    <span className="text-[9px] font-black text-slate-400 uppercase">
                                        {getInstallmentInfo(exp, monthKey)?.current}/{getInstallmentInfo(exp, monthKey)?.total}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-50 dark:border-white/5">
                            <button onClick={() => onUpdateExpense(exp.id, exp)} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400">📝</button>
                            <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Data & Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-xl ${accentBg}/10 ${accentText} flex items-center justify-center text-xs font-black shadow-sm`}>
                                                {parseSafeDate(exp.date).getDate().toString().padStart(2, '0')}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{exp.description}</p>
                                                    {getInstallmentInfo(exp, monthKey) && (
                                                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-black">
                                                            {getInstallmentInfo(exp, monthKey)?.current}/{getInstallmentInfo(exp, monthKey)?.total}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                    {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { month: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black text-sm ${accentText}`}>
                                        {formatCurrency(getMonthlyExpenseValue(exp, monthKey))}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onUpdateExpense(exp.id, exp)} className="p-2 text-slate-400 hover:text-p1 hover:bg-p1/5 rounded-xl transition-all">📝</button>
                                            <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PersonalWallet;
