
import React from 'react';
import { formatCurrency } from '../../utils';

interface StatSmallProps {
    label: string;
    value: number;
}

const StatSmall: React.FC<StatSmallProps> = ({ label, value }) => (
    <div className="p-6 text-center transition-all hover:bg-slate-50/80 group">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 group-hover:text-blue-500 transition-colors">{label}</p>
        <p className="text-lg font-black text-slate-800 tracking-tight group-hover:scale-105 transition-transform">{formatCurrency(value)}</p>
    </div>
);

export default React.memo(StatSmall);
