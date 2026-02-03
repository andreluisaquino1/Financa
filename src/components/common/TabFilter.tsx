
import React from 'react';

interface TabFilterProps {
    options: { id: string; label: string; icon?: string }[];
    activeId: string;
    onSelect: (id: string) => void;
    colorClass?: string;
}

const TabFilter: React.FC<TabFilterProps> = ({ options, activeId, onSelect, colorClass = 'bg-p1 text-white' }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {options.map((opt) => {
                const isActive = activeId === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${isActive
                                ? `${colorClass} border-transparent shadow-lg shadow-p1/20 scale-105`
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-400 hover:border-slate-200 dark:hover:border-white/10'
                            }`}
                    >
                        {opt.icon && <span className="text-xs">{opt.icon}</span>}
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
};

export default React.memo(TabFilter);
