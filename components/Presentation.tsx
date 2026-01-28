
import React, { useState } from 'react';

interface PresentationProps {
    onClose: () => void;
}

const steps = [
    {
        title: "Seja Bem-vindo!",
        description: "O Finanças em Casal foi desenhado para acabar com as brigas por dinheiro e trazer clareza total para a vida a dois.",
        icon: "💝",
        color: "from-p1 to-blue-600"
    },
    {
        title: "Resumo Inteligente",
        description: "Saiba instantaneamente quanto cada um precisa transferir para as contas da casa e qual é o saldo real do mês.",
        icon: "📊",
        color: "from-blue-600 to-indigo-600"
    },
    {
        title: "Gestão de Renda",
        description: "Cadastre salários e rendas extras. O app entende o poder de cada um e sugere divisões justas e proporcionais.",
        icon: "💰",
        color: "from-indigo-600 to-purple-600"
    },
    {
        title: "Gastos & Divisão",
        description: "Lance gastos comuns e escolha: dividir 50/50, por renda ou de forma totalmente personalizada.",
        icon: "🛒",
        color: "from-purple-600 to-pink-600"
    },
    {
        title: "Carteira Individual",
        description: "Mantenha sua independência! Controle seus gastos pessoais sem que eles afetem a planilha do casal.",
        icon: "💳",
        color: "from-pink-600 to-orange-600"
    },
    {
        title: "Metas em Conjunto",
        description: "Planeje o futuro! Criem metas para viagens ou compras e acompanhem a barra de progresso subindo.",
        icon: "🎯",
        color: "from-orange-600 to-p1"
    },
    {
        title: "Sincronização Real",
        description: "Conecte com seu parceiro usando um código único. O que um lança, o outro vê na hora no próprio celular.",
        icon: "🔄",
        color: "from-p1 to-slate-900"
    }
];

const Presentation: React.FC<PresentationProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

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

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[20000] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
            {/* Background Decor */}
            <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${step.color} rounded-full blur-[100px] opacity-20 transition-all duration-1000`}></div>
            <div className={`absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr ${step.color} rounded-full blur-[100px] opacity-20 transition-all duration-1000`}></div>

            <div className="max-w-xl w-full flex-1 flex flex-col items-center justify-center relative z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Progress Bar */}
                <div className="w-full flex gap-1.5 mb-8">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? `bg-gradient-to-r ${step.color}` : 'bg-slate-100 dark:bg-slate-800'}`}
                        />
                    ))}
                </div>

                {/* Icon & Content */}
                <div className={`w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br ${step.color} rounded-[2.5rem] flex items-center justify-center text-5xl sm:text-6xl shadow-2xl animate-in slide-in-from-bottom-8 duration-700`}>
                    {step.icon}
                </div>

                <div className="space-y-4 px-4 min-h-[160px]">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-tight">
                        {step.title}
                    </h2>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {step.description}
                    </p>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="w-full max-w-xl flex flex-col gap-4 mt-8 relative z-10">
                <button
                    onClick={next}
                    className={`w-full py-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] bg-gradient-to-r ${step.color}`}
                >
                    {currentStep === steps.length - 1 ? "Começar Agora 🚀" : "Próxima Maravilha"}
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
                    Função {currentStep + 1} de {steps.length}
                </span>
            </div>
        </div>
    );
};

export default Presentation;
