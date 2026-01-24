
import React, { useState } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '../types';
import { formatCurrency, parseBRL, parseSafeDate } from '../utils';

interface Props {
  activeTab: 'fixed' | 'common' | 'equal' | 'reimbursement';
  expenses: Expense[];
  monthKey: string;
  coupleInfo: CoupleInfo;
  onAddExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (id: string, exp: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
}

const ExpenseTabs: React.FC<Props> = ({ activeTab, expenses, monthKey, coupleInfo, onAddExpense, onUpdateExpense, onDeleteExpense }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const typeMap: Record<string, ExpenseType> = {
    fixed: ExpenseType.FIXED,
    common: ExpenseType.COMMON,
    equal: ExpenseType.EQUAL,
    reimbursement: ExpenseType.REIMBURSEMENT
  };

  const [targetYear, targetMonth] = monthKey.split('-').map(Number);

  const filteredExpenses = expenses
    .filter(exp => {
      if (exp.type !== typeMap[activeTab]) return false;

      const expDate = parseSafeDate(exp.date);
      const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));

      if (exp.type === ExpenseType.FIXED) return diffMonths >= 0;
      return diffMonths >= 0 && diffMonths < exp.installments;
    })
    .filter(exp => {
      // Filtro de Busca
      const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      // Filtro de Categoria
      const matchesCategory = selectedCategory === 'Todas' || exp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const valA = a.totalValue / a.installments;
        const valB = b.totalValue / b.installments;
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
    });

  const tabTitles: Record<string, string> = {
    fixed: 'Gastos Fixos',
    common: 'Gastos Comuns',
    equal: 'Gastos 50/50',
    reimbursement: 'Reembolsos'
  };

  const handleEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setShowAdd(true);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{tabTitles[activeTab]}</h2>
          <p className="text-sm text-gray-500">Lançamentos em {monthKey}</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setShowAdd(true); }}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Buscar gasto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none transition"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl pl-4 pr-10 py-3 text-sm font-bold outline-none transition appearance-none min-w-[140px]"
              >
                <option>Todas</option>
                {(coupleInfo.categories || ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']).map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>

            <button
              onClick={() => {
                if (sortBy === 'date') setSortBy('value');
                else {
                  setSortBy('date');
                  setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                }
              }}
              className="bg-gray-50 border-2 border-transparent hover:bg-gray-100 rounded-2xl px-4 py-3 text-sm font-black text-gray-600 flex items-center gap-2 transition"
            >
              <span>{sortBy === 'date' ? 'Data' : 'Valor'}</span>
              <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>
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
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="font-black text-gray-900 text-lg tracking-tight">{formatCurrency(exp.totalValue / exp.installments)}</p>
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(exp)} className="text-blue-300 hover:text-blue-600 p-1.5 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDeleteExpense(exp.id)} className="text-red-300 hover:text-red-600 p-1.5 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          type={editingExpense?.type || typeMap[activeTab]}
          coupleInfo={coupleInfo}
          initialData={editingExpense}
          onClose={() => { setShowAdd(false); setEditingExpense(null); }}
          onAdd={(data) => {
            if (editingExpense) onUpdateExpense(editingExpense.id, data);
            else onAddExpense(data);
          }}
        />
      )}
    </div>
  );
};

