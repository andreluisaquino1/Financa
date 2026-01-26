
import React, { useState } from 'react';
import { CoupleInfo } from '../types';
import { parseBRL, formatAsBRL } from '../utils';

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
  householdId?: string | null;
  userId?: string;
  inviteCode?: string | null;
}

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
  householdId,
  userId,
  inviteCode
}) => {
  const [n1, setN1] = useState(coupleInfo.person1Name);
  const [n2, setN2] = useState(coupleInfo.person2Name);
  const [s1, setS1] = useState(coupleInfo.salary1 ? formatAsBRL((coupleInfo.salary1 * 100).toString()) : '');
  const [s2, setS2] = useState(coupleInfo.salary2 ? formatAsBRL((coupleInfo.salary2 * 100).toString()) : '');
  const [categories, setCategories] = useState<string[]>(coupleInfo.categories || []);
  const [newCategory, setNewCategory] = useState('');

  const [splitMode, setSplitMode] = useState<'proportional' | 'fixed'>(coupleInfo.customSplitMode || 'proportional');
  const [manualPerc1, setManualPerc1] = useState(coupleInfo.manualPercentage1 !== undefined ? coupleInfo.manualPercentage1 : 50);

  const [theme, setTheme] = useState<'light' | 'dark'>(coupleInfo.theme || 'light');
  const [p1Color, setP1Color] = useState(coupleInfo.person1Color || '#2563eb');
  const [p2Color, setP2Color] = useState(coupleInfo.person2Color || '#ec4899');

  const handleSave = () => {
    onUpdateSettings(n1, n2, parseBRL(s1), parseBRL(s2), categories, splitMode, manualPerc1, theme, p1Color, p2Color);
    onClose();
  };

  const handleUpdateCategories = (updatedCats: string[]) => {
    setCategories(updatedCats);
    onUpdateSettings(n1, n2, parseBRL(s1), parseBRL(s2), updatedCats, splitMode, manualPerc1, theme, p1Color, p2Color);
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      handleUpdateCategories(updated);
      setNewCategory('');
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCats.length) {
      [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
      handleUpdateCategories(newCats);
    }
  };

  const removeCategory = (cat: string) => {
    if (confirm(`Deseja remover a categoria "${cat}"?`)) {
      const updated = categories.filter(c => c !== cat);
      handleUpdateCategories(updated);
    }
  };

  const colorPresets = [
    '#2563eb', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
    '#eab308', '#f97316', '#ef4444', '#ec4899', '#d946ef',
    '#8b5cf6', '#6366f1', '#475569', '#0f172a'
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 z-40 transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 w-85 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-8 bg-slate-900 text-white rounded-br-[4rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
          <div className="relative z-10 text-white">
            <h2 className="text-2xl font-black tracking-tighter">Ajustes</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sua Conta & App</p>
            {userEmail && (
              <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black">{userEmail.slice(0, 2).toUpperCase()}</div>
                <p className="text-[10px] font-bold opacity-60 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          {/* Aparência */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Aparência
            </h3>
            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tema do App</label>
                <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Claro
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    Escuro
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <ColorPicker label={`Cor de ${n1.split(' ')[0]}`} value={p1Color} onChange={setP1Color} presets={colorPresets} />
                <ColorPicker label={`Cor de ${n2.split(' ')[0]}`} value={p2Color} onChange={setP2Color} presets={colorPresets} />
              </div>
            </div>
          </section>

          {/* Sessão Pessoas */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Perfil & Renda
            </h3>
            <div className="space-y-6">
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                <TextInput label={`Nome (${coupleInfo.person1Name})`} value={n1} onChange={setN1} />
                <MoneyInput label="Renda Mensal" value={s1} onChange={setS1} />
              </div>
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                <TextInput label={`Nome (${coupleInfo.person2Name})`} value={n2} onChange={setN2} />
                <MoneyInput label="Renda Mensal" value={s2} onChange={setS2} />
              </div>
            </div>
          </section>

          {/* Sessão Modo de Divisão */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Cálculo de Divisão
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSplitMode('proportional')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'proportional' ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Proporcional
                </button>
                <button
                  onClick={() => setSplitMode('fixed')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'fixed' ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Fixo (%)
                </button>
              </div>

              {splitMode === 'fixed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase bg-p1/10 text-p1 px-3 py-1 rounded-full">{n1.split(' ')[0]} {manualPerc1}%</span>
                    <span className="text-[11px] font-black uppercase bg-p2/10 text-p2 px-3 py-1 rounded-full">{n2.split(' ')[0]} {100 - manualPerc1}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualPerc1}
                    onChange={(e) => setManualPerc1(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer group-hover:h-3 accent-p1 transition-all"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Seção Conectar Parceiro */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Conectar Parceiro
            </h3>
            <div className="bg-p1 rounded-[2.5rem] p-8 text-white shadow-xl shadow-p1/20 space-y-6 relative overflow-hidden group">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

              <div className="space-y-3 relative">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Seu Código</p>
                <div className="flex items-center justify-between bg-white px-4 py-4 rounded-2xl shadow-inner border border-white/10">
                  <code className="text-sm font-mono font-bold text-slate-800 tracking-wider truncate mr-4">{inviteCode || userId}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode || userId || '');
                      alert('Código copiado!');
                    }}
                    className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black transition-all active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                </div>
              </div>

              <button
                onClick={() => { if (onShowHouseholdLink) { onShowHouseholdLink(); onClose(); } }}
                className="w-full py-4 text-slate-900 bg-white font-black text-[10px] uppercase rounded-[1.25rem] shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Vincular Novo Código
              </button>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="space-y-1 pt-6 border-t border-slate-100 dark:border-slate-800 pb-12">
            <SidebarBtn icon="?" label="Central de Ajuda" onClick={() => { onNavigateToHelp?.(); onClose(); }} />
            <SidebarBtn icon="↩" label="Sair da Conta" onClick={onSignOut} />
            <SidebarBtn icon="×" label="Apagar Todos os Dados" onClick={onDeleteAccount} variant="danger" />
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={handleSave} className="w-full bg-slate-900 dark:bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            Salvar Alterações
          </button>
        </div>
      </div>
    </>
  );
};

const ColorPicker: React.FC<{ label: string, value: string, onChange: (v: string) => void, presets: string[] }> = ({ label, value, onChange, presets }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center px-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: value }}></div>
    </div>
    <div className="flex flex-wrap gap-2">
      {presets.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-all ${value === c ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded-full overflow-hidden bg-transparent border-none cursor-pointer"
      />
    </div>
  </div>
);

const SidebarBtn: React.FC<{ icon: string, label: string, onClick?: () => void, variant?: 'default' | 'danger' }> = ({ icon, label, onClick, variant = 'default' }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${variant === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${variant === 'danger' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-p1'}`}>{icon}</div>
    <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
  </button>
);

const MoneyInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>
    <div className="relative group/input">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm transition-colors group-focus-within/input:text-p1">R$</span>
      <input
        type="text" inputMode="decimal" value={value}
        onChange={e => onChange(formatAsBRL(e.target.value))}
        className="w-full bg-slate-100/50 dark:bg-slate-900 border border-transparent focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pl-10 pr-4 py-3.5 outline-none transition-all font-bold text-sm text-slate-800 dark:text-slate-200"
        placeholder="0,00"
      />
    </div>
  </div>
);

const TextInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-100/50 dark:bg-slate-900 border border-transparent focus:border-p1 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-sm text-slate-800 dark:text-slate-200"
      placeholder="Nome"
    />
  </div>
);

export default SidebarMenu;
