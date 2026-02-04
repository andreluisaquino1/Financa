
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Income, CoupleInfo } from '@/types';
import { formatCurrency, formatAsBRL, parseBRL } from '@/utils';

interface IncomeManagerProps {
    incomes: Income[];
    coupleInfo: CoupleInfo;
    monthKey: string;
    onAddIncome: (inc: any) => Promise<void> | void;
    onUpdateIncome: (id: string, inc: any) => Promise<void> | void;
    onDeleteIncome: (id: string) => void;
    onUpdateBaseSalary: (person: 'person1' | 'person2', value: number, description?: string) => void;
}

const DEFAULT_INCOME_CATEGORIES = [
    { name: 'Salário', icon: '💼' },
    { name: 'Investimento', icon: '📈' },
    { name: 'Bônus', icon: '🎁' },
    { name: 'Outros', icon: '💰' }
];

export const IncomeManager: React.FC<IncomeManagerProps> = ({
    incomes,
    coupleInfo,
    monthKey,
    onAddIncome,
    onUpdateIncome,
    onDeleteIncome,
    onUpdateBaseSalary,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [paidBy, setPaidBy] = useState<'person1' | 'person2'>('person1');
    const [category, setCategory] = useState('Salário');
    const [setAsDefault, setSetAsDefault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [search, setSearch] = useState('');
    const [filterPayer, setFilterPayer] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    const allCategories = React.useMemo(() => {
        const cats = (coupleInfo.incomeCategories || []).map(c => typeof c === 'string' ? { name: c } : c);
        if (cats.length > 0) return cats;
        return DEFAULT_INCOME_CATEGORIES;
    }, [coupleInfo.incomeCategories]);

    // Filter real incomes first
    const realMonthIncomes = incomes.filter(inc => inc.date.startsWith(monthKey));

    // Calculate duplicates/overrides check
    const hasP1Salary = realMonthIncomes.some(i => i.paidBy === 'person1' && i.category === 'Salário');
    const hasP2Salary = realMonthIncomes.some(i => i.paidBy === 'person2' && i.category === 'Salário');

    // Create virtual entries
    const virtualIncomes: Income[] = [];

    const p1Recurring = coupleInfo.person1RecurringIncomes || [];
    const p2Recurring = coupleInfo.person2RecurringIncomes || [];

    // Fallback Legacy migration for UI
    if (p1Recurring.length === 0 && coupleInfo.salary1 > 0) {
        p1Recurring.push({ id: 'legacy-p1', description: coupleInfo.salary1Description || 'Salário Base', value: coupleInfo.salary1 });
    }
    if (p2Recurring.length === 0 && coupleInfo.salary2 > 0) {
        p2Recurring.push({ id: 'legacy-p2', description: coupleInfo.salary2Description || 'Salário Base', value: coupleInfo.salary2 });
    }

    // Process Person 1 Recurring
    p1Recurring.forEach(rec => {
        // If there is ANY real income with same description for this month, don't show virtual
        const hasRealOverride = realMonthIncomes.some(i => i.paidBy === 'person1' && i.description === rec.description);

        if (!hasRealOverride) {
            virtualIncomes.push({
                id: `virtual-p1-${rec.id || rec.description}`,
                description: rec.description,
                value: rec.value,
                category: 'Salário',
                paidBy: 'person1',
                date: `${monthKey}-01`,
                household_id: 'virtual',
                user_id: 'virtual',
                createdAt: new Date().toISOString(),
                isVirtual: true // Custom flag for UI
            } as any);
        }
    });

    // Process Person 2 Recurring
    p2Recurring.forEach(rec => {
        const hasRealOverride = realMonthIncomes.some(i => i.paidBy === 'person2' && i.description === rec.description);

        if (!hasRealOverride) {
            virtualIncomes.push({
                id: `virtual-p2-${rec.id || rec.description}`,
                description: rec.description,
                value: rec.value,
                category: 'Salário',
                paidBy: 'person2',
                date: `${monthKey}-01`,
                household_id: 'virtual',
                user_id: 'virtual',
                createdAt: new Date().toISOString(),
                isVirtual: true // Custom flag for UI
            } as any);
        }
    });

    const monthIncomes = [...realMonthIncomes, ...virtualIncomes]
        .filter(inc => {
            if (filterPayer !== 'all' && inc.paidBy !== filterPayer) return false;
            if (filterCategory !== 'all' && inc.category !== filterCategory) return false;
            if (search && !inc.description.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (a.category === 'Salário' && b.category !== 'Salário') return -1;
            if (a.category !== 'Salário' && b.category === 'Salário') return 1;
            return 0;
        });

    const totalP1 = monthIncomes.filter(i => i.paidBy === 'person1').reduce((sum, i) => sum + i.value, 0);
    const totalP2 = monthIncomes.filter(i => i.paidBy === 'person2').reduce((sum, i) => sum + i.value, 0);

    const openModal = (inc?: Income) => {

        if (inc) {
            // If virtual, we are technically "creating" a real one based on it
            if ((inc as any).isVirtual) {
                setEditingIncome(null); // It's new
            } else {
                setEditingIncome(inc);
            }
            setDescription(inc.description);
            setValue(formatAsBRL(Math.round(inc.value * 100).toString()));
            setPaidBy(inc.paidBy);
            setCategory(inc.category || 'Salário');
        } else {
            setEditingIncome(null);
            setDescription('');
            setValue('');
            setPaidBy('person1');
            setCategory('Salário');
        }
        setSetAsDefault(false);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (isSubmitting) return;

        const payload = {
            description,
            value: parseBRL(value),
            paidBy,
            category,
            date: editingIncome?.date || `${monthKey}-01`
        };

        setIsSubmitting(true);
        try {
            if (editingIncome) {
                await onUpdateIncome(editingIncome.id, payload);
            } else {
                await onAddIncome(payload);
            }

            if (setAsDefault && category === 'Salário') {
                await onUpdateBaseSalary(paidBy, payload.value, description);
            }

            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving income:', err);
            alert('Erro ao salvar receita. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header com Status e Botão principal */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Gestão de Renda
                        </h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                        Organize seus ganhos, bonificações e acompanhe sua renda mensal total
                    </p>
                </div>


                <div className="flex items-center gap-6 w-full lg:w-auto z-10">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total {coupleInfo.person1Name.split(' ')[0]}</span>
                        <span className="text-2xl font-black text-p1 tabular-nums tracking-tighter">{formatCurrency(totalP1)}</span>
                    </div>

                    <div className="hidden md:flex flex-col items-end pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total {coupleInfo.person2Name.split(' ')[0]}</span>
                        <span className="text-2xl font-black text-p2 tabular-nums tracking-tighter">{formatCurrency(totalP2)}</span>
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="flex-1 lg:flex-none bg-slate-900 dark:bg-brand hover:brightness-110 text-white px-10 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-brand/30 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Adicionar Entrada
                    </button>
                </div>

                {/* Efeitos visuais de fundo */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
            </div>

            {/* Filtros e Busca */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-4 sm:p-6 rounded-[2rem] shadow-xl space-y-4">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                        {/* Busca Principal */}
                        <div className="relative flex-1">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Busca por descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-16 pr-6 py-4 text-base font-bold outline-none focus:border-brand focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-slate-100 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>

                        {/* Ações Rápidas de Filtro */}
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={filterPayer}
                                onChange={(e) => setFilterPayer(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-200"
                            >
                                <option value="all">👥 Todos Pagadores</option>
                                <option value="person1">👤 {coupleInfo.person1Name.split(' ')[0]}</option>
                                <option value="person2">👤 {coupleInfo.person2Name.split(' ')[0]}</option>
                            </select>

                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-6 py-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-200"
                            >
                                <option value="all">🏷️ Todas Categorias</option>
                                {allCategories.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.icon || '💰'} {cat.name}</option>
                                ))}
                            </select>

                            {(search || filterPayer !== 'all' || filterCategory !== 'all') && (
                                <button
                                    onClick={() => { setSearch(''); setFilterPayer('all'); setFilterCategory('all'); }}
                                    className="px-4 py-2 text-[10px] font-black uppercase text-brand hover:underline flex items-center gap-2"
                                >
                                    <span>✕</span> Limpar Filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="block lg:hidden space-y-4">
                {monthIncomes.length === 0 ? (
                    <div className="py-12 text-center bg-white dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                        <p className="text-slate-400 font-bold italic">Nenhuma receita registrada.</p>
                    </div>
                ) : monthIncomes.map(inc => (
                    <div key={inc.id} className={`p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm space-y-4 ${(inc as any).isVirtual ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800/60'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm ${(inc as any).isVirtual ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                    {(inc as any).isVirtual ? '🔄' : (allCategories.find(c => c.name === inc.category)?.icon || '💰')}
                                </span>
                                <div>
                                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{inc.description}</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        {typeof inc.category === 'string' ? inc.category : (inc.category as any)?.name || 'Outros'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900 dark:text-slate-100 text-lg">{formatCurrency(inc.value)}</p>
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${inc.paidBy === 'person1' ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'}`}>
                                    {inc.paidBy === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-50 dark:border-white/5">
                            <button onClick={() => openModal(inc)} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400">📝</button>
                            <button onClick={() => {
                                if ((inc as any).isVirtual) {
                                    if (confirm('Deseja remover este salário fixo recorrente?')) {
                                        onUpdateBaseSalary(inc.paidBy, 0, inc.description);
                                    }
                                } else {
                                    onDeleteIncome(inc.id);
                                }
                            }} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400">🗑️</button>
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
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest min-w-[240px]">💼 Tipo & Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">👤 Pessoa</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right min-w-[140px]">💰 Valor</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                            {monthIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center">
                                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest opacity-60 italic">Nenhuma receita registrada.</p>
                                    </td>
                                </tr>
                            ) : monthIncomes.map(inc => (
                                <tr key={inc.id} className={`group hover:bg-brand/5 dark:hover:bg-brand/10 transition-all ${(inc as any).isVirtual ? 'bg-blue-50/20 dark:bg-blue-900/5' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm border border-slate-100 dark:border-white/5 font-black ${(inc as any).isVirtual ? 'bg-blue-50 dark:bg-blue-900' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                                {(inc as any).isVirtual ? '🔄' : (allCategories.find(c => c.name === inc.category)?.icon || '💰')}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{inc.description}</p>
                                                    {(inc as any).isVirtual && (
                                                        <span className="bg-blue-400/10 text-blue-600 dark:text-blue-400 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black">
                                                            Fixo Mensal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tabular-nums italic">
                                                    {inc.category}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${inc.paidBy === 'person1' ? 'bg-p1/5 border-p1/20 text-p1' : 'bg-p2/5 border-p2/20 text-p2'}`}>
                                            {inc.paidBy === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="font-black text-slate-950 dark:text-white text-base tabular-nums tracking-tighter">{formatCurrency(inc.value)}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => openModal(inc)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:text-brand rounded-2xl shadow-xl hover:shadow-brand/20 border border-slate-100 dark:border-white/5 transition-all active:scale-90" title={(inc as any).isVirtual ? "Editar este mês" : "Editar"}>📝</button>
                                            <button onClick={() => {
                                                if ((inc as any).isVirtual) {
                                                    if (confirm('Deseja remover este salário fixo recorrente?')) {
                                                        onUpdateBaseSalary(inc.paidBy, 0, inc.description);
                                                    }
                                                } else {
                                                    onDeleteIncome(inc.id);
                                                }
                                            }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-2xl shadow-xl hover:shadow-red-500/20 border border-slate-100 dark:border-white/5 transition-all active:scale-90 ml-1">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                isModalOpen && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-lg animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                    {editingIncome ? 'Editar Entrada' : 'Nova Entrada de Renda'}
                                </h3>
                                <p className="text-slate-500 font-bold text-sm">Onde o dinheiro está entrando?</p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Pessoa responsável</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl gap-1 border border-slate-200 dark:border-white/5">
                                        <button
                                            onClick={() => setPaidBy('person1')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${paidBy === 'person1' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                        >
                                            {coupleInfo.person1Name}
                                        </button>
                                        <button
                                            onClick={() => setPaidBy('person2')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${paidBy === 'person2' ? 'bg-white dark:bg-slate-800 shadow-sm text-p2 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                        >
                                            {coupleInfo.person2Name}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Categoria da Receita</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allCategories.map(cat => {
                                            return (
                                                <button
                                                    key={cat.name}
                                                    onClick={() => {
                                                        setCategory(cat.name);
                                                    }}
                                                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${category === cat.name
                                                        ? 'bg-brand/5 border-brand text-brand'
                                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-400'
                                                        }`}
                                                >
                                                    <span className="text-lg">{cat.icon || '💰'}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-tight leading-none">{cat.name}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Ex: Salário Mensal, Rendição NuBank..."
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:opacity-30"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Valor</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={value}
                                            onChange={e => setValue(formatAsBRL(e.target.value))}
                                            placeholder="0,00"
                                            onFocus={e => e.target.select()}
                                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-black text-2xl text-slate-900 dark:text-slate-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {category === 'Salário' && (
                                    <div className="flex items-center gap-3 px-1 py-1">
                                        <button
                                            onClick={() => setSetAsDefault(!setAsDefault)}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${setAsDefault ? 'bg-brand border-brand' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10'}`}
                                        >
                                            {setAsDefault && <span className="text-white text-[10px]">✓</span>}
                                        </button>
                                        <div className="flex flex-col">
                                            <label
                                                onClick={() => setSetAsDefault(!setAsDefault)}
                                                className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight cursor-pointer"
                                            >
                                                Definir como Salário Base
                                            </label>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Isso atualizará seu salário fixo para os próximos meses</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!description || !value || isSubmitting}
                                    className={`w-full py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl font-black text-[10px] uppercase transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>Salvar Receita 🚀</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

