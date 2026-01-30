
import React, { useEffect } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdOptions } from '@capacitor-community/admob';

interface Props {
    isPremium?: boolean;
    position?: 'dashboard' | 'sidebar' | 'bottom';
}

const AdBanner: React.FC<Props> = ({ isPremium, position = 'dashboard' }) => {
    // Never show ads for premium users
    if (isPremium) return null;

    useEffect(() => {
        async function showBanner() {
            // Small delay to ensure view is ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const options: BannerAdOptions = {
                adId: 'ca-app-pub-1110010077986201/1868807679', // Real Ad Unit ID
                adSize: BannerAdSize.BANNER,
                position: position === 'bottom' ? BannerAdPosition.BOTTOM_CENTER : BannerAdPosition.TOP_CENTER,
                margin: position === 'sidebar' ? 60 : 0,
                isTesting: false,
            };

            try {
                await AdMob.showBanner(options);
            } catch (e) {
                console.log('Banner fail:', e);
            }
        }

        // Only show real banner if not on web (Capacitor handles this)
        const isNative = (window as any).Capacitor?.isNative;
        if (isNative) {
            showBanner();
        }

        return () => {
            if (isNative) {
                AdMob.removeBanner().catch(e => { });
            }
        };
    }, [position]);

    // Keep the visual placeholder for Web/Preview mode
    return (
        <div className={`w-full overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-2 ${position === 'sidebar' ? 'mt-4' : 'my-8'
            }`}>
            <div className={`relative group cursor-pointer overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-lg transition-all ${position === 'sidebar' ? 'rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40' : 'rounded-[2rem] p-6 bg-white dark:border-white/5'
                }`}>
                <div className="absolute top-2 right-3 text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest pointer-events-none">Recomendação</div>

                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform ${position === 'sidebar' ? 'w-10 h-10 text-lg' : ''
                        }`}>
                        🚀
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">Seja PRO por R$ 29,90</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-1">Remova este bloco e libere todos os recursos.</p>
                    </div>
                    <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-p1 group-hover:text-white transition-colors shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdBanner;
