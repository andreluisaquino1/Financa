
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/utils';

interface Props {
    data: Record<string, number>;
}

const CategoryChart: React.FC<Props> = ({ data }) => {
    const chartData = Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    if (chartData.length === 0) return null;

    const COLORS = ['#2563eb', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-3 rounded-xl shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[350px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={8}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="transparent"
                                className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CategoryChart;
