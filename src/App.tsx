
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Expense, CoupleInfo, ExpenseType, Category, QuickShortcut } from './types';
import SidebarMenu from '@/components/layout/SidebarMenu';
import Auth from '@/components/auth/Auth';
import HouseholdLink from '@/components/common/HouseholdLink';
import AddExpenseModal from '@/components/modals/AddExpenseModal';


import { AuthProvider } from './AuthContext';

const Dashboard = lazy(() => import('@/components/Dashboard'));
const ExpenseTabs = lazy(() => import('@/components/finance/ExpenseTabs'));
const PersonalWallet = lazy(() => import('@/components/finance/PersonalWallet'));
const SavingsGoals = lazy(() => import('@/components/finance/SavingsGoals'));
const TripManager = lazy(() => import('@/components/finance/TripManager'));

const IncomeManager = lazy(() => import('@/components/finance/IncomeManager').then(m => ({ default: m.IncomeManager })));
const LoansTab = lazy(() => import('@/components/finance/LoansTab'));
const InvestmentTab = lazy(() => import('@/components/finance/InvestmentTab'));
const WalletsTab = lazy(() => import('@/components/finance/WalletsTab'));

import { getMonthYearKey } from './utils';
import { useAppData } from './hooks/useAppData';
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
    loans,
    addLoan,
    updateLoan,
    deleteLoan,
    deleteAllData,
    deleteMonthData,
    restoreData,
    signOut,
    // Mods for Trips
    trips,
    addTrip,
    updateTrip,
    deleteTrip,
    addTripExpense,
    deleteTripExpense,
    addTripDeposit,
    deleteTripDeposit,
    // Mods for Goal Transactions
    goalTransactions,
    addGoalTransaction,
    deleteGoalTransaction,
    markAsSettled
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'summary' | 'incomes' | 'expenses' | 'loans' | 'reimbursement' | 'wallets' | 'goals' | 'trip' | 'investments'>('summary');
  const [showHouseholdLink, setShowHouseholdLink] = useState(false);

  // Simple Mode
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    const saved = localStorage.getItem('simpleMode');
    return saved ? JSON.parse(saved) : false;
  });

  const handleToggleSimpleMode = (value: boolean) => {
    setIsSimpleMode(value);
    localStorage.setItem('simpleMode', JSON.stringify(value));
  };

  const handleTabChange = (tab: typeof currentTab) => {
    setCurrentTab(tab);
  };

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
    n1: string, n2: string,
    cats?: (string | Category)[], theme?: 'light' | 'dark',
    p1Color?: string, p2Color?: string,
    shortcuts?: QuickShortcut[]
  ) => {
    saveCoupleInfo({
      ...coupleInfo,
      person1Name: n1,
      person2Name: n2,
      categories: cats || coupleInfo.categories,
      theme: theme || coupleInfo.theme,
      person1Color: p1Color || coupleInfo.person1Color,
      person2Color: p2Color || coupleInfo.person2Color,
      quickShortcuts: shortcuts || coupleInfo.quickShortcuts
    }, true);
  };

  const handleUpdateRecurringIncome = (person: 'person1' | 'person2', value: number, description: string) => {
    // Determine which array to update
    const currentIncomes = person === 'person1'
      ? (coupleInfo.person1RecurringIncomes || [])
      : (coupleInfo.person2RecurringIncomes || []);

    // Check if we need to update an existing one or add new
    // We match by description OR id if present. For simplicity in this logic, we use description as key if ID is missing.
    const existingIndex = currentIncomes.findIndex(inc => inc.description === description);

    let newIncomes = [...currentIncomes];

    if (existingIndex >= 0) {
      if (value === 0) {
        // Remove
        newIncomes.splice(existingIndex, 1);
      } else {
        // Update
        newIncomes[existingIndex] = { ...newIncomes[existingIndex], value, description };
      }
    } else if (value > 0) {
      // Add new
      newIncomes.push({ id: Date.now().toString(), description, value });
    }

    // Also update legacy fields for backward compat or if array was empty
    const updates: Partial<CoupleInfo> = {
      [person === 'person1' ? 'person1RecurringIncomes' : 'person2RecurringIncomes']: newIncomes
    };

    // If this is the FIRST recurring income (or if list became empty), sync legacy
    if (newIncomes.length === 1) {
      if (person === 'person1') {
        updates.salary1 = newIncomes[0].value;
        updates.salary1Description = newIncomes[0].description;
      } else if (person === 'person2') {
        updates.salary2 = newIncomes[0].value;
        updates.salary2Description = newIncomes[0].description;
      }
    } else if (newIncomes.length === 0) {
      // If empty, clear legacy too
      if (person === 'person1') {
        updates.salary1 = 0;
        updates.salary1Description = '';
      } else if (person === 'person2') {
        updates.salary2 = 0;
        updates.salary2Description = '';
      }
    }

    saveCoupleInfo({
      ...coupleInfo,
      ...updates
    }, true);
  };

  const navigateMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(getMonthYearKey(date));
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  // Só mostra o loader de tela cheia se estiver carregando E ainda não tivermos os dados do usuário (householdId)
  // Isso evita que a tela "pisque" ou feche modais quando o usuário troca de aba (background refresh)
  if (authLoading || (dataLoading && !householdId)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center animate-pulse border border-slate-100 dark:border-white/5">
              <img src="/logo.png" alt="Loading" className="h-14 w-14 object-contain opacity-50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand rounded-full border-4 border-white dark:border-slate-800 animate-bounce shadow-lg"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-slate-800 dark:text-slate-200 font-black text-xl tracking-tight">Preparando tudo</h2>
            <div className="flex items-center justify-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce"></div>
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
    <div className="h-screen h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative pt-[env(safe-area-inset-top)]">
      {/* Header fixo sem sobreposição */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-white/5 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 group">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <NavItem active={currentTab === 'summary'} onClick={() => handleTabChange('summary')} label="Resumo" />
              <NavItem active={currentTab === 'incomes'} onClick={() => handleTabChange('incomes')} label="Receitas" />
              <NavItem active={currentTab === 'expenses'} onClick={() => handleTabChange('expenses')} label="Gastos" />
              <NavItem active={currentTab === 'reimbursement'} onClick={() => handleTabChange('reimbursement')} label="Reembolsos" />
              <NavItem active={currentTab === 'goals'} onClick={() => handleTabChange('goals')} label="Metas" />
              {!isSimpleMode && (
                <>
                  <NavItem active={currentTab === 'investments'} onClick={() => handleTabChange('investments')} label="Investimentos" />
                  <NavItem active={currentTab === 'trip'} onClick={() => handleTabChange('trip')} label="Viagem" />
                  <NavItem active={currentTab === 'loans'} onClick={() => handleTabChange('loans')} label="Empréstimos" />
                  <NavItem active={currentTab === 'wallets'} onClick={() => handleTabChange('wallets')} label="Carteiras" />
                </>
              )}

            </div>
          </nav>
        </div>
      </header>

      <nav className="lg:hidden flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-b dark:border-white/5 flex items-center h-[72px] z-40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex w-full px-2 items-center justify-around min-w-max mx-auto">
          <MobileTab active={currentTab === 'summary'} onClick={() => handleTabChange('summary')} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Início" />
          <MobileTab active={currentTab === 'incomes'} onClick={() => handleTabChange('incomes')} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Renda" />
          <MobileTab active={currentTab === 'expenses'} onClick={() => handleTabChange('expenses')} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Gastos" />
          <MobileTab active={currentTab === 'reimbursement'} onClick={() => handleTabChange('reimbursement')} icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" label="Reemb" />
          <MobileTab active={currentTab === 'goals'} onClick={() => handleTabChange('goals')} icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Metas" />
          {!isSimpleMode && (
            <>
              <MobileTab active={currentTab === 'investments'} onClick={() => handleTabChange('investments')} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Invest" />
              <MobileTab active={currentTab === 'trip'} onClick={() => handleTabChange('trip')} icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Viagem" />
              <MobileTab active={currentTab === 'loans'} onClick={() => handleTabChange('loans')} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" label="Emprést" />
              <MobileTab active={currentTab === 'wallets'} onClick={() => handleTabChange('wallets')} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label="Carteiras" />
            </>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 lg:pb-12 scroll-smooth no-scrollbar">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          <Suspense fallback={<div className="flex items-center justify-center py-20 opacity-50 font-bold">Carregando...</div>}>
            {currentTab === 'summary' && (
              <Dashboard
                coupleInfo={coupleInfo}
                expenses={expenses}
                monthKey={selectedMonth}
                goals={goals}
                onNavigateToIncomes={() => setCurrentTab('incomes')}
                summary={summary}
                markAsSettled={markAsSettled}
              />
            )}
            {currentTab === 'incomes' && (
              <IncomeManager
                incomes={incomes}
                coupleInfo={coupleInfo}
                monthKey={selectedMonth}
                onAddIncome={addIncome}
                onUpdateIncome={updateIncome}
                onDeleteIncome={deleteIncome}
                onUpdateBaseSalary={(p, v, d) => handleUpdateRecurringIncome(p, v, d || 'Salário Base')}
              />
            )}
            {currentTab === 'loans' && (
              <LoansTab
                loans={loans}
                coupleInfo={coupleInfo}
                onAddLoan={addLoan}
                onUpdateLoan={updateLoan}
                onDeleteLoan={deleteLoan}
              />
            )}

            {currentTab === 'goals' && (
              <SavingsGoals
                goals={goals}
                goalTransactions={goalTransactions}
                onAddGoal={addGoal}
                onUpdateGoal={updateGoal}
                onDeleteGoal={deleteGoal}
                onAddTransaction={addGoalTransaction}
                onDeleteTransaction={deleteGoalTransaction}
                coupleInfo={coupleInfo}
                summary={summary}
                onUpdateCoupleInfo={saveCoupleInfo}
              />
            )}
            {currentTab === 'trip' && (
              <TripManager
                coupleInfo={coupleInfo}
                trips={trips}
                onAddTrip={addTrip}
                onUpdateTrip={updateTrip}
                onDeleteTrip={deleteTrip}
                onAddExpense={addTripExpense}
                onDeleteExpense={deleteTripExpense}
                onAddDeposit={addTripDeposit}
                onDeleteDeposit={deleteTripDeposit}
              />
            )}
            {currentTab === 'investments' && (
              <InvestmentTab />
            )}
            {currentTab === 'wallets' && (
              <WalletsTab
                coupleInfo={coupleInfo}
                expenses={expenses}
                monthKey={selectedMonth}
                summary={summary}
                goals={goals}
                onAddExpense={openAddExpense}
                onUpdateExpense={(id, exp) => openAddExpense(exp.type, exp)}
                onDeleteExpense={deleteExpense}
              />
            )}
            {['expenses', 'reimbursement'].includes(currentTab) && (
              <ExpenseTabs
                activeTab={currentTab as any}
                expenses={expenses}
                monthKey={selectedMonth}
                coupleInfo={coupleInfo}
                onAddExpense={(type) => openAddExpense(type)}
                onUpdateExpense={(id, exp) => openAddExpense(exp.type, exp)}
                onDeleteExpense={deleteExpense}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Sidebar e Modais movidos para fora do fluxo principal para garantir z-index absoluto */}
      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onDeleteAccount={deleteAllData}
        onDeleteMonthData={() => deleteMonthData(selectedMonth)}
        coupleInfo={coupleInfo}
        onUpdateSettings={handleUpdateSettings}
        userEmail={user.email}
        onSignOut={handleSignOut}
        onNavigateToIncomes={() => setCurrentTab('incomes')}
        onShowHouseholdLink={() => setShowHouseholdLink(true)}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={handleToggleSimpleMode}

        onRestoreData={restoreData}
        householdId={householdId}
        userId={user.id}
        inviteCode={inviteCode}
        selectedMonth={selectedMonth}
      />

      {isGlobalModalOpen && (
        <AddExpenseModal
          type={modalType}
          coupleInfo={coupleInfo}
          initialData={editingExpense}
          onClose={() => { setIsGlobalModalOpen(false); setEditingExpense(null); }}
          onAdd={async (exp) => {
            try {
              if (editingExpense) await updateExpense(editingExpense.id, exp);
              else await addExpense(exp);
              setIsGlobalModalOpen(false);
              setEditingExpense(null);
            } catch (err) {
              console.error('Error in onAdd:', err);
            }
          }}
        />
      )}


    </div>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 active:scale-95 ${active
      ? 'bg-white dark:bg-brand text-brand dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800'
      }`}
  >
    {label}
  </button>
);

const MobileTab: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center px-1.5 py-1 transition-all rounded-xl active:scale-95 ${active ? 'bg-brand/5' : ''} min-w-[64px] relative`}>
    <div className={`p-1.5 rounded-xl transition-all ${active ? 'text-brand scale-110' : 'text-slate-400 dark:text-slate-600'}`}>
      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d={icon} /></svg>
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter whitespace-nowrap transition-all flex items-center gap-1 ${active ? 'text-brand opacity-100 mt-0.5' : 'text-slate-400 opacity-60'}`}>
      {label}
    </span>
  </button>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
