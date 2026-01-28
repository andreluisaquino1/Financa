
import React, { useMemo } from 'react';
import { CoupleInfo, Expense, MonthlySummary } from '../types';
import { formatCurrency } from '../utils';
import ClosingBreakdown from './dashboard/ClosingBreakdown';
import AdBanner from './AdBanner';
import CategoryChart from './dashboard/CategoryChart';
import { exportMonthlyPDF } from '../pdfGenerator';

interface Props {
  coupleInfo: CoupleInfo;
  expenses: Expense[];
  monthKey: string;
  onNavigateToIncomes: () => void;
  summary: MonthlySummary;
  isPremium?: boolean;
}

const Dashboard: React.FC<Props> = ({
  coupleInfo,
  expenses,
  monthKey,
  onNavigateToIncomes,
  summary,
  isPremium
}) => {
  const [showBreakdown, setShowBreakdown] = React.useState(false);

  const totalIncome = summary.person1TotalIncome + summary.person2TotalIncome;
  const p1Ratio = totalIncome > 0 ? (summary.person1TotalIncome / totalIncome) * 100 : 50;
  const p2Ratio = totalIncome > 0 ? (summary.person2TotalIncome / totalIncome) * 100 : 50;

  const p1Left = summary.person1TotalIncome - summary.person1Responsibility - summary.person1PersonalTotal;
  const p2Left = summary.person2TotalIncome - summary.person2Responsibility - summary.person2PersonalTotal;

  const p1Name = coupleInfo.person1Name.split(' ')[0];
  const p2Name = coupleInfo.person2Name.split(' ')[0];

  const sortedCategories = useMemo(() => {
    return Object.entries(summary.categoryTotals).sort((a, b) => b[1] - a[1]);
  }, [summary.categoryTotals]);

  const totalExpenses = summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement;
  const totalPersonal = summary.person1PersonalTotal + summary.person2PersonalTotal;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">

      {/* Hero: Acerto Financeiro */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-p1/20 rounded-full -mr-40 -mt-40 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-p2/20 rounded-full -ml-30 -mb-30 blur-[80px]"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-3xl shadow-2xl">
                🤝
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Acerto do Mês</p>
                <h2 className="text-xl md:text-2xl font-black text-white">Equilíbrio Financeiro</h2>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {summary.whoTransfers !== 'none' ? (
                <>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center border ${summary.whoTransfers === 'person1'
                      ? 'bg-p1/20 border-p1/30 text-p1'
                      : 'bg-p2/20 border-p2/30 text-p2'
                    }`}>
                    {summary.whoTransfers === 'person1' ? p1Name : p2Name} transfere
                  </div>
                  <div className="bg-white px-6 py-3 rounded-xl shadow-lg">
                    <p className="text-slate-900 text-2xl md:text-3xl font-black tracking-tighter text-center">
                      {formatCurrency(summary.transferAmount)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center gap-3 bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 rounded-xl text-emerald-400 font-black text-sm uppercase tracking-wider">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Equilibrado
                </div>
              )}

              <div className="flex gap-2">
                {isPremium && (
                  <button
                    onClick={() => exportMonthlyPDF(monthKey, coupleInfo, summary, expenses)}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                    title="Exportar PDF"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                  title="Ver detalhes"
                >
                  <svg className={`w-5 h-5 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {showBreakdown && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <ClosingBreakdown coupleInfo={coupleInfo} summary={summary} />
            </div>
          )}
        </div>
      </div>

      {/* Visão Geral: 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Renda Total */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-lg">💰</div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Renda Total</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalIncome)}</p>
          <button onClick={onNavigateToIncomes} className="mt-2 text-[10px] font-bold text-p1 hover:underline">Gerenciar →</button>
        </div>

        {/* Card Gastos Casa */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-lg">🏠</div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gastos Casa</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalExpenses)}</p>
          <p className="mt-2 text-[10px] text-slate-400">Fixos + Variáveis</p>
        </div>

        {/* Card Gastos Pessoais */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/10 rounded-xl flex items-center justify-center text-lg">👤</div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pessoais</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(totalPersonal)}</p>
          <p className="mt-2 text-[10px] text-slate-400">Individuais do mês</p>
        </div>

        {/* Card Sobra */}
        <div className="bg-gradient-to-br from-p1 to-purple-600 p-5 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">✨</div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Sobra Total</p>
          </div>
          <p className="text-2xl font-black tracking-tight">{formatCurrency(p1Left + p2Left)}</p>
          <p className="mt-2 text-[10px] text-white/60">Livre para investir</p>
        </div>
      </div>

      {/* Seção Individual: 2 Cards lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Pessoa 1 */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
          <div className="bg-p1/10 px-6 py-4 flex items-center justify-between border-b border-p1/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-p1 rounded-xl flex items-center justify-center text-white text-lg font-black">
                {p1Name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-800 dark:text-slate-100">{p1Name}</p>
                <p className="text-[9px] font-bold text-p1 uppercase">{p1Ratio.toFixed(0)}% da renda</p>
              </div>
            </div>
            <p className="text-xl font-black text-p1">{formatCurrency(summary.person1TotalIncome)}</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Responsabilidade Casa</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">- {formatCurrency(summary.person1Responsibility)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gastos Pessoais</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">- {formatCurrency(summary.person1PersonalTotal)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-100 dark:border-white/10 pt-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">Sobra Livre</span>
              <span className={`font-black ${p1Left >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(p1Left)}</span>
            </div>
          </div>
        </div>

        {/* Card Pessoa 2 */}
        <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
          <div className="bg-p2/10 px-6 py-4 flex items-center justify-between border-b border-p2/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-p2 rounded-xl flex items-center justify-center text-white text-lg font-black">
                {p2Name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-800 dark:text-slate-100">{p2Name}</p>
                <p className="text-[9px] font-bold text-p2 uppercase">{p2Ratio.toFixed(0)}% da renda</p>
              </div>
            </div>
            <p className="text-xl font-black text-p2">{formatCurrency(summary.person2TotalIncome)}</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Responsabilidade Casa</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">- {formatCurrency(summary.person2Responsibility)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gastos Pessoais</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">- {formatCurrency(summary.person2PersonalTotal)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-100 dark:border-white/10 pt-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">Sobra Livre</span>
              <span className={`font-black ${p2Left >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(p2Left)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Proporção */}
      <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Balanço</p>
          <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex">
            <div style={{ width: `${p1Ratio}%` }} className="bg-p1 h-full transition-all duration-700"></div>
            <div style={{ width: `${p2Ratio}%` }} className="bg-p2 h-full transition-all duration-700"></div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-black shrink-0">
            <span className="text-p1">{p1Ratio.toFixed(0)}%</span>
            <span className="text-slate-300">|</span>
            <span className="text-p2">{p2Ratio.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Gastos do Mês - Breakdown */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">Gastos do Mês</h3>
            <p className="text-xs text-slate-400">Detalhamento por tipo</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 dark:divide-white/5">
          <div className="p-5 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Fixos</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(summary.totalFixed)}</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Variáveis</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(summary.totalCommon)}</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Reembolsos</p>
            <p className="text-xl font-black text-emerald-500">{formatCurrency(summary.totalReimbursement)}</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Média/Dia</p>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(totalExpenses / 30)}</p>
          </div>
        </div>
      </div>

      <AdBanner isPremium={isPremium} position="dashboard" />

      {/* Categorias com Gráfico */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl">Categorias</h3>
            <p className="text-sm text-slate-400">Onde o dinheiro está indo</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xl">📊</div>
        </div>

        <CategoryChart data={summary.categoryTotals} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {sortedCategories.map(([category, total]) => {
            const customCat = (coupleInfo.categories || []).find(c =>
              typeof c === 'string' ? c === category : c.name === category
            );
            const customIcon = typeof customCat === 'object' ? customCat.icon : null;
            const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;

            return (
              <div key={category} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    {customIcon ? customIcon : (
                      category === 'Moradia' ? '🏠' :
                        category === 'Alimentação' ? '🥗' :
                          category === 'Transporte' ? '🚗' :
                            category === 'Lazer' ? '🎮' :
                              category === 'Saúde' ? '🏥' :
                                category === 'Educação' ? '🎓' :
                                  category === 'Compras' ? '🛍️' :
                                    category === 'Viagem' ? '✈️' : '📦'
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{category}</p>
                    <p className="text-[10px] text-slate-400">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(total)}</span>
              </div>
            );
          })}

          {sortedCategories.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 opacity-50">📊</div>
              <p className="text-slate-400 font-bold">Nenhum gasto registrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
