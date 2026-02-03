
import React, { useState } from 'react';

interface PresentationProps {
    onClose: () => void;
}

const steps = [
    {
        title: "Gestão Financeira Inteligente",
        description: "Tudo o que você precisa para organizar o dinheiro do casal em um único lugar, com clareza e justiça.",
        color: "from-p1 to-blue-600",
        features: [
            { icon: "📊", title: "Resumo Real", desc: "Cálculo automático de transferências e saldos." },
            { icon: "💰", title: "Rendas", desc: "Acompanhe salários e ganhos extras mensais." },
            { icon: "🛒", title: "Gastos", desc: "Lançamento de despesas comuns e parceladas." },
            { icon: "💳", title: "Carteira", desc: "Independência total para seus gastos pessoais." }
        ]
    },
    {
        title: "Planejamento & Conexão",
        description: "Trabalhem juntos para conquistar seus sonhos com dados sincronizados e metas compartilhadas.",
        color: "from-blue-600 to-indigo-600",
        features: [
            { icon: "🎯", title: "Metas", desc: "Economize para viagens e compras importantes." },
            { icon: "🔄", title: "Sincronia", desc: "Dados atualizados na hora nos dois celulares." },
            { icon: "🔐", title: "Segurança", desc: "Seus dados protegidos e salvos na nuvem." },
            { icon: "📄", title: "Relatórios", desc: "Gere PDFs detalhados dos seus fechamentos." }
        ]
    }
];

const Presentation: React.FC<PresentationProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const prev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[20000] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Background Decor */}
            <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${step.color} rounded-full blur-[100px] opacity-10 transition-all duration-1000`}></div>
            <div className={`absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr ${step.color} rounded-full blur-[100px] opacity-10 transition-all duration-1000`}></div>

            <div className="max-w-2xl w-full flex-1 flex flex-col items-center justify-center relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Progress Bar */}
                <div className="w-full flex gap-2 mb-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all duration-500 ${i === currentStep ? `bg-gradient-to-r ${step.color}` : 'bg-slate-100 dark:bg-slate-800'}`}
                        />
                    ))}
                </div>

                {/* Header content */}
                <div className="text-center space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-tight italic">
                        {step.title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                        {step.description}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    {step.features.map((f, i) => (
                        <div
                            key={i}
                            className="group p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5 flex items-start gap-4 hover:scale-[1.02] transition-all duration-300"
                        >
                            <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-white dark:ring-slate-900`}>
                                {f.icon}
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-xs">{f.title}</h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-tight">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Controls */}
            <div className="w-full max-w-xl flex flex-col gap-4 mt-8 relative z-10">
                <button
                    onClick={next}
                    className={`w-full py-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] bg-gradient-to-r ${step.color} hover:brightness-110`}
                >
                    {currentStep === steps.length - 1 ? "Começar Agora 🚀" : "Próximo Passo"}
                </button>

                <div className="flex items-center justify-between px-2">
                    {currentStep > 0 ? (
                        <button onClick={prev} className="text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-p1 transition-colors">
                            Anterior
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        Pular Apresentação
                    </button>
                </div>
            </div>

            {/* Slide Indicators Count */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">
                    Página {currentStep + 1} de {steps.length}
                </span>
            </div>
        </div>
    );
};

export default Presentation;
