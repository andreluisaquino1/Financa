import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trip, TripDeposit, TripExpense, CoupleInfo } from '@/types';
import { formatCurrency, formatAsBRL, parseBRL } from '@/utils';
import { calculateTripSettlement } from '@/domain/trips';
import { RECOMMENDED_ICONS } from '@/config/design';

interface Props {
    coupleInfo: CoupleInfo;
    trips: Trip[];
    onAddTrip: (trip: Omit<Trip, 'id' | 'household_id' | 'created_at' | 'expenses' | 'deposits'>) => void;
    onUpdateTrip: (id: string, updates: Partial<Trip>) => void;
    onDeleteTrip: (id: string) => void;
    onAddExpense: (tripId: string, expense: Omit<TripExpense, 'id' | 'trip_id' | 'created_at'>) => void;
    onDeleteExpense: (tripId: string, expenseId: string) => void;
    onAddDeposit: (tripId: string, deposit: Omit<TripDeposit, 'id' | 'trip_id' | 'created_at'>) => void;
    onDeleteDeposit: (tripId: string, depositId: string) => void;
}

export const TripManager: React.FC<Props> = ({
    coupleInfo,
    trips,
    onAddTrip,
    onUpdateTrip,
    onDeleteTrip,
    onAddExpense,
    onDeleteExpense,
    onAddDeposit,
    onDeleteDeposit
}) => {
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [isAddingTrip, setIsAddingTrip] = useState(false);

    // Trip Form State
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('🎒');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [newBudget, setNewBudget] = useState('');
    const [newProportion, setNewProportion] = useState<'proportional' | 'custom'>('proportional');
    const [newCustomP1, setNewCustomP1] = useState(50);

    const activeTrip = trips.find(t => t.id === activeTripId);

    const handleAddTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAddTrip({
            name: newName,
            icon: newIcon,
            budget: parseBRL(newBudget),
            proportionType: newProportion,
            customPercentage1: newProportion === 'custom' ? newCustomP1 : undefined,
        });
        setNewName('');
        setNewIcon('🎒');
        setNewBudget('');
        setIsAddingTrip(false);
    };

    const handleDeleteTrip = async (id: string) => {
        if (!confirm('Excluir esta viagem e todos os seus registros?')) return;
        await onDeleteTrip(id);
        if (activeTripId === id) setActiveTripId(null);
    };

    if (activeTripId && activeTrip) {
        return (
            <TripDetail
                trip={activeTrip}
                coupleInfo={coupleInfo}
                onBack={() => setActiveTripId(null)}
                onUpdate={(updates) => onUpdateTrip(activeTripId, updates)}
                onDelete={() => handleDeleteTrip(activeTripId)}
                onAddExpense={(exp) => onAddExpense(activeTripId, exp)}
                onDeleteExpense={(expId) => onDeleteExpense(activeTripId, expId)}
                onAddDeposit={(dep) => onAddDeposit(activeTripId, dep)}
                onDeleteDeposit={(depId) => onDeleteDeposit(activeTripId, depId)}
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header com Status e Botão principal */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-400"></span>
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Viagens
                        </h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                        Planeje suas viagens, controle orçamentos e divida os gastos de forma justa
                    </p>
                </div>

                <div className="flex items-center gap-6 w-full lg:w-auto z-10">
                    <div className="hidden sm:flex flex-col items-end pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Viagens Ativas</span>
                        <span className="text-2xl font-black text-blue-500 tabular-nums tracking-tighter">{trips.length}</span>
                    </div>

                    <button
                        onClick={() => setIsAddingTrip(!isAddingTrip)}
                        className={`flex-1 lg:flex-none ${isAddingTrip ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-slate-900 dark:bg-p1 text-white shadow-p1/30 shadow-2xl'} hover:brightness-110 px-10 py-5 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        {isAddingTrip ? 'Cancelar' : 'Nova Viagem'}
                    </button>
                </div>

                {/* Efeitos visuais de fundo */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            {isAddingTrip && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddingTrip(false)} />
                    <div className="relative bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">🎒 Planejar Nova Viagem</h3>
                            <p className="text-slate-500 font-bold text-sm">Organize as finanças da sua próxima aventura</p>
                        </div>

                        <form onSubmit={handleAddTrip} className="space-y-6">
                            <div className="flex gap-4">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block mb-1">Ícone</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border transition-all ${showIconPicker ? 'bg-p1 text-white border-p1' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'}`}
                                    >
                                        {newIcon}
                                    </button>

                                    {showIconPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[110]" onClick={() => setShowIconPicker(false)} />
                                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-4 z-[120] grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                {RECOMMENDED_ICONS.map(icon => (
                                                    <button
                                                        key={icon}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewIcon(icon);
                                                            setShowIconPicker(false);
                                                        }}
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 ${newIcon === icon ? 'bg-p1/10 ring-2 ring-p1 scale-110' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                                                    >
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome da Viagem</label>
                                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Gramado 2024" className="w-full h-14 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all" required />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Orçamento Estimado</label>
                                <input type="text" inputMode="decimal" value={newBudget} onChange={e => setNewBudget(formatAsBRL(e.target.value))} placeholder="R$ 0,00" className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-black text-xl text-blue-500 outline-none transition-all" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Como dividir os custos?</label>
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl gap-1 border border-slate-200 dark:border-white/5">
                                    {(['proportional', 'custom'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewProportion(type)}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${newProportion === type ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                        >
                                            {type === 'proportional' ? 'Proporcional ao Salário' : 'Percentual Personalizado %'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newProportion === 'custom' && (
                                <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-950/40 rounded-[2rem] border border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span className="text-p1">{coupleInfo.person1Name.split(' ')[0]} {newCustomP1}%</span>
                                        <span className="text-p2">{coupleInfo.person2Name.split(' ')[0]} {100 - newCustomP1}%</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100" value={newCustomP1}
                                        onChange={(e) => setNewCustomP1(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-p1"
                                    />
                                    <button type="button" onClick={() => setNewCustomP1(50)} className="w-full text-[9px] font-black uppercase text-slate-400 hover:text-p1">50/50</button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button type="button" onClick={() => setIsAddingTrip(false)} className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                                <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all uppercase text-[10px] tracking-widest">Criar Planejamento</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map(trip => (
                    <div key={trip.id} onClick={() => setActiveTripId(trip.id)} className="bg-white dark:bg-slate-800/60 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col min-h-[240px]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner border border-blue-100 dark:border-white/5 font-bold">
                                {trip.icon || '✈️'}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }}
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 text-slate-400 dark:text-slate-500 group-hover:text-red-500 rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                                title="Excluir Viagem"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1 tracking-tight">{trip.name}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {(trip.expenses?.length || 0)} Gastos • {(trip.deposits?.length || 0)} Aportes
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5 mt-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Gasto</p>
                                <p className="text-xl font-black text-p1 tabular-nums tracking-tighter">{formatCurrency((trip.expenses || []).reduce((acc, current) => acc + current.value, 0))}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>

                        {/* Efeito sutil de fundo */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                    </div>
                ))}

                {trips.length === 0 && !isAddingTrip && (
                    <div className="col-span-full py-24 bg-white dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner border border-slate-100 dark:border-white/5">🌍</div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Sua próxima viagem começa aqui</h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto">Crie seu planejamento, defina orçamentos e aproveite cada momento sem surpresas financeiras.</p>
                        <button onClick={() => setIsAddingTrip(true)} className="mt-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">Planejar Viagem Agora</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TripDetail: React.FC<{
    trip: Trip,
    coupleInfo: CoupleInfo,
    onBack: () => void,
    onUpdate: (updates: Partial<Trip>) => void,
    onDelete: () => void,
    onAddExpense: (exp: any) => void,
    onDeleteExpense: (id: string) => void,
    onAddDeposit: (dep: any) => void,
    onDeleteDeposit: (id: string) => void
}> = ({ trip, coupleInfo, onBack, onUpdate, onDelete, onAddExpense, onDeleteExpense, onAddDeposit, onDeleteDeposit }) => {
    const [view, setView] = useState<'expenses' | 'deposits'>('expenses');
    // State for Adding (Editing logic removed for simplicity in this migration step, can re-add later if needed but simple add/delete is safer for first pass)
    // Actually, let's keep basic add
    const [isAdding, setIsAdding] = useState(false);

    // Form inputs
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [person, setPerson] = useState<'person1' | 'person2' | 'fund'>('person1');

    const s1 = coupleInfo.salary1 || 0;
    const s2 = coupleInfo.salary2 || 0;
    const totalSalary = s1 + s2;
    const p1SalaryRatio = totalSalary > 0 ? (s1 / totalSalary) : 0.5;

    const expenses = trip.expenses || [];
    const deposits = trip.deposits || [];

    const settlement = calculateTripSettlement(trip, p1SalaryRatio);

    const {
        totalExpenses,
        totalPaidByP1,
        totalPaidByP2,
        totalPaidByFund,
        p1Responsibility: responsibilityP1,
        p2Responsibility: responsibilityP2,
        p1Balance: balanceP1,
        p2Balance: balanceP2,
        fundBalance
    } = settlement;

    const totalAportadoP1 = totalPaidByP1 + deposits.filter(d => d.person === 'person1').reduce((acc, curr) => acc + curr.value, 0);
    const totalAportadoP2 = totalPaidByP2 + deposits.filter(d => d.person === 'person2').reduce((acc, curr) => acc + curr.value, 0);

    const p1Percent = trip.proportionType === 'proportional' ? p1SalaryRatio * 100 : (trip.customPercentage1 ?? 50);
    const p2Percent = 100 - p1Percent;

    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const numValue = parseBRL(value);
        if (numValue <= 0) return;

        if (view === 'expenses') {
            await onAddExpense({
                description,
                value: numValue,
                paidBy: person,
                date: new Date().toISOString().split('T')[0],
                category: 'Viagem'
            });
        } else {
            const depositPerson = (person === 'fund' ? 'person1' : person) as 'person1' | 'person2';
            await onAddDeposit({
                description,
                value: numValue,
                person: depositPerson,
                date: new Date().toISOString().split('T')[0]
            });
        }

        resetForm();
    };

    const resetForm = () => {
        setDescription('');
        setValue('');
        setIsAdding(false);
        setPerson('person1');
    };

    const handleDeleteItem = async (id: string, type: 'expenses' | 'deposits') => {
        if (!confirm('Tem certeza?')) return;
        if (type === 'expenses') {
            onDeleteExpense(id);
        } else {
            onDeleteDeposit(id);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header com Status e Botão principal */}
            <div className="flex flex-col lg:row justify-between items-start lg:items-center gap-6 lg:gap-0 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40 rounded-xl text-slate-400 hover:text-p1 transition-all border border-slate-100 dark:border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {trip.name}
                            </h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-0.5">
                                Viagem em {trip.proportionType === 'proportional' ? 'Divisão Proporcional' : 'Divisão Personalizada'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto z-10">
                    <div className="flex flex-col items-end pr-4 border-r border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Gasto</span>
                        <span className="text-2xl font-black text-p1 tabular-nums tracking-tighter">{formatCurrency(totalExpenses)}</span>
                    </div>

                    <div className="flex gap-2 flex-1 lg:flex-none">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className={`flex-1 lg:flex-none ${isAdding ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-slate-900 dark:bg-p1 text-white shadow-p1/30 shadow-2xl'} hover:brightness-110 px-8 py-5 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            {isAdding ? 'Cancelar' : (view === 'expenses' ? 'Gasto' : 'Aporte')}
                        </button>

                        <button
                            onClick={onDelete}
                            className="p-5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                            title="Excluir Viagem"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {/* Efeito visual */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-p1/5 rounded-full blur-3xl text-p1"></div>
            </div>

            <div className="bg-white dark:bg-slate-900/40 rounded-[2rem] p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
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
                        bgColorClass="bg-white dark:bg-slate-900/40"
                        person="person1"
                    />
                    <BalanceCard
                        name={coupleInfo.person2Name}
                        responsibility={responsibilityP2}
                        deposited={totalAportadoP2}
                        balance={balanceP2}
                        colorClass="text-p2"
                        bgColorClass="bg-white dark:bg-slate-900/40"
                        person="person2"
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
                                    ✨ Novo Registro
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
                                    <div className="sm:col-span-2 space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">
                                                {view === 'expenses' ? 'Quem pagou?' : 'Quem depositou?'}
                                            </label>
                                            {view === 'expenses' && (
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    Saldo da Caixinha: <span className={fundBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}>{formatCurrency(fundBalance)}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 h-14">
                                            <button type="button" onClick={() => setPerson('person1')} className={`flex-1 rounded-xl font-bold text-[10px] uppercase transition-all flex flex-col items-center justify-center ${person === 'person1' ? 'bg-p1 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                                <span>{coupleInfo.person1Name.split(' ')[0]}</span>
                                            </button>
                                            <button type="button" onClick={() => setPerson('person2')} className={`flex-1 rounded-xl font-bold text-[10px] uppercase transition-all flex flex-col items-center justify-center ${person === 'person2' ? 'bg-p2 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                                <span>{coupleInfo.person2Name.split(' ')[0]}</span>
                                            </button>
                                            {view === 'expenses' && (
                                                <button type="button" onClick={() => setPerson('fund')} className={`flex-1 rounded-xl font-bold text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-0.5 ${person === 'fund' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                                    <span>Caixinha 📦</span>
                                                </button>
                                            )}
                                        </div>
                                        {view === 'expenses' && person === 'fund' && (
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-white/5 leading-relaxed">
                                                <span className="font-bold">ℹ️ Como funciona:</span> Está usando o dinheiro que vocês já depositaram anteriormente. Isso debitará do saldo da viagem (Caixinha) e não será cobrado de ninguém agora.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-p1 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all">
                                    {`Lançar ${view === 'expenses' ? 'Gasto' : 'Aporte'}`}
                                </button>
                            </form>
                        )}

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] no-scrollbar">
                            {view === 'expenses' ? (
                                expenses.map(exp => (
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
                                                            'Caixinha da Viagem'}
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
                                                <button onClick={() => handleDeleteItem(exp.id, 'expenses')} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                deposits.map(dep => (
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
                                                <button onClick={() => handleDeleteItem(dep.id, 'deposits')} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {(view === 'expenses' ? expenses.length : deposits.length) === 0 && !isAdding && (
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

const BalanceCard: React.FC<{ name: string, responsibility: number, deposited: number, balance: number, colorClass: string, bgColorClass: string, person: 'person1' | 'person2' }> = ({ name, responsibility, deposited, balance, colorClass, bgColorClass, person }) => {
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
