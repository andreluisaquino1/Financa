
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

  // Cálculo do dinheiro que sobra após as responsabilidades do casal
  const p1Left = coupleInfo.salary1 - summary.person1Responsibility - summary.person1PersonalTotal;
  const p2Left = coupleInfo.salary2 - summary.person2Responsibility - summary.person2PersonalTotal;

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-20 lg:pb-8">
      
      {/* Cards de Salário Interativos */}
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

      {/* Barra de Proporção Premium */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Responsabilidade Proporcional</h3>
            <p className="text-[10px] text-gray-400 font-bold">Baseado na renda de cada um</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-blue-600">{p1Ratio.toFixed(0)}%</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-sm font-black text-pink-500">{p2Ratio.toFixed(0)}%</span>
          </div>
        </div>
        <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${p1Ratio}%` }} className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000"></div>
          <div style={{ width: `${p2Ratio}%` }} className="bg-gradient-to-r from-pink-400 to-pink-500 h-full transition-all duration-1000"></div>
        </div>
      </div>

      {/* Resultado da Transferência (Destaque Principal) */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          </div>

          <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Resumo do Acerto
          </h3>

          {summary.whoTransfers !== 'none' ? (
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              <div className={`p-6 rounded-3xl flex-1 flex flex-col justify-center text-center ${summary.whoTransfers === 'person1' ? 'bg-blue-50/50 border border-blue-100' : 'bg-pink-50/50 border border-pink-100'}`}>
                <p className="font-black uppercase text-[10px] tracking-widest mb-2 opacity-60">Quem faz o PIX</p>
                <p className={`text-3xl font-black ${summary.whoTransfers === 'person1' ? 'text-blue-700' : 'text-pink-700'}`}>{summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name}</p>
              </div>
              <div className="bg-gray-900 p-8 rounded-3xl flex-1 text-center shadow-2xl transform hover:scale-[1.02] transition">
                <p className="text-blue-400 font-black uppercase text-[10px] tracking-widest mb-2">Valor Total a Transferir</p>
                <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(summary.transferAmount)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-700 p-10 rounded-3xl text-center border border-emerald-100">
              <div className="text-4xl mb-4">✨</div>
              <p className="text-xl font-black tracking-tight">Tudo certo! As contas estão equilibradas. 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Estatísticas Expandida */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gastos Totais */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Detalhamento de Gastos</h3>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-black shadow-sm text-gray-600">Total: {formatCurrency(summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            <StatSmall label="Fixos" value={summary.totalFixed} />
            <StatSmall label="Proporcional" value={summary.totalCommon} />
            <StatSmall label="50%/50%" value={summary.totalEqual} />
            <StatSmall label="Reembolsos" value={summary.totalReimbursement} />
          </div>
        </div>

        {/* Quem Pago o Quê */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 border border-gray-800 shadow-xl flex flex-col justify-between">
          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Desembolso Efetivo</h4>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{coupleInfo.person1Name} pagou</p>
                <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, (summary.person1Paid / (summary.person1Paid + summary.person2Paid || 1)) * 100)}%` }}></div>
                </div>
              </div>
              <p className="text-lg font-black text-white">{formatCurrency(summary.person1Paid)}</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{coupleInfo.person2Name} pagou</p>
                <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500" style={{ width: `${Math.min(100, (summary.person2Paid / (summary.person1Paid + summary.person2Paid || 1)) * 100)}%` }}></div>
                </div>
              </div>
              <p className="text-lg font-black text-white">{formatCurrency(summary.person2Paid)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Pessoal e Aporte (Onde o dinheiro sobra) */}
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

/* Componentes Auxiliares */

const SalaryCard: React.FC<{ name: string; value: number; onChange: (v: number) => void; color: 'blue' | 'pink' }> = ({ name, value, onChange, color }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(formatAsBRL((value * 100).toString()));

  const handleBlur = () => {
    setIsEditing(false);
    onChange(parseBRL(tempValue));
  };

  return (
    <div className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md ${isEditing ? 'ring-2 ring-blue-600/20' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salário de {name}</p>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`p-1.5 rounded-lg transition ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:text-blue-600'}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
      </div>

      {isEditing ? (
        <div className="relative mt-1">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">R$</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={tempValue}
            onChange={(e) => setTempValue(formatAsBRL(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            className="w-full bg-transparent border-b-2 border-blue-600 pl-8 pb-1 outline-none font-black text-2xl text-gray-900"
          />
        </div>
      ) : (
        <p className={`text-3xl font-black tracking-tighter ${color === 'blue' ? 'text-blue-600' : 'text-pink-600'}`}>
          {formatCurrency(value)}
        </p>
      )}
    </div>
  );
};

const BalanceCard: React.FC<{ name: string; personal: number; left: number; color: 'blue' | 'pink' }> = ({ name, personal, left, color }) => {
  const personColor = color === 'blue' ? 'blue' : 'pink';
  const personText = color === 'blue' ? 'text-blue-600' : 'text-pink-600';
  const personBg = color === 'blue' ? 'bg-blue-50' : 'bg-pink-50';

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${personBg} rounded-2xl flex items-center justify-center`}>
          <svg className={`w-6 h-6 ${personText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 tracking-tight">{name}</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo Financeiro</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gasto Pessoal</p>
          <p className="text-lg font-black text-gray-800">{formatCurrency(personal)}</p>
        </div>
        <div className={`p-4 ${personBg} rounded-2xl`}>
          <p className={`text-[10px] font-black ${personText} uppercase tracking-widest mb-1 opacity-70`}>Poder de Aporte</p>
          <p className={`text-xl font-black ${personText} tracking-tight`}>{formatCurrency(left)}</p>
        </div>
      </div>
    </div>
  );
};

const StatSmall: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="p-5 text-center transition hover:bg-gray-50/50">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-base font-black text-gray-900 tracking-tight">{formatCurrency(value)}</p>
  </div>
);

export default Dashboard;
