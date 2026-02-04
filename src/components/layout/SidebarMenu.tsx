import React, { useState } from 'react';
import { Category, CoupleInfo, QuickShortcut } from '@/types';
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
    shortcuts?: QuickShortcut[]
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
  isSimpleMode?: boolean;
  onToggleSimpleMode?: (value: boolean) => void;
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
  isSimpleMode = false,
  onToggleSimpleMode
}) => {
  const [n1, setN1] = useState(coupleInfo.person1Name);
  const [n2, setN2] = useState(coupleInfo.person2Name);

  const [categories, setCategories] = useState<Category[]>(() => {
    const initialCats = (coupleInfo.categories || []).map(c => typeof c === 'string' ? { name: c } : c);
    if (initialCats.length > 0) return initialCats;
    return DEFAULT_FREE_CATEGORIES;
  });
  const [newCategory, setNewCategory] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📦');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);

  const [incomeCategories, setIncomeCategories] = useState<Category[]>(() => {
    const initialCats = (coupleInfo.incomeCategories || []).map(c => typeof c === 'string' ? { name: c } : c);
    if (initialCats.length > 0) return initialCats;
    return DEFAULT_INCOME_CATEGORIES;
  });
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [selectedIncomeIcon, setSelectedIncomeIcon] = useState('💰');
  const [showIncomeIconPicker, setShowIncomeIconPicker] = useState(false);
  const [editingIncomeCategoryIndex, setEditingIncomeCategoryIndex] = useState<number | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(coupleInfo.theme || 'light');
  const [p1Color, setP1Color] = useState(coupleInfo.person1Color || '#2563eb');
  const [p2Color, setP2Color] = useState(coupleInfo.person2Color || '#ec4899');
  const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(coupleInfo.quickShortcuts || []);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

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

  const addCategory = () => {
    if (newCategory.trim() && !categories.some(c => c.name === newCategory.trim())) {
      const updated = [...categories, { name: newCategory.trim(), icon: selectedIcon }];
      handleUpdateCategories(updated);
      setNewCategory('');
      setSelectedIcon('📦');
    }
  };

  const removeCategory = (name: string) => {
    if (confirm(`Remover "${name}"?`)) {
      handleUpdateCategories(categories.filter(c => c.name !== name));
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
    }
    handleUpdateCategories(newCats);
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                <TextInput label={`Pessoa 1`} value={n1} onChange={setN1} />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5 space-y-3">
                <TextInput label={`Pessoa 2`} value={n2} onChange={setN2} />
              </div>
            </div>
          </section>

          {/* 2. Categorias */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Categorias de Gasto
            </h3>
            <div className="space-y-3">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border transition-all ${showIconPicker ? 'bg-brand text-white border-brand' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'}`}
                    >
                      {selectedIcon}
                    </button>

                    {showIconPicker && (
                      <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setShowIconPicker(false)} />
                        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 z-[120] grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="col-span-4 mb-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Escolha um Ícone</p>
                          </div>
                          {RECOMMENDED_ICONS.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                setSelectedIcon(icon);
                                setShowIconPicker(false);
                              }}
                              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 ${selectedIcon === icon ? 'bg-brand/10 ring-2 ring-brand scale-105' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    placeholder="Ex: Pets, Farmácia..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 text-sm font-bold outline-none dark:text-slate-100"
                  />
                  <button onClick={addCategory} className="bg-brand text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-95 transition-all text-xl font-bold">+</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {categories.map((cat, index) => {
                  const isEditing = editingCategoryIndex === index;
                  return (
                    <div key={cat.name} className={`group flex flex-col bg-white dark:bg-slate-800/60 p-2 rounded-2xl border transition-all ${isEditing ? 'border-brand shadow-lg' : 'border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md'}`}>
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setEditingCategoryIndex(isEditing ? null : index)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-inner transition-colors ${isEditing ? 'bg-brand text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                          >
                            {cat.icon || '📦'}
                          </button>
                          {isEditing ? (
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => {
                                const newCats = [...categories];
                                newCats[index].name = e.target.value;
                                setCategories(newCats);
                              }}
                              className="bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-2 py-1 text-xs font-bold outline-none dark:text-slate-100 w-32"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isEditing ? (
                            <>
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => moveCategory(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[8px] leading-none disabled:opacity-20"
                                >▲</button>
                                <button
                                  onClick={() => moveCategory(index, 'down')}
                                  disabled={index === categories.length - 1}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[8px] leading-none disabled:opacity-20"
                                >▼</button>
                              </div>
                              <button onClick={() => setEditingCategoryIndex(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-brand hover:bg-brand/5 rounded-xl font-bold transition-all">📝</button>
                              <button onClick={() => removeCategory(cat.name)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold transition-all">×</button>
                            </>
                          ) : (
                            <button onClick={() => setEditingCategoryIndex(null)} className="px-3 py-1 bg-brand text-white rounded-lg text-[10px] font-black uppercase">OK</button>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl grid grid-cols-6 gap-1 border border-slate-100 dark:border-white/5">
                          {RECOMMENDED_ICONS.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                const newCats = [...categories];
                                newCats[index].icon = icon;
                                setCategories(newCats);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-white dark:hover:bg-slate-800 transition-colors ${cat.icon === icon ? 'bg-white dark:bg-slate-800 ring-1 ring-brand' : ''}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 2.1 Categorias de Receita */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Categorias de Receita
            </h3>
            <div className="space-y-3">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowIncomeIconPicker(!showIncomeIconPicker)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner border transition-all ${showIncomeIconPicker ? 'bg-brand text-white border-brand' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'}`}
                    >
                      {selectedIncomeIcon}
                    </button>

                    {showIncomeIconPicker && (
                      <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setShowIncomeIconPicker(false)} />
                        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 z-[120] grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="col-span-4 mb-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Escolha um Ícone</p>
                          </div>
                          {RECOMMENDED_ICONS.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                setSelectedIncomeIcon(icon);
                                setShowIncomeIconPicker(false);
                              }}
                              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 ${selectedIncomeIcon === icon ? 'bg-brand/10 ring-2 ring-brand scale-105' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="text" value={newIncomeCategory} onChange={e => setNewIncomeCategory(e.target.value)}
                    placeholder="Ex: Aluguel, Extra..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 text-sm font-bold outline-none dark:text-slate-100"
                  />
                  <button
                    onClick={() => {
                      if (newIncomeCategory.trim() && !incomeCategories.some(c => c.name === newIncomeCategory.trim())) {
                        setIncomeCategories([...incomeCategories, { name: newIncomeCategory.trim(), icon: selectedIncomeIcon }]);
                        setNewIncomeCategory('');
                        setSelectedIncomeIcon('💰');
                      }
                    }}
                    className="bg-brand text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-95 transition-all text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {incomeCategories.map((cat, index) => {
                  const isEditing = editingIncomeCategoryIndex === index;
                  return (
                    <div key={cat.name} className={`group flex flex-col bg-white dark:bg-slate-800/60 p-2 rounded-2xl border transition-all ${isEditing ? 'border-brand shadow-lg' : 'border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md'}`}>
                      <div className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setEditingIncomeCategoryIndex(isEditing ? null : index)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-inner transition-colors ${isEditing ? 'bg-brand text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
                          >
                            {cat.icon || '💰'}
                          </button>
                          {isEditing ? (
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => {
                                const newCats = [...incomeCategories];
                                newCats[index].name = e.target.value;
                                setIncomeCategories(newCats);
                              }}
                              className="bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-2 py-1 text-xs font-bold outline-none dark:text-slate-100 w-32"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isEditing ? (
                            <>
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => {
                                    const newCats = [...incomeCategories];
                                    if (index > 0) {
                                      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
                                      setIncomeCategories(newCats);
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[8px] leading-none disabled:opacity-20"
                                >▲</button>
                                <button
                                  onClick={() => {
                                    const newCats = [...incomeCategories];
                                    if (index < newCats.length - 1) {
                                      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
                                      setIncomeCategories(newCats);
                                    }
                                  }}
                                  disabled={index === incomeCategories.length - 1}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-[8px] leading-none disabled:opacity-20"
                                >▼</button>
                              </div>
                              <button onClick={() => setEditingIncomeCategoryIndex(index)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-brand hover:bg-brand/5 rounded-xl font-bold transition-all">📝</button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover "${cat.name}"?`)) {
                                    setIncomeCategories(incomeCategories.filter(c => c.name !== cat.name));
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold transition-all"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setEditingIncomeCategoryIndex(null)} className="px-3 py-1 bg-brand text-white rounded-lg text-[10px] font-black uppercase">OK</button>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl grid grid-cols-6 gap-1 border border-slate-100 dark:border-white/5">
                          {RECOMMENDED_ICONS.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                const newCats = [...incomeCategories];
                                newCats[index].icon = icon;
                                setIncomeCategories(newCats);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-white dark:hover:bg-slate-800 transition-colors ${cat.icon === icon ? 'bg-white dark:bg-slate-800 ring-1 ring-brand' : ''}`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>


          {/* 4. Senha */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Segurança
            </h3>

            {!showPassForm ? (
              <button
                onClick={() => setShowPassForm(true)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm group-hover:text-brand transition-colors">🔐</div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">Alterar Senha</span>
              </button>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-brand/30 space-y-3 animate-in fade-in zoom-in-95 duration-200">
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


          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Interface
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Modo Simplificado</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Ocultar Investimentos, Viagens e<br />Empréstimos para mais foco.</p>
                </div>
                <button
                  onClick={() => onToggleSimpleMode?.(!isSimpleMode)}
                  className={`w-12 h-7 rounded-full transition-colors relative flex items-center ${isSimpleMode ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ml-1 ${isSimpleMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button
                onClick={() => setShowShortcutsModal(true)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm group-hover:text-brand transition-colors text-center">⚡</div>
                <div>
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight block">Atalhos de Preenchimento</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Personalizar botões rápidos</span>
                </div>
              </button>
            </div>
          </section>

          {/* 5. Sincronização */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-[9px] flex items-center gap-2">
              <span className="w-4 h-px bg-slate-200 dark:bg-slate-800"></span>
              Sincronização
            </h3>
            <button
              onClick={() => { if (onShowHouseholdLink) { onShowHouseholdLink(); onClose(); } }}
              className="w-full p-4 bg-brand text-white rounded-2xl shadow-lg shadow-brand/20 flex flex-col items-start gap-1 hover:brightness-110 active:scale-[0.98] transition-all"
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
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-brand text-white' : 'text-slate-400'}`}>
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

            <SidebarBtn icon="↩" label="Sair da Conta" onClick={onSignOut} />

            <SidebarBtn
              icon="♻️"
              label="Restaurar Dados (Lixeira)"
              onClick={() => { onRestoreData?.(); onClose(); }}
            />

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
              icon="×"
              label="Apagar Todos os Dados"
              onClick={() => {
                onDeleteAccount();
              }}
              variant="danger"
            />
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0">
          <button onClick={handleSave} className="w-full bg-slate-900 dark:bg-brand text-white font-black py-4.5 rounded-[1.25rem] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
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
