
import React from 'react';

interface Props {
    isPremium?: boolean;
    position?: 'dashboard' | 'sidebar' | 'bottom';
}

const AdBanner: React.FC<Props> = ({ isPremium, position = 'dashboard' }) => {
    // Never show ads for premium users
    if (isPremium) return null;

    return (
        <div className={`w-full overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-2 ${position === 'sidebar' ? 'mt-4' : 'my-8'
            }`}>
            <div className={`relative group cursor-pointer overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-lg transition-all ${position === 'sidebar' ? 'rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40' : 'rounded-[2rem] p-6 bg-white dark:bg-slate-800/20'
                }`}>
                {/* Ad Indicator */}
                <div className="absolute top-2 right-3 text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest pointer-events-none">Anúncio</div>

                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform ${position === 'sidebar' ? 'w-10 h-10 text-lg' : ''
                        }`}>
                        📢
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">Seu Anúncio Aqui</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-1">Clique para saber mais sobre esta oferta exclusiva.</p>
                    </div>
                    <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-p1 group-hover:text-white transition-colors shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Shine Animation */}
                <div className="absolute inset-y-0 -left-1/2 w-1/4 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-1000"></div>
            </div>
        </div>
    );
};

export default AdBanner;
