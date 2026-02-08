import React, { useState, useMemo, useEffect } from 'react';
import { Loan, CoupleInfo } from '@/types';
import { formatCurrency, parseBRL, formatAsBRL } from '@/utils';
import { RECOMMENDED_ICONS } from '@/config/design';

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
    const [icon, setIcon] = useState('🤝');
    const [showIconPicker, setShowIconPicker] = useState(false);

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
        setIcon('🤝');
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
            lender,
            icon
        };

        if (editingId) {
            onUpdateLoan(editingId, data);
        } else {
            onAddLoan({
                ...data,
                remaining_value: value,
                paid_installments: 0,
                status: 'pending'
            } as any);
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
        setIcon(loan.icon || '🤝');
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header com Status e Botão principal */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Empréstimos
                        </h2>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                        Controle valores a receber de terceiros e gerencie os prazos de pagamento
                    </p>
                </div>

                <div className="flex items-center gap-6 w-full lg:w-auto z-10">
                    <div className="hidden sm:flex flex-col items-end pr-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total a Receber</span>
                        <span className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">{formatCurrency(totalPending)}</span>
                    </div>

                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex-1 lg:flex-none bg-slate-900 dark:bg-p1 hover:brightness-110 text-white px-10 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-p1/30 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Novo Empréstimo
                    </button>
                </div>

                {/* Efeitos visuais de fundo */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
                    <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/5">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block mb-1">Ícone</label>
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border transition-all ${showIconPicker ? 'bg-p1 text-white border-p1' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'}`}
                                >
                                    {icon}
                                </button>

                                {showIconPicker && (
                                    <>
                                        <div className="fixed inset-0 z-[110]" onClick={() => setShowIconPicker(false)} />
                                        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl p-4 z-[120] grid grid-cols-5 gap-2 animate-in fade-in zoom-in-95 duration-200">
                                            {RECOMMENDED_ICONS.map(i => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        setIcon(i);
                                                        setShowIconPicker(false);
                                                    }}
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 ${icon === i ? 'bg-p1/10 ring-2 ring-p1 scale-110' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                                                >
                                                    {i}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {editingId ? 'Editar Empréstimo' : 'Cadastrar Empréstimo'}
                                </h3>
                                <p className="text-slate-500 font-bold text-sm">Preencha os dados do valor emprestado</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Quem pediu?</label>
                                <input
                                    type="text" value={borrowerName} onChange={e => setBorrowerName(e.target.value)}
                                    placeholder="Ex: Primo João"
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:opacity-30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Valor Total</label>
                                    <input
                                        type="text" value={totalValue} onChange={handleValueChange}
                                        placeholder="R$ 0,00"
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-black text-xl text-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Parcelado em</label>
                                    <div className="relative">
                                        <input
                                            type="number" min="1" value={installments} onChange={e => setInstallments(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-black text-xl text-slate-900 dark:text-slate-100 outline-none transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Vezes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Quem emprestou?</label>
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl gap-1 border border-slate-200 dark:border-white/5">
                                    <button
                                        type="button" onClick={() => setLender('person1')}
                                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${lender === 'person1' ? 'bg-white dark:bg-slate-800 shadow-sm text-p1 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                    >
                                        {p1Name}
                                    </button>
                                    <button
                                        type="button" onClick={() => setLender('person2')}
                                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${lender === 'person2' ? 'bg-white dark:bg-slate-800 shadow-sm text-p2 ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-400'}`}
                                    >
                                        {p2Name}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Primeiro Vencimento</label>
                                <input
                                    type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição / Motivo</label>
                                <input
                                    type="text" value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Ex: Viagem, Conserto do carro..."
                                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:opacity-30"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all active:scale-[0.98] uppercase text-[10px] tracking-widest">
                                    {editingId ? 'Salvar Alterações 💾' : 'Confirmar 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500/40"></span>
                        Empréstimos Ativos
                    </h3>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{activeLoans.length} empréstimos</span>
                </div>

                {activeLoans.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                        <div className="text-4xl mb-3 opacity-20">📂</div>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum empréstimo ativo no momento! 🙌</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeLoans.map(loan => (
                            <div key={loan.id} className="bg-white dark:bg-slate-800/60 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-5 hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black ${loan.lender === 'person1' ? 'bg-p1/10 text-p1' : 'bg-p2/10 text-p2'} border-2 border-current/10 shadow-inner`}>
                                            {loan.icon || '🤝'}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-tight mb-1">{loan.borrower_name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-p1 font-black uppercase tracking-tighter bg-p1/5 px-1.5 py-0.5 rounded">
                                                    {loan.description || 'Geral'}
                                                </span>
                                                {loan.installments && loan.installments > 1 && (
                                                    <span className="text-[9px] bg-slate-900 dark:bg-slate-700 text-white px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">
                                                        {loan.paid_installments || 0}/{loan.installments}x
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-emerald-500 text-xl tracking-tighter leading-none mb-1">{formatCurrency(loan.remaining_value)}</p>
                                        <p className="text-[8px] text-slate-400 uppercase font-black tabular-nums opacity-60">Inicial: {formatCurrency(loan.total_value)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-white/5 gap-3">
                                    <div className="flex-1 flex gap-2">
                                        {loan.installments && loan.installments > 1 && (
                                            <button
                                                onClick={() => handlePayInstallment(loan)}
                                                className="flex-1 bg-blue-500 hover:brightness-110 text-white text-[9px] font-black uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95"
                                            >
                                                <span>➕</span> Parcela
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePayment(loan)}
                                            className="flex-[1.5] bg-emerald-500 hover:brightness-110 text-white text-[9px] font-black uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
                                        >
                                            <span>💳</span> Receber
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(loan)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-p1 transition-all active:scale-90">
                                            📝
                                        </button>
                                        <button onClick={() => confirm('Excluir empréstimo?') && onDeleteLoan(loan.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90">
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {loan.due_date && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
                                        <span className="text-[7px] text-slate-500 font-black uppercase">Vence {new Date(loan.due_date + 'T12:00:00').toLocaleDateString()}</span>
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
