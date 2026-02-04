import React, { useState } from 'react';
import { Category, CoupleInfo } from '@/types';
import { RECOMMENDED_ICONS } from '@/config/design';

interface Props {
    coupleInfo: CoupleInfo;
    onSave: (categories: Category[]) => Promise<void> | void;
    onClose: () => void;
}

const DEFAULT_INCOME_CATEGORIES: Category[] = [
    { name: 'Salário', icon: '💼' },
    { name: 'Investimento', icon: '📈' },
    { name: 'Bônus', icon: '🎁' },
    { name: 'Outros', icon: '💰' }
];

const IncomeCategoryManagerModal: React.FC<Props> = ({ coupleInfo, onSave, onClose }) => {
    const [categories, setCategories] = useState<Category[]>(() => {
        const initialCats = (coupleInfo.incomeCategories || []).map(c => typeof c === 'string' ? { name: c } : c);
        return initialCats.length > 0 ? initialCats : DEFAULT_INCOME_CATEGORIES;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('💰');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        const cat: Category = {
            name: newCategory.trim(),
            icon: selectedIcon
        };
        setCategories([...categories, cat]);
        setNewCategory('');
        setSelectedIcon('💰');
    };

    const handleRemoveCategory = (index: number) => {
        if (confirm(`Remover "${categories[index].name}"?`)) {
            setCategories(categories.filter((_, i) => i !== index));
        }
    };

    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const newCats = [...categories];
        if (direction === 'up' && index > 0) {
            [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
        } else if (direction === 'down' && index < newCats.length - 1) {
            [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
        }
        setCategories(newCats);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(categories);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10010] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300 border border-white/10">
                <div className="px-8 py-6 border-b dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-xl shadow-inner border border-emerald-500/5 text-emerald-600">💵</div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg">Categorias de Receita</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Gestão de Ganhos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nova Categoria de Receita</h4>
                        <div className="flex gap-2">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-2xl flex items-center justify-center outline-none focus:border-brand transition-all shadow-sm"
                                >
                                    {selectedIcon}
                                </button>
                                {showIconPicker && (
                                    <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-20 grid grid-cols-4 gap-2 w-52 animate-in fade-in zoom-in-95 duration-200">
                                        {RECOMMENDED_ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedIcon(icon);
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
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all text-sm shadow-sm"
                                placeholder="Ex: Freelas, Dividendos..."
                            />
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategory.trim()}
                                className="bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-2xl font-bold disabled:opacity-50"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Suas Categorias</h4>
                        <div className="grid grid-cols-1 gap-3 pb-4">
                            {categories.map((cat, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon || '💰'}</span>
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={cat.name}
                                                autoFocus
                                                onBlur={() => setEditingIndex(null)}
                                                onChange={(e) => {
                                                    const newCats = [...categories];
                                                    newCats[index].name = e.target.value;
                                                    setCategories(newCats);
                                                }}
                                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-bold outline-none dark:text-slate-100 w-32"
                                            />
                                        ) : (
                                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm cursor-pointer" onClick={() => setEditingIndex(index)}>{cat.name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                onClick={() => moveCategory(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[8px] leading-none disabled:opacity-20 transition-colors text-slate-400"
                                            >▲</button>
                                            <button
                                                onClick={() => moveCategory(index, 'down')}
                                                disabled={index === categories.length - 1}
                                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[8px] leading-none disabled:opacity-20 transition-colors text-slate-400"
                                            >▼</button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCategory(index)}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all active:scale-90"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t dark:border-white/5 bg-slate-50 dark:bg-slate-950/40 shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-emerald-600 dark:bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Categorias'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomeCategoryManagerModal;
