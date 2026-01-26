
import React, { useState, useEffect } from 'react';
import { UserAccount, Expense, ExpenseType, CoupleInfo } from './types';
import Dashboard from './components/Dashboard';
import SidebarMenu from './components/SidebarMenu';
import ExpenseTabs from './components/ExpenseTabs';
import PersonalWallet from './components/PersonalWallet';
import SavingsGoals from './components/SavingsGoals';
import Auth from './components/Auth';
import HelpSupport from './components/HelpSupport';
import HouseholdLink from './components/HouseholdLink';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { getMonthYearKey } from './utils';
import { SavingsGoal } from './types';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();

  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo>({
    person1Name: 'André',
    person2Name: 'Luciana',
    salary1: 5000,
    salary2: 5000,
    categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'summary' | 'fixed' | 'common' | 'equal' | 'reimbursement' | 'wallet1' | 'wallet2' | 'goals' | 'help'>('summary');
  const [selectedMonth, setSelectedMonth] = useState(getMonthYearKey(new Date()));
  const [dataLoading, setDataLoading] = useState(true);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showHouseholdLink, setShowHouseholdLink] = useState(false);

  // Carregar dados do Supabase quando usuário está logado
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    const loadData = async () => {
      setDataLoading(true);

      // 1. Carregar perfil do usuário e household_id
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Se não existir perfil, criar um inicial
      if (profileError && profileError.code === 'PGRST116') {
        const initialProfile = {
          id: user.id,
          household_id: user.id,
          couple_info: coupleInfo,
          updated_at: new Date().toISOString()
        };
        await supabase.from('user_profiles').insert(initialProfile);
        profile = initialProfile;
      }

      if (profile) {
        setHouseholdId(profile.household_id || profile.id);
        setInviteCode(profile.invite_code);

        // Se o usuário não tem código de convite (usuário antigo ou erro), gerar um
        if (!profile.invite_code) {
          const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          await supabase.from('user_profiles').update({ invite_code: newCode }).eq('id', user.id);
          setInviteCode(newCode);
        }

        if (profile.couple_info) {
          const info = profile.couple_info as any;
          setCoupleInfo({
            person1Name: info.person1Name || 'André',
            person2Name: info.person2Name || 'Luciana',
            salary1: Number(info.salary1) || 0,
            salary2: Number(info.salary2) || 0,
            categories: info.categories || ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']
          });
        }
      }

      const activeHouseholdId = profile?.household_id || user.id;

      // 2. Carregar gastos filtrando por household_id
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: false });

      if (expensesData) {
        setExpenses(expensesData.map(e => ({
          id: e.id,
          date: e.date,
          type: e.type as ExpenseType,
          category: e.category,
          description: e.description,
          totalValue: Number(e.total_value),
          installments: e.installments,
          paidBy: e.paid_by as 'person1' | 'person2',
          createdAt: e.created_at,
          metadata: e.metadata,
          household_id: e.household_id,
          splitMethod: e.split_method as 'proportional' | 'equal'
        })));
      }

      // 3. Carregar metas filtrando por household_id
      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: false });

      if (goalsData) {
        setGoals(goalsData);
      }

      // 4. Carregar configuração salarial do mês específico
      const { data: monthConfig } = await supabase
        .from('monthly_configs')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .eq('month_key', selectedMonth)
        .single();

      if (monthConfig) {
        setCoupleInfo(prev => ({
          ...prev,
          salary1: Number(monthConfig.salary1),
          salary2: Number(monthConfig.salary2)
        }));
      } else {
        // Se não existir, tenta buscar do perfil geral como fallback inicial
        if (profile?.couple_info) {
          const info = profile.couple_info as any;
          setCoupleInfo(prev => ({
            ...prev,
            salary1: Number(info.salary1) || 0,
            salary2: Number(info.salary2) || 0
          }));
        }
      }

      setDataLoading(false);
    };

    loadData();
  }, [user, selectedMonth]); // Adicionado selectedMonth como dependência

  // Salvar coupleInfo no Supabase usando household_id
  const saveCoupleInfo = async (newInfo: CoupleInfo) => {
    setCoupleInfo(newInfo);
    if (user && householdId) {
      // 1. Atualiza perfil global (nomes e categorias)
      await supabase
        .from('user_profiles')
        .update({
          couple_info: {
            ...newInfo,
            // Não precisamos salvar salários "vivos" no JSON global se agora são mensais,
            // mas mantemos por compatibilidade
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', householdId);

      // 2. Salva o salário no mês específico
      await supabase
        .from('monthly_configs')
        .upsert({
          household_id: householdId,
          month_key: selectedMonth,
          salary1: newInfo.salary1,
          salary2: newInfo.salary2
        }, { onConflict: 'household_id, month_key' });
    }
  };

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

  const handleUpdateSalary1 = (val: number) => {
    saveCoupleInfo({ ...coupleInfo, salary1: val });
  };

  const handleUpdateSalary2 = (val: number) => {
    saveCoupleInfo({ ...coupleInfo, salary2: val });
  };

  const navigateMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(getMonthYearKey(date));
  };

  const addExpense = async (exp: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          household_id: householdId || user.id,
          date: exp.date,
          type: exp.type,
          category: exp.category,
          description: exp.description,
          total_value: exp.totalValue,
          installments: exp.installments,
          paid_by: exp.paidBy,
          metadata: exp.metadata || {},
          split_method: exp.splitMethod
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar gasto:', error);
        alert('Erro ao salvar o gasto: ' + error.message);
        return;
      }

      if (data) {
        const newExp: Expense = {
          id: data.id,
          date: data.date,
          type: data.type as ExpenseType,
          category: data.category,
          description: data.description,
          totalValue: Number(data.total_value),
          installments: data.installments,
          paidBy: data.paid_by as 'person1' | 'person2',
          createdAt: data.created_at,
          metadata: data.metadata,
          splitMethod: data.split_method as 'proportional' | 'equal'
        };
        setExpenses(prev => [newExp, ...prev]);
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      alert('Ocorreu um erro inesperado ao salvar.');
    }
  };

  const updateExpense = async (id: string, updates: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          date: updates.date,
          type: updates.type,
          category: updates.category,
          description: updates.description,
          total_value: updates.totalValue,
          installments: updates.installments,
          paid_by: updates.paidBy,
          metadata: updates.metadata || {},
          split_method: updates.splitMethod
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        alert('Erro ao atualizar: ' + error.message);
        return;
      }

      if (data) {
        const updatedExp: Expense = {
          id: data.id,
          date: data.date,
          type: data.type as ExpenseType,
          category: data.category,
          description: data.description,
          totalValue: Number(data.total_value),
          installments: data.installments,
          paidBy: data.paid_by as 'person1' | 'person2',
          createdAt: data.created_at,
          metadata: data.metadata,
          splitMethod: data.split_method as 'proportional' | 'equal'
        };
        setExpenses(prev => prev.map(e => e.id === id ? updatedExp : e));
      }
    } catch (err: any) {
      alert('Erro inesperado ao atualizar.');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        alert('Erro ao excluir: ' + error.message);
        return;
      }
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert('Erro inesperado ao excluir.');
    }
  };

  const addGoal = async (title: string, target: number, monthly: number, rate: number, deadline?: string, icon?: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: user.id,
          household_id: householdId || user.id,
          title,
          target_value: target,
          monthly_contribution: monthly,
          interest_rate: rate,
          deadline: deadline || null,
          icon: icon || '💰',
          current_value: 0,
          is_completed: false
        })
        .select()
        .single();
      if (error) alert('Erro ao criar meta: ' + error.message);
      else if (data) setGoals(prev => [data, ...prev]);
    } catch (err) {
      alert('Erro inesperado ao criar meta.');
    }
  };

  const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({
          current_value: updates.current_value,
          is_completed: updates.is_completed,
          monthly_contribution: updates.monthly_contribution,
          interest_rate: updates.interest_rate,
          title: updates.title,
          target_value: updates.target_value,
          deadline: updates.deadline,
          icon: updates.icon
        })
        .eq('id', id);

      if (error) alert('Erro ao atualizar meta: ' + error.message);
      else setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    } catch (err) {
      alert('Erro inesperado ao atualizar meta.');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) alert('Erro ao deletar meta: ' + error.message);
      else setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      alert('Erro inesperado.');
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;

    if (!confirm('Tem certeza que deseja apagar TODOS os seus gastos e configurações? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDataLoading(true);

      // 1. Apagar todos os gastos do usuário no Supabase
      const { error: expError } = await supabase
        .from('expenses')
        .delete()
        .eq('household_id', householdId || user.id);

      if (expError) throw expError;

      // 2. Resetar as configurações do casal para o padrão
      const defaultInfo: CoupleInfo = {
        person1Name: 'André',
        person2Name: 'Luciana',
        salary1: 5000,
        salary2: 5000,
        categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']
      };

      const { error: profError } = await supabase
        .from('user_profiles')
        .update({
          couple_info: defaultInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', householdId || user.id);

      if (profError) throw profError;

      // 3. Atualizar estado local
      setExpenses([]);
      setCoupleInfo(defaultInfo);
      alert('Todos os dados foram apagados com sucesso!');
    } catch (err: any) {
      console.error('Erro ao apagar dados:', err);
      alert('Erro ao apagar dados: ' + err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setExpenses([]);
    setCoupleInfo({
      person1Name: 'André',
      person2Name: 'Luciana',
      salary1: 5000,
      salary2: 5000,
      categories: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros']
    });
  };

  // Mostrar loading
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse">
            <img src="/logo.png" alt="Carregando..." className="h-20 mx-auto object-contain" />
          </div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Sincronizando Dados</p>
        </div>
      </div>
    );
  }

  // Se não está logado, mostrar tela de login
  if (!user) {
    return <Auth />;
  }

  if (showHouseholdLink) {
    return (
      <HouseholdLink
        onLinked={(id) => {
          setHouseholdId(id);
          setShowHouseholdLink(false);
          window.location.reload();
        }}
        onSkip={() => setShowHouseholdLink(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100 pb-20 lg:pb-0">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Top Row: Brand & Month Picker */}
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
                <h1 className="text-xl font-black tracking-tighter hidden sm:block">Finanças em Casal</h1>
              </div>
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1 shadow-inner shrink-0 h-10">
              <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-500 transition-all active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="relative flex items-center px-1">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-gray-800 font-black px-1 py-1 text-sm focus:outline-none cursor-pointer uppercase tracking-tight text-center w-[130px]"
                />
              </div>
              <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-500 transition-all active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Bottom Row: Navigation Tabs (Desktop only) */}
          <nav className="hidden lg:flex items-center pb-3 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl min-w-max">
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

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {currentTab === 'summary' && (
            <Dashboard
              coupleInfo={coupleInfo}
              expenses={expenses}
              monthKey={selectedMonth}
              onUpdateSalary1={handleUpdateSalary1}
              onUpdateSalary2={handleUpdateSalary2}
            />
          )}
          {currentTab === 'help' && (
            <HelpSupport />
          )}
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

      {/* Navegação Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t flex items-center p-2 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max space-x-1 px-2">
          <MobileTab active={currentTab === 'summary'} onClick={() => setCurrentTab('summary')} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Início" />
          <MobileTab active={currentTab === 'fixed'} onClick={() => setCurrentTab('fixed')} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Fixos" />
          <MobileTab active={currentTab === 'common'} onClick={() => setCurrentTab('common')} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" label="Prop." />
          <MobileTab active={currentTab === 'equal'} onClick={() => setCurrentTab('equal')} icon="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" label="50%/50%" />
          <MobileTab active={currentTab === 'reimbursement'} onClick={() => setCurrentTab('reimbursement')} icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" label="Reemb." />
          <MobileTab active={currentTab === 'wallet1'} onClick={() => setCurrentTab('wallet1')} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`Cart. ${coupleInfo.person1Name.slice(0, 3)}`} />
          <MobileTab active={currentTab === 'wallet2'} onClick={() => setCurrentTab('wallet2')} icon="M20 7a4 4 0 11-8 0 4 4 0 018 0zM16 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`Cart. ${coupleInfo.person2Name.slice(0, 3)}`} />
          <MobileTab active={currentTab === 'goals'} onClick={() => setCurrentTab('goals')} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Metas" />
          <MobileTab active={currentTab === 'help'} onClick={() => setCurrentTab('help')} icon="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Ajuda" />
        </div>
      </nav>

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onDeleteAccount={handleDeleteAllData}
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
  <button onClick={onClick} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>{label}</button>
);

const MobileTab: React.FC<{ active: boolean, onClick: () => void, icon: string, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center px-4 py-1 transition-all ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    <div className={`p-1.5 rounded-xl ${active ? 'bg-blue-50' : ''}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} /></svg>
    </div>
    <span className="text-[10px] mt-0.5 font-black uppercase tracking-tighter whitespace-nowrap">{label}</span>
  </button>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
