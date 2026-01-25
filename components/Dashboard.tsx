
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
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 lg:pb-8">

      {/* Cards de Salário - Minimalistas */}
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

      {/* Barra de Proporção - Design Limpo */}
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Distribuição de Custo</h3>
            <p className="text-sm font-bold text-slate-600">Proporção baseada na renda</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-600 tracking-tighter">{p1Ratio.toFixed(0)}%</span>
            <span className="mx-2 text-slate-200 font-light">/</span>
            <span className="text-2xl font-black text-pink-500 tracking-tighter">{p2Ratio.toFixed(0)}%</span>
          </div>
        </div>
        <div className="h-3 w-full bg-slate-100/50 rounded-full overflow-hidden flex p-0.5 border border-slate-200/50">
          <div style={{ width: `${p1Ratio}%` }} className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.3)]"></div>
          <div style={{ width: `${p2Ratio}%` }} className="bg-gradient-to-r from-pink-400 to-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(236,72,153,0.3)]"></div>
        </div>
      </div>

      {/* Destaque do Acerto - Versão Light Premium */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {/* Elemento de Fundo Suave */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-50 rounded-full -ml-10 -mb-10 blur-3xl opacity-50"></div>

        <h3 className="font-black text-slate-300 uppercase tracking-[0.3em] text-[10px] mb-10 flex items-center gap-3 relative z-10">
          <div className="h-px w-8 bg-slate-200"></div>
          Resumo do Fechamento
        </h3>

        {summary.whoTransfers !== 'none' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center relative z-10">
            <div className={`md:col-span-2 p-8 rounded-[2rem] text-center ${summary.whoTransfers === 'person1' ? 'bg-blue-50/40 border border-blue-100' : 'bg-pink-50/40 border border-pink-100'}`}>
              <p className="font-black uppercase text-[10px] tracking-widest mb-3 text-slate-400">Origem do PIX</p>
              <p className={`text-4xl font-black tracking-tighter ${summary.whoTransfers === 'person1' ? 'text-blue-600' : 'text-pink-600'}`}>
                {summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name}
              </p>
            </div>

            <div className="hidden md:flex justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>

            <div className="md:col-span-2 p-8 rounded-[2rem] bg-slate-50 border border-slate-100 text-center group transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-3 text-center">Valor do Acerto</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(summary.transferAmount)}</p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 text-emerald-600 p-12 rounded-[2rem] text-center border border-emerald-100 relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-xl font-black tracking-tight">Equilíbrio Perfeito! 🎉</p>
            <p className="text-sm font-bold opacity-70 mt-1">As contas estão batendo centavo por centavo.</p>
          </div>
        )}
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card de Gastos Detalhados */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-50">
            <div>
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-1">Fluxo Mensal</h3>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement)}</p>
            </div>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-50">
            <StatSmall label="Fixos" value={summary.totalFixed} />
            <StatSmall label="Prop." value={summary.totalCommon} />
            <StatSmall label="50/50" value={summary.totalEqual} />
            <StatSmall label="Reemb." value={summary.totalReimbursement} />
          </div>
        </div>

        {/* Quem Desembolsou */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Saída Efetiva</h4>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-bold text-slate-600">{coupleInfo.person1Name}</span>
              </div>
              <span className="font-black text-slate-900">{formatCurrency(summary.person1Paid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                <span className="text-sm font-bold text-slate-600">{coupleInfo.person2Name}</span>
              </div>
              <span className="font-black text-slate-900">{formatCurrency(summary.person2Paid)}</span>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <div className="h-1.5 w-full bg-slate-50 rounded-full flex overflow-hidden">
              <div style={{ width: `${(summary.person1Paid / (summary.person1Paid + summary.person2Paid || 1)) * 100}%` }} className="bg-blue-500/80 h-full"></div>
              <div style={{ width: `${(summary.person2Paid / (summary.person1Paid + summary.person2Paid || 1)) * 100}%` }} className="bg-pink-400/80 h-full"></div>
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
