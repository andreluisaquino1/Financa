import React, { useMemo, useState } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '../types';
import { formatCurrency, parseSafeDate, isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo } from '../utils';
import TabFilter from './common/TabFilter';

interface Props {
  activeTab: 'expenses' | 'reimbursement';
  expenses: Expense[];
  monthKey: string;
  coupleInfo: CoupleInfo;
  onAddExpense: (type: ExpenseType, exp: Expense | null) => void;
  onUpdateExpense: (id: string, exp: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const ExpenseTabs: React.FC<Props> = ({
  activeTab,
  expenses,
  monthKey,
  coupleInfo,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterPayer, setFilterPayer] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const cats = (coupleInfo.categories || []).map(c => typeof c === 'string' ? c : c.name);
    return ['all', ...cats];
  }, [coupleInfo.categories]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const isInMonth = isExpenseInMonth(e, monthKey);
      if (!isInMonth) return false;

      // Tab Type Filter
      if (activeTab === 'expenses') {
        if (![ExpenseType.FIXED, ExpenseType.COMMON, ExpenseType.EQUAL].includes(e.type)) return false;
      } else {
        if (![ExpenseType.REIMBURSEMENT, ExpenseType.REIMBURSEMENT_FIXED].includes(e.type)) return false;
      }

      // Period Filter
      if (filterPeriod === 'fixed') {
        if (e.type !== ExpenseType.FIXED && e.type !== ExpenseType.REIMBURSEMENT_FIXED) return false;
      } else if (filterPeriod === 'variable') {
        if (e.type === ExpenseType.FIXED || e.type === ExpenseType.REIMBURSEMENT_FIXED) return false;
      }

      // Payer Filter
      if (filterPayer !== 'all' && e.paidBy !== filterPayer) return false;

      // Category Filter
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;

      // Search
      if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.category?.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [expenses, activeTab, monthKey, filterPeriod, filterPayer, filterCategory, search]);

  const fixedExpensesList = useMemo(() => filteredExpenses.filter(e => e.type === ExpenseType.FIXED || e.type === ExpenseType.REIMBURSEMENT_FIXED), [filteredExpenses]);
  const variableExpensesList = useMemo(() => filteredExpenses.filter(e => e.type !== ExpenseType.FIXED && e.type !== ExpenseType.REIMBURSEMENT_FIXED), [filteredExpenses]);

