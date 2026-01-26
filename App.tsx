
import React, { useState, useMemo } from 'react';
import { Expense, CoupleInfo } from './types';
import Dashboard from './components/Dashboard';
import SidebarMenu from './components/SidebarMenu';
import ExpenseTabs from './components/ExpenseTabs';
import PersonalWallet from './components/PersonalWallet';
import SavingsGoals from './components/SavingsGoals';
import Auth from './components/Auth';
import HelpSupport from './components/HelpSupport';
import HouseholdLink from './components/HouseholdLink';
import { AuthProvider } from './AuthContext';
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
    deleteAllData,
    signOut
  } = useAppData();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'summary' | 'fixed' | 'common' | 'equal' | 'reimbursement' | 'wallet1' | 'wallet2' | 'goals' | 'help'>('summary');
  const [showHouseholdLink, setShowHouseholdLink] = useState(false);

  const handleUpdateSettings = (
    n1: string,
    n2: string,
    s1: number,
    s2: number,
    cats?: string[],
    customMode?: 'proportional' | 'fixed',
    manualPerc?: number
  ) => {
    saveCoupleInfo({
      ...coupleInfo,
      person1Name: n1,
      person2Name: n2,
      salary1: s1,
      salary2: s2,
      categories: cats || coupleInfo.categories,
      customSplitMode: customMode || coupleInfo.customSplitMode,
      manualPercentage1: manualPerc !== undefined ? manualPerc : coupleInfo.manualPercentage1
    });
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center animate-pulse border border-slate-100">
              <img src="/logo.png" alt="Loading" className="h-14 w-14 object-contain opacity-50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full border-4 border-white animate-bounce shadow-lg"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-slate-800 font-black text-xl tracking-tight">Preparando tudo</h2>
            <div className="flex items-center justify-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 pb-20 lg:pb-0">
      <header className="bg-white/80 border-b sticky top-0 z-30 shadow-sm backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <button onClick={() => setIsMenuOpen(true)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 group">
                <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
                <h1 className="text-xl font-black tracking-tighter text-slate-800 hidden sm:block">Finanças em Casal</h1>
              </div>
            </div>

            <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-2xl p-1 shadow-inner shrink-0 h-11">
              <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="relative flex items-center px-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold px-1 py-1 text-sm focus:outline-none cursor-pointer uppercase tracking-tight text-center w-[120px]"
                />
              </div>
              <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-500 transition-all active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex items-center pb-3 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl min-w-max border border-slate-100">
              <NavItem active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} label="Resumo" />
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

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 lg:pb-12">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          {currentTab === 'summary' && (
            <Dashboard
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onUpdateSalary1={handleUpdateSalary1}
              onUpdateSalary2={handleUpdateSalary2}
              summary={summary}
            />
          )}
          {currentTab === 'help' && <HelpSupport />}
          {currentTab === 'goals' && (
            <SavingsGoals
              goals={goals}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
          )}
          {currentTab === 'wallet1' && (
            <PersonalWallet
              person="person1"
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
            />
          )}
          {currentTab === 'wallet2' && (
            <PersonalWallet
              person="person2"
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
            />
          )}
          {['fixed', 'common', 'equal', 'reimbursement'].includes(currentTab) && (
            <ExpenseTabs
              activeTab={currentTab as any}
              expenses={expenses}
              monthKey={selectedMonth}
              coupleInfo={coupleInfo}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
            />
          )}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200/60 flex items-center p-2 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max space-x-1 px-2 mx-auto">
          <MobileTab active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Início" />
          <MobileTab active={currentTab === 'fixed'} onClick={() => setCurrentTab('fixed')} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Fixos" />
          <MobileTab active={currentTab === 'common'} onClick={() => setCurrentTab('common')} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" label="Prop." />
          <MobileTab active={currentTab === 'equal'} onClick={() => setCurrentTab('equal')} icon="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" label="50%/50%" />
          <MobileTab active={currentTab === 'reimbursement'} onClick={() => setCurrentTab('reimbursement')} icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" label="Reemb." />
          <MobileTab active={currentTab === 'wallet1'} onClick={() => setCurrentTab('wallet1')} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`${coupleInfo.person1Name.slice(0, 3)}`} />
          <MobileTab active={currentTab === 'wallet2'} onClick={() => setCurrentTab('wallet2')} icon="M20 7a4 4 0 11-8 0 4 4 0 018 0zM16 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`${coupleInfo.person2Name.slice(0, 3)}`} />
          <MobileTab active={currentTab === 'goals'} onClick={() => setCurrentTab('goals')} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Metas" />
        </div>
      </nav>

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onDeleteAccount={deleteAllData}
        coupleInfo={coupleInfo}
        onUpdateSettings={handleUpdateSettings}
        userEmail={user.email}
        onSignOut={handleSignOut}
        onNavigateToHelp={() => setCurrentTab('help')}
        onShowHouseholdLink={() => setShowHouseholdLink(true)}
        householdId={householdId}
        userId={user.id}
        inviteCode={inviteCode}
      />
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${active
      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50'
      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
      }`}
  >
    {label}
  </button>
);

const MobileTab: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center px-3.5 py-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-blue-50' : ''}`}>
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
