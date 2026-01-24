
import React, { useState } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '../types';
import { formatCurrency, parseBRL, parseSafeDate } from '../utils';

interface Props {
  activeTab: 'fixed' | 'common' | 'equal' | 'reimbursement';
  expenses: Expense[];
  monthKey: string;
  coupleInfo: CoupleInfo;
  onAddExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
}

const ExpenseTabs: React.FC<Props> = ({ activeTab, expenses, monthKey, coupleInfo, onAddExpense, onDeleteExpense }) => {
  const [showAdd, setShowAdd] = useState(false);

  const typeMap: Record<string, ExpenseType> = {
    fixed: ExpenseType.FIXED,
    common: ExpenseType.COMMON,
    equal: ExpenseType.EQUAL,
    reimbursement: ExpenseType.REIMBURSEMENT
  };

  const [targetYear, targetMonth] = monthKey.split('-').map(Number);

  const filteredExpenses = expenses.filter(exp => {
    if (exp.type !== typeMap[activeTab]) return false;

    const expDate = parseSafeDate(exp.date);
    const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));

    if (exp.type === ExpenseType.FIXED) return diffMonths >= 0;
    return diffMonths >= 0 && diffMonths < exp.installments;
  });

  const tabTitles: Record<string, string> = {
    fixed: 'Gastos Fixos',
    common: 'Gastos Comuns',
    equal: 'Gastos 50/50',
    reimbursement: 'Reembolsos'
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{tabTitles[activeTab]}</h2>
          <p className="text-sm text-gray-500">Lançamentos em {monthKey}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 font-medium">
            Nenhum registro encontrado.
          </div>
        ) : (
          filteredExpenses.map(exp => (
            <div key={exp.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex justify-between items-center group shadow-sm hover:shadow-md transition">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${exp.paidBy === 'person1' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-500'}`}>{exp.category}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">{parseSafeDate(exp.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <h4 className="font-bold text-gray-800">{exp.description}</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pago por <span className={exp.paidBy === 'person1' ? 'text-blue-600 font-bold' : 'text-pink-500 font-bold'}>{exp.paidBy === 'person1' ? coupleInfo.person1Name : coupleInfo.person2Name}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 text-lg tracking-tight">{formatCurrency(exp.totalValue / exp.installments)}</p>
                <button onClick={() => onDeleteExpense(exp.id)} className="text-red-300 hover:text-red-500 p-2 transition opacity-0 group-hover:opacity-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          type={typeMap[activeTab]}
          coupleInfo={coupleInfo}
          onClose={() => setShowAdd(false)}
          onAdd={onAddExpense}
        />
      )}
    </div>
  );
};

export const AddExpenseModal: React.FC<{ type: ExpenseType, coupleInfo: CoupleInfo, onClose: () => void, onAdd: (exp: any) => void }> = ({ type, coupleInfo, onClose, onAdd }) => {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('Outros');
  const [paidBy, setPaidBy] = useState<'person1' | 'person2'>('person1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      type,
      description,
      totalValue: parseBRL(value),
      category,
      paidBy: type === ExpenseType.PERSONAL_P1 ? 'person1' : paidBy,
      date,
      installments: type === ExpenseType.FIXED ? 1 : (parseInt(installments) || 1)
    });
    onClose();
  };

  const isPersonalAndre = type === ExpenseType.PERSONAL_P1;

  return (
    <div className="fixed inset-0 bg-gray-900/60 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Novo Gasto</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valor Total</label>
              <input type="text" inputMode="decimal" required value={value} onChange={e => setValue(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition" placeholder="R$ 0,00" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Data</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Descrição</label>
            <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition" placeholder="O que você comprou?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition appearance-none">
                <option>Moradia</option><option>Alimentação</option><option>Transporte</option><option>Lazer</option><option>Saúde</option><option>Outros</option>
              </select>
            </div>
            {type !== ExpenseType.FIXED && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parcelas</label>
                <input type="number" min="1" value={installments || ''} onChange={e => setInstallments(e.target.value)} placeholder="1" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition" />
              </div>
            )}
          </div>

          {!isPersonalAndre && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quem pagou?</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPaidBy('person1')} className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${paidBy === 'person1' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>André</button>
                <button type="button" onClick={() => setPaidBy('person2')} className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${paidBy === 'person2' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>Luciana</button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl">Cancelar</button>
            <button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100">Lançar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseTabs;
