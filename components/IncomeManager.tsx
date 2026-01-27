
import React, { useState } from 'react';
import { Income, CoupleInfo } from '../types';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface IncomeManagerProps {
    incomes: Income[];
    coupleInfo: CoupleInfo;
    monthKey: string;
    isPremium: boolean;
    onAddIncome: (inc: any) => void;
    onUpdateIncome: (id: string, inc: any) => void;
    onDeleteIncome: (id: string) => void;
    onShowPremium: () => void;
}

export const IncomeManager: React.FC<IncomeManagerProps> = ({
    incomes,
    coupleInfo,
    monthKey,
    isPremium,
    onAddIncome,
    onUpdateIncome,
    onDeleteIncome,
    onShowPremium
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [paidBy, setPaidBy] = useState<'person1' | 'person2'>('person1');

    const monthIncomes = incomes.filter(inc => inc.date.startsWith(monthKey));
    const totalP1 = monthIncomes.filter(i => i.paidBy === 'person1').reduce((sum, i) => sum + i.value, 0);
    const totalP2 = monthIncomes.filter(i => i.paidBy === 'person2').reduce((sum, i) => sum + i.value, 0);

    const openModal = (inc?: Income) => {
        if (!isPremium) {
            onShowPremium();
            return;
        }
        if (inc) {
            setEditingIncome(inc);
            setDescription(inc.description);
            setValue(formatAsBRL((inc.value * 100).toString()));
            setPaidBy(inc.paidBy);
        } else {
            setEditingIncome(null);
            setDescription('');
            setValue('');
            setPaidBy('person1');
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const payload = {
            description,
            value: parseBRL(value),
            paidBy,
            date: editingIncome?.date || `${monthKey}-01`
        };

        if (editingIncome) {
            onUpdateIncome(editingIncome.id, payload);
        } else {
            onAddIncome(payload);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Rendas Extras</h2>
                        {!isPremium && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Recurso PRO</span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Adicione bônus, dividendos ou freelas</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-p1 hover:bg-p1/90 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-p1/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    {!isPremium && <span className="text-xs">🔒</span>}
                    <span>+</span> Adicionar Receita
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extras {coupleInfo.person1Name}</p>
                    <p className="text-2xl font-black text-p1">{formatCurrency(totalP1)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extras {coupleInfo.person2Name}</p>
                    <p className="text-2xl font-black text-p2">{formatCurrency(totalP2)}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-slate-50 dark:border-white/5">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoa</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {monthIncomes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold italic">Nenhuma renda extra este mês.</td>
                            </tr>
                        ) : monthIncomes.map(inc => (
                            <tr key={inc.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{inc.description}</p>
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
                                        <button onClick={() => openModal(inc)} className="p-2 text-slate-400 hover:text-p1 hover:bg-p1/5 rounded-xl transition-all">📝</button>
                                        <button onClick={() => onDeleteIncome(inc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">🗑️</button>
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
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                {editingIncome ? 'Editar Receita' : 'Nova Receita Extra'}
                            </h3>
                            <p className="text-slate-500 font-bold text-sm">Adicione bônus ou rendas pontuais.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Quem recebeu?</label>
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
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ex: Bônus de Natal, Freela Grafitti"
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
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
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!description || !value}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                            >
                                Salvar Receita
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
