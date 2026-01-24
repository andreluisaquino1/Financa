
import React, { useState } from 'react';
import { CoupleInfo, Expense, ExpenseType } from '../types';
import { calculateSummary, formatCurrency, parseSafeDate } from '../utils';
import { AddExpenseModal } from './ExpenseTabs';

interface Props {
    person: 'person1' | 'person2';
    coupleInfo: CoupleInfo;
    expenses: Expense[];
    monthKey: string;
    onAddExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => void;
    onUpdateExpense: (id: string, exp: Omit<Expense, 'id' | 'createdAt'>) => void;
    onDeleteExpense: (id: string) => void;
}

const PersonalWallet: React.FC<Props> = ({
    person,
    coupleInfo,
    expenses,
    monthKey,
    onAddExpense,
    onUpdateExpense,
    onDeleteExpense
}) => {
    const [showAdd, setShowAdd] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const summary = calculateSummary(expenses, coupleInfo, monthKey);

    const isPerson1 = person === 'person1';
    const personName = isPerson1 ? coupleInfo.person1Name : coupleInfo.person2Name;
    const personSalary = isPerson1 ? coupleInfo.salary1 : coupleInfo.salary2;
    const personResponsibility = isPerson1 ? summary.person1Responsibility : summary.person2Responsibility;
    const personPersonalTotal = isPerson1 ? summary.person1PersonalTotal : summary.person2PersonalTotal;
    const personExpenseType = isPerson1 ? ExpenseType.PERSONAL_P1 : ExpenseType.PERSONAL_P2;

    // O que sobra é Salário - (Sua parte nas contas do casal) - (Seus gastos extras)
    const leftToInvest = personSalary - personResponsibility - personPersonalTotal;

    const [targetYear, targetMonth] = monthKey.split('-').map(Number);
    const personalExpenses = expenses.filter(exp => {
        if (exp.type !== personExpenseType) return false;
        const expDate = parseSafeDate(exp.date);
        const diffMonths = (targetYear - expDate.getFullYear()) * 12 + (targetMonth - (expDate.getMonth() + 1));
        return diffMonths >= 0 && diffMonths < exp.installments;
    });

    const themeColor = isPerson1 ? 'blue' : 'pink';
    const borderColor = isPerson1 ? 'border-blue-200' : 'border-pink-200';
    const bgColor = isPerson1 ? 'bg-blue-600' : 'bg-pink-600';
    const shadowColor = isPerson1 ? 'shadow-blue-100' : 'shadow-pink-100';
    const lightBgColor = isPerson1 ? 'bg-blue-50' : 'bg-pink-50';
    const lightBorderColor = isPerson1 ? 'border-blue-100' : 'border-pink-100';
    const textColor = isPerson1 ? 'text-blue-600' : 'text-pink-600';
    const lightTextColor = isPerson1 ? 'text-blue-400' : 'text-pink-400';

    const handleEdit = (exp: Expense) => {
        setEditingExpense(exp);
        setShowAdd(true);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const filteredPersonalExpenses = personalExpenses
        .filter(exp => {
            const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
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

    return (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            {/* Cabeçalho da Carteira */}
            <div className={`bg-white p-6 md:p-8 rounded-[2rem] border-2 border-dashed ${borderColor} shadow-sm space-y-8 relative overflow-hidden group`}>
                <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-4">
                        <div className={`${bgColor} p-4 rounded-2xl text-white shadow-lg ${shadowColor}`}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900 text-3xl tracking-tighter">Carteira de {personName}</h2>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Resumo Financeiro Pessoal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditingExpense(null); setShowAdd(true); }}
                        className={`${bgColor} text-white p-4 rounded-2xl shadow-xl active:scale-95 transition`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seu Salário</p>
                        <p className="text-2xl font-black text-gray-800">{formatCurrency(personSalary)}</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cota Compartilhada + Extras</p>
                        <p className="text-2xl font-black text-red-500">-{formatCurrency(personResponsibility + personPersonalTotal)}</p>
                    </div>

                    <div className={`${lightBgColor} p-6 rounded-3xl border ${lightBorderColor}`}>
                        <p className={`text-[10px] font-black ${lightTextColor} uppercase tracking-widest mb-1`}>Poder de Aporte (Livre)</p>
                        <p className={`text-3xl font-black ${textColor} tracking-tighter`}>{formatCurrency(leftToInvest)}</p>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Buscar gasto pessoal..."
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

            {/* Lista de Gastos Pessoais */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Gastos Individuais</h3>
                    <span className="font-bold text-gray-900">{formatCurrency(personPersonalTotal)}</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {filteredPersonalExpenses.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-medium italic">
                            Nenhum gasto encontrado com os filtros atuais.
                        </div>
                    ) : (
                        filteredPersonalExpenses.map(exp => (
                            <div key={exp.id} className="p-5 flex justify-between items-center group hover:bg-gray-50 transition">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] ${lightBgColor} ${textColor} px-2 py-0.5 rounded-lg font-black uppercase tracking-widest`}>{exp.category}</span>
                                        <span className="text-[10px] text-gray-400">{parseSafeDate(exp.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <p className="font-bold text-gray-800">{exp.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-black text-gray-900">
                                        {formatCurrency(exp.totalValue / exp.installments)}
                                        {exp.installments > 1 && (
                                            <span className="text-[10px] text-gray-400 ml-1.5 font-bold">
                                                {Math.floor(((targetYear - parseSafeDate(exp.date).getFullYear()) * 12 + (targetMonth - (parseSafeDate(exp.date).getMonth() + 1)))) + 1}/{exp.installments}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEdit(exp)} className="text-blue-300 hover:text-blue-600 transition p-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => onDeleteExpense(exp.id)} className="text-red-300 hover:text-red-500 transition p-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showAdd && (
                <AddExpenseModal
                    type={editingExpense?.type || personExpenseType}
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

export default PersonalWallet;
