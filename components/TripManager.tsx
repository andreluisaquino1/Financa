
import React, { useState } from 'react';
import { Trip, TripDeposit, TripExpense, CoupleInfo } from '../types';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface Props {
    coupleInfo: CoupleInfo;
    onUpdateTrips: (trips: Trip[]) => void;
}

export const TripManager: React.FC<Props> = ({ coupleInfo, onUpdateTrips }) => {
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [isAddingTrip, setIsAddingTrip] = useState(false);

    // Trip Form State
    const [newName, setNewName] = useState('');
    const [newBudget, setNewBudget] = useState('');
    const [newProportion, setNewProportion] = useState<'proportional' | 'custom'>('proportional');
    const [newCustomP1, setNewCustomP1] = useState(50);

    const trips = coupleInfo.trips || [];
    const activeTrip = trips.find(t => t.id === activeTripId);

    const handleAddTrip = (e: React.FormEvent) => {
        e.preventDefault();
        const newTrip: Trip = {
            id: Date.now().toString(),
            name: newName,
            budget: parseBRL(newBudget),
            proportionType: newProportion,
            customPercentage1: newProportion === 'custom' ? newCustomP1 : undefined,
            deposits: [],
            expenses: []
        };
        onUpdateTrips([...trips, newTrip]);
        setNewName('');
        setNewBudget('');
        setIsAddingTrip(false);
    };

    const handleDeleteTrip = (id: string) => {
        if (!confirm('Excluir esta viagem e todos os seus registros?')) return;
        onUpdateTrips(trips.filter(t => t.id !== id));
        if (activeTripId === id) setActiveTripId(null);
    };

    const handleUpdateActiveTrip = (updates: Partial<Trip>) => {
        if (!activeTripId) return;
        onUpdateTrips(trips.map(t => t.id === activeTripId ? { ...t, ...updates } : t));
    };

    if (activeTripId && activeTrip) {
        return (
            <TripDetail
                trip={activeTrip}
                coupleInfo={coupleInfo}
                onBack={() => setActiveTripId(null)}
                onUpdate={handleUpdateActiveTrip}
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-slate-100">Viagens</h2>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Planeje e divida seus momentos</p>
                </div>
                <button
                    onClick={() => setIsAddingTrip(!isAddingTrip)}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${isAddingTrip ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-p1 text-white shadow-p1/20'}`}
                >
                    {isAddingTrip ? 'Cancelar' : '+ Nova Viagem'}
                </button>
            </div>

            {isAddingTrip && (
                <form onSubmit={handleAddTrip} className="bg-white dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-md space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome da Viagem</label>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Viagem para Gramado" className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold dark:text-slate-100 placeholder:opacity-30" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Orçamento (Opcional)</label>
                            <input type="text" inputMode="decimal" value={newBudget} onChange={e => setNewBudget(formatAsBRL(e.target.value))} placeholder="R$ 0,00" className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-p1 rounded-2xl px-5 py-4 outline-none transition-all font-bold text-p1" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Divisão da Viagem</label>
                            <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/40 p-1 rounded-2xl">
                                {(['proportional', 'custom'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewProportion(type)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${newProportion === type ? 'bg-white dark:bg-slate-800 shadow-sm text-p1' : 'text-slate-400'}`}
                                    >
                                        {type === 'proportional' ? 'Proporcional' : 'Percentual %'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {newProportion === 'custom' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 md:col-span-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="text-p1">{coupleInfo.person1Name.split(' ')[0]} {newCustomP1}%</span>
                                    <span className="text-p2">{coupleInfo.person2Name.split(' ')[0]} {100 - newCustomP1}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={newCustomP1}
                                    onChange={(e) => setNewCustomP1(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-p1"
                                />
                                <div className="flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setNewCustomP1(50)}
                                        className="text-[9px] font-black uppercase text-slate-400 hover:text-p1 transition-colors"
                                    >
                                        Zerar em 50/50
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-5 rounded-[1.8rem] shadow-xl hover:brightness-110 transition-all active:scale-[0.98]">
                        Criar Viagem
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map(trip => (
                    <div key={trip.id} onClick={() => setActiveTripId(trip.id)} className="bg-white dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                ✈️
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }}
                                className="p-2 text-slate-200 dark:text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{trip.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            {trip.expenses.length} Gastos • {trip.deposits.length} Depósitos
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5 mt-auto">
                            <span className="text-sm font-black text-p1">{formatCurrency(trip.expenses.reduce((acc, current) => acc + current.value, 0))}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Total Gasto</span>
                        </div>
                    </div>
                ))}

                {trips.length === 0 && !isAddingTrip && (
                    <div className="col-span-full py-16 bg-white dark:bg-slate-800/40 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl opacity-50">🧭</div>
                        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">Nenhuma viagem planejada ainda</p>
                        <p className="text-slate-300 dark:text-slate-700 font-medium mt-2">Clique em "+ Nova Viagem" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TripDetail: React.FC<{ trip: Trip, coupleInfo: CoupleInfo, onBack: () => void, onUpdate: (updates: Partial<Trip>) => void }> = ({ trip, coupleInfo, onBack, onUpdate }) => {
    const [view, setView] = useState<'expenses' | 'deposits'>('expenses');
    // State for Adding/Editing
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form inputs
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [person, setPerson] = useState<'person1' | 'person2' | 'fund'>('person1');

    const totalExpenses = trip.expenses.reduce((acc, curr) => acc + curr.value, 0);
    const totalDepositsP1 = trip.deposits.filter(d => d.person === 'person1').reduce((acc, curr) => acc + curr.value, 0);
    const totalDepositsP2 = trip.deposits.filter(d => d.person === 'person2').reduce((acc, curr) => acc + curr.value, 0);

    const totalPaidP1 = trip.expenses.filter(e => e.paidBy === 'person1').reduce((acc, curr) => acc + curr.value, 0);
    const totalPaidP2 = trip.expenses.filter(e => e.paidBy === 'person2').reduce((acc, curr) => acc + curr.value, 0);

    const totalAportadoP1 = totalDepositsP1 + totalPaidP1;
    const totalAportadoP2 = totalDepositsP2 + totalPaidP2;

    // Calcula Proporção
    let p1Percent = 50;
    if (trip.proportionType === 'proportional') {
        const s1 = coupleInfo.salary1 || 0;
        const s2 = coupleInfo.salary2 || 0;
        const totalSalary = s1 + s2;
        p1Percent = totalSalary > 0 ? (s1 / totalSalary) * 100 : 50;
    } else if (trip.proportionType === 'custom') {
        p1Percent = trip.customPercentage1 ?? 50;
    }

    const p2Percent = 100 - p1Percent;
    const responsibilityP1 = totalExpenses * (p1Percent / 100);
    const responsibilityP2 = totalExpenses * (p2Percent / 100);

    const balanceP1 = responsibilityP1 - totalAportadoP1;
    const balanceP2 = responsibilityP2 - totalAportadoP2;

    const handleSubmitItem = (e: React.FormEvent) => {
        e.preventDefault();
        const numValue = parseBRL(value);
        if (numValue <= 0) return;

        if (view === 'expenses') {
            const expenseData: TripExpense = {
                id: editingId || Date.now().toString(),
                description,
                value: numValue,
                paidBy: person,
                date: new Date().toISOString().split('T')[0],
                category: 'Viagem'
            };

            const newExpenses = editingId
                ? trip.expenses.map(e => e.id === editingId ? expenseData : e)
                : [...trip.expenses, expenseData];

            onUpdate({ expenses: newExpenses });
        } else {
            // Se for depósito, o 'person' não pode ser 'fund'
            const depositPerson = (person === 'fund' ? 'person1' : person) as 'person1' | 'person2';

            const depositData: TripDeposit = {
                id: editingId || Date.now().toString(),
                description,
                value: numValue,
                person: depositPerson,
                date: new Date().toISOString().split('T')[0]
            };

            const newDeposits = editingId
                ? trip.deposits.map(d => d.id === editingId ? depositData : d)
                : [...trip.deposits, depositData];

            onUpdate({ deposits: newDeposits });
        }

        resetForm();
    };

    const resetForm = () => {
        setDescription('');
        setValue('');
        setEditingId(null);
        setIsAdding(false);
        setPerson('person1');
    };

    const handleStartEdit = (item: TripExpense | TripDeposit) => {
        setEditingId(item.id);
        setDescription(item.description || '');
        setValue(formatAsBRL(Math.round(item.value * 100).toString()));
        setPerson('paidBy' in item ? item.paidBy : item.person);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteItem = (id: string, type: 'expenses' | 'deposits') => {
        if (type === 'expenses') {
            onUpdate({ expenses: trip.expenses.filter(e => e.id !== id) });
        } else {
            onUpdate({ deposits: trip.deposits.filter(d => d.id !== id) });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-p1 font-bold text-xs uppercase tracking-widest transition-colors mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Voltar às Viagens
            </button>

            <div className="bg-white dark:bg-slate-800/60 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{trip.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase">
                                Divisão: {trip.proportionType === 'proportional' ? `Proporcional (${Math.round(p1Percent)}/${Math.round(p2Percent)})` : (p1Percent === 50 ? 'Igualitária (50/50)' : `Percentual (${Math.round(p1Percent)}/${Math.round(p2Percent)})`)}
                            </span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total da Viagem</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{formatCurrency(totalExpenses)}</p>
                    </div>
                </div>

                {/* Resumo de Ajuste */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BalanceCard
                        name={coupleInfo.person1Name}
                        responsibility={responsibilityP1}
                        deposited={totalAportadoP1}
                        balance={balanceP1}
                        colorClass="text-p1"
                        bgColorClass="bg-p1/5"
                    />
                    <BalanceCard
                        name={coupleInfo.person2Name}
                        responsibility={responsibilityP2}
                        deposited={totalAportadoP2}
                        balance={balanceP2}
                        colorClass="text-p2"
                        bgColorClass="bg-p2/5"
                    />
                </div>

                <div className="space-y-6">
                    <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl w-full sm:w-fit">
                        <button
                            onClick={() => { setView('expenses'); setIsAdding(false); setPerson('person1'); }}
                            className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${view === 'expenses' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1' : 'text-slate-400'}`}
                        >
                            Gastos
                        </button>
                        <button
                            onClick={() => { setView('deposits'); setIsAdding(false); setPerson('person1'); }}
                            className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all ${view === 'deposits' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1' : 'text-slate-400'}`}
                        >
                            Aportes/Depósitos
                        </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                {view === 'expenses' ? 'Lista de Gastos' : 'Aportes para o fundo'}
                            </h4>
                            <button
                                onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
                                className={`p-2 rounded-xl transition-all ${isAdding ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-p1 text-white shadow-lg ring-4 ring-p1/10 shadow-p1/20'}`}
                            >
                                <svg className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleSubmitItem} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-p1/20 dark:border-p1/10 shadow-lg space-y-4 mb-6 animate-in slide-in-from-top-4">
                                <h5 className="text-[10px] font-black uppercase text-p1 tracking-widest flex items-center gap-2">
                                    {editingId ? '📝 Editando Registro' : '✨ Novo Registro'}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">Descrição</label>
                                        <input autoFocus type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all dark:text-slate-100" placeholder="Ex: Combustível, Jantar..." required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">Valor</label>
                                        <input type="text" inputMode="decimal" value={value} onChange={e => setValue(formatAsBRL(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all dark:text-slate-100" placeholder="R$ 0,00" required />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">
                                            {view === 'expenses' ? 'Quem pagou?' : 'Quem depositou?'}
                                        </label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setPerson('person1')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase transition-all ${person === 'person1' ? 'bg-p1 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>{coupleInfo.person1Name.split(' ')[0]}</button>
                                            <button type="button" onClick={() => setPerson('person2')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase transition-all ${person === 'person2' ? 'bg-p2 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>{coupleInfo.person2Name.split(' ')[0]}</button>
                                            {view === 'expenses' && (
                                                <button type="button" onClick={() => setPerson('fund')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase transition-all ${person === 'fund' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>Fundo</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-p1 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all">
                                    {editingId ? 'Salvar Alterações' : `Lançar ${view === 'expenses' ? 'Gasto' : 'Aporte'}`}
                                </button>
                                {editingId && (
                                    <button type="button" onClick={resetForm} className="w-full bg-slate-100 dark:bg-slate-900 text-slate-500 font-black py-3 rounded-xl text-xs uppercase tracking-widest">
                                        Cancelar Edição
                                    </button>
                                )}
                            </form>
                        )}

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] no-scrollbar">
                            {view === 'expenses' ? (
                                trip.expenses.map(exp => (
                                    <div key={exp.id} className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${exp.paidBy === 'person1' ? 'bg-p1/10 text-p1' :
                                                    exp.paidBy === 'person2' ? 'bg-p2/10 text-p2' :
                                                        'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                {exp.description.toLowerCase().includes('uber') || exp.description.toLowerCase().includes('combust') ? '🚗' :
                                                    exp.description.toLowerCase().includes('jantar') || exp.description.toLowerCase().includes('almoço') || exp.description.toLowerCase().includes('comida') ? '🍕' :
                                                        exp.description.toLowerCase().includes('hotel') || exp.description.toLowerCase().includes('pousada') || exp.description.toLowerCase().includes('airbnb') ? '🏨' :
                                                            exp.description.toLowerCase().includes('avião') || exp.description.toLowerCase().includes('passagem') ? '✈️' : '🎟️'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{exp.description}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">
                                                    {exp.paidBy === 'person1' ? coupleInfo.person1Name.split(' ')[0] :
                                                        exp.paidBy === 'person2' ? coupleInfo.person2Name.split(' ')[0] :
                                                            'Fundo da Viagem'}
                                                    <span className="opacity-30 mx-1.5">•</span>
                                                    {new Date(exp.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-right mr-2">
                                                <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(exp.value)}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <button onClick={() => handleStartEdit(exp)} className="p-2 text-slate-300 hover:text-p1 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteItem(exp.id, 'expenses')} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                trip.deposits.map(dep => (
                                    <div key={dep.id} className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${dep.person === 'person1' ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'}`}>
                                                💰
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{dep.description || 'Depósito p/ fundo'}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">
                                                    Depositado por {dep.person === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                                                    <span className="opacity-30 mx-1.5">•</span>
                                                    {new Date(dep.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-right mr-2">
                                                <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(dep.value)}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <button onClick={() => handleStartEdit(dep)} className="p-2 text-slate-300 hover:text-p1 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteItem(dep.id, 'deposits')} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {(view === 'expenses' ? trip.expenses.length : trip.deposits.length) === 0 && !isAdding && (
                                <div className="py-20 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-50">Nenhum registro encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BalanceCard: React.FC<{ name: string, responsibility: number, deposited: number, balance: number, colorClass: string, bgColorClass: string }> = ({ name, responsibility, deposited, balance, colorClass, bgColorClass }) => {
    const pName = name.split(' ')[0];
    const needsToPay = balance > 0;

    return (
        <div className={`p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md ${bgColorClass}`}>
            <h4 className={`text-sm font-black uppercase tracking-tight mb-4 ${colorClass}`}>{pName}</h4>
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Responsabilidade</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(responsibility)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Aportou</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(deposited)}</p>
                    </div>
                </div>
                <div className={`pt-4 border-t border-slate-200/50 dark:border-white/10 flex justify-between items-center`}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Final</p>
                    <div className="text-right">
                        <p className={`text-xl font-black ${needsToPay ? 'text-red-500' : 'text-emerald-500'}`}>
                            {needsToPay ? `Deve R$ ${formatCurrency(balance).replace('R$', '')}` : `A receber R$ ${formatCurrency(Math.abs(balance)).replace('R$', '')}`}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {needsToPay ? `Precisa pagar para o outro` : `Pagou a mais que o esperado`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripManager;
