
import React, { useMemo } from 'react';
import { CoupleInfo, Expense, ExpenseType, MonthlySummary, SavingsGoal } from '@/types';
import { formatCurrency, parseSafeDate, isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo } from '@/utils';

interface Props {
    person: 'person1' | 'person2';
    coupleInfo: CoupleInfo;
    expenses: Expense[];
    monthKey: string;
    summary: MonthlySummary;
    goals: SavingsGoal[];
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
    goals,
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

    const personalGoals = useMemo(() => {
        return goals.filter(g => !g.is_completed && (
            (person === 'person1' && (g.monthly_contribution_p1 || 0) > 0) ||
            (person === 'person2' && (g.monthly_contribution_p2 || 0) > 0)
        ));
    }, [goals, person]);

    const totalGoalInvestment = useMemo(() => {
        return personalGoals.reduce((sum, g) => sum + (person === 'person1' ? (g.monthly_contribution_p1 || 0) : (g.monthly_contribution_p2 || 0)), 0);
    }, [personalGoals, person]);

    const left = income - responsibility - totalPersonal - totalGoalInvestment;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header com Status e Botão principal */}
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden`}>
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-3 w-3 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${accentBg} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${accentBg}`}></span>
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Carteira de {name.split(' ')[0]}
                        </h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                        Controle seus gastos individuais, investimentos pessoais e acompanhe o que sobrou da sua renda
                    </p>
                </div>

                <div className="flex items-center gap-6 w-full lg:w-auto z-10">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1 opacity-60">Sobra Livre Estimada</span>
                        <span className={`text-2xl font-black ${left >= 0 ? 'text-emerald-500' : 'text-red-500'} tabular-nums tracking-tighter`}>{formatCurrency(left)}</span>
                    </div>

                    <button
                        onClick={() => onAddExpense(type, null)}
                        className={`flex-1 lg:flex-none ${accentBg} hover:brightness-110 text-white px-10 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-${person === 'person1' ? 'p1' : 'p2'}/30 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Novo Gasto Individual
                    </button>
                </div>

                {/* Efeitos visuais de fundo */}
                <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 ${accentBg}/5 rounded-full blur-3xl`}></div>
            </div>

            {/* Resumo de Fluxo Financeiro Individual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">Sua Renda</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(income)}</p>
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${accentBg} w-full opacity-60`}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">Contas Casa</p>
                    <p className="text-xl font-black text-red-400 tabular-nums">-{formatCurrency(responsibility)}</p>
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400" style={{ width: `${Math.min((responsibility / (income || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">Gastos Pessoais</p>
                    <p className="text-xl font-black text-red-300 tabular-nums">-{formatCurrency(totalPersonal)}</p>
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-300" style={{ width: `${Math.min((totalPersonal / (income || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">Aporte Metas</p>
                    <p className="text-xl font-black text-purple-400 tabular-nums">-{formatCurrency(totalGoalInvestment)}</p>
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400" style={{ width: `${Math.min((totalGoalInvestment / (income || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>

                <div className={`p-5 rounded-[2rem] ${left >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'} border shadow-xl flex flex-col justify-center relative overflow-hidden group`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${left >= 0 ? 'text-emerald-500' : 'text-red-500'} mb-1`}>
                        {left >= 0 ? 'Sobra Livre' : 'Déficit'}
                    </p>
                    <p className={`text-2xl font-black ${left >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} tabular-nums tracking-tighter z-10`}>
                        {formatCurrency(left)}
                    </p>
                    <div className={`absolute -right-4 -bottom-4 text-4xl opacity-10 group-hover:scale-125 transition-transform duration-500`}>
                        {left >= 0 ? '🥳' : '⚠️'}
                    </div>
                </div>
            </div>

            {/* Planejamento de Sonhos (Metas) */}
            {personalGoals.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">🎯</div>
                        <div>
                            <h3 className="font-black tracking-tight">Investimento em Sonhos</h3>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aportes para suas metas este mês</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {personalGoals.map(goal => {
                            const myContribution = person === 'person1' ? (goal.monthly_contribution_p1 || 0) : (goal.monthly_contribution_p2 || 0);
                            const totalSaved = (goal.current_savings_p1 || 0) + (goal.current_savings_p2 || 0) + (goal.current_value || 0);
                            const progress = (totalSaved / goal.target_value) * 100;

                            return (
                                <div key={goal.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{goal.icon || '💰'}</span>
                                            <span className="font-bold text-sm truncate max-w-[120px]">{goal.title}</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400">{formatCurrency(myContribution)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-black uppercase text-white/40">
                                            <span>Progresso</span>
                                            <span>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
            <div className="hidden lg:block bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest min-w-[240px]">🗓️ Data & Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell">🏷️ Categoria</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right min-w-[140px]">💰 Valor</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center">
                                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest opacity-60 italic">Nenhum gasto registrado este mês.</p>
                                    </td>
                                </tr>
                            ) : filteredExpenses.map(exp => {
                                const value = getMonthlyExpenseValue(exp, monthKey);
                                const instInfo = getInstallmentInfo(exp, monthKey);

                                return (
                                    <tr key={exp.id} className={`group hover:${accentBg}/5 dark:hover:${accentBg}/10 transition-all`}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center shadow-inner border border-slate-100 dark:border-white/5 font-black text-slate-400 dark:text-slate-500 tabular-nums">
                                                    <span className="text-[9px] leading-tight opacity-40">{parseSafeDate(exp.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                                    <span className="text-sm leading-tight text-slate-900 dark:text-slate-100">{parseSafeDate(exp.date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{exp.description}</p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tabular-nums italic">
                                                        {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {(() => {
                                                        const cat = (coupleInfo.categories || []).find(c =>
                                                            typeof c === 'string' ? c === exp.category : c.name === exp.category
                                                        );
                                                        return (cat && typeof cat === 'object') ? cat.icon : '📁';
                                                    })()}
                                                </span>
                                                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/5">
                                                    {exp.category}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-black ${accentText} text-base tabular-nums tracking-tighter`}>{formatCurrency(value)}</span>
                                                {instInfo && (
                                                    <span className="text-[8px] font-black text-slate-400 text-right uppercase mt-0.5">
                                                        Parcela {instInfo.current} de {instInfo.total}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                <button onClick={() => onUpdateExpense(exp.id, exp)} className={`w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:${accentText} rounded-2xl shadow-xl hover:shadow-${person === 'person1' ? 'p1' : 'p2'}/20 border border-slate-100 dark:border-white/5 transition-all active:scale-90`}>📝</button>
                                                <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-2xl shadow-xl hover:shadow-red-500/20 border border-slate-100 dark:border-white/5 transition-all active:scale-90 ml-1">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PersonalWallet;
