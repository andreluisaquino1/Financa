import React, { useState, useMemo, useEffect } from 'react';
import { Loan, CoupleInfo } from '../types';
import { formatCurrency, parseBRL, formatAsBRL } from '../utils';

interface Props {
    loans: Loan[];
    coupleInfo: CoupleInfo;
    onAddLoan: (loan: Omit<Loan, 'id' | 'created_at'>) => void;
    onUpdateLoan: (id: string, loan: Partial<Loan>) => void;
    onDeleteLoan: (id: string) => void;
}

const LoansTab: React.FC<Props> = ({ loans, coupleInfo, onAddLoan, onUpdateLoan, onDeleteLoan }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [borrowerName, setBorrowerName] = useState('');
    const [description, setDescription] = useState('');
    const [totalValue, setTotalValue] = useState('');
    const [installments, setInstallments] = useState('1');
    const [dueDate, setDueDate] = useState('');
    const [lender, setLender] = useState<'person1' | 'person2'>('person1');

    useEffect(() => {
        if (!isAdding) resetForm();
    }, [isAdding]);

    const resetForm = () => {
        setBorrowerName('');
        setDescription('');
        setTotalValue('');
        setInstallments('1');
        setDueDate('');
        setLender('person1');
        setEditingId(null);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTotalValue(formatAsBRL(val));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseBRL(totalValue);
        if (!borrowerName || value <= 0) return;

        const data = {
            borrower_name: borrowerName,
            description,
            total_value: value,
            installments: parseInt(installments) || 1,
            due_date: dueDate || undefined,
            lender
        };

        if (editingId) {
            onUpdateLoan(editingId, data);
        } else {
            onAddLoan({
                ...data,
                remaining_value: value,
                paid_installments: 0,
                status: 'pending',
                user_id: '',
                household_id: ''
            });
        }
        setIsAdding(false);
    };

    const handleEdit = (loan: Loan) => {
        setBorrowerName(loan.borrower_name);
        setDescription(loan.description);
        setTotalValue(formatAsBRL((loan.total_value * 100).toString()));
        setInstallments((loan.installments || 1).toString());
        setDueDate(loan.due_date || '');
        setLender(loan.lender);
        setEditingId(loan.id);
        setIsAdding(true);
    };

    const handlePayment = (loan: Loan) => {
        const payment = prompt(`Valor pago por ${loan.borrower_name}:`, (loan.remaining_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
        if (payment) {
            const payVal = parseBRL(payment);
            if (payVal > 0) {
                const newRemaining = Math.max(0, loan.remaining_value - payVal);
                const newStatus = newRemaining === 0 ? 'paid' : 'partial';
                onUpdateLoan(loan.id, { remaining_value: newRemaining, status: newStatus });
            }
        }
    };

    const handlePayInstallment = (loan: Loan) => {
        const totalInst = loan.installments || 1;
        if (totalInst <= 1) return;

        const installmentValue = loan.total_value / totalInst;
        const nextPaidCount = (loan.paid_installments || 0) + 1;

        if (confirm(`Confirmar recebimento da parcela ${nextPaidCount} de ${totalInst} (${formatCurrency(installmentValue)})?`)) {
            const newRemaining = Math.max(0, loan.remaining_value - installmentValue);
            const newStatus = newRemaining <= 0 || nextPaidCount >= totalInst ? 'paid' : 'partial';
            onUpdateLoan(loan.id, {
                remaining_value: newRemaining,
                paid_installments: nextPaidCount,
                status: newStatus
            });
        }
    };

    const activeLoans = useMemo(() => loans.filter(l => l.status !== 'paid'), [loans]);
    const paidLoans = useMemo(() => loans.filter(l => l.status === 'paid'), [loans]);
    const totalPending = useMemo(() => activeLoans.reduce((acc, curr) => acc + curr.remaining_value, 0), [activeLoans]);

    const p1Name = coupleInfo.person1Name || 'Pessoa 1';
    const p2Name = coupleInfo.person2Name || 'Pessoa 2';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Receber 💰</p>
                    <h2 className="text-3xl font-black text-emerald-500">{formatCurrency(totalPending)}</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`w-full py-3 rounded-xl font-black uppercase transition-all ${isAdding ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : 'bg-p1 text-white shadow-lg shadow-p1/20'}`}
                    >
                        {isAdding ? '✕ Cancelar' : '+ Novo Empréstimo'}
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border-2 border-p1/20 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-black mb-4 text-slate-800 dark:text-slate-100">{editingId ? 'Editar Empréstimo' : 'Cadastrar Empréstimo'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Quem pediu?</label>
                                <input
                                    type="text" value={borrowerName} onChange={e => setBorrowerName(e.target.value)}
                                    placeholder="Ex: Primo João"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Valor Total</label>
                                <input
                                    type="text" value={totalValue} onChange={handleValueChange}
                                    placeholder="R$ 0,00"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold text-emerald-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Parcelado em:</label>
                                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-1 border-2 border-transparent focus-within:border-p1 transition-all">
                                    <input
                                        type="number" min="1" value={installments} onChange={e => setInstallments(e.target.value)}
                                        className="w-full bg-transparent py-2 outline-none font-bold"
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Vezes</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase px-1">Primeiro Vencimento</label>
                                <input
                                    type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-1.5 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase px-1">Quem emprestou?</label>
                            <div className="flex gap-2">
                                <button
                                    type="button" onClick={() => setLender('person1')}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${lender === 'person1' ? 'border-p1 bg-p1 text-white shadow-lg shadow-p1/20' : 'border-slate-100 dark:border-white/5 text-slate-400 bg-slate-50 dark:bg-slate-900'}`}
                                >
                                    {p1Name}
                                </button>
                                <button
                                    type="button" onClick={() => setLender('person2')}
                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${lender === 'person2' ? 'border-p2 bg-p2 text-white shadow-lg shadow-p2/20' : 'border-slate-100 dark:border-white/5 text-slate-400 bg-slate-50 dark:bg-slate-900'}`}
                                >
                                    {p2Name}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase px-1">Descrição / Motivo</label>
                            <input
                                type="text" value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Ex: Viagem, Conserto do carro..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-p1 rounded-xl px-4 py-3 outline-none transition-all font-bold"
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 transition-all active:scale-[0.98]">
                            {editingId ? '💾 Salvar Alterações' : 'Confirmar Empréstimo'}
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Empréstimos Ativos</h3>
                {activeLoans.length === 0 ? (
                    <div className="py-12 bg-white dark:bg-slate-800/40 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-center">
                        <p className="text-slate-400 font-bold text-xs">Ninguém está te devendo por enquanto! 🙌</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeLoans.map(loan => (
                            <div key={loan.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 relative group hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black ${loan.lender === 'person1' ? 'bg-p1 shadow-lg shadow-p1/20' : 'bg-p2 shadow-lg shadow-p2/20'}`}>
                                            {loan.lender === 'person1' ? p1Name[0] : p2Name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-slate-100">{loan.borrower_name}</h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{loan.description || 'Sem descrição'}</p>
                                                {loan.installments && loan.installments > 1 && (
                                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2.5 rounded-full font-black uppercase">
                                                        {loan.paid_installments || 0}/{loan.installments}x
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-500 leading-none mb-1">{formatCurrency(loan.remaining_value)}</p>
                                        <p className="text-[8px] text-slate-400 uppercase font-black">Total: {formatCurrency(loan.total_value)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {loan.installments && loan.installments > 1 && (
                                        <button
                                            onClick={() => handlePayInstallment(loan)}
                                            className="flex-1 bg-blue-500 text-white text-[10px] font-black uppercase py-2.5 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-1 shadow-lg shadow-blue-500/10"
                                        >
                                            <span>➕</span> Parcela
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handlePayment(loan)}
                                        className="flex-[2] bg-emerald-500 text-white text-[10px] font-black uppercase py-2.5 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                                    >
                                        <span>💳</span> Outro Valor
                                    </button>
                                    <button
                                        onClick={() => handleEdit(loan)}
                                        className="px-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-lg hover:text-amber-500 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => confirm('Excluir empréstimo?') && onDeleteLoan(loan.id)}
                                        className="px-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-lg hover:text-red-500 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>

                                {loan.due_date && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-40">
                                        <span className="text-[8px] text-slate-500 font-black uppercase">Vence em {new Date(loan.due_date + 'T12:00:00').toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {paidLoans.length > 0 && (
                <div className="mt-12 opacity-50 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Histórico (Pagos)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {paidLoans.map(loan => (
                            <div key={loan.id} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">✅</span>
                                    <div>
                                        <p className="font-bold text-slate-600 dark:text-slate-400 line-through text-xs">{loan.borrower_name}</p>
                                        <p className="text-[10px] text-slate-400">{formatCurrency(loan.total_value)}</p>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteLoan(loan.id)} className="text-slate-300 hover:text-red-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoansTab;
