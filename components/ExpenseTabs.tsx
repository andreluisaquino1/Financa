import React, { useMemo } from 'react';
import { Expense, ExpenseType, CoupleInfo } from '../types';
import { formatCurrency, parseSafeDate } from '../utils';

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
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const isMonthMatch = e.date.startsWith(monthKey);

      if (activeTab === 'expenses') {
        return e.type === ExpenseType.FIXED ||
          ((e.type === ExpenseType.COMMON || e.type === ExpenseType.EQUAL) && isMonthMatch);
      }

      if (activeTab === 'reimbursement') {
        return e.type === ExpenseType.REIMBURSEMENT && isMonthMatch;
      }

      return false;
    });
  }, [expenses, activeTab, monthKey]);

  const fixedExpenses = useMemo(() => filteredExpenses.filter(e => e.type === ExpenseType.FIXED), [filteredExpenses]);
  const variableExpenses = useMemo(() => filteredExpenses.filter(e => e.type !== ExpenseType.FIXED && e.type !== ExpenseType.REIMBURSEMENT), [filteredExpenses]);
  const reimbursementExpenses = useMemo(() => filteredExpenses.filter(e => e.type === ExpenseType.REIMBURSEMENT), [filteredExpenses]);

  const renderExpenseTable = (list: Expense[], title?: string, emptyMessage: string = "Nenhum gasto encontrado") => (
    <div className="space-y-4">
      {title && (
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-3">
          {title}
          <div className="h-px bg-slate-100 dark:bg-white/5 flex-1"></div>
        </h3>
      )}
      <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[100px]">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center sm:text-left min-w-[200px]">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Categoria</th>
                {activeTab === 'expenses' && (
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell">Divisão</th>
                )}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:table-cell">Pago por</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right min-w-[120px]">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {list.map(exp => {
                const value = (exp.type === ExpenseType.FIXED && exp.metadata?.overrides?.[monthKey])
                  ? exp.metadata.overrides[monthKey]
                  : exp.totalValue;

                return (
                  <tr key={exp.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">
                        {parseSafeDate(exp.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{exp.description}</p>
                        {exp.reminderDay && (
                          <span className="flex items-center gap-0.5 bg-p1/10 text-p1 text-[9px] px-1.5 py-0.5 rounded-lg font-black uppercase" title={`Lembrete dia ${exp.reminderDay}`}>
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22zm7-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C8.64 5.36 7 7.92 7 11v5l-2 2v1h14v-1l-2-2z" /></svg>
                            Dia {exp.reminderDay}
                          </span>
                        )}
                      </div>
                      <div className="sm:hidden flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{exp.category}</span>
                        {activeTab === 'expenses' && (
                          <span className="text-[10px] font-black text-p1 uppercase opacity-60">
                            • {exp.splitMethod === 'custom' ? `${exp.splitPercentage1}% / ${100 - (exp.splitPercentage1 || 50)}%` : 'Prop.'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 px-3 py-1.5 rounded-xl">{exp.category}</span>
                    </td>

                    {activeTab === 'expenses' && (
                      <td className="px-6 py-5 hidden md:table-cell">
                        <span className="text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200/50 dark:border-white/5">
                          {exp.splitMethod === 'custom' ? `${exp.splitPercentage1}% / ${100 - (exp.splitPercentage1 || 50)}%` : 'Proporcional'}
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-5 hidden lg:table-cell">
                      <span className={`text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl ${exp.paidBy === 'person1' ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'}`}>
                        {exp.paidBy === 'person1' ? coupleInfo.person1Name.split(' ')[0] : coupleInfo.person2Name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(value)}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onUpdateExpense(exp.id, exp)} className="p-2 text-slate-400 hover:text-p1 hover:bg-p1/5 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => { if (confirm('Excluir?')) onDeleteExpense(exp.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">{emptyMessage}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {activeTab === 'expenses' ? 'Gastos Compartilhados' : 'Reembolsos'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {activeTab === 'expenses'
              ? 'Contas do casal organizadas por periodicidade'
              : 'Lançamentos para ressarcimento entre o casal'}
          </p>
        </div>
        <button
          onClick={() => onAddExpense(activeTab === 'expenses' ? ExpenseType.COMMON : ExpenseType.REIMBURSEMENT, null)}
          className="bg-p1 hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-p1/10 flex items-center gap-2 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {activeTab === 'expenses' ? (
        <div className="space-y-12">
          {renderExpenseTable(fixedExpenses, "Contas Fixas", "Nenhuma conta fixa este mês")}
          {renderExpenseTable(variableExpenses, "Gastos Variáveis", "Nenhum gasto variável este mês")}
        </div>
      ) : (
        renderExpenseTable(reimbursementExpenses, undefined, "Nenhum reembolso este mês")
      )}
    </div>
  );
};

export default ExpenseTabs;