  const renderMobileList = (list: Expense[], emptyMessage: string) => (
    <div className="space-y-4">
      {list.map(exp => {
        const value = getMonthlyExpenseValue(exp, monthKey);
        const instInfo = getInstallmentInfo(exp, monthKey);
        const isP1 = exp.paidBy === 'person1';

        return (
          <div key={exp.id} className="bg-white dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-lg shadow-sm">
                  {(() => {
                    const cat = (coupleInfo.categories || []).find(c =>
                      typeof c === 'string' ? c === exp.category : c.name === exp.category
                    );
                    const customIcon = typeof cat === 'object' ? cat.icon : null;
                    if (customIcon) return customIcon;

                    if (exp.type === ExpenseType.FIXED || exp.type === ExpenseType.REIMBURSEMENT_FIXED) return '🏠';
                    if (exp.category === 'Alimentação') return '🥗';
                    if (exp.category === 'Transporte') return '🚗';
                    if (exp.category === 'Lazer') return '🎮';
                    if (exp.category === 'Saúde') return '🏥';
                    if (exp.category === 'Educação') return '🎓';
                    if (exp.category === 'Compras') return '🛍️';
                    if (exp.category === 'Viagem') return '✈️';
                    return '💸';
                  })()}
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{exp.description}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      {typeof exp.category === 'string' ? exp.category : (exp.category as any)?.name || 'Outros'}
                    </span>
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">
                      {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900 dark:text-slate-100 text-lg">{formatCurrency(value)}</p>
                {instInfo && (
                  <span className="text-[9px] font-black text-p1 bg-p1/10 px-1.5 py-0.5 rounded-lg uppercase">
                    {instInfo.current}/{instInfo.total}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${isP1 ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'}`}>
                  {isP1 ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                </span>
                {exp.splitMethod === 'custom' && (
                  <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    {exp.splitPercentage1}% / {100 - (exp.splitPercentage1 || 50)}%
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onUpdateExpense(exp.id, exp)} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 group-hover:text-p1 transition-colors">
                  📝
                </button>
                <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 group-hover:text-red-500 transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {list.length === 0 && (
        <div className="py-12 text-center bg-white dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
          <p className="text-slate-400 font-bold italic">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  const renderExpenseTable = (list: Expense[], title?: string, emptyMessage: string = "Nenhum gasto encontrado") => (
    <div className="space-y-4">
      {title && (
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-3">
          {title}
          <div className="h-px bg-slate-100 dark:bg-white/5 flex-1"></div>
        </h3>
      )}

      {/* Mobile View */}
      <div className="block lg:hidden">
        {renderMobileList(list, emptyMessage)}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[200px]">Data & Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Categoria</th>
                {activeTab === 'expenses' && (
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell">Divisão</th>
                )}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:table-cell">Pessoa</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right min-w-[120px]">Valor</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {list.map(exp => {
                const value = getMonthlyExpenseValue(exp, monthKey);
                const instInfo = getInstallmentInfo(exp, monthKey);

                return (
                  <tr key={exp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-sm shadow-sm">
                          {parseSafeDate(exp.date).getDate().toString().padStart(2, '0')}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{exp.description}</p>
                            {exp.reminderDay && (
                              <span className="bg-p1/10 text-p1 text-[8px] px-1.5 py-0.5 rounded uppercase font-black" title={`Lembrete dia ${exp.reminderDay}`}>
                                Dia {exp.reminderDay}
                              </span>
                            )}
                            {instInfo && (
                              <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-black">
                                {instInfo.current}/{instInfo.total}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                            {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                        {exp.category}
                      </span>
                    </td>

                    {activeTab === 'expenses' && (
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                          {exp.splitMethod === 'custom' ? `${exp.splitPercentage1}% / ${100 - (exp.splitPercentage1 || 50)}%` : 'Proporcional'}
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${exp.paidBy === 'person1' ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'}`}>
                        {exp.paidBy === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(value)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onUpdateExpense(exp.id, exp)} className="p-2 text-slate-400 hover:text-p1 hover:bg-p1/5 rounded-xl transition-all">📝</button>
                        <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {activeTab === 'expenses' ? 'Contas Compartilhadas' : 'Gestão de Reembolsos'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
            {activeTab === 'expenses'
              ? 'Contas do casal organizadas por periodicidade'
              : 'Organize ressarcimentos e acertos recorrentes'}
          </p>
        </div>
        <button
          onClick={() => onAddExpense(activeTab === 'expenses' ? ExpenseType.COMMON : ExpenseType.REIMBURSEMENT, null)}
          className="bg-p1 hover:bg-p1/90 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-p1/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>+</span> Adicionar {activeTab === 'expenses' ? 'Gasto' : 'Reembolso'}
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 rounded-3xl shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-11 pr-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-p1/20 transition-all dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border-none outline-none focus:ring-2 ring-p1/20 transition-all dark:text-slate-100"
            >
              <option value="all">Frequência: Tudo</option>
              <option value="fixed">Fixos / Mensais</option>
              <option value="variable">Pontuais / Variáveis</option>
            </select>

            <select
              value={filterPayer}
              onChange={(e) => setFilterPayer(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border-none outline-none focus:ring-2 ring-p1/20 transition-all dark:text-slate-100"
            >
              <option value="all">Pagador: Todos</option>
              <option value="person1">{coupleInfo.person1Name.split(' ')[0]}</option>
              <option value="person2">{coupleInfo.person2Name.split(' ')[0]}</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border-none outline-none focus:ring-2 ring-p1/20 transition-all dark:text-slate-100 max-w-[150px]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Categoria: Todas' : cat}
                </option>
              ))}
            </select>

            {(search || filterPeriod !== 'all' || filterPayer !== 'all' || filterCategory !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilterPeriod('all'); setFilterPayer('all'); setFilterCategory('all'); }}
                className="text-[10px] font-black uppercase text-p1 hover:underline px-2"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {renderExpenseTable(
          fixedExpensesList,
          activeTab === 'expenses' ? "Contas Fixas" : "Reembolsos Fixos",
          "Nenhum registro fixo encontrado com estes filtros"
        )}
        {renderExpenseTable(
          variableExpensesList,
          activeTab === 'expenses' ? "Gastos Variáveis" : "Reembolsos Pontuais",
          "Nenhum registro variável encontrado com estes filtros"
        )}
      </div>
    </div>
  );
};

export default ExpenseTabs;
