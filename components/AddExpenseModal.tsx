
import React, { useState } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '../types';
import { formatAsBRL, parseBRL } from '../utils';

interface AddExpenseModalProps {
    type: ExpenseType;
    coupleInfo: CoupleInfo;
    initialData?: Expense | null;
    onClose: () => void;
    onAdd: (exp: any) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    type,
    coupleInfo,
    initialData,
    onClose,
    onAdd
}) => {
    const [description, setDescription] = useState(initialData?.description || '');
    const [value, setValue] = useState(initialData?.totalValue ? formatAsBRL((initialData.totalValue * 100).toString()) : '');
    const [category, setCategory] = useState(initialData?.category || (coupleInfo.categories?.[0] || 'Outros'));
    const [paidBy, setPaidBy] = useState<'person1' | 'person2'>(initialData?.paidBy || 'person1');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');
    const [splitMethod, setSplitMethod] = useState<'proportional' | 'equal'>(initialData?.splitMethod || 'proportional');

    const [onlyThisMonth, setOnlyThisMonth] = useState(false);

    const isPersonalType = type === ExpenseType.PERSONAL_P1 || type === ExpenseType.PERSONAL_P2;

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalValue = parseBRL(value);
        const monthKey = date.substring(0, 7);

        let finalMetadata = initialData?.metadata || {};
        let finalTotalValue = finalValue;

        if (type === ExpenseType.FIXED && initialData && onlyThisMonth) {
            finalTotalValue = initialData.totalValue;
            finalMetadata = {
                ...finalMetadata,
                overrides: {
                    ...(finalMetadata.overrides || {}),
                    [monthKey]: finalValue
                }
            };
        } else if (type === ExpenseType.FIXED && initialData && !onlyThisMonth) {
            if (finalMetadata.overrides) {
                const { [monthKey]: _, ...rest } = finalMetadata.overrides;
                finalMetadata = { ...finalMetadata, overrides: rest };
            }
        }

        onAdd({
            type,
            description,
            totalValue: finalTotalValue,
            category,
            paidBy: type === ExpenseType.PERSONAL_P1 ? 'person1' : (type === ExpenseType.PERSONAL_P2 ? 'person2' : paidBy),
            date,
            installments: type === ExpenseType.FIXED ? 1 : (parseInt(installments) || 1),
            splitMethod: type === ExpenseType.FIXED ? splitMethod : (type === ExpenseType.COMMON ? 'proportional' : (type === ExpenseType.EQUAL ? 'equal' : undefined)),
            metadata: finalMetadata
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-start sm:items-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in transition-all overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 relative my-auto border border-white/5">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
                    {initialData ? 'Editar Gasto' : 'Novo Gasto'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
                    {type === ExpenseType.FIXED ? 'Gasto fixo (repete todo mês)' : 'Lançamento pontual'}
                </p>

                {type === ExpenseType.FIXED && initialData && (
                    <div className="mb-6 flex items-center gap-3 bg-p1/5 p-4 rounded-2xl border border-p1/10">
                        <input
                            type="checkbox"
                            id="onlyThisMonth"
                            checked={onlyThisMonth}
                            onChange={e => setOnlyThisMonth(e.target.checked)}
                            className="w-5 h-5 rounded-lg text-p1 focus:ring-p1 border-slate-300 dark:border-slate-700 dark:bg-slate-800 transition-all"
                        />
                        <label htmlFor="onlyThisMonth" className="text-xs font-bold text-p1 leading-tight cursor-pointer">
                            Mudar valor apenas neste mês
                        </label>
                    </div>
                )}

                <form onSubmit={handleFinalSubmit} className="space-y-5">
                    {type === ExpenseType.FIXED && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Método de Divisão</label>
                            <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setSplitMethod('proportional')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${splitMethod === 'proportional' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    Proporcional
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitMethod('equal')}
                                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${splitMethod === 'equal' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    50%/50%
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Valor Total</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    required
                                    value={value}
                                    onChange={e => setValue(formatAsBRL(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Data</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                            placeholder="O que você comprou?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Categoria</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all appearance-none cursor-pointer"
                            >
                                {(coupleInfo.categories || ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']).map(cat => (
                                    <option key={cat} className="bg-white dark:bg-slate-900">{cat}</option>
                                ))}
                            </select>
                        </div>
                        {type !== ExpenseType.FIXED && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Parcelas</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={installments || ''}
                                    onChange={e => setInstallments(e.target.value)}
                                    placeholder="1"
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {!isPersonalType && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Quem pagou?</label>
                            <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-100 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setPaidBy('person1')}
                                    className={`flex-1 py-3.5 rounded-xl font-black transition-all ${paidBy === 'person1' ? 'bg-p1 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    {coupleInfo.person1Name.split(' ')[0]}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaidBy('person2')}
                                    className={`flex-1 py-3.5 rounded-xl font-black transition-all ${paidBy === 'person2' ? 'bg-p2 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    {coupleInfo.person2Name.split(' ')[0]}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-4.5 rounded-[1.25rem] shadow-xl shadow-slate-200 dark:shadow-none hover:bg-black dark:hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            {initialData ? 'Atualizar Gasto' : 'Confirmar Lançamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
