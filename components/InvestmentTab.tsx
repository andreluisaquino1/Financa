import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatAsBRL, parseBRL } from '../utils';
import { useAppData } from '../hooks/useAppData';
import { Investment } from '../types';

const InvestmentTab: React.FC = () => {
    const { investments, addInvestment, updateInvestment, deleteInvestment, coupleInfo } = useAppData();
    const [activeTab, setActiveTab] = useState<'wallet' | 'calculator'>('wallet');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<Investment['type']>('fixed_income');
    const [currentValue, setCurrentValue] = useState('');
    const [investedValue, setInvestedValue] = useState('');
    const [owner, setOwner] = useState<'person1' | 'person2' | 'couple'>('couple');

    // Calculator State
    const [calcInitial, setCalcInitial] = useState<number>(0);
    const [calcMonthly, setCalcMonthly] = useState<number>(0);
    const [calcRate, setCalcRate] = useState<number>(0);
    const [calcYears, setCalcYears] = useState<number>(1);
    const [calcResult, setCalcResult] = useState<{ total: number; totalContributed: number; totalInterest: number } | null>(null);

    useEffect(() => {
        calculateInterest();
    }, [calcInitial, calcMonthly, calcRate, calcYears]);

    const calculateInterest = () => {
        let total = calcInitial;
        let totalContributed = calcInitial;
        const rate = calcRate / 100;
        const months = calcYears * 12;

        for (let i = 0; i < months; i++) {
            total = total * (1 + rate / 12) + calcMonthly;
            totalContributed += calcMonthly;
        }

        setCalcResult({
            total,
            totalContributed: totalContributed,
            totalInterest: total - totalContributed
        });
    };

    const resetForm = () => {
        setName('');
        setType('fixed_income');
        setCurrentValue('');
        setInvestedValue('');
        setOwner('couple');
        setEditingId(null);
    };

    const handleEdit = (inv: Investment) => {
        setName(inv.name);
        setType(inv.type);
        setCurrentValue(formatAsBRL((inv.current_value * 100).toString()));
        setInvestedValue(formatAsBRL((inv.invested_value * 100).toString()));
        setOwner(inv.owner);
        setEditingId(inv.id);
        setIsAdding(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const curVal = parseBRL(currentValue);
        const invVal = parseBRL(investedValue);

        if (!name || curVal < 0) return;

        const data: any = {
            name,
            type,
            current_value: curVal,
            invested_value: invVal,
            owner
        };

        if (editingId) {
            await updateInvestment(editingId, data);
        } else {
            await addInvestment(data);
        }
        setIsAdding(false);
        resetForm();
    };

    const totalEquity = useMemo(() => investments.reduce((acc, inv) => acc + inv.current_value, 0), [investments]);
    const totalInvested = useMemo(() => investments.reduce((acc, inv) => acc + inv.invested_value, 0), [investments]);
    const totalProfit = totalEquity - totalInvested;
    const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const getTypeLabel = (t: string) => {
        const types: Record<string, string> = {
            'fixed_income': 'Renda Fixa',
            'variable_income': 'Renda Variável',
            'crypto': 'Criptomoedas',
            'funds': 'Fundos',
            'real_estate': 'Imóveis/FIIs',
            'custom': 'Outros'
        };
        return types[t] || t;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <span className="text-4xl">💎</span>
                        Patrimônio & Investimentos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md mt-1">
                        Gerencie sua carteira de ativos e simule o futuro do seu patrimônio.
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'wallet' ? 'bg-white dark:bg-p1 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Minha Carteira
                    </button>
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calculator' ? 'bg-white dark:bg-p1 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        Simular Juros
                    </button>
                </div>
            </div>

            {activeTab === 'wallet' && (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-p1 rounded-full blur-[60px] opacity-20 transform translate-x-10 -translate-y-10"></div>
                            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-1">Patrimônio Total</h3>
                            <div className="text-4xl font-black tracking-tighter mb-4">{formatCurrency(totalEquity)}</div>
                            <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-lg">
                                <span>💰</span>
                                <span>{investments.length} ativos cadastrados</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5">
                            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-1">Total Investido (Custo)</h3>
                            <div className="text-3xl font-black text-slate-700 dark:text-slate-200 tracking-tighter mb-2">{formatCurrency(totalInvested)}</div>
                            <p className="text-xs text-slate-400 font-medium">Valor original aportado</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5">
                            <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-1">Rentabilidade Estimada</h3>
                            <div className={`text-3xl font-black tracking-tighter mb-2 ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                            </div>
                            <div className={`text-xs font-black px-2 py-0.5 rounded w-fit ${totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600'}`}>
                                {roi.toFixed(2)}% de retorno
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => { resetForm(); setIsAdding(true); }}
                            className="bg-slate-900 dark:bg-p1 hover:brightness-110 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-p1/20 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Novo Investimento
                        </button>
                    </div>

                    {/* List */}
                    {investments.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                            <div className="text-5xl mb-4 opacity-20">🏝️</div>
                            <h3 className="text-lg font-black text-slate-400">Sua carteira está vazia</h3>
                            <p className="text-sm text-slate-400/60 font-medium mt-1">Adicione seus investimentos para acompanhar o crescimento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {investments.map(inv => {
                                const profit = inv.current_value - inv.invested_value;
                                const yieldPerc = inv.invested_value > 0 ? (profit / inv.invested_value) * 100 : 0;

                                return (
                                    <div key={inv.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-xl hover:scale-[1.01] transition-all relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${inv.type === 'fixed_income' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                                            inv.type === 'variable_income' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                                inv.type === 'crypto' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                                                                    'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                                                        }`}>
                                                        {getTypeLabel(inv.type)}
                                                    </span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                                                        {inv.owner === 'couple' ? 'Casal' : inv.owner === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{inv.name}</h3>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(inv)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-p1 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => confirm('Excluir este ativo?') && deleteInvestment(inv.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end pb-4 border-b border-slate-50 dark:border-white/5">
                                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Valor Atual</div>
                                                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{formatCurrency(inv.current_value)}</div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 font-bold">Investido</span>
                                                <span className="font-bold text-slate-600 dark:text-slate-300">{formatCurrency(inv.invested_value)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400 font-bold">Retorno</span>
                                                <span className={`font-black ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({Math.round(yieldPerc)}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'calculator' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-p1/10 flex items-center justify-center text-xl">🧮</div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Simulador de Juros</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Aporte Inicial</label>
                                <input
                                    type="number"
                                    value={calcInitial}
                                    onChange={(e) => setCalcInitial(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Aporte Mensal</label>
                                <input
                                    type="number"
                                    value={calcMonthly}
                                    onChange={(e) => setCalcMonthly(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Taxa (% a.a.)</label>
                                    <input
                                        type="number"
                                        value={calcRate}
                                        onChange={(e) => setCalcRate(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tempo (Anos)</label>
                                    <input
                                        type="number"
                                        value={calcYears}
                                        onChange={(e) => setCalcYears(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                        placeholder="1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10 space-y-8">
                            <div>
                                <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Montante Final Estimado</h4>
                                <div className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-400">
                                    {calcResult ? formatCurrency(calcResult.total) : formatCurrency(0)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <h5 className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Investido</h5>
                                    <div className="text-lg font-bold text-slate-200">
                                        {calcResult ? formatCurrency(calcResult.totalContributed) : formatCurrency(0)}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <h5 className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Total em Juros</h5>
                                    <div className="text-lg font-bold text-emerald-400">
                                        +{calcResult ? formatCurrency(calcResult.totalInterest) : formatCurrency(0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsAdding(false); resetForm(); }} />
                    <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {editingId ? 'Editar Investimento' : 'Novo Investimento'}
                            </h3>
                            <p className="text-slate-500 font-bold text-sm">Adicione um ativo à sua carteira</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome do Ativo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ex: CDB Nubank, PETR4, Bitcoin..."
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:opacity-30"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tipo</label>
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all appearance-none"
                                    >
                                        <option value="fixed_income">Renda Fixa</option>
                                        <option value="variable_income">Ações/Stocks</option>
                                        <option value="funds">Fundos</option>
                                        <option value="real_estate">FIIs/Imóveis</option>
                                        <option value="crypto">Cripto</option>
                                        <option value="custom">Outro</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Dono</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl gap-1 border border-slate-200 dark:border-white/5 h-[58px]">
                                        <button
                                            type="button" onClick={() => setOwner('person1')}
                                            className={`flex-1 rounded-xl font-bold text-xs transition-all ${owner === 'person1' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                        >
                                            {coupleInfo.person1Name.split(' ')[0]}
                                        </button>
                                        <button
                                            type="button" onClick={() => setOwner('person2')}
                                            className={`flex-1 rounded-xl font-bold text-xs transition-all ${owner === 'person2' ? 'bg-white dark:bg-slate-800 shadow-sm text-p2 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                        >
                                            {coupleInfo.person2Name.split(' ')[0]}
                                        </button>
                                        <button
                                            type="button" onClick={() => setOwner('couple')}
                                            className={`flex-1 rounded-xl font-bold text-xs transition-all ${owner === 'couple' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                        >
                                            Casal
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Investido (Custo)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                        <input
                                            type="text"
                                            value={investedValue}
                                            onChange={e => setInvestedValue(formatAsBRL(e.target.value))}
                                            placeholder="0,00"
                                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Valor Atual</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                        <input
                                            type="text"
                                            value={currentValue}
                                            onChange={e => setCurrentValue(formatAsBRL(e.target.value))}
                                            placeholder="0,00"
                                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-4 font-black text-slate-900 dark:text-slate-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); resetForm(); }}
                                    className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all active:scale-[0.98] uppercase text-[10px] tracking-widest">
                                    {editingId ? 'Salvar Alterações 💾' : 'Adicionar Ativo 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentTab;
