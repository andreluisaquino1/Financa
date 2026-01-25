
import React, { useState } from 'react';
import { CoupleInfo, Expense } from '../types';
import { calculateSummary, formatCurrency, formatAsBRL, parseBRL } from '../utils';

interface Props {
  coupleInfo: CoupleInfo;
  expenses: Expense[];
  monthKey: string;
  onUpdateSalary1: (val: number) => void;
  onUpdateSalary2: (val: number) => void;
}

const Dashboard: React.FC<Props> = ({
  coupleInfo,
  expenses,
  monthKey,
  onUpdateSalary1,
  onUpdateSalary2
}) => {
  const summary = calculateSummary(expenses, coupleInfo, monthKey);
  const totalSalary = coupleInfo.salary1 + coupleInfo.salary2;
  const p1Ratio = totalSalary > 0 ? (coupleInfo.salary1 / totalSalary) * 100 : 50;
  const p2Ratio = totalSalary > 0 ? (coupleInfo.salary2 / totalSalary) * 100 : 50;

  const p1Left = coupleInfo.salary1 - summary.person1Responsibility - summary.person1PersonalTotal;
  const p2Left = coupleInfo.salary2 - summary.person2Responsibility - summary.person2PersonalTotal;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 lg:pb-8">

      {/* Topo: Salários e Proporção Integrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

      {/* Barra de Proporção Compacta */}
      <div className="bg-white/40 backdrop-blur-sm px-6 py-4 rounded-[1.5rem] border border-slate-100/50 shadow-sm flex items-center gap-6">
        <div className="shrink-0">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Divisão</h3>
        </div>
        <div className="flex-1 h-1 bg-slate-100/50 rounded-full overflow-hidden flex border border-slate-200/50">
          <div style={{ width: `${p1Ratio}%` }} className="bg-blue-500 h-full rounded-full transition-all duration-1000"></div>
          <div style={{ width: `${p2Ratio}%` }} className="bg-pink-400 h-full rounded-full transition-all duration-1000"></div>
        </div>
        <div className="shrink-0 flex gap-3 text-[10px] font-black tracking-tighter">
          <span className="text-blue-600">{p1Ratio.toFixed(0)}%</span>
          <span className="text-slate-300">/</span>
          <span className="text-pink-500">{p2Ratio.toFixed(0)}%</span>
        </div>
      </div>

      {/* Destaque do Acerto - Compacto Premium */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 blur-3xl opacity-40"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner">💰</div>
            <div>
              <h3 className="font-black text-slate-300 uppercase tracking-widest text-[9px] mb-0.5">Acerto do Mês</h3>
              <p className="text-sm font-bold text-slate-600">Fechamento das contas</p>
            </div>
          </div>

          {summary.whoTransfers !== 'none' ? (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight text-center ${summary.whoTransfers === 'person1' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                {summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name} paga
              </div>
              <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-lg transform transition-transform">
                <p className="text-white text-xl font-black tracking-tighter text-center">{formatCurrency(summary.transferAmount)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              Tudo equilibrado!
            </div>
          )}
        </div>
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Card de Gastos Detalhados */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50">
            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Fluxo Mensal</h3>
            <span className="text-lg font-black text-slate-900 tracking-tighter">{formatCurrency(summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-50">
            <StatSmall label="Fixos" value={summary.totalFixed} />
            <StatSmall label="Prop." value={summary.totalCommon} />
            <StatSmall label="50/50" value={summary.totalEqual} />
            <StatSmall label="Reemb." value={summary.totalReimbursement} />
          </div>
        </div>

        {/* Quem Desembolsou */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Saída Efetiva</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{coupleInfo.person1Name}</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(summary.person1Paid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{coupleInfo.person2Name}</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(summary.person2Paid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Saldo e Aporte */}
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

      {/* Gastos por Categoria - NOVA SEÇÃO */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-300 uppercase tracking-[0.2em] text-[10px] mb-8 flex items-center gap-3">
          <div className="h-px w-8 bg-slate-200"></div>
          Gastos por Categoria
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(summary.categoryTotals)
            .sort((a, b) => b[1] - a[1]) // Ordenar do maior para o menor
            .map(([category, total]) => (
              <div key={category} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    <span className="text-xs">📊</span>
                  </div>
                  <span className="text-sm font-bold text-slate-600">{category}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(total)}</span>
              </div>
            ))}

          {Object.keys(summary.categoryTotals).length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium italic">
              Nenhum gasto registrado neste mês.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

/* Componentes Refatorados */

const SalaryCard: React.FC<{ name: string; value: number; onChange: (v: number) => void; color: 'blue' | 'pink' }> = ({ name, value, onChange, color }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(formatAsBRL((value * 100).toString()));

  const handleBlur = () => {
    setIsEditing(false);
    onChange(parseBRL(tempValue));
  };

  return (
    <div className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 ${isEditing ? 'border-blue-200 shadow-xl scale-[1.02]' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renda de {name}</p>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isEditing ? 'bg-blue-600 text-white rotate-90' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
      </div>

      {isEditing ? (
        <div className="flex items-center group">
          <span className="text-slate-300 font-black text-2xl mr-2 group-focus-within:text-blue-600">R$</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={tempValue}
            onChange={(e) => setTempValue(formatAsBRL(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            className="w-full bg-transparent outline-none font-black text-3xl text-slate-900 tracking-tighter"
          />
        </div>
      ) : (
        <div className="flex items-baseline">
          <p className={`text-4xl font-black tracking-tighter ${color === 'blue' ? 'text-blue-600' : 'text-pink-500'}`}>
            {formatCurrency(value)}
          </p>
        </div>
      )}
    </div>
  );
};

const BalanceCard: React.FC<{ name: string; personal: number; left: number; color: 'blue' | 'pink' }> = ({ name, personal, left, color }) => {
  const accentColor = color === 'blue' ? 'text-blue-600' : 'text-pink-500';
  const accentBg = color === 'blue' ? 'bg-blue-50/50' : 'bg-pink-50/50';

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${accentBg} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6`}>
            <svg className={`w-6 h-6 ${accentColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{name}</h3>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Performance Individual</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gastos Solo</p>
          <p className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(personal)}</p>
        </div>
        <div className={`p-6 ${accentBg} rounded-3xl border border-transparent transition-all group-hover:border-white/50`}>
          <p className={`text-[10px] font-black ${accentColor} uppercase tracking-widest mb-2 opacity-80`}>Disponível</p>
          <p className={`text-2xl font-black ${accentColor} tracking-tighter`}>{formatCurrency(left)}</p>
        </div>
      </div>
    </div>
  );
};

const StatSmall: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="p-6 text-center transition hover:bg-slate-50/50 group">
    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 group-hover:text-blue-500 transition-colors">{label}</p>
    <p className="text-lg font-black text-slate-800 tracking-tight">{formatCurrency(value)}</p>
  </div>
);

export default Dashboard;
