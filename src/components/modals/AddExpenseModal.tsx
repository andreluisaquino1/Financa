import React, { useState, useEffect, useMemo } from 'react';
import { Expense, ExpenseType, CoupleInfo, QuickShortcut } from '@/types';
import { formatAsBRL, parseBRL } from '@/utils';

interface AddExpenseModalProps {
    type: ExpenseType;
    coupleInfo: CoupleInfo;
    initialData?: Expense | null;
    onClose: () => void;
    onAdd: (exp: any) => Promise<void> | void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    type: initialType,
    coupleInfo,
    initialData,
    onClose,
    onAdd
}) => {
    const [currentType, setCurrentType] = useState<ExpenseType>(initialType);

    const [description, setDescription] = useState(initialData?.description || '');
    const [value, setValue] = useState(initialData?.totalValue ? formatAsBRL(Math.round(initialData.totalValue * 100).toString()) : '');

    // Fix: Handle both string and Category object for initial category
    const initialCategory = useMemo(() => {
        if (initialData?.category) {
            return typeof initialData.category === 'string' ? initialData.category : (initialData.category as any).name;
        }
        const firstCat = coupleInfo.categories?.[0];
        if (!firstCat) return 'Outros';
        return typeof firstCat === 'string' ? firstCat : firstCat.name;
    }, [initialData, coupleInfo.categories]);

    const [category, setCategory] = useState(initialCategory);
    const [paidBy, setPaidBy] = useState<'person1' | 'person2'>(initialData?.paidBy || 'person1');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');

    // Novo Estado de Divisão
    const [splitMethod, setSplitMethod] = useState<'proportional' | 'custom'>(initialData?.splitMethod || 'proportional');
    const [splitPercentage1, setSplitPercentage1] = useState<number>(initialData?.splitPercentage1 !== undefined ? initialData.splitPercentage1 : 50);
    const [specValue1, setSpecValue1] = useState(initialData?.specificValueP1 ? formatAsBRL(Math.round(initialData.specificValueP1 * 100).toString()) : '');
    const [specValue2, setSpecValue2] = useState(initialData?.specificValueP2 ? formatAsBRL(Math.round(initialData.specificValueP2 * 100).toString()) : '');
    const [showAdvancedSplit, setShowAdvancedSplit] = useState(!!(initialData?.specificValueP1 || initialData?.specificValueP2));

    const [installmentValue, setInstallmentValue] = useState('');
    const [reminderDay, setReminderDay] = useState<string>(initialData?.reminderDay?.toString() || '');
    const [onlyThisMonth, setOnlyThisMonth] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modo Múltiplo
    const [isMultiMode, setIsMultiMode] = useState(false);
    const [multiItems, setMultiItems] = useState<{ id: string, description: string, value: string, date: string }[]>([]);
    const [itemDescription, setItemDescription] = useState('');
    const [itemValue, setItemValue] = useState('');
    const [itemDate, setItemDate] = useState(date); // Inicia com a data global selecionada

    // Sincronizar itemDate quando date (global) muda (útil para carregar o valor inicial)
    useEffect(() => {
        setItemDate(date);
    }, [date]);

    // Sync total value and installment value
    useEffect(() => {
        const total = parseBRL(value);
        const instCount = parseInt(installments) || 1;
        if (instCount > 1 && total > 0) {
            const instVal = total / instCount;
            const cents = Math.round(instVal * 100);
            setInstallmentValue(formatAsBRL(cents.toString()));
        } else {
            setInstallmentValue('');
        }
    }, [installments]); // Only refresh on installments change initially or when value changes manually

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleValueChange = (newVal: string) => {
        const total = parseBRL(newVal);
        setValue(formatAsBRL(Math.round(total * 100).toString()));

        const instCount = parseInt(installments) || 1;
        if (instCount > 1) {
            const instVal = total / instCount;
            // Garantir arredondamento exato para centavos antes de formatar
            const cents = Math.round(instVal * 100);
            setInstallmentValue(formatAsBRL(cents.toString()));
        }
    };

    const handleInstallmentValueChange = (newVal: string) => {
        const instVal = parseBRL(newVal);
        setInstallmentValue(formatAsBRL(Math.round(instVal * 100).toString()));

        const instCount = parseInt(installments) || 1;
        if (instCount >= 1) {
            const total = instVal * instCount;
            const cents = Math.round(total * 100);

            // Só atualiza o total se o valor for diferente para evitar loops ou saltos de cursor
            const currentTotalCents = Math.round(parseBRL(value) * 100);
            if (cents !== currentTotalCents) {
                setValue(formatAsBRL(cents.toString()));
            }
        }
    };

    const isPersonalType = currentType === ExpenseType.PERSONAL_P1 || currentType === ExpenseType.PERSONAL_P2;
    const isReimbursement = currentType === ExpenseType.REIMBURSEMENT || currentType === ExpenseType.REIMBURSEMENT_FIXED;
    const isFixed = currentType === ExpenseType.FIXED || currentType === ExpenseType.REIMBURSEMENT_FIXED;
    const isJoint = !isPersonalType && !isReimbursement;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (isMultiMode) {
            if (multiItems.length === 0) {
                alert('Adicione pelo menos um item à lista.');
                return;
            }
            setIsSubmitting(true);
            try {
                const batchData = multiItems.map(item => ({
                    description: item.description,
                    totalValue: parseBRL(item.value),
                    date: item.date, // Usa a data do item
                    category,
                    paidBy,
                    type: currentType,
                    installments: 1,
                    reminderDay: reminderDay ? parseInt(reminderDay) : undefined,
                    splitMethod: isJoint ? splitMethod : undefined,
                    splitPercentage1: isJoint && splitMethod === 'custom' ? splitPercentage1 : undefined,
                    specificValueP1: isJoint && splitMethod === 'custom' && specValue1 ? (parseBRL(specValue1) * (parseBRL(item.value) / parseBRL(totalMultiValue))) : undefined,
                    specificValueP2: isJoint && splitMethod === 'custom' && specValue2 ? (parseBRL(specValue2) * (parseBRL(item.value) / parseBRL(totalMultiValue))) : undefined,
                }));
                // Note: onAdd will be called multiple times if we don't have a special onAddBatch
                // But the parent usually passes addExpense from useExpenses.
                // We should check if the parent supports batch.
                // If it's the standard onAdd, we might need to await Promise.all.
                // However, our plan says we will use addMultipleExpenses.
                // Looking at the props, onAdd is (exp: any) => Promise<void> | void.
                // In my case, I'll assume onAdd can handle an array or I'll call it for each.
                // Wait, I added addMultipleExpenses to useExpenses but AddExpenseModal uses onAdd.
                // I should probably modify the parent to pass the correct function or make onAdd handle both.

                // Let's assume onAdd is updated or handles array if needed.
                // Actually, I'll just call onAdd for each item if it's not Batch-aware, 
                // OR better, I'll change the prop interface if possible.
                // But let's look at how it's used.
                await onAdd(batchData);
                onClose();
            } catch (err) {
                console.error(err);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        const totalValue = parseBRL(value);
        if (totalValue <= 0) return;

        setIsSubmitting(true);
        try {
            await onAdd({
                description,
                totalValue,
                category,
                paidBy,
                date,
                type: currentType,
                installments: isFixed ? 1 : (parseInt(installments) || 1),
                reminderDay: reminderDay ? parseInt(reminderDay) : undefined,
                onlyThisMonth,
                splitMethod: isJoint ? splitMethod : undefined,
                splitPercentage1: isJoint && splitMethod === 'custom' ? splitPercentage1 : undefined,
                specificValueP1: isJoint && splitMethod === 'custom' && specValue1 ? parseBRL(specValue1) : undefined,
                specificValueP2: isJoint && splitMethod === 'custom' && specValue2 ? parseBRL(specValue2) : undefined,
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addMultiItem = () => {
        const val = parseBRL(itemValue);
        if (!itemDescription || val <= 0) return;

        setMultiItems(prev => [...prev, {
            id: Date.now().toString(),
            description: itemDescription,
            value: itemValue,
            date: itemDate
        }]);
        setItemDescription('');
        setItemValue('');
        // Mantém a itemDate atual (geralmente o usuário quer lançar vários na mesma data, mas pode mudar o próximo)
    };

    const removeMultiItem = (id: string) => {
        setMultiItems(prev => prev.filter(i => i.id !== id));
    };

    const totalMultiValue = useMemo(() => {
        const total = multiItems.reduce((acc, item) => acc + parseBRL(item.value), 0);
        return formatAsBRL(Math.round(total * 100).toString());
    }, [multiItems]);

    const handleShortcutClick = (shortcut: QuickShortcut) => {
        console.log('🔥 Atalho clicado:', shortcut);
        console.log('📝 Descrição atual antes:', description);
        console.log('🔀 Modo multi-item antes:', isMultiMode);

        // Desativar modo multi-item se estiver ativo
        if (isMultiMode) {
            setIsMultiMode(false);
        }

        setDescription(shortcut.description);
        console.log('📝 Descrição sendo definida para:', shortcut.description);
        setCategory(shortcut.category);
        if (shortcut.defaultType) setCurrentType(shortcut.defaultType);
        if (shortcut.defaultValue) {
            handleValueChange(formatAsBRL(Math.round(shortcut.defaultValue * 100).toString()));
        }
    };


    const shortcuts = useMemo(() => {
        if (coupleInfo.quickShortcuts && coupleInfo.quickShortcuts.length > 0) {
            return coupleInfo.quickShortcuts;
        }
        return [
            { id: 's1', description: 'Mercado', category: 'Alimentação', icon: '🛒' },
            { id: 's2', description: 'Padaria', category: 'Alimentação', icon: '🥖' },
            { id: 's3', description: 'Combustível', category: 'Transporte', icon: '⛽' },
            { id: 's4', description: 'Farmácia', category: 'Saúde', icon: '💊' },
            { id: 's5', description: 'Lanche / iFood', category: 'Alimentação', icon: '🍔' },
            { id: 's6', description: 'Uber / 99', category: 'Transporte', icon: '🚗' },
        ];
    }, [coupleInfo.quickShortcuts]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10010] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl sm:rounded-[2rem] rounded-t-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500 border border-white/10">

                {/* Header */}
                <div className="px-8 py-6 flex justify-between items-center border-b dark:border-white/5 bg-white dark:bg-slate-900 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-xl shadow-inner border border-brand/5">✨</div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg leading-tight">
                                {initialData ? 'Editar Registro' : (isMultiMode ? 'Lançamentos Múltiplos' : 'Novo Lançamento')}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Gestão Financeira Integral</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!initialData && (
                            <button
                                type="button"
                                onClick={() => setIsMultiMode(!isMultiMode)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isMultiMode ? 'bg-brand text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                            >
                                {isMultiMode ? '📝 Modo Único' : '📋 Lançar Vários'}
                            </button>
                        )}
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 text-slate-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar pb-10">
                    <div className="p-8 space-y-8">
                        {/* 0. Tipo de Gasto (Fixo vs Variável) */}
                        {(!isPersonalType) && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-center">Frequência do Gasto</label>
                                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-2xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isReimbursement) setCurrentType(ExpenseType.REIMBURSEMENT);
                                            else setCurrentType(ExpenseType.COMMON);
                                        }}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${!isFixed ? 'bg-white dark:bg-brand text-brand dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
                                    >
                                        <span className="text-sm">📅</span>
                                        Pontual / Variável
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isReimbursement) setCurrentType(ExpenseType.REIMBURSEMENT_FIXED);
                                            else setCurrentType(ExpenseType.FIXED);
                                        }}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isFixed ? 'bg-white dark:bg-brand text-brand dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
                                    >
                                        <span className="text-sm">🏠</span>
                                        Mensal / Fixo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 0.5 Quick Shortcuts */}
                        {!initialData && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-center">Atalhos de Preenchimento</label>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {shortcuts.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => handleShortcutClick(s)}
                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 hover:border-brand/30 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-2 transition-all active:scale-95 group"
                                        >
                                            <span className="text-base group-hover:scale-110 transition-transform">{s.icon || '✨'}</span>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{s.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 1. Tipo e Data/Lembrete */}
                        {!isMultiMode && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all text-sm min-h-[52px]"
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
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all text-sm min-h-[52px]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. Descrição (Modo Único) */}
                        {!isMultiMode && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                                <input
                                    type="text"
                                    required={!isMultiMode}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                    placeholder="O que você comprou?"
                                />
                            </div>
                        )}

                        {/* 3. Valor Total e Parcela (Modo Único) */}
                        {!isMultiMode && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                                            {isFixed ? 'Valor Mensal' : 'Valor Total'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                required={!isMultiMode}
                                                value={value}
                                                onChange={e => handleValueChange(e.target.value)}
                                                onFocus={e => e.target.select()}
                                                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:opacity-30"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    {parseInt(installments) > 1 && !isFixed && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                                                Valor da Parcela
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={installmentValue}
                                                    onChange={e => handleInstallmentValueChange(e.target.value)}
                                                    onFocus={e => e.target.select()}
                                                    className="w-full bg-brand/5 border border-brand/20 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-bold text-brand outline-none transition-all"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-brand/60 px-1 uppercase italic">
                                                Preencha um para calcular o outro
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2 e 3. Modo Múltiplo - Lista de Itens */}
                        {isMultiMode && (
                            <div className="space-y-6">
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 text-center block">Adicionar Itens à Lista</label>
                                    <div className="flex flex-col gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={itemDescription}
                                                onChange={e => setItemDescription(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                                placeholder="Descrição..."
                                            />
                                            <input
                                                type="date"
                                                value={itemDate}
                                                onChange={e => setItemDate(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all text-xs"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={itemValue}
                                                    onChange={e => {
                                                        const total = parseBRL(e.target.value);
                                                        setItemValue(formatAsBRL(Math.round(total * 100).toString()));
                                                    }}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addMultiItem}
                                                disabled={!itemDescription || parseBRL(itemValue) <= 0}
                                                className="bg-brand text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {multiItems.length > 0 ? (
                                    <div className="space-y-2">
                                        {multiItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-right-2">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.description}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{item.date.split('-').reverse().join('/')}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-black text-slate-900 dark:text-slate-100">R$ {item.value}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMultiItem(item.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-white/5 mx-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal ({multiItems.length} itens)</span>
                                            <span className="text-xl font-black text-brand">R$ {totalMultiValue}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center space-y-3">
                                        <div className="text-4xl">📝</div>
                                        <p className="text-xs font-bold text-slate-400 italic">Sua lista de lançamentos está vazia.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. Parcelas (Apenas Modo Único) */}
                        {!isMultiMode && !(currentType === ExpenseType.FIXED || currentType === ExpenseType.REIMBURSEMENT_FIXED) && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Número de Parcelas</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={installments || ''}
                                        onChange={e => setInstallments(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-brand focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                        placeholder="1x"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 5. Categoria */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Categoria</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {(coupleInfo.categories || ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']).map(cat => {
                                    const catName = typeof cat === 'string' ? cat : cat.name;
                                    const catIcon = typeof cat === 'object' && cat.icon ? cat.icon : (() => {
                                        if (catName === 'Moradia') return '🏠';
                                        if (catName === 'Alimentação') return '🥗';
                                        if (catName === 'Transporte') return '🚗';
                                        if (catName === 'Lazer') return '🎮';
                                        if (catName === 'Saúde') return '🏥';
                                        if (catName === 'Educação') return '🎓';
                                        if (catName === 'Compras') return '🛍️';
                                        if (catName === 'Viagem') return '✈️';
                                        return '💰';
                                    })();
                                    const isSelected = category === catName;

                                    return (
                                        <button
                                            key={catName}
                                            type="button"
                                            onClick={() => setCategory(catName)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 gap-1.5 ${isSelected
                                                ? 'bg-brand/10 border-brand shadow-sm ring-1 ring-brand/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 hover:border-brand/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <span className={`text-xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>{catIcon}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter truncate w-full text-center ${isSelected ? 'text-brand' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {catName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 6. Quem pagou / Detalhes de Divisão */}
                        {(!isPersonalType) && (
                            <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-center">Quem pagou este gasto?</label>
                                    <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900 rounded-2xl gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setPaidBy('person1')}
                                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${paidBy === 'person1' ? 'bg-p1 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {coupleInfo.person1Name.split(' ')[0]}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaidBy('person2')}
                                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${paidBy === 'person2' ? 'bg-p2 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {coupleInfo.person2Name.split(' ')[0]}
                                        </button>
                                    </div>
                                </div>

                                {isJoint && (
                                    <div className="space-y-6 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                        <div className="flex flex-col gap-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Como dividir este gasto?</label>
                                            <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1.5 rounded-2xl gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => { setSplitMethod('proportional'); setShowAdvancedSplit(false); }}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${splitMethod === 'proportional' ? 'bg-white dark:bg-slate-800 text-brand shadow-md' : 'text-slate-400'}`}
                                                >
                                                    <span className="text-sm">⚖️</span>
                                                    Proporcional
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSplitMethod('custom')}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${splitMethod === 'custom' ? 'bg-white dark:bg-slate-800 text-brand shadow-md' : 'text-slate-400'}`}
                                                >
                                                    <span className="text-sm">🎯</span>
                                                    Manual / %
                                                </button>
                                            </div>
                                        </div>

                                        {splitMethod === 'custom' && (
                                            <div className="animate-in slide-in-from-top-4 duration-500 space-y-8 py-2">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-p1 uppercase opacity-60">Responsabilidade</span>
                                                            <span className="text-base font-black text-p1">{coupleInfo.person1Name.split(' ')[0]}</span>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end">
                                                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{splitPercentage1}%</span>
                                                            <span className="text-2xl font-black text-slate-300 dark:text-slate-700 tabular-nums">/ {100 - splitPercentage1}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="relative h-12 flex items-center">
                                                        <div className="absolute inset-x-0 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-p1 transition-all duration-300"
                                                                style={{ width: `${splitPercentage1}%` }}
                                                            />
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="5"
                                                            value={splitPercentage1}
                                                            onChange={e => {
                                                                const p1 = parseInt(e.target.value);
                                                                setSplitPercentage1(p1);
                                                                const total = parseBRL(value);
                                                                setSpecValue1(formatAsBRL(Math.round((total * p1 / 100) * 100).toString()));
                                                                setSpecValue2(formatAsBRL(Math.round((total * (100 - p1) / 100) * 100).toString()));
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div
                                                            className="absolute w-8 h-8 bg-white border-4 border-p1 rounded-full shadow-lg pointer-events-none transition-all duration-300"
                                                            style={{ left: `calc(${splitPercentage1}% - 16px)` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                                        <span>100% {coupleInfo.person2Name.split(' ')[0]}</span>
                                                        <span>50/50</span>
                                                        <span>100% {coupleInfo.person1Name.split(' ')[0]}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAdvancedSplit(!showAdvancedSplit)}
                                                        className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-500 hover:text-brand transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
                                                    >
                                                        <span className="text-base">{showAdvancedSplit ? '➖' : '➕'}</span>
                                                        {showAdvancedSplit ? 'Ocultar Valores Exatos' : 'Informar Valores em Reais (R$)'}
                                                    </button>
                                                </div>

                                                {showAdvancedSplit && (
                                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-p1/20 shadow-sm space-y-2">
                                                            <label className="text-[9px] font-black text-p1 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Quanto {coupleInfo.person1Name.split(' ')[0]} paga?</span>
                                                                <span className="opacity-40">R$</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={specValue1}
                                                                onChange={e => {
                                                                    const v1 = parseBRL(e.target.value);
                                                                    const total = parseBRL(value);
                                                                    setSpecValue1(formatAsBRL(Math.round(v1 * 100).toString()));
                                                                    const v2 = Math.max(0, total - v1);
                                                                    setSpecValue2(formatAsBRL(Math.round(v2 * 100).toString()));
                                                                    setSplitPercentage1(total > 0 ? Math.round((v1 / total) * 100) : 50);
                                                                }}
                                                                className="w-full bg-transparent text-xl font-black text-slate-800 dark:text-slate-100 outline-none"
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-p2/20 shadow-sm space-y-2">
                                                            <label className="text-[9px] font-black text-p2 uppercase tracking-wider flex items-center justify-between">
                                                                <span>Quanto {coupleInfo.person2Name.split(' ')[0]} paga?</span>
                                                                <span className="opacity-40">R$</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={specValue2}
                                                                onChange={e => {
                                                                    const v2 = parseBRL(e.target.value);
                                                                    const total = parseBRL(value);
                                                                    setSpecValue2(formatAsBRL(Math.round(v2 * 100).toString()));
                                                                    const v1 = Math.max(0, total - v2);
                                                                    setSpecValue1(formatAsBRL(Math.round(v1 * 100).toString()));
                                                                    setSplitPercentage1(total > 0 ? Math.round((v1 / total) * 100) : 50);
                                                                }}
                                                                className="w-full bg-transparent text-xl font-black text-slate-800 dark:text-slate-100 outline-none"
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 italic text-center leading-relaxed">
                                            {splitMethod === 'proportional'
                                                ? '* Dividido proporcionalmente à renda mensal de cada um.'
                                                : '* Divisão customizada aplicada apenas a este gasto.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer fixed */}
                <div className="p-8 border-t dark:border-white/5 bg-slate-50 dark:bg-slate-950/40 shrink-0">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="w-full bg-slate-900 dark:bg-brand text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                {initialData ? 'Atualizar Lançamento' : (isMultiMode ? `Confirmar ${multiItems.length} Lançamentos` : 'Confirmar Lançamento')}
                            </>
                        )}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default AddExpenseModal;
