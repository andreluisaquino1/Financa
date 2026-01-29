import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';
import { useAppData } from '../hooks/useAppData';
import { Investment } from '../types';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

// Cores do Investidor10 (aprox) e do tema
const COLORS = ['#0052cc', '#ff9900', '#0099ff', '#36b37e', '#974cd0', '#6554c0'];
const RADIAN = Math.PI / 180;

const InvestmentTab: React.FC = () => {
    const { investments, addInvestment, updateInvestment, deleteInvestment, coupleInfo } = useAppData();
    const [activeView, setActiveView] = useState<'summary' | 'calculator'>('summary');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'buy' | 'sell'>('buy'); // visual only for now, logically same update
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<Investment['type']>('variable_income');
    const [currentValue, setCurrentValue] = useState('');
    const [investedValue, setInvestedValue] = useState(''); // "Preço Médio" or "Custo"
    const [owner, setOwner] = useState<'person1' | 'person2' | 'couple'>('couple');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculator State
    const [calcInitial, setCalcInitial] = useState<number>(1000);
    const [calcMonthly, setCalcMonthly] = useState<number>(500);
    const [calcRate, setCalcRate] = useState<number>(10);
    const [calcYears, setCalcYears] = useState<number>(5);
    const [calcPeriod, setCalcPeriod] = useState<'monthly' | 'yearly'>('yearly');
    const [calcData, setCalcData] = useState<any[]>([]);

    // --- CALCULATOR LOGIC ---
    useEffect(() => {
        const rate = calcRate / 100;
        const months = calcYears * 12;
        const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;

        let currentTotal = calcInitial;
        let totalInvested = calcInitial;
        const data = [];

        for (let i = 0; i <= months; i++) {
            // Record data point
            if (i % (calcYears > 5 ? 12 : 1) === 0) { // Optimize points for long periods
                data.push({
                    name: calcYears > 5 ? `${Math.floor(i / 12)}a` : `Mês ${i}`,
                    'Valor Investido': Math.round(totalInvested),
                    'Juros Acumulados': Math.round(currentTotal - totalInvested),
                    'Total Acumulado': Math.round(currentTotal)
                });
            }

            // Next month calculation
            if (i < months) {
                currentTotal = currentTotal * (1 + monthlyRate) + calcMonthly;
                totalInvested += calcMonthly;
            }
        }
        setCalcData(data);
    }, [calcInitial, calcMonthly, calcRate, calcYears]);

    // --- WALLET METRICS ---
    const summary = useMemo(() => {
        const equity = investments.reduce((acc, inv) => acc + inv.current_value, 0);
        const cost = investments.reduce((acc, inv) => acc + inv.invested_value, 0);
        const profit = equity - cost;
        const rentabilidade = cost > 0 ? (profit / cost) * 100 : 0;

        // Group by type for donut
        const byType: Record<string, number> = {};
        investments.forEach(inv => {
            byType[inv.type] = (byType[inv.type] || 0) + inv.current_value;
        });

        const donutData = Object.entries(byType).map(([key, value]) => ({
            name: getTypeLabel(key),
            value,
            key
        })).sort((a, b) => b.value - a.value);

        return { equity, cost, profit, rentabilidade, donutData };
    }, [investments]);

    // Group investments for list
    const groupedInvestments = useMemo(() => {
        const groups: Record<string, Investment[]> = {};
        investments.forEach(inv => {
            if (!groups[inv.type]) groups[inv.type] = [];
            groups[inv.type].push(inv);
        });
        return groups;
    }, [investments]);

    const handleEdit = (inv: Investment) => {
        setEditingId(inv.id);
        setName(inv.name);
        setType(inv.type);
        setInvestedValue(formatAsBRL((inv.invested_value * 100).toString()));
        setCurrentValue(formatAsBRL((inv.current_value * 100).toString()));
        setOwner(inv.owner);
        setIsModalOpen(true);
        setModalMode('buy'); // Edit is like a buy/adjust
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const cVal = parseBRL(currentValue);
        const iVal = parseBRL(investedValue);

        if (!name) return;

        const payload: any = {
            name,
            type,
            current_value: cVal,
            invested_value: iVal,
            owner
        };

        if (editingId) {
            await updateInvestment(editingId, payload);
        } else {
            await addInvestment(payload);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setName('');
        setCurrentValue('');
        setInvestedValue('');
        setType('variable_income');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* --- HEADER NAVIGATION --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto no-scrollbar">
                    <button
                        onClick={() => setActiveView('summary')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeView === 'summary' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        📊 Resumo Carteira
                    </button>
                    <button
                        onClick={() => setActiveView('calculator')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeView === 'calculator' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        🧮 Calculadora de Juros
                    </button>
                </div>
                <button
                    onClick={() => { closeModal(); setIsModalOpen(true); }}
                    className="w-full md:w-auto px-6 py-2 bg-p1 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-p1/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    + Adicionar Lançamento
                </button>
            </div>

            {/* --- VIEW: SUMMARY --- */}
            {activeView === 'summary' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    {/* KEY METRICS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            icon="💰" label="Patrimônio Total"
                            value={formatCurrency(summary.equity)}
                            subValue={`Custo: ${formatCurrency(summary.cost)}`}
                        />
                        <MetricCard
                            icon="📈" label="Lucro / Prejuízo"
                            value={formatCurrency(summary.profit)}
                            valueColor={summary.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}
                            subValue={summary.profit >= 0 ? '👍 Carteira positiva' : '👎 Carteira negativa'}
                        />
                        <MetricCard
                            icon="🚀" label="Rentabilidade"
                            value={`${summary.rentabilidade.toFixed(2)}%`}
                            valueColor={summary.rentabilidade >= 0 ? 'text-emerald-500' : 'text-red-500'}
                            subValue="Variação sobre custo"
                        />
                        <MetricCard
                            icon="🧺" label="Total de Ativos"
                            value={investments.length.toString()}
                            subValue="Itens na carteira"
                        />
                    </div>

                    {/* PROJECTION CHART (CURRENT WALLET) & DONUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-6">Alocação por Ativo</h3>
                            {summary.donutData.length > 0 ? (
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={summary.donutData} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: 'transparent' }}
                                                formatter={(value: any) => formatCurrency(value)}
                                            />
                                            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                                                {summary.donutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-slate-400 font-bold opacity-50">Sem dados para gráfico</div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center justify-center relative">
                            <h3 className="absolute top-6 left-6 text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Distribuição</h3>
                            {summary.donutData.length > 0 ? (
                                <div className="h-[250px] w-full mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={summary.donutData}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {summary.donutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : null}
                            {/* Total Center */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-4 pointer-events-none">
                                <span className="text-[10px] text-slate-400 font-black uppercase">TOTAL</span>
                                <div className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(summary.equity)}</div>
                            </div>
                        </div>
                    </div>

                    {/* ASSET LIST (ACCORDION STYLE) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 px-2 tracking-tight">Meus Ativos</h3>
                        {Object.entries(groupedInvestments).map(([type, items]) => {
                            const groupTotal = items.reduce((acc, i) => acc + i.current_value, 0);
                            const groupInvested = items.reduce((acc, i) => acc + i.invested_value, 0);
                            const groupProfit = groupTotal - groupInvested;
                            const groupYield = groupInvested > 0 ? (groupProfit / groupInvested) * 100 : 0;

                            return (
                                <div key={type} className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                    {/* Group Header */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center border-b border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                                                {getIconForType(type)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">{getTypeLabel(type)}</h4>
                                                <span className="text-[10px] font-bold text-slate-400">{items.length} ativos • {((groupTotal / summary.equity) * 100).toFixed(1)}% da carteira</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-slate-800 dark:text-slate-100 text-sm">{formatCurrency(groupTotal)}</div>
                                            <div className={`text-[10px] font-bold ${groupProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {groupProfit >= 0 ? '+' : ''}{groupProfit.toFixed(2)} ({groupYield.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assets Items */}
                                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                                        {items.map(item => {
                                            const itemProfit = item.current_value - item.invested_value;
                                            const itemYield = item.invested_value > 0 ? (itemProfit / item.invested_value) * 100 : 0;
                                            return (
                                                <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-1 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                                        <div>
                                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs text-left">{item.name}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex gap-2">
                                                                <span>Custo: {formatCurrency(item.invested_value)}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span>{item.owner === 'couple' ? 'Casal' : item.owner === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{formatCurrency(item.current_value)}</div>
                                                            <div className={`text-[10px] font-bold ${itemProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {itemYield.toFixed(2)}%
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1 text-slate-300 hover:text-p1 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => { if (confirm('Remover ativo?')) deleteInvestment(item.id); }}
                                                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- VIEW: CALCULATOR --- */}
            {activeView === 'calculator' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                            <span>🧮</span> Simulador de Juros Compostos
                        </h3>

                        {/* Inputs Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <CalcInput label="Valor Inicial" value={calcInitial} onChange={setCalcInitial} prefix="R$" />
                            <CalcInput label="Aporte Mensal" value={calcMonthly} onChange={setCalcMonthly} prefix="R$" />
                            <CalcInput label="Taxa (% a.a.)" value={calcRate} onChange={setCalcRate} suffix="%" />
                            <CalcInput label="Período (Anos)" value={calcYears} onChange={setCalcYears} suffix="anos" />
                        </div>

                        {/* Result Big Numbers */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Investido</p>
                                <p className="text-xl font-black text-slate-700 dark:text-slate-300">{formatCurrency(calcData[calcData.length - 1]?.['Valor Investido'] || 0)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Juros Acumulados</p>
                                <p className="text-xl font-black text-emerald-500">+{formatCurrency(calcData[calcData.length - 1]?.['Juros Acumulados'] || 0)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montante Final</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(calcData[calcData.length - 1]?.['Total Acumulado'] || 0)}</p>
                            </div>
                        </div>

                        {/* Graph */}
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={calcData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#36b37e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#36b37e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0052cc" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#0052cc" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={(val) => `R$${val / 1000}k`} tick={{ fontSize: 10 }} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="Total Acumulado" stroke="#36b37e" fillOpacity={1} fill="url(#colorTotal)" />
                                    <Area type="monotone" dataKey="Valor Investido" stroke="#0052cc" fillOpacity={1} fill="url(#colorInvested)" />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD/EDIT MODAL (Dialog Style) --- */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 font-sans">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-white/5">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {editingId ? 'Editar Lançamento' : 'Adicionar Lançamento'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">×</button>
                        </div>

                        {/* Fake Tabs for visual fidelity */}
                        <div className="flex border-b border-slate-100 dark:border-white/5">
                            <button className="flex-1 py-3 text-sm font-bold text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400">
                                Compra / Aporte
                            </button>
                            <button className="flex-1 py-3 text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                Venda / Resgate
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Tipo de Ativo</label>
                                    <select
                                        value={type} onChange={e => setType(e.target.value as any)}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    >
                                        <option value="fixed_income">Renda Fixa</option>
                                        <option value="variable_income">Ações</option>
                                        <option value="funds">Fundos</option>
                                        <option value="real_estate">FIIs / Imóveis</option>
                                        <option value="crypto">Criptomoedas</option>
                                        <option value="custom">Outros</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Data (Referência)</label>
                                    <input
                                        type="date" value={date} onChange={e => setDate(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Nome do Ativo / Ticker</label>
                                <input
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Ex: PETR4, Tesouro Selic 2029..."
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Valor Investido (Custo)</label>
                                    <input
                                        type="text" value={investedValue} onChange={e => setInvestedValue(formatAsBRL(e.target.value))}
                                        placeholder="R$ 0,00"
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Valor Atual</label>
                                    <input
                                        type="text" value={currentValue} onChange={e => setCurrentValue(formatAsBRL(e.target.value))}
                                        placeholder="R$ 0,00"
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Pertence a</label>
                                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                    {(['person1', 'person2', 'couple'] as const).map(p => (
                                        <button
                                            key={p} type="button" onClick={() => setOwner(p)}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${owner === p ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {p === 'couple' ? 'Casal' : p === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white py-3 rounded-lg font-bold text-sm hover:brightness-110 shadow-lg shadow-p1/20 transition-all active:scale-95">
                                    {editingId ? 'Salvar Alterações' : '+ Adicionar Lançamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const MetricCard: React.FC<{ icon: string, label: string, value: string, subValue?: string, valueColor?: string }> = ({ icon, label, value, subValue, valueColor = 'text-slate-800 dark:text-white' }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{icon}</span>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
        </div>
        <div className={`text-2xl font-black tracking-tight ${valueColor}`}>{value}</div>
        {subValue && <div className="text-[10px] font-bold text-slate-400 mt-1">{subValue}</div>}
    </div>
);

const CalcInput: React.FC<{ label: string, value: number, onChange: (v: number) => void, prefix?: string, suffix?: string }> = ({ label, value, onChange, prefix, suffix }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">{label}</label>
        <div className="relative group">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{prefix}</span>}
            <input
                type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))}
                className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 font-bold text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-p1 outline-none transition-all ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-8' : 'pr-4'}`}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{suffix}</span>}
        </div>
    </div>
);

function getTypeLabel(t: string) {
    const types: Record<string, string> = {
        'fixed_income': 'Renda Fixa',
        'variable_income': 'Ações',
        'crypto': 'Cripto',
        'funds': 'Fundos',
        'real_estate': 'FIIs / Imóveis',
        'custom': 'Outros'
    };
    return types[t] || t;
}

function getIconForType(t: string) {
    const icons: Record<string, string> = {
        'fixed_income': '🛡️',
        'variable_income': '📈',
        'crypto': '₿',
        'funds': '🏦',
        'real_estate': '🏢',
        'custom': '📦'
    };
    return icons[t] || '📦';
}

export default InvestmentTab;
