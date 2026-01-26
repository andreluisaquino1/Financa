
import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface Props {
    goals: SavingsGoal[];
    onAddGoal: (title: string, target: number, monthly: number, rate: number, deadline?: string, icon?: string) => void;
    onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
    onDeleteGoal: (id: string) => void;
}

const SavingsGoals: React.FC<Props> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState('');
    const [monthly, setMonthly] = useState('500,00');
    const [rate, setRate] = useState('10,00');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('💰');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !target) return;
        onAddGoal(
            title,
            parseBRL(target),
            parseBRL(monthly),
            parseFloat(rate.replace(',', '.')) || 0,
            deadline || undefined,
            icon
        );
        setTitle('');
        setTarget('');
        setIsAdding(false);
    };

    const icons = ['💰', '🏠', '🚗', '✈️', '💍', '👶', '🎮', '🏖️', '🎓', '🛡️'];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-100">Metas do Casal</h2>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Transformando sonhos em números</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${isAdding ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-p1 text-white shadow-p1/20'}`}
                >
                    {isAdding ? 'Cancelar' : '+ Nova Meta'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">O que vocês querem?</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Lua de Mel" className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold dark:text-slate-100" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Valor Total</label>
                            <input type="text" inputMode="decimal" value={target} onChange={e => setTarget(formatAsBRL(e.target.value))} placeholder="R$ 0,00" className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold text-p1" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Aporte Mensal Previsto</label>
                            <input type="text" inputMode="decimal" value={monthly} onChange={e => setMonthly(formatAsBRL(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold dark:text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Rentabilidade Estimada (% a.a)</label>
                            <input type="text" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold dark:text-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Prazo (Opcional)</label>
                            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Ícone</label>
                            <div className="flex flex-wrap gap-2">
                                {icons.map(i => (
                                    <button key={i} type="button" onClick={() => setIcon(i)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${icon === i ? 'bg-p1 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{i}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-5 rounded-[1.8rem] shadow-xl hover:brightness-110 transition-all active:scale-[0.98]">
                        Lançar Novo Objetivo
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {goals.map(goal => (
                    <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdate={onUpdateGoal}
                        onDelete={onDeleteGoal}
                    />
                ))}
                {goals.length === 0 && !isAdding && (
                    <div className="col-span-full py-24 bg-white dark:bg-slate-800/20 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl opacity-50">🔭</div>
                        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">Nenhum sonho planejado ainda</p>
                        <p className="text-slate-300 dark:text-slate-700 font-medium mt-2">Clique em "+ Nova Meta" para começar o planejamento.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const GoalCard: React.FC<{ goal: SavingsGoal, onUpdate: (id: string, updates: Partial<SavingsGoal>) => void, onDelete: (id: string) => void }> = ({ goal, onUpdate, onDelete }) => {
    const [isContributing, setIsContributing] = useState(false);
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [contribution, setContribution] = useState('');

    const [editTitle, setEditTitle] = useState(goal.title);
    const [editTarget, setEditTarget] = useState(formatAsBRL((goal.target_value * 100).toString()));
    const [editMonthly, setEditMonthly] = useState(formatAsBRL(((goal.monthly_contribution || 0) * 100).toString()));
    const [editRate, setEditRate] = useState((goal.interest_rate || 0).toString().replace('.', ','));

    const percent = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);

    const handleContribute = () => {
        const valueToAdd = parseBRL(contribution);
        if (valueToAdd <= 0) return;
        const newTotal = goal.current_value + valueToAdd;
        onUpdate(goal.id, { current_value: newTotal, is_completed: newTotal >= goal.target_value });
        setContribution('');
        setIsContributing(false);
    };

    const handleSaveSettings = () => {
        onUpdate(goal.id, {
            title: editTitle,
            target_value: parseBRL(editTarget),
            monthly_contribution: parseBRL(editMonthly),
            interest_rate: parseFloat(editRate.replace(',', '.')) || 0,
            is_completed: goal.current_value >= parseBRL(editTarget)
        });
        setIsEditingSettings(false);
    };

    const calculateMonths = () => {
        const fv = goal.target_value;
        const pv = goal.current_value;
        const pmt = goal.monthly_contribution || 0;
        const r = (goal.interest_rate || 0) / 12 / 100;

        if (pv >= fv) return 0;
        if (pmt <= 0 && r <= 0) return Infinity;
        if (r === 0) return Math.ceil((fv - pv) / pmt);

        const n = (Math.log(fv + pmt / r) - Math.log(pv + pmt / r)) / Math.log(1 + r);
        return Math.ceil(n);
    };

    const monthsRemaining = calculateMonths();
    const finishDate = new Date();
    if (monthsRemaining !== Infinity) finishDate.setMonth(finishDate.getMonth() + monthsRemaining);

    const years = Math.floor(monthsRemaining / 12);
    const months = monthsRemaining % 12;

    return (
        <div className={`bg-white dark:bg-slate-800/40 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden transition-all hover:shadow-xl dark:shadow-none group flex flex-col ${goal.is_completed ? 'bg-emerald-50/20 dark:bg-emerald-500/5 ring-2 ring-emerald-100 dark:ring-emerald-500/20' : ''}`}>
            <div className="flex justify-between items-start mb-8">
                <div className="flex gap-5 items-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner dark:shadow-none group-hover:scale-110 transition-transform duration-500">
                        {goal.icon}
                    </div>
                    <div className="flex-1">
                        {isEditingSettings ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900 border-b-2 border-p1 outline-none font-black text-xl w-full dark:text-slate-100"
                            />
                        ) : (
                            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{goal.title}</h4>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${goal.is_completed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-p1/10 text-p1'}`}>
                                {goal.is_completed ? 'Concluído' : `${percent}% do objetivo`}
                            </span>
                            {!isEditingSettings && goal.deadline && (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Meta: {new Date(goal.deadline).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsEditingSettings(!isEditingSettings)} className={`p-2 rounded-xl transition ${isEditingSettings ? 'bg-p1 text-white' : 'text-slate-300 dark:text-slate-600 hover:text-p1'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {!isEditingSettings && (
                        <button onClick={() => confirm('Apagar meta?') && onDelete(goal.id)} className="p-2 text-slate-200 dark:text-slate-700 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {isEditingSettings ? (
                    <div className="grid grid-cols-2 gap-4 bg-p1/5 p-6 rounded-[2rem] border border-p1/10 animate-in zoom-in-95 duration-200">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-p1/60 uppercase">Objetivo Final</label>
                            <input type="text" value={editTarget} onChange={e => setEditTarget(formatAsBRL(e.target.value))} className="w-full bg-white dark:bg-slate-900 border border-p1/20 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-p1 dark:text-slate-100" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-p1/60 uppercase">Aporte Mensal</label>
                            <input type="text" value={editMonthly} onChange={e => setEditMonthly(formatAsBRL(e.target.value))} className="w-full bg-white dark:bg-slate-900 border border-p1/20 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-p1 dark:text-slate-100" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-p1/60 uppercase">Rentabilidade %</label>
                            <input type="text" value={editRate} onChange={e => setEditRate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-p1/20 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-p1 dark:text-slate-100" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleSaveSettings} className="w-full bg-p1 text-white rounded-xl py-2 text-xs font-black shadow-lg shadow-p1/20 active:scale-95 transition-all">Salvar Tudo</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Acumulado</p>
                                <p className="text-xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(goal.current_value)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Faltam</p>
                                <p className="text-xl font-black text-p1">{formatCurrency(Math.max(0, goal.target_value - goal.current_value))}</p>
                            </div>
                        </div>

                        <div className="relative pt-2">
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner font-black">
                                <div style={{ width: `${percent}%` }} className={`h-full rounded-full transition-all duration-1000 ${goal.is_completed ? 'bg-emerald-500' : 'bg-p1 shadow-[0_0_10px_var(--p1-color)]'}`}></div>
                            </div>
                            {monthsRemaining !== Infinity && !goal.is_completed && (
                                <div className="mt-4 flex justify-between items-center bg-p1/5 p-4 rounded-2xl border border-p1/10">
                                    <div>
                                        <p className="text-[9px] font-black text-p1/60 uppercase tracking-widest">Previsão de Conclusão</p>
                                        <p className="text-sm font-bold text-p1 uppercase italic">
                                            {finishDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[20px] font-black text-p1 tracking-tighter">
                                            ~{years > 0 ? `${years}a ` : ''}{months}m
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {!isEditingSettings && (
                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 flex gap-3">
                    {isContributing ? (
                        <div className="flex-1 flex gap-2 animate-in slide-in-from-right-2 duration-300">
                            <input
                                type="text" autoFocus inputMode="decimal" value={contribution}
                                onChange={e => setContribution(formatAsBRL(e.target.value))}
                                placeholder="Valor do Aporte"
                                className="flex-1 bg-p1/5 border-2 border-p1 rounded-2xl px-4 py-3 font-black text-p1 outline-none dark:text-slate-100"
                            />
                            <button onClick={handleContribute} className="bg-p1 text-white px-6 rounded-2xl font-black shadow-lg">Salvar</button>
                            <button onClick={() => setIsContributing(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 rounded-2xl font-black">X</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => goal.is_completed ? null : setIsContributing(true)}
                            className={`flex-1 py-4 rounded-[1.2rem] font-black text-sm tracking-tight transition-all active:scale-[0.98] ${goal.is_completed ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default font-black' : 'bg-slate-900 dark:bg-slate-950 text-white shadow-xl hover:brightness-110'}`}
                        >
                            {goal.is_completed ? 'OBJETIVO ALCANÇADO!' : '+ Adicionar Aporte'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SavingsGoals;
