
import React, { useState, useMemo } from 'react';
import { Expense, CoupleInfo, ExpenseType } from './types';
import Dashboard from './components/Dashboard';
import SidebarMenu from './components/SidebarMenu';
import ExpenseTabs from './components/ExpenseTabs';
import PersonalWallet from './components/PersonalWallet';
import SavingsGoals from './components/SavingsGoals';
import Auth from './components/Auth';
import HelpSupport from './components/HelpSupport';
import HouseholdLink from './components/HouseholdLink';
import AddExpenseModal from './components/AddExpenseModal';
import PremiumModal from './components/PremiumModal';
import { AuthProvider } from './AuthContext';
import { IncomeManager } from './components/IncomeManager';
import { getMonthYearKey } from './utils';
import { useAppData } from './hooks/useAppData';
import { AdMob } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';

// REVENUECAT CONFIG (Get these from RevenueCat Dashboard)
const RC_GOOGLE_KEY = 'test_fIsCaEeDXlEcVMOELSYGvFsbePm';

const AppContent: React.FC = () => {
  const {
    user,
    authLoading,
    dataLoading,
    coupleInfo,
    expenses,
    goals,
    selectedMonth,
    setSelectedMonth,
    householdId,
    inviteCode,
    isPremium,
    updatePremiumStatus,
    summary,
    saveCoupleInfo,
    addExpense,
    updateExpense,
    deleteExpense,
    addGoal,
    updateGoal,
    deleteGoal,
    incomes,
    addIncome,
    updateIncome,
    deleteIncome,
    deleteAllData,
    deleteMonthData,
    signOut
  } = useAppData();

  // Aplicar Tema e Cores
  React.useEffect(() => {
    if (coupleInfo.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (coupleInfo.person1Color) {
      document.documentElement.style.setProperty('--p1-color', coupleInfo.person1Color);
    }
    if (coupleInfo.person2Color) {
      document.documentElement.style.setProperty('--p2-color', coupleInfo.person2Color);
    }
  }, [coupleInfo.theme, coupleInfo.person1Color, coupleInfo.person2Color]);

  // Inicializar AdMob
  React.useEffect(() => {
    AdMob.initialize({
      testingDevices: ['2077ef9a63d2b398840261cdd221b406'],
      initializeForTesting: true,
    }).catch(e => console.log('AdMob Init Error:', e));
  }, []);

  // Inicializar RevenueCat
  React.useEffect(() => {
    const initRC = async () => {
      const isNative = (window as any).Capacitor?.isNative;
      if (!isNative) return;

      try {
        await Purchases.configure({ apiKey: RC_GOOGLE_KEY });
        console.log('RevenueCat Configured');
      } catch (e) {
        console.log('RevenueCat Error:', e);
      }
    };
    initRC();
  }, []);

  const handleRestore = async () => {
    const isNative = (window as any).Capacitor?.isNative;
    if (!isNative) {
      alert('Restauração disponível apenas no aplicativo móvel.');
      return;
    }

    try {
      const { customerInfo } = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['PRO'] !== "undefined") {
        await updatePremiumStatus(true);
        alert('Assinatura restaurada com sucesso! ✨');
      } else {
        alert('Nenhuma assinatura ativa encontrada para esta conta da Google Play.');
      }
    } catch (e: any) {
      alert('Erro ao restaurar: ' + e.message);
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'summary' | 'incomes' | 'fixed' | 'common' | 'equal' | 'reimbursement' | 'wallet1' | 'wallet2' | 'goals' | 'help'>('summary');
  const [showHouseholdLink, setShowHouseholdLink] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  // Global Modal State
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ExpenseType>(ExpenseType.COMMON);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openAddExpense = (type: ExpenseType, exp: Expense | null = null) => {
    setModalType(type);
    setEditingExpense(exp);
    setIsGlobalModalOpen(true);
  };

  const handleUpdateSettings = (
    n1: string, n2: string, s1: number, s2: number,
    cats?: string[], customMode?: 'proportional' | 'fixed',
    manualPerc?: number, theme?: 'light' | 'dark',
    p1Color?: string, p2Color?: string
  ) => {
    saveCoupleInfo({
      ...coupleInfo,
      person1Name: n1,
      person2Name: n2,
      salary1: s1,
      salary2: s2,
      categories: cats || coupleInfo.categories,
      customSplitMode: customMode || coupleInfo.customSplitMode,
      manualPercentage1: manualPerc !== undefined ? manualPerc : coupleInfo.manualPercentage1,
      theme: theme || coupleInfo.theme,
      person1Color: p1Color || coupleInfo.person1Color,
      person2Color: p2Color || coupleInfo.person2Color
    }, true);
  };

  const handleUpdateSalary1 = (val: number, isGlobal?: boolean) => saveCoupleInfo({ ...coupleInfo, salary1: val }, isGlobal);
  const handleUpdateSalary2 = (val: number, isGlobal?: boolean) => saveCoupleInfo({ ...coupleInfo, salary2: val }, isGlobal);

  const navigateMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(getMonthYearKey(date));
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center animate-pulse border border-slate-100 dark:border-white/5">
              <img src="/logo.png" alt="Loading" className="h-14 w-14 object-contain opacity-50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-p1 rounded-full border-4 border-white dark:border-slate-800 animate-bounce shadow-lg"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-slate-800 dark:text-slate-200 font-black text-xl tracking-tight">Preparando tudo</h2>
            <div className="flex items-center justify-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-p1 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-p1 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-p1 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  if (showHouseholdLink) {
    return (
      <HouseholdLink
        onLinked={() => {
          setShowHouseholdLink(false);
          window.location.reload();
        }}
        onSkip={() => setShowHouseholdLink(false)}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative">
      {/* Header fixo sem sobreposição */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-white/5 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 group">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-p1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain dark:brightness-110" />
                <h1 className="text-xl font-black tracking-tighter text-slate-800 dark:text-slate-100 hidden sm:block">Finanças em Casal</h1>
              </div>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-1 shadow-inner shrink-0 h-11">
              <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="relative flex items-center px-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-bold px-1 py-1 text-sm focus:outline-none cursor-pointer uppercase tracking-tight text-center w-[160px]"
                />
              </div>
              <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl text-slate-500 dark:text-slate-400 transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex items-center pb-3 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/40 p-1 rounded-2xl min-w-max border border-slate-100 dark:border-white/5">
              <NavItem active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} label="Resumo" />
              <NavItem active={currentTab === 'incomes'} onClick={() => setCurrentTab('incomes')} label="Receitas" />
              <NavItem active={currentTab === 'fixed'} onClick={() => setCurrentTab('fixed')} label="Fixos" />
              <NavItem active={currentTab === 'common'} onClick={() => setCurrentTab('common')} label="Proporcional" />
              <NavItem active={currentTab === 'equal'} onClick={() => setCurrentTab('equal')} label="50%/50%" />
              <NavItem active={currentTab === 'reimbursement'} onClick={() => setCurrentTab('reimbursement')} label="Reembolsos" />
              <NavItem active={currentTab === 'wallet1'} onClick={() => setCurrentTab('wallet1')} label={`Carteira ${coupleInfo.person1Name.split(' ')[0]}`} />
              <NavItem active={currentTab === 'wallet2'} onClick={() => setCurrentTab('wallet2')} label={`Carteira ${coupleInfo.person2Name.split(' ')[0]}`} />
              <NavItem active={currentTab === 'goals'} onClick={() => setCurrentTab('goals')} label="Metas" />
              <NavItem active={currentTab === 'help'} onClick={() => setCurrentTab('help')} label="Ajuda" />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 lg:pb-12 scroll-smooth no-scrollbar">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          {currentTab === 'summary' && (
            <Dashboard
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onUpdateSalary1={handleUpdateSalary1}
              onUpdateSalary2={handleUpdateSalary2}
              summary={summary}
              isPremium={isPremium}
            />
          )}
          {currentTab === 'incomes' && (
            <IncomeManager
              incomes={incomes}
              coupleInfo={coupleInfo}
              monthKey={selectedMonth}
              isPremium={isPremium}
              onAddIncome={addIncome}
              onUpdateIncome={updateIncome}
              onDeleteIncome={deleteIncome}
              onShowPremium={() => setIsPremiumModalOpen(true)}
            />
          )}
          {currentTab === 'help' && <HelpSupport />}
          {currentTab === 'goals' && (
            <SavingsGoals
              goals={goals}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              isPremium={isPremium}
            />
          )}
          {currentTab === 'wallet1' && (
            <PersonalWallet
              person="person1"
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onAddExpense={(exp) => openAddExpense(ExpenseType.PERSONAL_P1)}
              onUpdateExpense={(id, exp) => openAddExpense(ExpenseType.PERSONAL_P1, { ...exp, id } as Expense)}
              onDeleteExpense={deleteExpense}
            />
          )}
          {currentTab === 'wallet2' && (
            <PersonalWallet
              person="person2"
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onAddExpense={(exp) => openAddExpense(ExpenseType.PERSONAL_P2)}
              onUpdateExpense={(id, exp) => openAddExpense(ExpenseType.PERSONAL_P2, { ...exp, id } as Expense)}
              onDeleteExpense={deleteExpense}
            />
          )}
          {['fixed', 'common', 'equal', 'reimbursement'].includes(currentTab) && (
            <ExpenseTabs
              activeTab={currentTab as any}
              expenses={expenses}
              monthKey={selectedMonth}
              coupleInfo={coupleInfo}
              onAddExpense={(exp) => openAddExpense({
                'fixed': ExpenseType.FIXED,
                'common': ExpenseType.COMMON,
                'equal': ExpenseType.EQUAL,
                'reimbursement': ExpenseType.REIMBURSEMENT
              }[currentTab as 'fixed' | 'common' | 'equal' | 'reimbursement'])}
              onUpdateExpense={(id, exp) => openAddExpense(exp.type, { ...exp, id } as Expense)}
              onDeleteExpense={deleteExpense}
            />
          )}
        </div>
      </main>

      <nav className="lg:hidden flex-shrink-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border-t dark:border-white/5 flex items-center p-2 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max space-x-1 px-2 mx-auto">
          <MobileTab active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Início" />
          <MobileTab active={currentTab === 'incomes'} onClick={() => setCurrentTab('incomes')} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Receitas" />
          <MobileTab active={currentTab === 'fixed'} onClick={() => setCurrentTab('fixed')} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Fixos" />
          <MobileTab active={currentTab === 'common'} onClick={() => setCurrentTab('common')} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" label="Prop." />
          <MobileTab active={currentTab === 'equal'} onClick={() => setCurrentTab('equal')} icon="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" label="50%/50%" />
          <MobileTab active={currentTab === 'reimbursement'} onClick={() => setCurrentTab('reimbursement')} icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" label="Reemb." />
          <MobileTab active={currentTab === 'wallet1'} onClick={() => setCurrentTab('wallet1')} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`${coupleInfo.person1Name.slice(0, 3)}`} />
          <MobileTab active={currentTab === 'wallet2'} onClick={() => setCurrentTab('wallet2')} icon="M20 7a4 4 0 11-8 0 4 4 0 018 0zM16 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`${coupleInfo.person2Name.slice(0, 3)}`} />
          <MobileTab active={currentTab === 'goals'} onClick={() => setCurrentTab('goals')} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Metas" />
        </div>
      </nav>

      {/* Sidebar e Modais movidos para fora do fluxo principal para garantir z-index absoluto */}
      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onDeleteAccount={deleteAllData}
        onDeleteMonthData={() => deleteMonthData(selectedMonth)}
        onRestorePurchases={handleRestore}
        coupleInfo={coupleInfo}
        onUpdateSettings={handleUpdateSettings}
        userEmail={user.email}
        onSignOut={handleSignOut}
        onNavigateToHelp={() => setCurrentTab('help')}
        onNavigateToIncomes={() => setCurrentTab('incomes')}
        onShowHouseholdLink={() => setShowHouseholdLink(true)}
        onShowPremium={() => setIsPremiumModalOpen(true)}
        householdId={householdId}
        userId={user.id}
        inviteCode={inviteCode}
        isPremium={isPremium}
        selectedMonth={selectedMonth}
      />

      {isGlobalModalOpen && (
        <AddExpenseModal
          type={modalType}
          coupleInfo={coupleInfo}
          initialData={editingExpense}
          isPremium={isPremium}
          onShowPremium={() => setIsPremiumModalOpen(true)}
          onClose={() => { setIsGlobalModalOpen(false); setEditingExpense(null); }}
          onAdd={(exp) => {
            if (editingExpense) updateExpense(editingExpense.id, exp);
            else addExpense(exp);
            setIsGlobalModalOpen(false);
          }}
        />
      )}

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onPurchaseSuccess={() => updatePremiumStatus(true)}
      />
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${active
      ? 'bg-white dark:bg-p1 text-p1 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800'
      }`}
  >
    {label}
  </button>
);

const MobileTab: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center px-3.5 py-1 transition-all ${active ? 'text-p1' : 'text-slate-400 dark:text-slate-600'}`}>
    <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-p1/10' : ''}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} /></svg>
    </div>
    <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter whitespace-nowrap">{label}</span>
  </button>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
