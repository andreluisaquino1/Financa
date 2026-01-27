import React, { useState, useEffect } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '../types';
import { formatAsBRL, parseBRL } from '../utils';

interface AddExpenseModalProps {
    type: ExpenseType;
    coupleInfo: CoupleInfo;
    initialData?: Expense | null;
    onClose: () => void;
    onAdd: (exp: any) => Promise<void> | void;
    isPremium?: boolean;
    onShowPremium?: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    type: initialType,
    coupleInfo,
    initialData,
    onClose,
    onAdd,
    isPremium,
    onShowPremium
}) => {
    const [currentType, setCurrentType] = useState<ExpenseType>(initialType);

    const [description, setDescription] = useState(initialData?.description || '');
    const [value, setValue] = useState(initialData?.totalValue ? formatAsBRL((initialData.totalValue * 100).toString()) : '');
    const [category, setCategory] = useState(initialData?.category || (coupleInfo.categories?.[0] || 'Outros'));
    const [paidBy, setPaidBy] = useState<'person1' | 'person2'>(initialData?.paidBy || 'person1');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');

    // Novo Estado de Divisão
    const [splitMethod, setSplitMethod] = useState<'proportional' | 'custom'>(initialData?.splitMethod || 'proportional');
    const [splitPercentage1, setSplitPercentage1] = useState<number>(initialData?.splitPercentage1 !== undefined ? initialData.splitPercentage1 : 50);
    const [specValue1, setSpecValue1] = useState(initialData?.specificValueP1 ? formatAsBRL((initialData.specificValueP1 * 100).toString()) : '');
    const [specValue2, setSpecValue2] = useState(initialData?.specificValueP2 ? formatAsBRL((initialData.specificValueP2 * 100).toString()) : '');
    const [showAdvancedSplit, setShowAdvancedSplit] = useState(!!(initialData?.specificValueP1 || initialData?.specificValueP2));

    const [reminderDay, setReminderDay] = useState<string>(initialData?.reminderDay?.toString() || '');
    const [onlyThisMonth, setOnlyThisMonth] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isPersonalType = currentType === ExpenseType.PERSONAL_P1 || currentType === ExpenseType.PERSONAL_P2;
    const isReimbursement = currentType === ExpenseType.REIMBURSEMENT;
    const isJoint = !isPersonalType && !isReimbursement;

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const finalValue = parseBRL(value);
            const monthKey = date.substring(0, 7);

            let finalMetadata = initialData?.metadata || {};
            let finalTotalValue = finalValue;

            if (currentType === ExpenseType.FIXED && initialData && onlyThisMonth) {
                finalTotalValue = initialData.totalValue;
                finalMetadata = {
                    ...finalMetadata,
                    overrides: {
                        ...(finalMetadata.overrides || {}),
                        [monthKey]: finalValue
                    }
                };
            } else if (currentType === ExpenseType.FIXED && initialData && !onlyThisMonth) {
                if (finalMetadata.overrides) {
                    const { [monthKey]: _, ...rest } = finalMetadata.overrides;
                    finalMetadata = { ...finalMetadata, overrides: rest };
                }
            }

            const expenseData = {
                type: currentType,
                description,
                totalValue: finalTotalValue,
                category,
                paidBy: isPersonalType ? (currentType === ExpenseType.PERSONAL_P1 ? 'person1' : 'person2') : paidBy,
                date,
                installments: currentType === ExpenseType.FIXED ? 1 : (parseInt(installments) || 1),
                splitMethod: isJoint ? splitMethod : undefined,
                splitPercentage1: (isJoint && splitMethod === 'custom') ? splitPercentage1 : undefined,
                specificValueP1: isJoint ? parseBRL(specValue1) : undefined,
                specificValueP2: isJoint ? parseBRL(specValue2) : undefined,
                metadata: finalMetadata,
                reminderDay: reminderDay ? parseInt(reminderDay) : undefined
            };

            await onAdd(expenseData);
        } catch (err) {
            console.error('❌ Erro no envio:', err);
            alert('Erro ao salvar lançamento. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 flex justify-center items-start sm:items-center z-[9999] p-4 backdrop-blur-sm animate-in fade-in transition-all overflow-y-auto">
            <div className="bg-white dark:bg-slate-800/95 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-lg animate-in slide-in-from-bottom duration-300 relative my-auto border border-slate-100 dark:border-white/5">
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
                    {isJoint ? 'Lançamento compartilhado' : (isReimbursement ? 'Solicitação de reembolso' : 'Gasto individual')}
                </p>

                {currentType === ExpenseType.FIXED && initialData && (
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

                <form onSubmit={handleFinalSubmit} className="space-y-4">
                    {/* 1. Data e Lembrete */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 h-4 flex items-center">Data</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all text-sm min-h-[52px]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 h-4 flex items-center gap-1">
                                Lembrete (Dia)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={reminderDay}
                                onChange={e => setReminderDay(e.target.value)}
                                placeholder="Ex: 05"
                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all text-sm min-h-[52px]"
                            />
                        </div>
                    </div>

                    {/* 2. Descrição */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                            placeholder="O que você comprou?"
                        />
                    </div>

                    {/* 3. Valor Total */}
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
                                onFocus={e => e.target.select()}
                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    {/* 4. Categoria e Parcelas */}
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
                        {currentType !== ExpenseType.FIXED && (
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

                    {/* Configurações Adicionais no Final */}
                    <div className="pt-4 space-y-4 border-t border-slate-100 dark:border-white/5">
                        {isJoint && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Periodicidade</label>
                                    <div className="flex gap-3 bg-slate-50 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentType(ExpenseType.COMMON)}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${currentType !== ExpenseType.FIXED ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            Variável
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentType(ExpenseType.FIXED)}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${currentType === ExpenseType.FIXED ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            Fixo (Mensal)
                                        </button>
                                    </div>
                                </div>

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
                                            onClick={() => setSplitMethod('custom')}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${splitMethod === 'custom' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            Percentual (%)
                                        </button>
                                    </div>
                                </div>

                                {splitMethod === 'custom' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                            <span className="text-p1">{coupleInfo.person1Name.split(' ')[0]} {splitPercentage1}%</span>
                                            <span className="text-p2">{coupleInfo.person2Name.split(' ')[0]} {100 - splitPercentage1}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100" value={splitPercentage1}
                                            onChange={(e) => setSplitPercentage1(Number(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-p1"
                                        />
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setSplitPercentage1(50)}
                                                className="text-[9px] font-black uppercase text-slate-400 hover:text-p1 transition-colors"
                                            >
                                                Resetar para 50/50
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedSplit(!showAdvancedSplit)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-p1 transition-colors px-1"
                                >
                                    <svg className={`w-3 h-3 transition-transform ${showAdvancedSplit ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    {showAdvancedSplit ? 'Ocultar partes específicas' : 'Adicionar partes específicas'}
                                </button>

                                {showAdvancedSplit && (
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-p1 uppercase tracking-wider px-1">Parte de {coupleInfo.person1Name.split(' ')[0]}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">R$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={specValue1}
                                                    onChange={e => setSpecValue1(formatAsBRL(e.target.value))}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-p1 rounded-xl pl-8 pr-3 py-2.5 font-bold text-xs text-slate-900 dark:text-slate-100 outline-none transition-all"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-p2 uppercase tracking-wider px-1">Parte de {coupleInfo.person2Name.split(' ')[0]}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">R$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={specValue2}
                                                    onChange={e => setSpecValue2(formatAsBRL(e.target.value))}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-p2 rounded-xl pl-8 pr-3 py-2.5 font-bold text-xs text-slate-900 dark:text-slate-100 outline-none transition-all"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-slate-900 dark:bg-p1 text-white font-black py-4.5 rounded-[1.25rem] shadow-xl shadow-slate-200 dark:shadow-none hover:bg-black dark:hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                initialData ? 'Atualizar Gasto' : 'Confirmar Lançamento'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
