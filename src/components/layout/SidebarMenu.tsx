import React, { useState } from 'react';
import { Category, CoupleInfo, QuickShortcut } from '@/types';
import CategoryManagerModal from '@/components/modals/CategoryManagerModal';
import IncomeCategoryManagerModal from '@/components/modals/IncomeCategoryManagerModal';
import QuickShortcutsModal from '@/components/modals/QuickShortcutsModal';
import { parseBRL, formatAsBRL } from '@/utils';
import { useAuth } from '@/AuthContext';
import { RECOMMENDED_ICONS } from '@/config/design';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
  coupleInfo: CoupleInfo;
  onUpdateSettings: (
    n1: string,
    n2: string,
    cats?: (string | Category)[],
    theme?: 'light' | 'dark',
    p1Color?: string,
    p2Color?: string,
    shortcuts?: QuickShortcut[],
    incomeCats?: (string | Category)[]
  ) => void;
  userEmail?: string;
  onSignOut?: () => void;
  onNavigateToIncomes?: () => void;
  onShowHouseholdLink?: () => void;

  onDeleteMonthData?: () => void;
  onRestoreData?: () => void;
  householdId?: string | null;
  userId?: string;
  inviteCode?: string | null;
  selectedMonth?: string;
}

const DEFAULT_FREE_CATEGORIES: Category[] = [
  { name: 'Moradia', icon: '🏠' },
  { name: 'Alimentação', icon: '🥗' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Lazer', icon: '🎮' },
  { name: 'Saúde', icon: '🏥' }
];

const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { name: 'Salário', icon: '💼' },
  { name: 'Investimento', icon: '📈' },
  { name: 'Bônus', icon: '🎁' },
  { name: 'Outros', icon: '💰' }
];

const SidebarMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  onDeleteAccount,
  coupleInfo,
  onUpdateSettings,
  userEmail,
  onSignOut,
  onNavigateToIncomes,
  onShowHouseholdLink,
  onDeleteMonthData,
  onRestoreData,
  householdId,
  userId,
  inviteCode,
  selectedMonth,
}) => {
  const [n1, setN1] = useState(coupleInfo.person1Name);
  const [n2, setN2] = useState(coupleInfo.person2Name);

  const [categories, setCategories] = useState<Category[]>(() => {
    const initialCats = (coupleInfo.categories || []).map(c => typeof c === 'string' ? { name: c } : c);
    if (initialCats.length > 0) return initialCats;
    return DEFAULT_FREE_CATEGORIES;
  });
  const [incomeCategories, setIncomeCategories] = useState<Category[]>(() => {
    const initialCats = (coupleInfo.incomeCategories || []).map(c => typeof c === 'string' ? { name: c } : c);
    if (initialCats.length > 0) return initialCats;
    return DEFAULT_INCOME_CATEGORIES;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(coupleInfo.theme || 'light');
  const [p1Color, setP1Color] = useState(coupleInfo.person1Color || '#2563eb');
  const [p2Color, setP2Color] = useState(coupleInfo.person2Color || '#ec4899');
  const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(coupleInfo.quickShortcuts || []);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showIncomeCategoriesModal, setShowIncomeCategoriesModal] = useState(false);

  const { updatePassword } = useAuth();
  const [showPassForm, setShowPassForm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      alert('As senhas não coincidem.');
      return;
    }

    setPassLoading(true);
    const { error } = await updatePassword(newPass);
    setPassLoading(false);

    if (error) {
      alert('Erro ao alterar senha: ' + error.message);
    } else {
      alert('Senha alterada com sucesso! ✨');
      setShowPassForm(false);
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleSave = () => {
    (onUpdateSettings as any)(n1, n2, categories, theme, p1Color, p2Color, shortcuts, incomeCategories);
    onClose();
  };

  const handleUpdateCategories = (updatedCats: Category[]) => {
    setCategories(updatedCats);
  };

  const handleUpdateIncomeCategories = (updatedCats: Category[]) => {
    setIncomeCategories(updatedCats);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 z-[9998] transition-opacity backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 bottom-0 w-80 md:w-96 max-w-[85vw] bg-white dark:bg-slate-900 z-[9999] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-6 bg-slate-900 text-white rounded-br-[2rem] relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand rounded-full blur-[80px] opacity-20"></div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black tracking-tighter">Ajustes</h2>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Conta & Preferências</p>
            {userEmail && (
              <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-[10px] font-black">{userEmail.slice(0, 2).toUpperCase()}</div>
                <p className="text-[9px] font-bold opacity-60 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">

          {/* 1. Perfil */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Perfil & Renda
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-white/5 space-y-3">
                <TextInput label={`Pessoa 1`} value={n1} onChange={setN1} />
                <TextInput label={`Pessoa 2`} value={n2} onChange={setN2} />
              </div>
            </div>
          </section>

          {/* 2. Configurações Globais */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Configurações Globais
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl group-hover:text-brand transition-colors text-center border border-slate-200 dark:border-white/5">🏷️</div>
                <div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight block">Categorias de Gastos</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Organizar despesas</span>
                </div>
              </button>

              <button
                onClick={() => setShowIncomeCategoriesModal(true)}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl group-hover:text-emerald-500 transition-colors text-center border border-slate-200 dark:border-white/5">💵</div>
                <div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight block">Categorias de Receitas</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gerenciar ganhos</span>
                </div>
              </button>

              <button
                onClick={() => setShowShortcutsModal(true)}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl group-hover:text-brand transition-colors text-center border border-slate-200 dark:border-white/5">⚡</div>
                <div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight block">Atalhos Rápidos</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Preenchimento veloz</span>
                </div>
              </button>
            </div>
          </section>

          {/* 3. Segurança */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Segurança
            </h3>

            {!showPassForm ? (
              <button
                onClick={() => setShowPassForm(true)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm group-hover:text-brand transition-colors border border-slate-200 dark:border-white/5">🔐</div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">Alterar Minha Senha</span>
              </button>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-brand/30 space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-md">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold border border-slate-100 dark:border-white/10 outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold border border-slate-100 dark:border-white/10 outline-none focus:border-brand"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleChangePassword}
                    disabled={passLoading}
                    className="flex-1 bg-brand text-white py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-brand/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                  >
                    {passLoading ? 'Salvando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => { setShowPassForm(false); setNewPass(''); setConfirmPass(''); }}
                    className="px-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-xl font-black text-[10px] uppercase transition-all hover:bg-slate-300 active:scale-95"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 4. Sincronização */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Sincronização
            </h3>
            <button
              onClick={() => { if (onShowHouseholdLink) { onShowHouseholdLink(); onClose(); } }}
              className="w-full p-4 bg-brand text-white rounded-2xl shadow-lg shadow-brand/20 flex flex-col items-start gap-1 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Conectar ao Parceiro</span>
              <span className="text-[8px] opacity-70 font-bold">DISPOSITIVO VINCULADO</span>
            </button>
          </section>

          {/* 5. Personalização Visual */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Aparência
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[1.5rem] flex items-center justify-between border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-white/5">
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-brand text-white shadow-sm' : 'text-slate-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group cursor-pointer">
                  <input
                    type="color"
                    value={p1Color}
                    onChange={(e) => setP1Color(e.target.value)}
                    className="w-6 h-6 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer"
                  />
                </div>
                <div className="relative group cursor-pointer">
                  <input
                    type="color"
                    value={p2Color}
                    onChange={(e) => setP2Color(e.target.value)}
                    className="w-6 h-6 rounded-lg overflow-hidden bg-transparent border-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="space-y-1 pt-6 border-t border-slate-100 dark:border-white/5 pb-10">
            <SidebarBtn
              icon="📅"
              label={`Limpar Mês (${selectedMonth})`}
              onClick={() => {
                if (confirm(`Isso apagará TODAS as despesas de ${selectedMonth}. Continuar?`)) {
                  onDeleteMonthData?.();
                  onClose();
                }
              }}
              variant="danger"
            />

            <SidebarBtn
              icon="🗑️"
              label="Apagar Todos os Dados"
              onClick={() => {
                onDeleteAccount();
              }}
              variant="danger"
            />

            <SidebarBtn
              icon="♻️"
              label="Restaurar Dados (Lixeira)"
              onClick={() => { onRestoreData?.(); onClose(); }}
            />

            <SidebarBtn icon="↩" label="Sair da Conta" onClick={onSignOut} />
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0">
          <button onClick={handleSave} className="w-full bg-slate-900 dark:bg-brand text-white font-black py-5.5 rounded-[1.5rem] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-[0.2em]">
            Salvar Alterações
          </button>
        </div>
      </div >

      {showShortcutsModal && (
        <QuickShortcutsModal
          coupleInfo={coupleInfo}
          onClose={() => setShowShortcutsModal(false)}
          onSave={async (updatedShortcuts) => {
            setShortcuts(updatedShortcuts);
            (onUpdateSettings as any)(n1, n2, categories, theme, p1Color, p2Color, updatedShortcuts, incomeCategories);
            setShowShortcutsModal(false);
          }}
        />
      )}

      {showCategoriesModal && (
        <CategoryManagerModal
          coupleInfo={coupleInfo}
          onClose={() => setShowCategoriesModal(false)}
          onSave={async (updatedCategories) => {
            setCategories(updatedCategories);
            (onUpdateSettings as any)(n1, n2, updatedCategories, theme, p1Color, p2Color, shortcuts, incomeCategories);
            setShowCategoriesModal(false);
          }}
        />
      )}

      {showIncomeCategoriesModal && (
        <IncomeCategoryManagerModal
          coupleInfo={coupleInfo}
          onClose={() => setShowIncomeCategoriesModal(false)}
          onSave={async (updatedIncomeCategories) => {
            setIncomeCategories(updatedIncomeCategories);
            (onUpdateSettings as any)(n1, n2, categories, theme, p1Color, p2Color, shortcuts, updatedIncomeCategories);
            setShowIncomeCategoriesModal(false);
          }}
        />
      )}
    </>
  );
};

const SidebarBtn: React.FC<{ icon: string, label: string, onClick?: () => void, variant?: 'default' | 'danger' }> = ({ icon, label, onClick, variant = 'default' }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${variant === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${variant === 'danger' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand'}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
  </button>
);

const MoneyInput: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group/input">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] transition-colors group-focus-within/input:text-brand">R$</span>
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
