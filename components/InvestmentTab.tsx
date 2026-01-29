import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils';

const InvestmentTab: React.FC = () => {
    const [initialAmount, setInitialAmount] = useState<number>(0);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
    const [interestRate, setInterestRate] = useState<number>(0);
    const [years, setYears] = useState<number>(1);
    const [compoundFrequency, setCompoundFrequency] = useState<'monthly' | 'yearly'>('monthly');

    const [result, setResult] = useState<{ total: number; totalContributed: number; totalInterest: number } | null>(null);

    useEffect(() => {
        calculate();
    }, [initialAmount, monthlyContribution, interestRate, years, compoundFrequency]);

    const calculate = () => {
        let total = initialAmount;
        let totalContributed = initialAmount;
        const rate = interestRate / 100;
        const months = years * 12;

        if (compoundFrequency === 'monthly') {
            for (let i = 0; i < months; i++) {
                total = total * (1 + rate / 12) + monthlyContribution;
                totalContributed += monthlyContribution;
            }
        } else {
            for (let i = 0; i < years; i++) {
                total = total * (1 + rate) + (monthlyContribution * 12);
                totalContributed += (monthlyContribution * 12);
            }
        }

        setResult({
            total,
            totalContributed,
            totalInterest: total - totalContributed
        });
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Investimentos</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Simule e acompanhe o crescimento do seu patrimônio.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calculator Form */}
                <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-p1/10 flex items-center justify-center text-xl">📈</div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">Calculadora de Juros Compostos</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investimento Inicial</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input
                                    type="number"
                                    value={initialAmount}
                                    onChange={(e) => setInitialAmount(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aporte Mensal</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input
                                    type="number"
                                    value={monthlyContribution}
                                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taxa de Juros (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">{compoundFrequency === 'monthly' ? 'a.a.' : 'a.a.'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período (Anos)</label>
                                <input
                                    type="number"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-p1 focus:ring-1 focus:ring-p1 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-p1 rounded-full filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 space-y-8">
                        <div>
                            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Valor Total Acumulado</h4>
                            <div className="text-4xl md:text-5xl font-black tracking-tighter">
                                {result ? formatCurrency(result.total) : formatCurrency(0)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h5 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Total Investido</h5>
                                <div className="text-xl font-bold text-slate-200">
                                    {result ? formatCurrency(result.totalContributed) : formatCurrency(0)}
                                </div>
                            </div>
                            <div>
                                <h5 className="text-p1 font-bold uppercase tracking-widest text-[10px] mb-1">Total em Juros</h5>
                                <div className="text-xl font-bold text-p1">
                                    +{result ? formatCurrency(result.totalInterest) : formatCurrency(0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs">ℹ️</div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                O cálculo considera juros compostos anuais aportados mensalmente. Valores são estimativas e não garantem rentabilidade futura.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentTab;
