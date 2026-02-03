import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatAsBRL, parseBRL } from '@/utils';
import { useAppData } from '@/hooks/useAppData';
import { Investment } from '@/types';
import { investmentService } from '@/services/investmentService';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { calculatePortfolioSummary, calculateInvestmentStats } from '@/domain/investments';
import { InvestmentMovementType } from '@/types';

// Cores do Investidor10 (aprox) e do tema
const COLORS = ['#0052cc', '#ff9900', '#0099ff', '#36b37e', '#974cd0', '#6554c0'];
const RADIAN = Math.PI / 180;

const InvestmentTab: React.FC = () => {
    const {
        investments, addInvestment, updateInvestment, deleteInvestment,
        investmentMovements, addInvestmentMovement, deleteInvestmentMovement,
        coupleInfo
    } = useAppData();
    const [activeView, setActiveView] = useState<'summary' | 'calculator'>('summary');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<InvestmentMovementType>('buy');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<Investment['type']>('variable_income');
    const [currentValue, setCurrentValue] = useState('');
    const [investedValue, setInvestedValue] = useState(''); // "Preço Médio" or "Custo"
    const [owner, setOwner] = useState<'person1' | 'person2' | 'couple'>('couple');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [institution, setInstitution] = useState('');
    const [indexer, setIndexer] = useState('');
    const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('low');
    const [liquidity, setLiquidity] = useState('');
    const [notes, setNotes] = useState('');

    // Calculator State
    const [calcInitial, setCalcInitial] = useState<number>(1000);
    const [calcMonthly, setCalcMonthly] = useState<number>(500);
    const [calcRate, setCalcRate] = useState<number>(10);
    const [calcRatePeriod, setCalcRatePeriod] = useState<'yearly' | 'monthly'>('yearly');
    const [calcDuration, setCalcDuration] = useState<number>(5);
    const [calcDurationType, setCalcDurationType] = useState<'years' | 'months'>('years');
    const [calcData, setCalcData] = useState<any[]>([]);

    // --- CALCULATOR LOGIC ---
    useEffect(() => {
        const rate = calcRate / 100;

        // Determine monthly rate based on selection
        let monthlyRate = 0;
        if (calcRatePeriod === 'yearly') {
            monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
        } else {
            monthlyRate = rate;
        }

        // Determine total months
        const totalMonths = calcDurationType === 'years' ? calcDuration * 12 : calcDuration;

        let currentTotal = calcInitial;
        let totalInvested = calcInitial;
        const data = [];

        for (let i = 0; i <= totalMonths; i++) {
            // Record data point
            // For long periods (byte years > 5), show yearly. For short (months or < 5 years), show monthly or periodic
            const shouldPush = totalMonths > 60 ? i % 12 === 0 : true;

            if (shouldPush || i === totalMonths) {
                let label = '';
                if (calcDurationType === 'years') {
                    label = totalMonths > 60 ? `${Math.floor(i / 12)}a` : `Mês ${i}`;
                } else {
                    label = `Mês ${i}`;
                }

                // Avoid duplicates if last month coincides with loop step
                if (data.length === 0 || data[data.length - 1].name !== label) {
                    data.push({
                        name: label,
                        'Valor Investido': Math.round(totalInvested),
                        'Juros Acumulados': Math.round(currentTotal - totalInvested),
                        'Total Acumulado': Math.round(currentTotal)
                    });
                }
            }

            // Next month calculation
            if (i < totalMonths) {
                currentTotal = currentTotal * (1 + monthlyRate) + calcMonthly;
                totalInvested += calcMonthly;
            }
        }
        setCalcData(data);
    }, [calcInitial, calcMonthly, calcRate, calcRatePeriod, calcDuration, calcDurationType]);

    // --- WALLET METRICS ---
    const summary = useMemo(() => {
        const portfolio = calculatePortfolioSummary(investments, investmentMovements);

        // Group by type for donut
        const byType: Record<string, number> = {};
        investments.forEach(inv => {
            const stats = portfolio.statsByInvestment[inv.id];
            if (stats) {
                byType[inv.type] = (byType[inv.type] || 0) + stats.totalBalance;
            }
        });

        const donutData = Object.entries(byType).map(([key, value]) => ({
            name: getTypeLabel(key),
            value,
            key
        })).sort((a, b) => b.value - a.value);

        return {
            equity: portfolio.totalEquity,
            cost: portfolio.totalCost,
            profit: portfolio.totalProfit,
            rentabilidade: portfolio.totalYieldPercentage,
            donutData,
            portfolio
        };
    }, [investments, investmentMovements]);

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
        setOwner(inv.owner);
        setInstitution(inv.institution || '');
        setIndexer(inv.indexer || '');
        setRisk(inv.risk || 'low');
        setLiquidity(inv.liquidity || '');
        setNotes(inv.notes || '');

        // Stats for defaults
        const stats = summary.portfolio.statsByInvestment[inv.id];
        if (stats) {
            setQuantity(stats.quantity.toString());
            setInvestedValue(formatAsBRL(stats.investedAmount.toFixed(2)));
            setCurrentValue(formatAsBRL(stats.totalBalance.toFixed(2)));
        }

        setIsModalOpen(true);
        setModalMode('buy');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const qty = parseFloat(quantity.replace('.', '').replace(',', '.')) || 0;
        const ppu = parseBRL(pricePerUnit);
        const val = modalMode === 'yield' || modalMode === 'adjustment'
            ? parseBRL(currentValue) // Use currentValue as the yield amount
            : qty * ppu; // Buy/Sell value

        if (!name) return;

        let targetAssetId = editingId;

        // If not editing, find by name/owner/type OR create new
        if (!targetAssetId) {
            const existingAsset = investments.find(i =>
                i.name.toLowerCase() === name.toLowerCase() &&
                i.owner === owner &&
                i.type === type
            );

            if (existingAsset) {
                targetAssetId = existingAsset.id;
            } else {
                // Create new asset first
                const { data: newAsset } = await investmentService.create({
                    name, type, owner,
                    current_value: 0, invested_value: 0 // Will be derived
                } as any);
                if (newAsset) targetAssetId = newAsset.id;
            }
        }

        if (!targetAssetId) {
            alert('Não foi possível identificar ou criar o ativo.');
            return;
        }

        if (editingId) {
            // Update Asset Details
            await updateInvestment(editingId, {
                name, type, owner,
                institution, indexer, risk, liquidity, notes
            });
        }

        // Register Movement (Optional if only editing info? Let's check if values changed)
        // If user provided a positive qty or price or yield value, register it.
        if (val !== 0 || qty !== 0) {
            await addInvestmentMovement({
                investment_id: targetAssetId,
                type: modalMode,
                value: val,
                quantity: qty,
                price_per_unit: ppu,
                date,
                person: owner === 'person2' ? 'person2' : 'person1',
                description: modalMode === 'buy' ? 'Compra' : modalMode === 'sell' ? 'Venda' : modalMode === 'yield' ? 'Rendimento' : 'Ajuste'
            });
        }

        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setName('');
        setCurrentValue('');
        setInvestedValue('');
        setQuantity('');
        setPricePerUnit('');
        setType('variable_income');
        setModalMode('buy');
        setInstitution('');
        setIndexer('');
        setRisk('low');
        setLiquidity('');
        setNotes('');
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
                                            {/* Removido Legend para evitar flicker no tooltip/render */}
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
                                            const stats = summary.portfolio.statsByInvestment[item.id];
                                            if (!stats) return null;

                                            const itemProfit = stats.profit;
                                            const itemYield = stats.profitPercentage;
                                            const movements = investmentMovements.filter(m => m.investment_id === item.id);

                                            return (
                                                <div key={item.id} className="divide-y divide-slate-50 dark:divide-white/5">
                                                    <div className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex justify-between items-center group">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-1 h-8 rounded-full ${stats.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                            <div>
                                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm text-left flex items-center gap-2">
                                                                    {item.name}
                                                                    {item.institution && <span className="text-[10px] font-normal px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-400">{item.institution}</span>}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mt-0.5">
                                                                    <span className="text-slate-800 dark:text-slate-300">Qtd: {stats.quantity.toLocaleString()}</span>
                                                                    <span className="text-slate-200 dark:text-slate-700">|</span>
                                                                    <span>Custo: {formatCurrency(stats.investedAmount)}</span>
                                                                    <span className="text-slate-200 dark:text-slate-700">|</span>
                                                                    <span className="flex items-center gap-1">
                                                                        {item.risk === 'low' ? '🟢' : item.risk === 'medium' ? '🟡' : '🔴'} {item.owner === 'couple' ? 'Casal' : item.owner === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <div className="font-black text-slate-800 dark:text-slate-100 text-sm">{formatCurrency(stats.totalBalance)}</div>
                                                                <div className={`text-[10px] font-black flex items-center justify-end gap-1 ${itemProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                    {itemProfit >= 0 ? '▲' : '▼'} {Math.abs(itemYield).toFixed(2)}%
                                                                    <span className="text-[9px] font-bold opacity-60">({formatCurrency(itemProfit)})</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-p1 transition-colors"
                                                                    title="Editar / Lançar"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => { if (confirm('Remover ativo e todo seu histórico?')) deleteInvestment(item.id); }}
                                                                    className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="Excluir Ativo"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Phase 6: History Reveal (Nested) */}
                                                    <details className="group/details">
                                                        <summary className="px-4 py-1.5 bg-slate-50/50 dark:bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors list-none flex items-center gap-2">
                                                            <svg className="w-2.5 h-2.5 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                                            Histórico de Movimentações ({movements.length})
                                                        </summary>
                                                        <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                                                            {movements.map(m => (
                                                                <div key={m.id} className="flex justify-between items-center text-[10px] border-b border-dashed border-slate-100 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`px-1.5 py-0.5 rounded font-black text-[8px] uppercase ${m.type === 'buy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                                                m.type === 'sell' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                                                    m.type === 'yield' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                                                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                                            }`}>
                                                                            {m.type === 'buy' ? 'Compra' : m.type === 'sell' ? 'Venda' : m.type === 'yield' ? 'Rend.' : 'Ajuste'}
                                                                        </span>
                                                                        <div>
                                                                            <div className="font-bold text-slate-600 dark:text-slate-300">{new Date(m.date).toLocaleDateString()}</div>
                                                                            <div className="text-[9px] text-slate-400">{m.description || 'Sem descrição'}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-black text-slate-700 dark:text-slate-200">{formatCurrency(m.value)}</div>
                                                                        {m.quantity && <div className="text-[9px] text-slate-400">{m.quantity.toLocaleString()} x {formatCurrency(m.price_per_unit || 0)}</div>}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => { if (confirm('Remover esta movimentação?')) deleteInvestmentMovement(m.id); }}
                                                                        className="ml-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
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
                        {/* Inputs Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <CalcInput label="Valor Inicial" value={calcInitial} onChange={setCalcInitial} prefix="R$" />
                            <CalcInput label="Aporte Mensal" value={calcMonthly} onChange={setCalcMonthly} prefix="R$" />

                            {/* Taxa com Select */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Taxa de Juros</label>
                                <div className="flex">
                                    <input
                                        type="number" value={calcRate || ''} onChange={e => setCalcRate(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-l-xl py-3 pl-4 font-bold text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-p1 outline-none transition-all"
                                    />
                                    <select
                                        value={calcRatePeriod}
                                        onChange={e => setCalcRatePeriod(e.target.value as 'yearly' | 'monthly')}
                                        className="bg-slate-100 dark:bg-slate-800 border-y border-r border-slate-200 dark:border-slate-700 rounded-r-xl px-2 text-xs font-bold text-slate-500 dark:text-slate-400 outline-none"
                                    >
                                        <option value="yearly">% a.a.</option>
                                        <option value="monthly">% a.m.</option>
                                    </select>
                                </div>
                            </div>

                            {/* Período com Select */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Período</label>
                                <div className="flex">
                                    <input
                                        type="number" value={calcDuration || ''} onChange={e => setCalcDuration(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-l-xl py-3 pl-4 font-bold text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-p1 outline-none transition-all"
                                    />
                                    <select
                                        value={calcDurationType}
                                        onChange={e => setCalcDurationType(e.target.value as 'years' | 'months')}
                                        className="bg-slate-100 dark:bg-slate-800 border-y border-r border-slate-200 dark:border-slate-700 rounded-r-xl px-2 text-xs font-bold text-slate-500 dark:text-slate-400 outline-none"
                                    >
                                        <option value="years">Anos</option>
                                        <option value="months">Meses</option>
                                    </select>
                                </div>
                            </div>
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

                        <div className="flex border-b border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar">
                            <button
                                type="button"
                                onClick={() => setModalMode('buy')}
                                className={`flex-1 min-w-[100px] py-3 text-xs font-bold border-b-2 transition-colors ${modalMode === 'buy' ? 'text-emerald-600 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                Compra
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalMode('sell')}
                                className={`flex-1 min-w-[100px] py-3 text-xs font-bold border-b-2 transition-colors ${modalMode === 'sell' ? 'text-red-600 border-red-500 bg-red-50/50 dark:bg-red-500/10 dark:text-red-400' : 'text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                Venda
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalMode('yield')}
                                className={`flex-1 min-w-[100px] py-3 text-xs font-bold border-b-2 transition-colors ${modalMode === 'yield' ? 'text-blue-600 border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                Rendimento
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalMode('adjustment')}
                                className={`flex-1 min-w-[100px] py-3 text-xs font-bold border-b-2 transition-colors ${modalMode === 'adjustment' ? 'text-amber-600 border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 dark:text-amber-400' : 'text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                Ajuste
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* Top Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Tipo de Ativo</label>
                                    <select
                                        value={type} onChange={e => setType(e.target.value as any)}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    >
                                        <option value="fixed_income">Renda Fixa</option>
                                        <option value="variable_income">Ações / BDRs</option>
                                        <option value="funds">Fundos (FII, FIAGRO...)</option>
                                        <option value="real_estate">Imóveis</option>
                                        <option value="crypto">Criptomoedas</option>
                                        <option value="custom">Outros ativos</option>
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

                            {/* Ticker / Search Row */}
                            <div className="space-y-1.5 relative">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Nome do Ativo / Ticker</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text" value={name} onChange={e => setName(e.target.value.toUpperCase())}
                                        placeholder="Ex: PETR4, BCFF11, BTC..."
                                        className="flex-1 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100 uppercase"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!name) return alert('Digite um ticker para buscar.');
                                            const btn = document.getElementById('btn-fetch-quote');
                                            if (btn) btn.innerHTML = '⏳';

                                            try {
                                                const res = await fetch(`https://brapi.dev/api/quote/${name}?range=1d&interval=1d&fundamental=false`);
                                                const data = await res.json();

                                                if (data.results && data.results.length > 0) {
                                                    const quote = data.results[0].regularMarketPrice;
                                                    if (quote) {
                                                        const q = Number(quantity) || 0;
                                                        setPricePerUnit(formatAsBRL(quote.toFixed(2)));
                                                        if (q > 0) {
                                                            setCurrentValue(formatAsBRL((q * quote).toFixed(2)));
                                                        }
                                                        alert(`Cotação encontrada: ${formatCurrency(quote)}`);
                                                    }
                                                } else {
                                                    alert('Ativo não encontrado na B3/Cripto (Brapi).');
                                                }
                                            } catch (err) {
                                                alert('Erro ao buscar cotação.');
                                            } finally {
                                                if (btn) btn.innerHTML = '🔄';
                                            }
                                        }}
                                        id="btn-fetch-quote"
                                        className="h-10 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        🔄
                                    </button>
                                </div>
                            </div>

                            {/* Phase 2: Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Instituição</label>
                                    <input
                                        type="text" value={institution} onChange={e => setInstitution(e.target.value)}
                                        placeholder="Ex: Nubank, XP..."
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Indexador</label>
                                    <input
                                        type="text" value={indexer} onChange={e => setIndexer(e.target.value)}
                                        placeholder="Ex: CDI, IPCA..."
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Risco</label>
                                    <select
                                        value={risk} onChange={e => setRisk(e.target.value as any)}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    >
                                        <option value="low">Baixo</option>
                                        <option value="medium">Médio</option>
                                        <option value="high">Alto</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Liquidez</label>
                                    <input
                                        type="text" value={liquidity} onChange={e => setLiquidity(e.target.value)}
                                        placeholder="Ex: D+0, D+30..."
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            {/* Qty & Price Row (Only for Buy/Sell) */}
                            {(modalMode === 'buy' || modalMode === 'sell') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Quantidade {modalMode === 'sell' ? 'a Vender' : ''}</label>
                                        <input
                                            type="number" step="0.00000001" value={quantity} onChange={e => setQuantity(e.target.value)}
                                            placeholder="0"
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Preço Unitário {modalMode === 'sell' ? '(Venda)' : '(Médio/Atual)'}</label>
                                        <input
                                            type="text" value={pricePerUnit} onChange={e => setPricePerUnit(formatAsBRL(e.target.value))}
                                            placeholder="R$ 0,00"
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Value Field (For Yield/Adjustment or display for Buy/Sell) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {modalMode === 'yield' ? 'Valor do Rendimento' : modalMode === 'adjustment' ? 'Valor do Ajuste' : 'Total da Operação'}
                                </label>
                                <input
                                    type="text"
                                    value={modalMode === 'yield' || modalMode === 'adjustment' ? currentValue : formatAsBRL(((Number(quantity) || 0) * parseBRL(pricePerUnit)).toFixed(2))}
                                    onChange={e => setCurrentValue(formatAsBRL(e.target.value))}
                                    readOnly={modalMode === 'buy' || modalMode === 'sell'}
                                    className={`w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-p1 outline-none dark:text-slate-100 ${modalMode === 'buy' || modalMode === 'sell' ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed' : ''}`}
                                />
                                {(modalMode === 'buy' || modalMode === 'sell') && (
                                    <p className="text-[10px] text-slate-400 pt-1">Calculado automaticamente: Qtd × Preço</p>
                                )}
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
