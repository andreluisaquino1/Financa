
import React from 'react';
import { CoupleInfo, Expense } from '../types';
import { calculateSummary, formatCurrency } from '../utils';

interface Props {
  coupleInfo: CoupleInfo;
  expenses: Expense[];
  monthKey: string;
  onUpdateCardValue: (val: number) => void;
  onUpdateSalary1: (val: number) => void;
  onUpdateSalary2: (val: number) => void;
}

const Dashboard: React.FC<Props> = ({
  coupleInfo,
  expenses,
  monthKey,
  onUpdateCardValue,
  onUpdateSalary1,
  onUpdateSalary2
}) => {
  const summary = calculateSummary(expenses, coupleInfo, monthKey);
  const totalSalary = coupleInfo.salary1 + coupleInfo.salary2;
  const p1Ratio = totalSalary > 0 ? (coupleInfo.salary1 / totalSalary) * 100 : 50;
  const p2Ratio = totalSalary > 0 ? (coupleInfo.salary2 / totalSalary) * 100 : 50;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 lg:pb-8">
      {/* Visualização de Salários */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SalaryDisplayCard
            name={coupleInfo.person1Name}
            value={coupleInfo.salary1}
            color="blue"
          />
          <SalaryDisplayCard
            name={coupleInfo.person2Name}
            value={coupleInfo.salary2}
            color="pink"
          />
        </div>

        <div className="pt-6 border-t border-gray-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Responsabilidade Proporcional</span>
            <span className="text-sm font-black text-blue-600">{p1Ratio.toFixed(0)}% / {p2Ratio.toFixed(0)}%</span>
          </div>
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${p1Ratio}%` }} className="bg-blue-600 h-full transition-all duration-1000"></div>
            <div style={{ width: `${p2Ratio}%` }} className="bg-pink-500 h-full transition-all duration-1000"></div>
          </div>
        </div>
      </div>

      {/* Cartão de Crédito - Contexto Específico */}
      <div className="bg-blue-600 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 text-white relative overflow-hidden">
        <div className="flex items-center space-x-5 z-10">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-blue-100">Cartão de {coupleInfo.person1Name}</h4>
            <p className="text-lg font-medium opacity-90">Valor integral assumido por {coupleInfo.person2Name}</p>
          </div>
        </div>
        <div className="w-full md:w-auto bg-white/10 px-6 py-4 rounded-2xl border border-white/20 backdrop-blur-md z-10 text-center">
          <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(coupleInfo.andreCreditCardValue)}</p>
          <div className="mt-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-blue-100/90 mb-1">Editar valor</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={coupleInfo.andreCreditCardValue || ''}
              onChange={(e) => onUpdateCardValue(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full md:w-56 bg-white/15 placeholder:text-blue-100/60 text-white border border-white/25 focus:border-white/60 rounded-xl px-4 py-2 font-black outline-none"
            />
          </div>
        </div>
      </div>

      {/* Resultado da Transferência (PIX) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-center">
          <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs mb-8">Acerto de Contas do Mês</h3>

          {summary.whoTransfers !== 'none' ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className={`p-6 rounded-3xl flex-1 w-full text-center ${summary.whoTransfers === 'person1' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                <p className="font-black uppercase text-[10px] tracking-widest mb-1">Quem faz o PIX</p>
                <p className="text-2xl font-black">{summary.whoTransfers === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name}</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-3xl flex-1 w-full text-center shadow-lg">
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-1">Valor a Transferir</p>
                <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(summary.transferAmount)}</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-600 p-8 rounded-3xl text-center border border-emerald-100">
              <p className="text-xl font-black">Tudo certo! Ninguém deve nada. 🎉</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 flex flex-col justify-between space-y-6">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Compartilhado</p>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{formatCurrency(summary.totalFixed + summary.totalCommon + summary.totalEqual + summary.totalReimbursement + (coupleInfo.andreCreditCardValue || 0))}</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Pago por {coupleInfo.person1Name}</span>
              <span className="font-black text-blue-600">{formatCurrency(summary.person1Paid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Pago por {coupleInfo.person2Name}</span>
              <span className="font-black text-pink-500">{formatCurrency(summary.person2Paid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Resumo Categorias */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <Stat label="Fixos" value={summary.totalFixed} />
          <Stat label="Proporcional" value={summary.totalCommon} />
          <Stat label="50% / 50%" value={summary.totalEqual} />
          <Stat label="Reembolsos" value={summary.totalReimbursement} />
          <Stat label={`Cartão ${coupleInfo.person1Name}`} value={coupleInfo.andreCreditCardValue || 0} />
        </div>
      </div>

      {/* Edição rápida de salários (opcional) */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs mb-6">Ajustar salários</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickMoneyInput label={`Salário ${coupleInfo.person1Name}`} value={coupleInfo.salary1} onChange={onUpdateSalary1} />
          <QuickMoneyInput label={`Salário ${coupleInfo.person2Name}`} value={coupleInfo.salary2} onChange={onUpdateSalary2} />
        </div>
      </div>
    </div>
  );
};

const QuickMoneyInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder="0"
        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all font-black"
      />
    </div>
  </div>
);

const SalaryDisplayCard: React.FC<{ name: string, value: number, color: 'blue' | 'pink' }> = ({ name, value, color }) => (
  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
      Salário de {name}
    </p>
    <p className={`text-2xl font-black tracking-tighter ${color === 'blue' ? 'text-blue-600' : 'text-pink-600'}`}>
      {formatCurrency(value)}
    </p>
  </div>
);

const Stat: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="p-6 text-center hover:bg-gray-50 transition">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-gray-900 tracking-tight">{formatCurrency(value)}</p>
  </div>
);

export default Dashboard;
