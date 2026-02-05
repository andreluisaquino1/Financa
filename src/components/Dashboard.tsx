
import React, { useMemo } from 'react';
import { CoupleInfo, Expense, MonthlySummary, SavingsGoal } from '@/types';
import { formatCurrency } from '@/utils';
import ClosingBreakdown from './dashboard/ClosingBreakdown';
import CategoryChart from './dashboard/CategoryChart';
import MonthlyInsights from './dashboard/MonthlyInsights';
import { exportMonthlyPDF } from '@/pdfGenerator';
import { exportAsImage } from '@/utils/imageExport';

interface Props {
  coupleInfo: CoupleInfo;
  expenses: Expense[];
  monthKey: string;
  goals: SavingsGoal[];
  onNavigateToIncomes: () => void;
  summary: MonthlySummary;
  markAsSettled: (monthKey: string) => Promise<void>;
}

const Dashboard: React.FC<Props> = ({
  coupleInfo,
  expenses,
  monthKey,
  goals,
  onNavigateToIncomes,
  summary,
  markAsSettled
}) => {
  const [showBreakdown, setShowBreakdown] = React.useState(false);

  const totalIncome = summary.person1TotalIncome + summary.person2TotalIncome;
  const p1Ratio = totalIncome > 0 ? (summary.person1TotalIncome / totalIncome) * 100 : 50;
  const p2Ratio = totalIncome > 0 ? (summary.person2TotalIncome / totalIncome) * 100 : 50;

  const p1GoalContribution = summary.person1GoalContribution;
  const p2GoalContribution = summary.person2GoalContribution;
  const totalGoalSavings = summary.totalGoalSavings;

  const p1Left = summary.person1Remaining;
  const p2Left = summary.person2Remaining;

  const p1Name = coupleInfo.person1Name.split(' ')[0];
  const p2Name = coupleInfo.person2Name.split(' ')[0];

  const sortedCategories = useMemo(() => {
    return Object.entries(summary.categoryTotals).sort((a, b) => b[1] - a[1]);
  }, [summary.categoryTotals]);

  const totalExpenses = summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement;
  const totalPersonal = summary.person1PersonalTotal + summary.person2PersonalTotal;

  return (
    <div id="dashboard-export-area" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 bg-slate-50 dark:bg-transparent p-4 rounded-[2.5rem]">

      {/* Hero: Acerto Financeiro */}
      <div className="bg-slate-900 dark:bg-slate-900/40 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden border border-slate-800 dark:border-white/5 group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-p1/10 rounded-full -mr-64 -mt-64 blur-[120px] group-hover:bg-p1/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-p2/10 rounded-full -ml-40 -mb-40 blur-[100px] group-hover:bg-p2/20 transition-all duration-1000"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-3xl md:text-4xl shadow-2xl ring-1 ring-white/20">
                🤝
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Status de Fechamento</p>
                </div>
                <h2 className="text-xl md:text-4xl font-black text-white tracking-tight">Equilíbrio do Mês</h2>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              {summary.whoTransfers !== 'none' ? (
                <div className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-md border border-white/10 p-2 pl-6 rounded-[2rem]">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{summary.whoTransfers === 'person1' ? p1Name : p2Name} Transfere</span>
                    <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(summary.transferAmount)}</span>
                  </div>
                  <button
                    onClick={() => markAsSettled(monthKey)}
                    title="Marcar como Pago/Resolvido"
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-lg transition-transform active:scale-95 ${summary.whoTransfers === 'person1' ? 'bg-p1 hover:bg-p1/80' : 'bg-p2 hover:bg-p2/80'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 md:px-8 md:py-4 rounded-[2rem] text-emerald-400 font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/5">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-lg md:text-xl shadow-lg ring-4 ring-emerald-500/20">✓</div>
                  Contas Equilibradas
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={async () => await exportMonthlyPDF(monthKey, coupleInfo, summary, expenses, goals)}
                  className="w-16 h-16 flex items-center justify-center rounded-[1.5rem] bg-white text-slate-900 hover:bg-slate-100 transition-all active:scale-90 shadow-2xl"
                  title="Exportar PDF"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </button>
                <button
                  onClick={() => exportAsImage('dashboard-export-area', `Resumo_${monthKey}`)}
                  className="w-16 h-16 flex items-center justify-center rounded-[1.5rem] bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-90 shadow-2xl shadow-emerald-500/20"
                  title="Exportar Imagem"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className={`w-16 h-16 flex items-center justify-center rounded-[1.5rem] transition-all active:scale-95 border shadow-2xl ${showBreakdown ? 'bg-brand/20 border-brand text-brand' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`}
                >
                  <svg className={`w-6 h-6 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>
            {/* Critical Alerts - Always Visible */}
            {(summary.unspecifiedPaidByCount > 0) && (
              <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest text-xs mb-1">Atenção Necessária</h3>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    Você tem {summary.unspecifiedPaidByCount} gastos sem "Quem Pagou" definido. Isso distorce seu acerto mensal.
                    <button onClick={onNavigateToIncomes} className="underline ml-2">Corrigir agora</button>
                  </p>
                </div>
              </div>
            )}

          </div>

          {showBreakdown && (
            <div className="mt-8 pt-8 border-t border-white/10 space-y-8 animate-in slide-in-from-top-4 duration-500">
              <MonthlyInsights summary={summary} coupleInfo={coupleInfo} goals={goals} />
              <ClosingBreakdown coupleInfo={coupleInfo} summary={summary} goals={goals} />
            </div>
          )}
        </div>
      </div>



      {/* Seção Individual: 2 Cards lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Pessoa 1 */}
        <div className="bg-white dark:bg-slate-950/20 rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm group">
          <div className="bg-p1/5 px-8 py-6 flex items-center justify-between border-b border-p1/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-p1 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-p1/20 group-hover:scale-110 transition-transform">
                {p1Name.charAt(0)}
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{p1Name}</p>
                <p className="text-[10px] font-black text-p1 uppercase tracking-widest">{p1Ratio.toFixed(0)}% da Renda do Casal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Renda Bruta</p>
              <p className="text-2xl font-black text-p1 tabular-nums tracking-tighter">{formatCurrency(summary.person1TotalIncome)}</p>
            </div>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Responsabilidade Casa</span>
              <span className="font-black text-slate-700 dark:text-slate-300 tabular-nums">-{formatCurrency(summary.person1Responsibility)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Gastos Pessoais</span>
              <span className="font-black text-slate-700 dark:text-slate-300 tabular-nums">-{formatCurrency(summary.person1PersonalTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Aportes p/ Metas</span>
              <div className="text-right">
                <p className="font-black text-indigo-500 tabular-nums">{formatCurrency(summary.person1GoalsRealized)}</p>
                <p className="text-[9px] text-slate-400">meta: {formatCurrency(summary.person1GoalContribution)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 mt-2 border-t border-slate-50 dark:border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sobra Livre Individual</span>
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${p1Left >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(p1Left)}</span>
            </div>
          </div>
        </div>

        {/* Card Pessoa 2 */}
        <div className="bg-white dark:bg-slate-950/20 rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm group">
          <div className="bg-p2/5 px-8 py-6 flex items-center justify-between border-b border-p2/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-p2 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-p2/20 group-hover:scale-110 transition-transform">
                {p2Name.charAt(0)}
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{p2Name}</p>
                <p className="text-[10px] font-black text-p2 uppercase tracking-widest">{p2Ratio.toFixed(0)}% da Renda do Casal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Renda Bruta</p>
              <p className="text-2xl font-black text-p2 tabular-nums tracking-tighter">{formatCurrency(summary.person2TotalIncome)}</p>
            </div>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Responsabilidade Casa</span>
              <span className="font-black text-slate-700 dark:text-slate-300 tabular-nums">-{formatCurrency(summary.person2Responsibility)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Gastos Pessoais</span>
              <span className="font-black text-slate-700 dark:text-slate-300 tabular-nums">-{formatCurrency(summary.person2PersonalTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Aportes p/ Metas</span>
              <div className="text-right">
                <p className="font-black text-indigo-500 tabular-nums">{formatCurrency(summary.person2GoalsRealized)}</p>
                <p className="text-[9px] text-slate-400">meta: {formatCurrency(summary.person2GoalContribution)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 mt-2 border-t border-slate-50 dark:border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sobra Livre Individual</span>
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${p2Left >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(p2Left)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gastos do Mês - Breakdown */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">Resumo de Gastos</h3>
            <p className="text-xs text-slate-400">Por tipo de responsabilidade</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-slate-100 dark:divide-white/5">
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
        </div>
      </div>

      {/* Categorias com Gráfico */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2rem] p-8 md:p-10 border border-slate-100 dark:border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Onde o dinheiro está indo?</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Detalhamento por Categoria</p>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-3xl shadow-inner border border-slate-100 dark:border-white/5">📊</div>
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
