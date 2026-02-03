import React, { useState } from 'react';
import { QuickShortcut, CoupleInfo, ExpenseType } from '@/types';

interface Props {
    coupleInfo: CoupleInfo;
    onSave: (shortcuts: QuickShortcut[]) => Promise<void>;
    onClose: () => void;
}

const QuickShortcutsModal: React.FC<Props> = ({ coupleInfo, onSave, onClose }) => {
    const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(coupleInfo.quickShortcuts || []);
    const [isSaving, setIsSaving] = useState(false);

    const [newShortcut, setNewShortcut] = useState<Partial<QuickShortcut>>({
        description: '',
        category: coupleInfo.categories?.[0] ? (typeof coupleInfo.categories[0] === 'string' ? coupleInfo.categories[0] : coupleInfo.categories[0].name) : 'Outros',
        icon: '✨'
    });

    const handleAddShortcut = () => {
        if (!newShortcut.description || !newShortcut.category) return;
        const s: QuickShortcut = {
            id: Date.now().toString(),
            description: newShortcut.description,
            category: newShortcut.category,
            icon: newShortcut.icon || '✨',
            defaultType: newShortcut.defaultType,
            defaultValue: newShortcut.defaultValue
        };
        setShortcuts([...shortcuts, s]);
        setNewShortcut({
            description: '',
            category: newShortcut.category,
            icon: '✨'
        });
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
                <div className="px-8 py-6 border-b dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
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
                                <input
                                    type="text"
                                    value={newShortcut.icon}
                                    onChange={e => setNewShortcut({ ...newShortcut, icon: e.target.value })}
                                    className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-2 py-3.5 text-center text-xl outline-none focus:border-brand transition-all"
                                    placeholder="✨"
                                />
                                <input
                                    type="text"
                                    value={newShortcut.description}
                                    onChange={e => setNewShortcut({ ...newShortcut, description: e.target.value })}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand transition-all text-sm"
                                    placeholder="Nome do local (ex: Mercado)"
                                />
                            </div>
                            <select
                                value={newShortcut.category}
                                onChange={e => setNewShortcut({ ...newShortcut, category: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-brand transition-all text-sm"
                            >
                                {(coupleInfo.categories || []).map(cat => {
                                    const name = typeof cat === 'string' ? cat : cat.name;
                                    return <option key={name} value={name}>{name}</option>;
                                })}
                            </select>
                            <button
                                onClick={handleAddShortcut}
                                disabled={!newShortcut.description}
                                className="w-full bg-brand text-white font-black py-3.5 rounded-2xl shadow-lg shadow-brand/20 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
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
                            <div className="grid grid-cols-1 gap-3">
                                {shortcuts.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{s.icon || '✨'}</span>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.description}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{s.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveShortcut(s.id)}
                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickShortcutsModal;
