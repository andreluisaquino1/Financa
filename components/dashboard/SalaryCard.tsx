
import React, { useState } from 'react';
import { formatCurrency, formatAsBRL, parseBRL } from '../../utils';

interface SalaryCardProps {
    name: string;
    value: number;
    onChange: (v: number) => void;
    color: 'blue' | 'pink';
}

const SalaryCard: React.FC<SalaryCardProps> = ({ name, value, onChange, color }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(formatAsBRL((value * 100).toString()));

    const handleBlur = () => {
        setIsEditing(false);
        onChange(parseBRL(tempValue));
    };

    const accentColor = color === 'blue' ? 'text-blue-600' : 'text-pink-500';
    const accentBorder = color === 'blue' ? 'focus:border-blue-400' : 'focus:border-pink-300';

    return (
        <div className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 ${isEditing ? 'ring-4 ring-blue-50 border-blue-200 shadow-xl scale-[1.02]' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Renda Mensal</p>
                    <h4 className="text-sm font-bold text-slate-700">{name}</h4>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isEditing ? 'bg-blue-600 text-white rotate-90 shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            </div>

            {isEditing ? (
                <div className="flex items-center group">
                    <span className="text-slate-300 font-black text-2xl mr-2">R$</span>
                    <input
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        value={tempValue}
                        onChange={(e) => setTempValue(formatAsBRL(e.target.value))}
                        onBlur={handleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                        className={`w-full bg-transparent outline-none font-black text-4xl text-slate-900 tracking-tighter ${accentBorder}`}
                    />
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
