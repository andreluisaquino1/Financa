
import React, { useState } from 'react';

interface FAQItemProps {
    question: string;
    answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-3xl border border-gray-100/50 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left group"
            >
                <span className="font-black text-gray-800 tracking-tight">{question}</span>
                <svg
                    className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                className={`px-6 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
            >
                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                    {answer}
                </p>
            </div>
        </div>
    );
};

interface HelpSupportProps {
    onShowPresentation?: () => void;
}

const HelpSupport: React.FC<HelpSupportProps> = ({ onShowPresentation }) => {
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success'>('idle');

    const handleReportError = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailStatus('sending');

        // Simulação de envio
        const subject = encodeURIComponent('Relato de Erro - Finanças em Casal');
        const body = encodeURIComponent('Descreva o erro aqui...\n\n---\nEnviado via App Help Section');
        window.location.href = `mailto:suportefinancaemcasal@gmail.com?subject=${subject}&body=${body}`;

        setTimeout(() => {
            setEmailStatus('success');
            setTimeout(() => setEmailStatus('idle'), 3000);
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-full mb-2">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-gray-900">Como podemos ajudar?</h2>
                <p className="text-gray-500 font-medium max-w-lg mx-auto">
                    Tire suas dúvidas sobre o funcionamento do app ou reporte problemas técnicos para nossa equipe.
                </p>
            </div>

            {/* FAQ Grid */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-6 shadow-sm mb-8">
                    <div className="space-y-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">Novo por aqui?</h4>
                        <p className="text-xs text-slate-500 font-medium">Veja uma apresentação rápida de tudo o que o app pode fazer por você.</p>
                    </div>
                    <button
                        onClick={onShowPresentation}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all shrink-0"
                    >
                        Ver Tour ✨
                    </button>
                </div>

                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs px-2">Perguntas Frequentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FAQItem
                        question="Como funciona a divisão proporcional?"
                        answer="Calculamos quanto o salário de cada um representa no total do casal. Se um ganha R$ 6.000 e outro R$ 4.000, o primeiro paga 60% das contas comuns e o segundo 40%."
                    />
                    <FAQItem
                        question="O que são os lançamentos na Carteira?"
                        answer="São gastos individuais que não entram na conta do casal. Servem para você ter o controle do seu saldo restante após pagar sua parte das despesas fixas."
                    />
                    <FAQItem
                        question="Dados são salvos automaticamente?"
                        answer="Sim! Usamos o Supabase para sincronizar seus dados em tempo real. Qualquer alteração feita aqui aparece instantaneamente em outros dispositivos logados."
                    />
                    <FAQItem
                        question="Como adicionar gastos parcelados?"
                        answer="Ao adicionar um gasto, você pode definir o número de parcelas. O sistema irá distribuir o valor nos meses seguintes automaticamente."
                    />
                </div>
            </div>

            {/* Report Error Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tighter">Encontrou um bug?</h3>
                        <p className="text-slate-400 font-medium max-w-md">
                            Estamos sempre melhorando. Relate qualquer problema técnico ou sugestão de melhoria diretamente para nós.
                        </p>
                    </div>

                    <button
                        onClick={handleReportError}
                        className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl font-black transition-all active:scale-95 ${emailStatus === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-slate-900 hover:bg-blue-50'
                            }`}
                    >
                        {emailStatus === 'sending' ? (
                            <span className="animate-pulse">Abrindo E-mail...</span>
                        ) : emailStatus === 'success' ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                <span>E-mail Aberto</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <span>Reportar via E-mail</span>
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        Tempo de resposta estimado: 24h
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;
