
import React, { useState } from 'react';
import { CoupleInfo } from '../types';
import { parseBRL, formatAsBRL } from '../utils';
import AdBanner from './AdBanner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
  coupleInfo: CoupleInfo;
  onUpdateSettings: (
    n1: string,
    n2: string,
    s1: number,
    s2: number,
    cats?: string[],
    mode?: 'proportional' | 'fixed',
    mPerc1?: number,
    theme?: 'light' | 'dark',
    p1Color?: string,
    p2Color?: string
  ) => void;
  userEmail?: string;
  onSignOut?: () => void;
  onNavigateToHelp?: () => void;
  onShowHouseholdLink?: () => void;
  onShowPremium?: () => void;
  householdId?: string | null;
  userId?: string;
  inviteCode?: string | null;
  isPremium?: boolean;
}

const DEFAULT_FREE_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde'];

const SidebarMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  onDeleteAccount,
  coupleInfo,
  onUpdateSettings,
  userEmail,
  onSignOut,
  onNavigateToHelp,
  onShowHouseholdLink,
  onShowPremium,
  householdId,
  userId,
  inviteCode,
  isPremium
}) => {
  const [n1, setN1] = useState(coupleInfo.person1Name);
  const [n2, setN2] = useState(coupleInfo.person2Name);
  const [s1, setS1] = useState(coupleInfo.salary1 ? formatAsBRL((coupleInfo.salary1 * 100).toString()) : '');
  const [s2, setS2] = useState(coupleInfo.salary2 ? formatAsBRL((coupleInfo.salary2 * 100).toString()) : '');

  // Logic: if not premium, use hardcoded categories. If premium, use saved ones.
  const initialCats = isPremium ? (coupleInfo.categories || []) : DEFAULT_FREE_CATEGORIES;
  const [categories, setCategories] = useState<string[]>(initialCats);
  const [newCategory, setNewCategory] = useState('');

  const [splitMode, setSplitMode] = useState<'proportional' | 'fixed'>(coupleInfo.customSplitMode || 'proportional');
  const [manualPerc1, setManualPerc1] = useState(coupleInfo.manualPercentage1 !== undefined ? coupleInfo.manualPercentage1 : 50);

  const [theme, setTheme] = useState<'light' | 'dark'>(coupleInfo.theme || 'light');
  const [p1Color, setP1Color] = useState(coupleInfo.person1Color || '#2563eb');
  const [p2Color, setP2Color] = useState(coupleInfo.person2Color || '#ec4899');

  const handleSave = () => {
    // Free users can't change categories, so we pass back the static list or their saved list if premium
    onUpdateSettings(n1, n2, parseBRL(s1), parseBRL(s2), categories, splitMode, manualPerc1, theme, p1Color, p2Color);
    onClose();
  };

  const handleUpdateCategories = (updatedCats: string[]) => {
    if (!isPremium) return;
    setCategories(updatedCats);
  };

  const addCategory = () => {
    if (!isPremium) {
      onShowPremium?.();
      return;
    }
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      handleUpdateCategories(updated);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    if (!isPremium) {
      onShowPremium?.();
      return;
    }
    if (confirm(`Remover "${cat}"?`)) {
      handleUpdateCategories(categories.filter(c => c !== cat));
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 z-40 transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 w-85 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-8 bg-slate-900 text-white rounded-br-[4rem] relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black tracking-tighter">Ajustes</h2>
              {isPremium && <span className="px-2 py-0.5 bg-p1 text-[8px] font-black uppercase rounded-lg shadow-lg animate-pulse">PRO</span>}
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Conta & Preferências</p>
            {userEmail && (
              <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-p1 flex items-center justify-center text-[10px] font-black">{userEmail.slice(0, 2).toUpperCase()}</div>
                <p className="text-[9px] font-bold opacity-60 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          {!isPremium && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="p-6 bg-gradient-to-br from-p1 to-blue-600 rounded-[2rem] text-white shadow-xl shadow-p1/20 relative overflow-hidden group border border-white/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                <div className="relative">
                  <h4 className="font-black text-lg tracking-tight mb-1 italic">Seja PRO</h4>
                  <p className="text-[10px] opacity-80 leading-relaxed font-bold uppercase tracking-wider">Categorias customizadas, histórico ilimitado e PDF.</p>
                  <button onClick={onShowPremium} className="mt-4 w-full py-2.5 bg-white text-p1 rounded-xl font-black text-[10px] uppercase shadow-lg group-hover:scale-[1.02] transition-transform">Liberar Recursos</button>
                </div>
              </div>
            </section>
          )}

          {/* 1. Perfil */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Perfil & Renda
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-white/5 space-y-3">
                <TextInput label={`Pessoa 1`} value={n1} onChange={setN1} />
                <MoneyInput label="Renda Base" value={s1} onChange={setS1} />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-white/5 space-y-3">
                <TextInput label={`Pessoa 2`} value={n2} onChange={setN2} />
                <MoneyInput label="Renda Base" value={s2} onChange={setS2} />
              </div>
            </div>
          </section>

          {/* 2. Categorias - Locked for free users */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Categorias de Gasto
            </h3>
            <div className="space-y-3">
              {isPremium ? (
                <div className="flex gap-2">
                  <input
                    type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    placeholder="Ex: Pets, Farmácia..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none dark:text-slate-100"
                  />
                  <button onClick={addCategory} className="bg-slate-900 border border-transparent dark:border-white/10 text-white px-4 rounded-xl font-black text-[10px] uppercase">Add</button>
                </div>
              ) : (
                <div className="p-3 bg-p1/5 rounded-xl border border-p1/10 text-center">
                  <p className="text-[9px] font-black text-p1 uppercase italic">Categorias padrão (PRO para editar)</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <div key={cat} className="group flex items-center gap-2 bg-white dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm transition-all">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{cat}</span>
                    {isPremium && (
                      <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500 font-bold transition-colors">×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Divisão */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Modo de Divisão
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[1.5rem] border border-slate-100 dark:border-white/5 space-y-5">
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                <button
                  onClick={() => setSplitMode('proportional')}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${splitMode === 'proportional' ? 'bg-slate-900 text-white dark:bg-p1' : 'text-slate-400'}`}
                >Proporcional</button>
                <button
                  onClick={() => setSplitMode('fixed')}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${splitMode === 'fixed' ? 'bg-slate-900 text-white dark:bg-p1' : 'text-slate-400'}`}
                >Fixo (%)</button>
              </div>

              {splitMode === 'fixed' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 px-1">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase">
                    <span className="text-p1">{n1.split(' ')[0]} {manualPerc1}%</span>
                    <span className="text-p2">{n2.split(' ')[0]} {100 - manualPerc1}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100" value={manualPerc1}
                    onChange={(e) => setManualPerc1(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-p1"
                  />
                </div>
              )}
            </div>
          </section>

          {/* 4. Sincronização */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Sincronização
            </h3>
            <button
              onClick={() => { if (onShowHouseholdLink) { onShowHouseholdLink(); onClose(); } }}
              className="w-full p-4 bg-p1 text-white rounded-2xl shadow-lg shadow-p1/20 flex flex-col items-start gap-1 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Conectar Parceiro</span>
              <span className="text-[8px] opacity-70 font-bold">CÓDIGO: {inviteCode || userId?.slice(0, 8)}</span>
            </button>
          </section>

          {/* 5. Personalização Visual */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Aparência
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[1.5rem] flex items-center justify-between border border-slate-100 dark:border-white/5">
              <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-white/5">
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-p1 text-white' : 'text-slate-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <input type="color" value={p1Color} onChange={(e) => setP1Color(e.target.value)} className="w-6 h-6 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                  <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: p1Color }}></div>
                </div>
                <div className="relative group">
                  <input type="color" value={p2Color} onChange={(e) => setP2Color(e.target.value)} className="w-6 h-6 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer" />
                  <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-white dark:border-slate-800 shadow-sm" style={{ backgroundColor: p2Color }}></div>
                </div>
              </div>
            </div>
          </section>

          <AdBanner isPremium={isPremium} position="sidebar" />

          {/* Footer Actions */}
          <div className="space-y-1 pt-6 border-t border-slate-100 dark:border-white/5 pb-10">
            <SidebarBtn icon="?" label="Central de Ajuda" onClick={() => { onNavigateToHelp?.(); onClose(); }} />
            <SidebarBtn icon="↩" label="Sair da Conta" onClick={onSignOut} />
            <SidebarBtn icon="×" label="Apagar Todos os Dados" onClick={onDeleteAccount} variant="danger" />
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0">
          <button onClick={handleSave} className="w-full bg-slate-900 dark:bg-p1 text-white font-black py-4.5 rounded-[1.25rem] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            Salvar Alterações
          </button>
        </div>
      </div >
    </>
  );
};

const SidebarBtn: React.FC<{ icon: string, label: string, onClick?: () => void, variant?: 'default' | 'danger' }> = ({ icon, label, onClick, variant = 'default' }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${variant === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${variant === 'danger' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-p1'}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

const MoneyInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group/input">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] transition-colors group-focus-within/input:text-p1">R$</span>
      <input
        type="text" inputMode="decimal" value={value}
        onChange={e => onChange(formatAsBRL(e.target.value))}
        className="w-full bg-slate-100 dark:bg-slate-800/50 border-none focus:bg-white dark:focus:bg-slate-950 rounded-xl pl-8 pr-4 py-2.5 outline-none transition-all font-bold text-xs text-slate-800 dark:text-slate-200"
        placeholder="0,00"
      />
    </div>
  </div>
);

const TextInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">{label}</label>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-100 dark:bg-slate-800/50 border-none focus:bg-white dark:focus:bg-slate-950 rounded-xl px-3.5 py-2.5 outline-none transition-all font-bold text-xs text-slate-800 dark:text-slate-200"
      placeholder="Nome"
    />
  </div>
);

export default SidebarMenu;
