import React, { useMemo, useState } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '@/types';
import { formatCurrency, parseSafeDate, isExpenseInMonth, getMonthlyExpenseValue, getInstallmentInfo } from '@/utils';
import TabFilter from '@/components/common/TabFilter';

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
  const [sortField, setSortField] = useState<'date' | 'value' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const cats = (coupleInfo.categories || []).map(c => typeof c === 'string' ? c : c.name);
    return ['all', ...cats];
  }, [coupleInfo.categories]);

  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(e => {
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

      // Price Range Filter
      const value = getMonthlyExpenseValue(e, monthKey);
      if (minPrice && value < parseFloat(minPrice)) return false;
      if (maxPrice && value > parseFloat(maxPrice)) return false;

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === 'date') {
        valA = a.date;
        valB = b.date;
      } else if (sortField === 'value') {
        valA = getMonthlyExpenseValue(a, monthKey);
        valB = getMonthlyExpenseValue(b, monthKey);
      } else {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [expenses, activeTab, monthKey, filterPeriod, filterPayer, filterCategory, search, sortField, sortOrder, minPrice, maxPrice]);

  const totalFilteredValue = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + getMonthlyExpenseValue(e, monthKey), 0);
  }, [filteredExpenses, monthKey]);

  const fixedExpensesList = useMemo(() => filteredExpenses.filter(e => e.type === ExpenseType.FIXED || e.type === ExpenseType.REIMBURSEMENT_FIXED), [filteredExpenses]);
  const variableExpensesList = useMemo(() => filteredExpenses.filter(e => e.type !== ExpenseType.FIXED && e.type !== ExpenseType.REIMBURSEMENT_FIXED), [filteredExpenses]);

  const renderMobileList = (list: Expense[], emptyMessage: string) => (
    <div className="space-y-4">
      {list.map(exp => {
        const value = getMonthlyExpenseValue(exp, monthKey);
        const instInfo = getInstallmentInfo(exp, monthKey);
        const isP1 = exp.paidBy === 'person1';

        return (
          <div key={exp.id} className="bg-white dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center text-xl shadow-sm">
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
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight mb-1">{exp.description}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] text-brand font-black uppercase tracking-tighter bg-brand/5 px-1.5 py-0.5 rounded">
                      {typeof exp.category === 'string' ? exp.category : (exp.category as any)?.name || 'Outros'}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tabular-nums">
                      {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-950 dark:text-slate-50 text-xl tracking-tighter">{formatCurrency(value)}</p>
                {instInfo && (
                  <span className="text-[10px] font-black text-white bg-slate-900 dark:bg-slate-700 px-2 py-0.5 rounded-lg uppercase tracking-widest mt-1 inline-block scale-90 origin-right">
                    {instInfo.current}/{instInfo.total}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${isP1 ? 'bg-p1/5 border-p1/20 text-p1' : 'bg-p2/5 border-p2/20 text-p2'}`}>
                  {isP1 ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                </span>
                {exp.splitMethod === 'custom' && (
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
                    🎯 {exp.splitPercentage1}% / {100 - (exp.splitPercentage1 || 50)}%
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onUpdateExpense(exp.id, exp)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-brand transition-all active:scale-90">
                  📝
                </button>
                <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {list.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-white/5">
          <div className="text-4xl mb-3 opacity-20">📂</div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  const renderExpenseTable = (list: Expense[], title?: string, emptyMessage: string = "Nenhum gasto encontrado") => (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-brand/40"></span>
            {title}
          </h3>
          <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{list.length} {list.length === 1 ? 'item' : 'itens'}</span>
        </div>
      )}

      {/* Mobile View */}
      <div className="block lg:hidden px-1">
        {renderMobileList(list, emptyMessage)}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest min-w-[240px]">🗓️ Data & Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell">🏷️ Categoria</th>
                {activeTab === 'expenses' && (
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest hidden md:table-cell text-center">⚖️ Divisão</th>
                )}
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest hidden lg:table-cell text-center">👤 Pagador</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right min-w-[140px]">💰 Valor</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest opacity-60 italic">{emptyMessage}</p>
                  </td>
                </tr>
              ) : list.map(exp => {
                const value = getMonthlyExpenseValue(exp, monthKey);
                const instInfo = getInstallmentInfo(exp, monthKey);
                const isP1 = exp.paidBy === 'person1';

                return (
                  <tr key={exp.id} className="group hover:bg-brand/5 dark:hover:bg-brand/10 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center shadow-inner border border-slate-100 dark:border-white/5 font-black text-slate-400 dark:text-slate-500 tabular-nums">
                          <span className="text-[9px] leading-tight opacity-40">{parseSafeDate(exp.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                          <span className="text-sm leading-tight text-slate-900 dark:text-slate-100">{parseSafeDate(exp.date).getDate()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{exp.description}</p>
                            {exp.reminderDay && (
                              <span className="bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black" title={`Lembrete dia ${exp.reminderDay}`}>
                                🔔 {exp.reminderDay}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tabular-nums italic">
                            {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {(() => {
                            const cat = (coupleInfo.categories || []).find(c => typeof c === 'object' && c.name === exp.category);
                            return (cat && typeof cat === 'object') ? cat.icon : '📁';
                          })()}
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/5">
                          {exp.category}
                        </span>
                      </div>
                    </td>

                    {activeTab === 'expenses' && (
                      <td className="px-8 py-6 hidden md:table-cell text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900/40 rounded-full border border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">
                            {exp.splitMethod === 'custom' ? `🎯 ${exp.splitPercentage1}% / ${100 - (exp.splitPercentage1 || 50)}%` : '⚖️ Prop.'}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="px-8 py-6 hidden lg:table-cell text-center">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${isP1 ? 'bg-p1/5 border-p1/20 text-p1' : 'bg-p2/5 border-p2/20 text-p2'}`}>
                        {isP1 ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-950 dark:text-white text-base tabular-nums tracking-tighter">{formatCurrency(value)}</span>
                        {instInfo && (
                          <span className="text-[8px] font-black text-slate-400 text-right uppercase mt-0.5">
                            Parcela {instInfo.current} de {instInfo.total}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => onUpdateExpense(exp.id, exp)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:text-brand rounded-2xl shadow-xl hover:shadow-brand/20 border border-slate-100 dark:border-white/5 transition-all active:scale-90">📝</button>
                        <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-2xl shadow-xl hover:shadow-red-500/20 border border-slate-100 dark:border-white/5 transition-all active:scale-90 ml-1">🗑️</button>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header com Status e Botão principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {activeTab === 'expenses' ? 'Contas da Casa' : 'Reembolsos'}
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
            {activeTab === 'expenses'
              ? 'Visualize e gerencie todos os gastos compartilhados do seu lar este mês'
              : 'Controle centralizado para ressarcimentos e acertos de contas pontuais'}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto z-10">
          <div className="hidden sm:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Subtotal Filtrado</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{formatCurrency(totalFilteredValue)}</span>
          </div>

          <button
            onClick={() => onAddExpense(activeTab === 'expenses' ? ExpenseType.COMMON : ExpenseType.REIMBURSEMENT, null)}
            className="flex-1 lg:flex-none bg-slate-900 dark:bg-brand hover:brightness-110 text-white px-10 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-brand/30 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Adicionar {activeTab === 'expenses' ? 'Gasto' : 'Reembolso'}
          </button>
        </div>

        {/* Efeitos visuais de fundo */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
      </div>

      {/* Filtros de Ultra Alta Performance */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-4 sm:p-6 rounded-[2rem] shadow-xl space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-6">
            {/* Busca Principal */}
            <div className="relative flex-1">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Busca avançada: descrição, categoria ou tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-16 pr-6 py-4 text-base font-bold outline-none focus:border-brand focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-slate-100 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Ações Rápidas de Filtro */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 ${showFilters ? 'bg-brand text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}
              >
                <span className="text-base">{showFilters ? '✖️' : '🔧'}</span>
                {showFilters ? 'Fechar Filtros' : 'Filtros Avançados'}
              </button>

              <div className="h-10 w-px bg-slate-100 dark:bg-white/5 hidden sm:block mx-1"></div>

              <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl gap-1">
                {(['desc', 'asc'] as const).map((order) => (
                  <button
                    key={order}
                    onClick={() => setSortOrder(order)}
                    className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${sortOrder === order ? 'bg-white dark:bg-slate-900 text-brand shadow-sm' : 'text-slate-400 opacity-50'}`}
                  >
                    {order === 'asc' ? 'Crescente' : 'Decrescente'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Painel Avançado (Colapsável) */}
          {showFilters && (
            <div className="pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Frequência</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 text-[11px] font-black uppercase tracking-widest px-4 py-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-200"
                >
                  <option value="all">📅 Todas Frequências</option>
                  <option value="fixed">🏠 Fixos / Mensais</option>
                  <option value="variable">⚡ Pontuais / Variáveis</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quem Pagou</label>
                <select
                  value={filterPayer}
                  onChange={(e) => setFilterPayer(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 text-[11px] font-black uppercase tracking-widest px-4 py-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-200"
                >
                  <option value="all">👥 Todos Pagadores</option>
                  <option value="person1">👤 {coupleInfo.person1Name.split(' ')[0]}</option>
                  <option value="person2">👤 {coupleInfo.person2Name.split(' ')[0]}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ordenação</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 text-[11px] font-black uppercase tracking-widest px-4 py-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-200"
                >
                  <option value="date">📅 Por Data</option>
                  <option value="value">💰 Por Valor</option>
                  <option value="description">📝 Por Descrição</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categorias</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 text-[11px] font-black uppercase tracking-widest px-4 py-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-200"
                >
                  <option value="all">🏷️ Todas Categorias</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Faixa de Valor (Min - Max)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/60 text-xs font-black p-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-100"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/60 text-xs font-black p-4 rounded-2xl border-2 border-transparent focus:border-brand/30 outline-none transition-all dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumo de Filtros Ativos */}
          {(search || filterPeriod !== 'all' || filterPayer !== 'all' || filterCategory !== 'all' || minPrice || maxPrice) && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[9px] font-black text-brand uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-full border border-brand/20 flex items-center gap-2">
                Filtros Ativos: {filteredExpenses.length} itens mostrados
                <button
                  onClick={() => { setSearch(''); setFilterPeriod('all'); setFilterPayer('all'); setFilterCategory('all'); setMinPrice(''); setMaxPrice(''); setSortField('date'); setSortOrder('desc'); setShowFilters(false); }}
                  className="bg-brand text-white p-0.5 rounded-full hover:scale-110 transition-transform"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Listagem das Tabelas */}
      <div className="space-y-12">
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
