
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
    mPerc1?: number
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

  const handleSave = () => {
    onUpdateSettings(n1, n2, parseBRL(s1), parseBRL(s2), categories, splitMode, manualPerc1);
    onClose();
  };

  const handleUpdateCategories = (updatedCats: string[]) => {
    setCategories(updatedCats);
    onUpdateSettings(n1, n2, parseBRL(s1), parseBRL(s2), updatedCats, splitMode, manualPerc1);
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

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 z-40 transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 w-85 bg-white z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-8 bg-slate-900 text-white rounded-br-[4rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
          <div className="relative z-10">
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
          {/* Sessão Pessoas */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200"></span>
              Perfil & Renda
            </h3>
            <div className="space-y-6">
              <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all group">
                <TextInput label={`Nome (${coupleInfo.person1Name})`} value={n1} onChange={setN1} />
                <MoneyInput label="Renda Mensal" value={s1} onChange={setS1} />
              </div>
              <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all group">
                <TextInput label={`Nome (${coupleInfo.person2Name})`} value={n2} onChange={setN2} />
                <MoneyInput label="Renda Mensal" value={s2} onChange={setS2} />
              </div>
            </div>
          </section>

          {/* Sessão Modo de Divisão */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200"></span>
              Cálculo de Divisão
            </h3>
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-6">
              <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                <button
                  onClick={() => setSplitMode('proportional')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'proportional' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Proporcional
                </button>
                <button
                  onClick={() => setSplitMode('fixed')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'fixed' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Fixo (%)
                </button>
              </div>

              {splitMode === 'fixed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full">{n1.split(' ')[0]} {manualPerc1}%</span>
                    <span className="text-[11px] font-black text-pink-500 uppercase bg-pink-50 px-3 py-1 rounded-full">{n2.split(' ')[0]} {100 - manualPerc1}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualPerc1}
                    onChange={(e) => setManualPerc1(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:h-3"
                  />
                </div>
              )}

              <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-1">
                {splitMode === 'proportional'
                  ? "✓ Divisão baseada no poder aquisitivo de cada um."
                  : "✓ Divisão baseada em uma porcentagem fixa acordada."}
              </p>
            </div>
          </section>

          {/* Seção Conectar Parceiro */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200"></span>
              Conectar Parceiro
            </h3>
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 space-y-6 relative overflow-hidden group">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

              <div className="space-y-3 relative">
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em]">Seu Código</p>
                <div className="flex items-center justify-between bg-white px-4 py-4 rounded-2xl shadow-inner border border-blue-500/10">
                  <code className="text-sm font-mono font-bold text-slate-800 tracking-wider truncate mr-4">{inviteCode || userId}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode || userId || '');
                      alert('Código copiado para a área de transferência!');
                    }}
                    className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black transition-all active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onShowHouseholdLink) { onShowHouseholdLink(); onClose(); }
                }}
                className="w-full py-4 text-slate-900 bg-white font-black text-[10px] uppercase rounded-[1.25rem] shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Vincular Novo Código
              </button>

              <p className="text-[9px] text-blue-100 font-bold leading-relaxed text-center italic opacity-70">
                {householdId !== userId && householdId
                  ? "Você já está em um painel compartilhado! ✨"
                  : "Sincronize seus dados com seu parceiro em tempo real."}
              </p>
            </div>
          </section>

          {/* Categorias */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200"></span>
              Categorias personalizadas
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Nova categoria..."
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-[1.25rem] px-4 py-3 text-sm font-bold outline-none transition-all"
                />
                <button
                  onClick={addCategory}
                  className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-black shadow-lg transition-all active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1 pb-4">
                {categories.map((cat, idx) => (
                  <div key={cat} className="group flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
                    <span className="text-xs font-bold text-slate-700">{cat}</span>
                    <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className={`p-1.5 rounded-lg ${idx === 0 ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={() => moveCategory(idx, 'down')} disabled={idx === categories.length - 1} className={`p-1.5 rounded-lg ${idx === categories.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button onClick={() => removeCategory(cat)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="space-y-2 pt-6 border-t border-slate-100 pb-12">
            <button onClick={() => { onNavigateToHelp?.(); onClose(); }} className="w-full flex items-center justify-between text-slate-600 font-bold p-4 rounded-2xl hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">?</div>
                <span className="text-sm">Central de Ajuda</span>
              </div>
              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            <button onClick={onSignOut} className="w-full flex items-center justify-between text-slate-600 font-bold p-4 rounded-2xl hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                </div>
                <span className="text-sm">Sair da Conta</span>
              </div>
            </button>

            <button onClick={onDeleteAccount} className="w-full flex items-center justify-between text-red-600 font-bold p-4 rounded-2xl hover:bg-red-50 transition-all group mt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142" /></svg>
                </div>
                <span className="text-sm font-black uppercase tracking-tighter">Apagar Todos os Dados</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-white">
          <button onClick={handleSave} className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Salvar Alterações
          </button>
        </div>
      </div>
    </>
  );
};

const MoneyInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>
    <div className="relative group/input">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm transition-colors group-focus-within/input:text-blue-600">R$</span>
      <input
        type="text" inputMode="decimal" value={value}
        onChange={e => onChange(formatAsBRL(e.target.value))}
        className="w-full bg-slate-100/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl pl-10 pr-4 py-3.5 outline-none transition-all font-bold text-sm text-slate-800"
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
      className="w-full bg-slate-100/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3.5 outline-none transition-all font-bold text-sm text-slate-800"
      placeholder="Seu nome"
    />
  </div>
);

export default SidebarMenu;
