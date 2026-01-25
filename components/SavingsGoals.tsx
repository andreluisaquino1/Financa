
import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface Props {
    goals: SavingsGoal[];
    onAddGoal: (title: string, target: number, deadline?: string, icon?: string) => void;
    onUpdateGoal: (id: string, current: number, isCompleted: boolean) => void;
    onDeleteGoal: (id: string) => void;
}

const SavingsGoals: React.FC<Props> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('💰');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !target) return;
        onAddGoal(title, parseBRL(target), deadline || undefined, icon);
        setTitle('');
        setTarget('');
        setDeadline('');
        setIcon('💰');
        setIsAdding(false);
    };

    const icons = ['💰', '🏠', '🚗', '✈️', '💍', '👶', '🎮', '🏖️', '🎓', '🛡️'];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900">Metas de Economia</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Planejando o futuro juntos</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${isAdding ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-blue-200'}`}
                >
                    {isAdding ? 'Cancelar' : '+ Nova Meta'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Título da Meta</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Viagem para Europa"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 outline-none transition-all font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Valor Objetivo</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={target}
                                    onChange={e => setTarget(formatAsBRL(e.target.value))}
                                    placeholder="0,00"
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl pl-12 pr-5 py-4 outline-none transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Prazo (Opcional)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 outline-none transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Ícone</label>
                            <div className="flex flex-wrap gap-2">
                                {icons.map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setIcon(i)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${icon === i ? 'bg-blue-600 shadow-lg shadow-blue-100 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.8rem] shadow-xl hover:bg-black transition-all active:scale-[0.98]">
                        Criar Meta de Economia
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdate={onUpdateGoal}
                        onDelete={onDeleteGoal}
                    />
                ))}
                {goals.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
                        <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Nenhuma meta ativa</p>
                        <p className="text-slate-400 font-medium mt-2">Que tal começar a planejar algo incrível hoje?</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const GoalCard: React.FC<{ goal: SavingsGoal, onUpdate: (id: string, current: number, completed: boolean) => void, onDelete: (id: string) => void }> = ({ goal, onUpdate, onDelete }) => {
    const percent = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
    const [isEditing, setIsEditing] = useState(false);
    const [newCurrent, setNewCurrent] = useState(formatAsBRL((goal.current_value * 100).toString()));

    // Estados do Simulador
    const [isSimulating, setIsSimulating] = useState(false);
    const [aporte, setAporte] = useState('500,00');
    const [taxaAnual, setTaxaAnual] = useState('10,00');

    const handleSave = () => {
        const val = parseBRL(newCurrent);
        onUpdate(goal.id, val, val >= goal.target_value);
        setIsEditing(false);
    };

    const calculateMonths = () => {
        const fv = goal.target_value;
        const pv = goal.current_value;
        const pmt = parseBRL(aporte);
        const yearlyRate = parseFloat(taxaAnual.replace(',', '.')) || 0;
        const r = yearlyRate / 12 / 100;

        if (pv >= fv) return 0;
        if (pmt <= 0 && r <= 0) return Infinity;

        if (r === 0) {
            return Math.ceil((fv - pv) / pmt);
        }

        // Fórmula: n = [ln(fv + pmt/r) - ln(pv + pmt/r)] / ln(1 + r)
        const n = (Math.log(fv + pmt / r) - Math.log(pv + pmt / r)) / Math.log(1 + r);
        return Math.ceil(n);
    };

    const monthsRemaining = calculateMonths();
    const years = Math.floor(monthsRemaining / 12);
    const months = monthsRemaining % 12;

    return (
        <div className={`bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-xl group ${goal.is_completed ? 'bg-emerald-50/20' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-6 transition-transform">
                        {goal.icon}
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{goal.title}</h4>
                        {goal.deadline && (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Até {new Date(goal.deadline).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`p-2 rounded-xl transition ${isSimulating ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-blue-600'}`}
                        title="Simular Projeção"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition text-xs font-bold uppercase">
                            Editar
                        </button>
                        <button onClick={() => confirm('Apagar meta?') && onDelete(goal.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acumulado</p>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newCurrent}
                                    onChange={e => setNewCurrent(formatAsBRL(e.target.value))}
                                    className="w-32 bg-slate-50 border-2 border-blue-600 rounded-lg px-2 py-1 font-black text-lg outline-none"
                                />
                                <button onClick={handleSave} className="bg-blue-600 text-white p-1.5 rounded-lg active:scale-90 transition-transform">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </button>
                            </div>
                        ) : (
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(goal.current_value)}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                        <p className="text-lg font-black text-slate-500 tracking-tight">{formatCurrency(goal.target_value)}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                        <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all duration-1000 shadow-sm ${goal.is_completed ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className={`text-[10px] font-black ${goal.is_completed ? 'text-emerald-500' : 'text-blue-600'} uppercase tracking-tight`}>{percent}% completo</span>
                        {goal.is_completed && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Meta Atingida! 🎊</span>}
                    </div>
                </div>

                {/* Simulador de Projeção */}
                {isSimulating && !goal.is_completed && (
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Simulador de Projeção</h5>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Aporte Mensal</label>
                                <input
                                    type="text"
                                    value={aporte}
                                    onChange={e => setAporte(formatAsBRL(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-blue-600"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Juros a.a (%)</label>
                                <input
                                    type="text"
                                    value={taxaAnual}
                                    onChange={e => setTaxaAnual(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-2xl p-4 text-white text-center">
                            <p className="text-[10px] font-black uppercase opacity-70 mb-1">Tempo Estimado</p>
                            {monthsRemaining === Infinity ? (
                                <p className="text-lg font-black italic">Aporte insuficiente</p>
                            ) : (
                                <p className="text-xl font-black tracking-tight">
                                    {years > 0 ? `${years} ${years === 1 ? 'ano' : 'anos'}` : ''}
                                    {years > 0 && months > 0 ? ' e ' : ''}
                                    {months > 0 || years === 0 ? `${months} ${months === 1 ? 'mês' : 'meses'}` : ''}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavingsGoals;
