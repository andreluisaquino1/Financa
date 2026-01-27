
import React, { useMemo } from 'react';
import { CoupleInfo, Expense, MonthlySummary } from '../types';
import { formatCurrency } from '../utils';
import SalaryCard from './dashboard/SalaryCard';
import BalanceCard from './dashboard/BalanceCard';
import StatSmall from './dashboard/StatSmall';
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

  const sortedCategories = useMemo(() => {
    return Object.entries(summary.categoryTotals).sort((a, b) => b[1] - a[1]);
  }, [summary.categoryTotals]);

  // Totais simplificados para exibição
  const totalExpenses = summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

      {/* Topo: Salários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SalaryCard
          name={coupleInfo.person1Name}
          value={summary.person1TotalIncome}
          onClick={onNavigateToIncomes}
          color="p1"
        />
        <SalaryCard
          name={coupleInfo.person2Name}
          value={summary.person2TotalIncome}
          onClick={onNavigateToIncomes}
          color="p2"
        />
      </div>

      {/* Barra de Proporção de Rendas */}
      <div className="bg-white dark:bg-slate-800/60 px-6 py-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col md:flex-row items-center gap-4">
        <div className="shrink-0 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Balanço de Rendas
              {!isPremium && (summary.person1TotalIncome > (coupleInfo.salary1 || 0) || summary.person2TotalIncome > (coupleInfo.salary2 || 0)) && (
                <span className="text-amber-500 cursor-help" title="No plano grátis, rendas extras não entram no cálculo de proporção.">🔒</span>
              )}
            </h3>
          </div>
        </div>
        <div className="flex-1 w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-slate-200/50 dark:border-slate-800 shadow-inner">
          <div style={{ width: `${p1Ratio}%` }} className="bg-p1 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--p1-color)] brightness-110"></div>
          <div style={{ width: `${p2Ratio}%` }} className="bg-p2 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--p2-color)] brightness-110"></div>
        </div>
        <div className="shrink-0 flex items-center gap-4 text-[11px] font-black tracking-tighter">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-p1"></span>
            <span className="text-p1">{p1Ratio.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-p2"></span>
            <span className="text-p2">{p2Ratio.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Destaque do Acerto - Card Simples */}
      <div className="space-y-4">
        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden group border border-slate-800 dark:border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-p1 rounded-full -mr-32 -mt-32 blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-p2 rounded-full -ml-32 -mb-32 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-2xl shadow-2xl">🤝</div>
              <div>
                <h3 className="font-black text-white/40 uppercase tracking-[0.3em] text-[10px] mb-1">Acerto Financeiro</h3>
                <p className="text-lg font-bold text-white tracking-tight">Equilíbrio da Casa</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              {summary.whoTransfers !== 'none' ? (
                <>
                  <div className={`px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-center border ${summary.whoTransfers === 'person1' ? 'bg-p1/20 border-p1/20 text-p1' : 'bg-p2/20 border-p2/20 text-p2'}`}>
                    {summary.whoTransfers === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]} deve transferir
                  </div>
                  <div className="bg-white dark:bg-slate-100 px-6 py-4 rounded-xl shadow-md">
                    <p className="text-slate-950 text-3xl font-black tracking-tighter text-center">{formatCurrency(summary.transferAmount)}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl text-emerald-400 font-black text-sm uppercase tracking-widest">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Contas Equilibradas
                </div>
              )}

              <div className="flex gap-2">
                {isPremium && (
                  <button
                    onClick={() => exportMonthlyPDF(monthKey, coupleInfo, summary, expenses)}
                    className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2"
                    title="Exportar PDF PRO"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Exportar PDF</span>
                  </button>
                )}

                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                  title="Ver detalhes do cálculo"
                >
                  <svg className={`w-6 h-6 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showBreakdown && (
          <ClosingBreakdown coupleInfo={coupleInfo} summary={summary} />
        )}
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden flex flex-col">
          <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50 dark:border-white/5">
            <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Gastos do Mês</h3>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-50 dark:divide-white/5 bg-slate-50/30 dark:bg-transparent">
            <StatSmall label="Contas Fixas" value={summary.totalFixed} />
            <StatSmall label="Variáveis" value={summary.totalCommon + summary.totalEqual} />
            <StatSmall label="Reembolsos" value={summary.totalReimbursement} />
            <StatSmall label="Média Diária" value={totalExpenses / 30} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col justify-center">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 text-center">Desembolso (Pago no Mês)</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-p1 mb-1">
                <span>{coupleInfo.person1Name}</span>
                <span>{formatCurrency(summary.person1Paid)}</span>
              </div>
              <div className="w-full h-1.5 bg-p1/10 rounded-full overflow-hidden">
                <div style={{ width: `${(summary.person1Paid / (summary.person1Paid + summary.person2Paid || 1)) * 100}%` }} className="h-full bg-p1 rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-p2 mb-1">
                <span>{coupleInfo.person2Name}</span>
                <span>{formatCurrency(summary.person2Paid)}</span>
              </div>
              <div className="w-full h-1.5 bg-p2/10 rounded-full overflow-hidden">
                <div style={{ width: `${(summary.person2Paid / (summary.person1Paid + summary.person2Paid || 1)) * 100}%` }} className="h-full bg-p2 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Saldo Individual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BalanceCard
          name={coupleInfo.person1Name}
          personal={summary.person1PersonalTotal}
          left={p1Left}
          color="p1"
        />
        <BalanceCard
          name={coupleInfo.person2Name}
          personal={summary.person2PersonalTotal}
          left={p2Left}
          color="p2"
        />
      </div>

      <AdBanner isPremium={isPremium} position="dashboard" />

      {/* Gastos por Categoria */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight">Categorias</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Distribuição dos custos no mês</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-xl grayscale opacity-30">🧭</div>
        </div>

        <CategoryChart data={summary.categoryTotals} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {sortedCategories.map(([category, total]) => (
            <div key={category} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-sm group-hover:bg-p1 group-hover:text-white transition-colors">
                  <span className="text-xs font-bold">#</span>
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{category}</span>
              </div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-200">{formatCurrency(total)}</span>
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full mx-auto flex items-center justify-center text-3xl mb-4 grayscale opacity-30">📊</div>
              <p className="text-slate-400 dark:text-slate-500 font-bold italic tracking-tight">Nenhum gasto registrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
