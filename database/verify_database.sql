-- =============================================
-- SCRIPT DE VERIFICAÇÃO E CORREÇÃO DO BANCO DE DADOS
-- Finança em Casal - Execute no SQL Editor do Supabase
-- =============================================

-- =================== PARTE 1: VERIFICAÇÃO ===================
-- Este bloco lista o que existe no seu banco

-- Ver todas as tabelas públicas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Ver colunas da tabela expenses (se existir)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver colunas da tabela incomes (se existir)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'incomes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver colunas da tabela user_profiles (se existir)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =================== PARTE 2: CRIAÇÃO DE TABELAS ===================
-- Execute apenas se as tabelas não existirem

-- TABELA: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL,
    invite_code TEXT UNIQUE,
    couple_info JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Outros',
    description TEXT NOT NULL,
    total_value NUMERIC(15,2) NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1,
    paid_by TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    split_method TEXT,
    reminder_day INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: incomes
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    category TEXT DEFAULT 'Salário',
    paid_by TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: savings_goals
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL,
    title TEXT NOT NULL,
    target_value NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) DEFAULT 0,
    monthly_contribution NUMERIC(15,2) DEFAULT 0,
    interest_rate NUMERIC(5,4) DEFAULT 0,
    deadline DATE,
    icon TEXT DEFAULT '🎯',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: monthly_configs
CREATE TABLE IF NOT EXISTS monthly_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    month_key TEXT NOT NULL,
    salary1 NUMERIC(15,2) DEFAULT 0,
    salary2 NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(household_id, month_key)
);

-- =================== PARTE 3: RLS (Row Level Security) ===================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_configs ENABLE ROW LEVEL SECURITY;

-- =================== PARTE 4: POLÍTICAS DE SEGURANÇA ===================

-- user_profiles: usuário pode ver/editar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- expenses: membros do household podem gerenciar
DROP POLICY IF EXISTS "Household members can manage expenses" ON expenses;
CREATE POLICY "Household members can manage expenses" ON expenses
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- incomes: membros do household podem gerenciar
DROP POLICY IF EXISTS "Household members can manage incomes" ON incomes;
CREATE POLICY "Household members can manage incomes" ON incomes
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- savings_goals: membros do household podem gerenciar
DROP POLICY IF EXISTS "Household members can manage goals" ON savings_goals;
CREATE POLICY "Household members can manage goals" ON savings_goals
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- monthly_configs: membros do household podem gerenciar
DROP POLICY IF EXISTS "Household members can manage monthly_configs" ON monthly_configs;
CREATE POLICY "Household members can manage monthly_configs" ON monthly_configs
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- =================== PARTE 5: ÍNDICES PARA PERFORMANCE ===================

CREATE INDEX IF NOT EXISTS idx_expenses_household ON expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_incomes_household ON incomes(household_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_goals_household ON savings_goals(household_id);
CREATE INDEX IF NOT EXISTS idx_monthly_household ON monthly_configs(household_id);
CREATE INDEX IF NOT EXISTS idx_profiles_household ON user_profiles(household_id);

-- =================== PARTE 6: VERIFICAÇÃO FINAL ===================

-- Confirma que as tabelas existem
SELECT 
    'TABELAS EXISTENTES:' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') as user_profiles,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') as expenses,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'incomes' AND table_schema = 'public') as incomes,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'savings_goals' AND table_schema = 'public') as savings_goals,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'monthly_configs' AND table_schema = 'public') as monthly_configs;

-- =================== FIM ===================
-- Se todos os valores na última query forem 1, seu banco está configurado!
