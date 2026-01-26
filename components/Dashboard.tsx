
import React from 'react';
import { CoupleInfo, Expense, MonthlySummary } from '../types';
import { formatCurrency } from '../utils';
import SalaryCard from './dashboard/SalaryCard';
import BalanceCard from './dashboard/BalanceCard';
import StatSmall from './dashboard/StatSmall';

interface Props {
  coupleInfo: CoupleInfo;
  expenses: Expense[];
  monthKey: string;
  onUpdateSalary1: (val: number) => void;
  onUpdateSalary2: (val: number) => void;
  summary: MonthlySummary;
}

const Dashboard: React.FC<Props> = ({
  coupleInfo,
  onUpdateSalary1,
  onUpdateSalary2,
  summary
}) => {
  const totalSalary = coupleInfo.salary1 + coupleInfo.salary2;
  const p1Ratio = totalSalary > 0 ? (coupleInfo.salary1 / totalSalary) * 100 : 50;
  const p2Ratio = totalSalary > 0 ? (coupleInfo.salary2 / totalSalary) * 100 : 50;

  const p1Left = coupleInfo.salary1 - summary.person1Responsibility - summary.person1PersonalTotal;
  const p2Left = coupleInfo.salary2 - summary.person2Responsibility - summary.person2PersonalTotal;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">

      {/* Topo: Salários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SalaryCard
          name={coupleInfo.person1Name}
          value={coupleInfo.salary1}
          onChange={onUpdateSalary1}
          color="blue"
        />
        <SalaryCard
          name={coupleInfo.person2Name}
          value={coupleInfo.salary2}
          onChange={onUpdateSalary2}
          color="pink"
        />
      </div>

      {/* Barra de Proporção Integrada */}
      <div className="bg-white/60 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-6">
        <div className="shrink-0 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Divisão de Custos</h3>
        </div>
        <div className="flex-1 w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/50 shadow-inner">
          <div style={{ width: `${p1Ratio}%` }} className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
          <div style={{ width: `${p2Ratio}%` }} className="bg-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.4)]"></div>
        </div>
        <div className="shrink-0 flex items-center gap-4 text-[11px] font-black tracking-tighter">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-blue-600">{p1Ratio.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            <span className="text-pink-500">{p2Ratio.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Destaque do Acerto - Premium Glass */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -mr-32 -mt-32 blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full -ml-32 -mb-32 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-2xl shadow-2xl">✨</div>
            <div>
              <h3 className="font-black text-white/40 uppercase tracking-[0.3em] text-[10px] mb-1">Acerto Financeiro</h3>
              <p className="text-lg font-bold text-white tracking-tight">Fechamento do Mês</p>
            </div>
          </div>

          {summary.whoTransfers !== 'none' ? (
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className={`px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-center border ${summary.whoTransfers === 'person1' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-pink-500/10 border-pink-500/20 text-pink-400'}`}>
                {summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name} deve transferir
              </div>
              <div className="bg-white px-8 py-5 rounded-[1.5rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] transform hover:scale-105 transition-transform duration-500">
                <p className="text-slate-950 text-3xl font-black tracking-tighter text-center">{formatCurrency(summary.transferAmount)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl text-emerald-400 font-black text-sm uppercase tracking-widest">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Contas Equilibradas
            </div>
          )}
        </div>
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Movimentação Total</h3>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-50 bg-slate-50/30">
            <StatSmall label="Fixos" value={summary.totalFixed} />
            <StatSmall label="Prop." value={summary.totalCommon} />
            <StatSmall label="50/50" value={summary.totalEqual} />
            <StatSmall label="Reemb." value={summary.totalReimbursement} />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Desembolso Real</h4>
          <div className="space-y-5">
            <div className="flex justify-between items-center p-4 bg-blue-50/30 rounded-2xl border border-blue-100/20">
              <span className="text-xs font-bold text-slate-500">{coupleInfo.person1Name}</span>
              <span className="text-sm font-black text-blue-600">{formatCurrency(summary.person1Paid)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-pink-50/30 rounded-2xl border border-pink-100/20">
              <span className="text-xs font-bold text-slate-500">{coupleInfo.person2Name}</span>
              <span className="text-sm font-black text-pink-500">{formatCurrency(summary.person2Paid)}</span>
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
          color="blue"
        />
        <BalanceCard
          name={coupleInfo.person2Name}
          personal={summary.person2PersonalTotal}
          left={p2Left}
          color="pink"
        />
      </div>

      {/* Gastos por Categoria */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-xl tracking-tight">Categorias</h3>
            <p className="text-slate-400 text-sm font-medium">Distribuição dos custos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl grayscale opacity-50">🧭</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(summary.categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, total]) => (
              <div key={category} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50 transition-all hover:bg-white hover:shadow-xl hover:scale-[1.02] group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="text-xs font-bold">#</span>
                  </div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{category}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(total)}</span>
              </div>
            ))}

          {Object.keys(summary.categoryTotals).length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-3xl mb-4 grayscale opacity-30">📊</div>
              <p className="text-slate-400 font-bold italic tracking-tight">Nenhum gasto registrado.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
