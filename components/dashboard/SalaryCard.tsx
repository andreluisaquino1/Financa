
import React, { useState } from 'react';
import { formatCurrency, formatAsBRL, parseBRL } from '../../utils';

interface SalaryCardProps {
    name: string;
    value: number;
    onChange: (v: number, isGlobal?: boolean) => void;
    color: 'blue' | 'pink';
}

const SalaryCard: React.FC<SalaryCardProps> = ({ name, value, onChange, color }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(formatAsBRL((value * 100).toString()));
    const [applyToAll, setApplyToAll] = useState(false);

    const handleBlur = () => {
        // We don't close on blur if we want them to click the confirm button to decide if it applies to all
        // But for better UX, maybe we just use a "Confirm" button
    };

    const handleSave = () => {
        setIsEditing(false);
        onChange(parseBRL(tempValue), applyToAll);
    };

    const accentColor = color === 'blue' ? 'text-blue-600' : 'text-pink-500';
    const accentBorder = color === 'blue' ? 'border-blue-400 focus:ring-blue-100' : 'border-pink-300 focus:ring-pink-100';

    return (
        <div className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 ${isEditing ? 'ring-4 ring-slate-100 border-slate-200 shadow-xl scale-[1.02]' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Salário do Mês</p>
                    <h4 className="text-sm font-bold text-slate-700">{name}</h4>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => {
                            setTempValue(formatAsBRL((value * 100).toString()));
                            setIsEditing(true);
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center group bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 font-black text-xl mr-2">R$</span>
                        <input
                            autoFocus
                            type="text"
                            inputMode="decimal"
                            value={tempValue}
                            onChange={(e) => setTempValue(formatAsBRL(e.target.value))}
                            className="w-full bg-transparent outline-none font-black text-3xl text-slate-900 tracking-tighter"
                        />
                    </div>

                    <div className="flex items-center gap-3 px-1">
                        <input
                            type="checkbox"
                            id={`apply-all-${name}`}
                            checked={applyToAll}
                            onChange={e => setApplyToAll(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`apply-all-${name}`} className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">
                            Definir como padrão para próximos meses
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-[2] py-3 px-4 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase hover:bg-black transition-all shadow-lg"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-baseline gap-1">
                    <p className={`text-4xl font-black tracking-tighter ${accentColor}`}>
                        {formatCurrency(value)}
                    </p>
                    <span className="text-[10px] font-bold text-slate-300 tracking-normal uppercase">BRL</span>
                </div>
            )}
        </div>
    );
};

export default React.memo(SalaryCard);
