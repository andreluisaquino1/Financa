
import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const PremiumModal: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const Feature = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-xl bg-p1 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-p1/20">{icon}</div>
            <div>
                <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 tracking-tight">{title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{desc}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500 border border-white/10">

                {/* Header Visual */}
                <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <div className="absolute top-10 left-10 w-20 h-20 bg-p1 rounded-full blur-[60px]"></div>
                        <div className="absolute bottom-10 right-10 w-32 h-32 bg-p2 rounded-full blur-[80px]"></div>
                    </div>
                    <div className="relative z-10">
                        <span className="px-4 py-1.5 bg-p1 text-white text-[10px] font-black rounded-full shadow-xl animate-bounce">OFERTA DE LANÇAMENTO</span>
                        <h2 className="text-4xl font-black text-white mt-4 tracking-tighter italic">FINANÇAS PRO</h2>
                        <p className="text-slate-400 text-sm font-bold mt-2">Tudo o que seu casal precisa para prosperar</p>
                    </div>
                </div>

                <div className="p-8 space-y-4">
                    <Feature icon="📊" title="Relatórios Ilimitados" desc="Acesse o histórico completo de todos os meses, sem restrições de visualização." />
                    <Feature icon="📂" title="Exportação em PDF/Excel" desc="Gere arquivos profissionais dos seus fechamentos mensais com apenas um toque." />
                    <Feature icon="🏷️" title="Super Categorias" desc="Adicione quantas categorias quiser para organizar seus gastos no seu estilo." />
                    <Feature icon="☁️" title="Backup em Nuvem Prioritário" desc="Seus dados sincronizados instantaneamente entre dispositivos do casal." />
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano Vitalício</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">R$ 29,90</span>
                                <span className="text-xs text-slate-400 font-bold">/ único</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-emerald-500 font-black uppercase">Economize 50%</span>
                            <p className="text-[8px] text-slate-400 font-bold line-through">De R$ 59,90</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors">Voltar</button>
                        <button className="flex-[2] py-4 bg-slate-900 dark:bg-p1 text-white rounded-[1.25rem] font-black text-xs uppercase shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Quero ser PRO</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;
