import React, { useState } from 'react';
import { QuickShortcut, CoupleInfo, ExpenseType } from '@/types';
import { formatAsBRL, parseBRL } from '@/utils';

interface Props {
    coupleInfo: CoupleInfo;
    onSave: (shortcuts: QuickShortcut[]) => Promise<void>;
    onClose: () => void;
}

const RECOMMENDED_ICONS = ['💰', '🏠', '🛒', '🚗', '🎮', '🏥', '🎓', '🛍️', '✈️', '💳', '🏖️', '🏰', '📦', '🍔', '👗', '💊', '🔋'];

const QuickShortcutsModal: React.FC<Props> = ({ coupleInfo, onSave, onClose }) => {
    const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(coupleInfo.quickShortcuts || []);
    const [isSaving, setIsSaving] = useState(false);

    const [newShortcut, setNewShortcut] = useState<Partial<QuickShortcut>>({
        description: '',
        category: coupleInfo.categories?.[0] ? (typeof coupleInfo.categories[0] === 'string' ? coupleInfo.categories[0] : coupleInfo.categories[0].name) : 'Outros',
        icon: '✨',
        defaultValue: 0
    });

    const [valueDisplay, setValueDisplay] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);

    const handleAddShortcut = () => {
        if (!newShortcut.description || !newShortcut.category) return;
        const s: QuickShortcut = {
            id: Date.now().toString(),
            description: newShortcut.description,
            category: newShortcut.category,
            icon: newShortcut.icon || '✨',
            defaultType: newShortcut.defaultType,
            defaultValue: parseBRL(valueDisplay) || undefined
        };
        setShortcuts([...shortcuts, s]);
        setNewShortcut({
            ...newShortcut,
            description: '',
            icon: '✨'
        });
        setValueDisplay('');
    };

    const handleRemoveShortcut = (id: string) => {
        setShortcuts(shortcuts.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(shortcuts);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300 border border-white/10">
                <div className="px-8 py-6 border-b dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-xl shadow-inner border border-brand/5">⚡</div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg">Meus Atalhos</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Agilidade no Lançamento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    {/* Form to add new */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Novo Atalho</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex gap-2">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowIconPicker(!showIconPicker)}
                                        className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-2xl flex items-center justify-center outline-none focus:border-brand transition-all shadow-sm"
                                    >
                                        {newShortcut.icon}
                                    </button>
                                    {showIconPicker && (
                                        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-20 grid grid-cols-4 gap-2 w-52 animate-in fade-in zoom-in-95 duration-200">
                                            {['✨', ...RECOMMENDED_ICONS].map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewShortcut({ ...newShortcut, icon });
                                                        setShowIconPicker(false);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={newShortcut.description}
                                    onChange={e => setNewShortcut({ ...newShortcut, description: e.target.value })}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand transition-all text-sm shadow-sm"
                                    placeholder="Ex: Mercado Atacadão"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={newShortcut.category}
                                    onChange={e => setNewShortcut({ ...newShortcut, category: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand transition-all text-xs shadow-sm appearance-none"
                                >
                                    {(coupleInfo.categories || []).map(cat => {
                                        const name = typeof cat === 'string' ? cat : cat.name;
                                        return <option key={name} value={name}>{name}</option>;
                                    })}
                                </select>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={valueDisplay}
                                        onChange={e => setValueDisplay(formatAsBRL(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand transition-all text-sm shadow-sm"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddShortcut}
                                disabled={!newShortcut.description}
                                className="w-full bg-brand text-white font-black py-4 rounded-2xl shadow-lg shadow-brand/20 hover:brightness-110 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 mt-2"
                            >
                                Adicionar à Minha Lista
                            </button>
                        </div>
                    </div>

                    {/* List existing */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Atalhos Salvos</h4>
                        {shortcuts.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 font-medium italic text-sm">
                                Nenhum atalho personalizado ainda.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 pb-4">
                                {shortcuts.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon || '✨'}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.description}</p>
                                                    {s.defaultValue !== undefined && s.defaultValue > 0 && (
                                                        <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-lg border border-brand/10">
                                                            R$ {formatAsBRL((Math.round(s.defaultValue * 100)).toString())}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-0.5">{s.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveShortcut(s.id)}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                                            title="Excluir atalho"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t dark:border-white/5 bg-slate-50 dark:bg-slate-950/40 shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-slate-900 dark:bg-brand text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Salvar Ativação de Atalhos
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickShortcutsModal;
