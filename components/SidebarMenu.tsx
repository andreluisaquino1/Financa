
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
}

const SidebarMenu: React.FC<Props> = ({ isOpen, onClose, onDeleteAccount, coupleInfo, onUpdateSettings, userEmail, onSignOut, onNavigateToHelp, onShowHouseholdLink, householdId, userId }) => {
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
      <div className={`fixed inset-0 bg-gray-900/60 z-40 transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
        <div className="p-8 bg-blue-600 text-white rounded-br-[3rem]">
          <h2 className="text-2xl font-black tracking-tighter">Ajustes</h2>
          <p className="text-sm font-medium opacity-80 mt-1">Configurações Gerais</p>
          {userEmail && (
            <p className="text-xs font-medium opacity-60 mt-3 truncate">{userEmail}</p>
          )}
        </div>

        <div className="p-8 space-y-8">
          {/* Sessão Pessoas */}
          <div className="space-y-4">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Pessoas e Renda</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <TextInput label={`Nome (${coupleInfo.person1Name})`} value={n1} onChange={setN1} />
                <MoneyInput label="Salário" value={s1} onChange={setS1} />
              </div>
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <TextInput label={`Nome (${coupleInfo.person2Name})`} value={n2} onChange={setN2} />
                <MoneyInput label="Salário" value={s2} onChange={setS2} />
              </div>
            </div>
          </div>

          {/* Sessão Modo de Divisão */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Modo de Divisão</h3>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSplitMode('proportional')}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'proportional' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                >
                  Salário
                </button>
                <button
                  onClick={() => setSplitMode('fixed')}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'fixed' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                >
                  Manual %
                </button>
              </div>

              {splitMode === 'fixed' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{n1}</span>
                    <span className="text-sm font-black text-blue-600">{manualPerc1}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualPerc1}
                    onChange={(e) => setManualPerc1(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{n2}</span>
                    <span className="text-sm font-black text-pink-500">{100 - manualPerc1}%</span>
                  </div>
                </div>
              )}

              <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                {splitMode === 'proportional'
                  ? "As contas são divididas proporcionalmente ao salário de cada um."
                  : "As contas são divididas seguindo a porcentagem fixa definida acima."}
              </p>
            </div>
          </div>

          <button onClick={handleSave} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition">
            Salvar Configurações
          </button>

          {/* Seção Conectar Parceiro */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Conectar Parceiro</h3>
            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Seu Código de Convite</p>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200">
                  <code className="text-xs font-mono font-bold text-gray-600 truncate mr-2">{userId}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userId || '');
                      alert('Código copiado!');
                    }}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition active:scale-90"
                    title="Copiar código"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onShowHouseholdLink) {
                    onShowHouseholdLink();
                    onClose();
                  }
                }}
                className="w-full py-3 px-4 bg-white border-2 border-blue-200 text-blue-600 font-black text-[10px] uppercase rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
              >
                Inserir código do parceiro
              </button>

              <p className="text-[9px] text-blue-400 font-bold leading-relaxed text-center italic">
                {householdId !== userId && householdId
                  ? "Você já está em um painel compartilhado! ✅"
                  : "Envie seu código para o parceiro ou insira o dele para sincronizar os dados."}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Categorias de Gasto</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Nova categoria..."
                  className="flex-1 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl px-4 py-2 text-sm font-bold outline-none transition"
                />
                <button
                  onClick={addCategory}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {categories.map((cat, idx) => (
                  <div key={cat} className="group flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition">
                    <span className="text-xs font-bold text-gray-700">{cat}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCategory(idx, 'up')}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-lg transition ${idx === 0 ? 'text-gray-200' : 'text-gray-400 hover:bg-white hover:text-blue-600'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button
                        onClick={() => moveCategory(idx, 'down')}
                        disabled={idx === categories.length - 1}
                        className={`p-1.5 rounded-lg transition ${idx === categories.length - 1 ? 'text-gray-200' : 'text-gray-400 hover:bg-white hover:text-blue-600'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button
                        onClick={() => removeCategory(cat)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {onNavigateToHelp && (
            <button
              onClick={() => {
                onNavigateToHelp();
                onClose();
              }}
              className="w-full flex items-center space-x-3 text-blue-600 font-bold p-3 rounded-xl hover:bg-blue-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Ajuda & Suporte</span>
            </button>
          )}

          {onSignOut && (
            <button onClick={onSignOut} className="w-full flex items-center space-x-3 text-gray-600 font-bold p-3 rounded-xl hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Sair da conta</span>
            </button>
          )}

          <button onClick={onDeleteAccount} className="w-full flex items-center space-x-3 text-red-600 font-bold p-3 rounded-xl hover:bg-red-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Apagar todos os dados</span>
          </button>
        </div>
      </div>
    </>
  );
};

const MoneyInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(formatAsBRL(e.target.value))}
        placeholder="0,00"
        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none transition-all font-bold text-sm"
      />
    </div>
  </div>
);

const TextInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-bold text-sm" placeholder={label} />
  </div>
);

export default SidebarMenu;