export const AddExpenseModal: React.FC<{
  type: ExpenseType,
  coupleInfo: CoupleInfo,
  initialData?: Expense | null,
  onClose: () => void,
  onAdd: (exp: any) => void
}> = ({ type, coupleInfo, initialData, onClose, onAdd }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [value, setValue] = useState(initialData?.totalValue?.toString().replace('.', ',') || '');
  const [category, setCategory] = useState(initialData?.category || (coupleInfo.categories?.[0] || 'Outros'));
  const [paidBy, setPaidBy] = useState<'person1' | 'person2'>(initialData?.paidBy || 'person1');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');

  const [onlyThisMonth, setOnlyThisMonth] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseBRL(value);

    let metadata = initialData?.metadata || {};
    if (type === ExpenseType.FIXED && initialData && onlyThisMonth) {
      // Adicionar ou atualizar a exceção para o mês atual selecionado
      metadata = {
        ...metadata,
        overrides: {
          ...(metadata.overrides || {}),
          [initialData.date.substring(0, 7)]: parsedValue // Usar a chave do mês do gasto ou atual
        }
      };
    }

    onAdd({
      type,
      description,
      totalValue: onlyThisMonth ? (initialData?.totalValue || parsedValue) : parsedValue,
      category,
      paidBy: type === ExpenseType.PERSONAL_P1 ? 'person1' : (type === ExpenseType.PERSONAL_P2 ? 'person2' : paidBy),
      date,
      installments: type === ExpenseType.FIXED ? 1 : (parseInt(installments) || 1),
      metadata: (type === ExpenseType.FIXED && onlyThisMonth) ? metadata : (onlyThisMonth ? metadata : initialData?.metadata)
    });
    onClose();
  };

  const isPersonalType = type === ExpenseType.PERSONAL_P1 || type === ExpenseType.PERSONAL_P2;

  // Simplificar a lógica de montagem do metadata para enviar
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalValue = parseBRL(value);
    const monthKey = date.substring(0, 7);

    let finalMetadata = initialData?.metadata || {};
    let finalTotalValue = finalValue;

    if (type === ExpenseType.FIXED && initialData && onlyThisMonth) {
      // Se mudar apenas este mês, preservamos o total_value original
      // e criamos uma exceção no metadata.overrides
      finalTotalValue = initialData.totalValue;
      finalMetadata = {
        ...finalMetadata,
        overrides: {
          ...(finalMetadata.overrides || {}),
          [monthKey]: finalValue
        }
      };
    } else if (type === ExpenseType.FIXED && initialData && !onlyThisMonth) {
      // Se mudar todos, limpamos a exceção deste mês se ela existia
      if (finalMetadata.overrides) {
        const { [monthKey]: _, ...rest } = finalMetadata.overrides;
        finalMetadata = { ...finalMetadata, overrides: rest };
      }
    }

    onAdd({
      type,
      description,
      totalValue: finalTotalValue,
      category,
      paidBy: type === ExpenseType.PERSONAL_P1 ? 'person1' : (type === ExpenseType.PERSONAL_P2 ? 'person2' : paidBy),
      date,
      installments: type === ExpenseType.FIXED ? 1 : (parseInt(installments) || 1),
      metadata: finalMetadata
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
          {initialData ? 'Editar Gasto' : 'Novo Gasto'}
        </h3>

        {type === ExpenseType.FIXED && initialData ? (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <input
              type="checkbox"
              id="onlyThisMonth"
              checked={onlyThisMonth}
              onChange={e => setOnlyThisMonth(e.target.checked)}
              className="w-5 h-5 rounded-lg text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="onlyThisMonth" className="text-xs font-bold text-amber-800 leading-tight cursor-pointer">
              Mudar apenas neste mês (manter padrão para os outros)
            </label>
          </div>
        ) : type === ExpenseType.FIXED && (
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-6">Gastos fixos repetem automaticamente todo mês.</p>
        )}

        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Valor Total</label>
              <input type="text" inputMode="decimal" required value={value} onChange={e => setValue(e.target.value.replace('-', ''))} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition" placeholder="R$ 0,00" />
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
                {(coupleInfo.categories || ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']).map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {type !== ExpenseType.FIXED && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parcelas</label>
                <input type="number" min="1" value={installments || ''} onChange={e => setInstallments(e.target.value)} placeholder="1" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl px-5 py-4 font-bold outline-none transition" />
              </div>
            )}
          </div>

          {!isPersonalType && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quem pagou?</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPaidBy('person1')} className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${paidBy === 'person1' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>{coupleInfo.person1Name}</button>
                <button type="button" onClick={() => setPaidBy('person2')} className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${paidBy === 'person2' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-100 text-gray-400'}`}>{coupleInfo.person2Name}</button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl">Cancelar</button>
            <button type="submit" className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100">
              {initialData ? 'Atualizar' : 'Lançar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseTabs;
