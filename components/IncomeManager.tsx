
import React, { useState } from 'react';
import { Income, CoupleInfo } from '../types';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface IncomeManagerProps {
    incomes: Income[];
    coupleInfo: CoupleInfo;
    monthKey: string;
    isPremium: boolean;
    onAddIncome: (inc: any) => Promise<void> | void;
    onUpdateIncome: (id: string, inc: any) => Promise<void> | void;
    onDeleteIncome: (id: string) => void;
    onUpdateBaseSalary: (person: 'person1' | 'person2', value: number, description?: string) => void;
    onShowPremium: () => void;
}

const CATEGORIES = [
    { label: 'Salário', icon: '💼' },
    { label: 'Investimento', icon: '📈' },
    { label: 'Bônus', icon: '🎁' },
    { label: 'Outros', icon: '💰' }
];

export const IncomeManager: React.FC<IncomeManagerProps> = ({
    incomes,
    coupleInfo,
    monthKey,
    isPremium,
    onAddIncome,
    onUpdateIncome,
    onDeleteIncome,
    onUpdateBaseSalary,
    onShowPremium
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [paidBy, setPaidBy] = useState<'person1' | 'person2'>('person1');
    const [category, setCategory] = useState('Salário');
    const [setAsDefault, setSetAsDefault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const monthIncomes = [...realMonthIncomes, ...virtualIncomes].sort((a, b) => {
        // Sort: Real first, then virtual? Or just by date/created?
        // Let's put Salário first usually.
        if (a.category === 'Salário' && b.category !== 'Salário') return -1;
        if (a.category !== 'Salário' && b.category === 'Salário') return 1;
        return 0;
    });

    const totalP1 = monthIncomes.filter(i => i.paidBy === 'person1').reduce((sum, i) => sum + i.value, 0);
    const totalP2 = monthIncomes.filter(i => i.paidBy === 'person2').reduce((sum, i) => sum + i.value, 0);

    const openModal = (inc?: Income) => {
        if (!isPremium && inc?.category !== 'Salário' && !inc) {
            // Check if adding new or editing extra
            if (!inc) {
                // onShowPremium(); // Let them open but lock categories later or keep simple
            }
        }

        if (inc) {
            // If virtual, we are technically "creating" a real one based on it
            if ((inc as any).isVirtual) {
                setEditingIncome(null); // It's new
            } else {
                setEditingIncome(inc);
            }
            setDescription(inc.description);
            setValue(formatAsBRL((inc.value * 100).toString()));
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Gestão de Renda</h2>
                        {!isPremium && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Recurso PRO</span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Organize salários, bônus e investimentos</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-p1 hover:bg-p1/90 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-p1/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <span>+</span> Adicionar Entrada
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Renda Total {coupleInfo.person1Name}</p>
                    <p className="text-2xl font-black text-p1">{formatCurrency(totalP1)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Renda Total {coupleInfo.person2Name}</p>
                    <p className="text-2xl font-black text-p2">{formatCurrency(totalP2)}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-slate-50 dark:border-white/5">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Tipo & Descrição</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoa</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right min-w-[120px]">Valor</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {monthIncomes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold italic">Nenhuma receita registrada este mês.</td>
                            </tr>
                        ) : monthIncomes.map(inc => (
                            <tr key={inc.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${(inc as any).isVirtual ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm ${(inc as any).isVirtual ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                            {(inc as any).isVirtual ? '🔄' : (CATEGORIES.find(c => c.label === inc.category)?.icon || '💰')}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{inc.description}</p>
                                                {(inc as any).isVirtual && (
                                                    <span className="text-[8px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                                        Fixo Mensal
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{inc.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${inc.paidBy === 'person1' ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'}`}>
                                        {inc.paidBy === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(inc.value)}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(inc)} className="p-2 text-slate-400 hover:text-p1 hover:bg-p1/5 rounded-xl transition-all" title={(inc as any).isVirtual ? "Editar este mês" : "Editar"}>📝</button>
                                        <button onClick={() => {
                                            if ((inc as any).isVirtual) {
                                                if (confirm('Deseja remover este salário fixo recorrente? Isso irá parar de gerar entradas futuras.')) {
                                                    onUpdateBaseSalary(inc.paidBy, 0, inc.description);
                                                }
                                            } else {
                                                onDeleteIncome(inc.id);
                                            }
                                        }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-4 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
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
                                    {CATEGORIES.map(cat => {
                                        const isSalary = cat.label === 'Salário';
                                        const currentSalariesCount = monthIncomes.filter(i => i.paidBy === paidBy && i.category === 'Salário').length;
                                        const isDisabled = !isPremium && !isSalary;
                                        const isSalaryLocked = !isPremium && isSalary && currentSalariesCount >= 1 && (!editingIncome || editingIncome.category !== 'Salário');

                                        return (
                                            <button
                                                key={cat.label}
                                                onClick={() => {
                                                    if (isDisabled || isSalaryLocked) {
                                                        onShowPremium();
                                                        return;
                                                    }
                                                    setCategory(cat.label);
                                                }}
                                                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${category === cat.label
                                                    ? 'bg-p1/5 border-p1 text-p1'
                                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-400'
                                                    } ${(isDisabled || isSalaryLocked) ? 'opacity-50 grayscale' : ''}`}
                                            >
                                                <span className="text-lg">{cat.icon}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-tight leading-none">{cat.label}</span>
                                                    {(isDisabled || isSalaryLocked) && <span className="text-[8px] font-bold text-amber-600 mt-1 uppercase flex items-center gap-0.5">🔒 PRO</span>}
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
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:opacity-30"
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
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-black text-2xl text-slate-900 dark:text-slate-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {category === 'Salário' && (
                                <div className="flex items-center gap-3 px-1 py-1">
                                    <button
                                        onClick={() => setSetAsDefault(!setAsDefault)}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${setAsDefault ? 'bg-p1 border-p1' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10'}`}
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
                                className={`w-full py-4 bg-slate-900 dark:bg-p1 text-white rounded-2xl font-black text-[10px] uppercase transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2`}
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
                </div>
            )}
        </div>
    );
};

