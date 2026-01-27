-- Arquivo para corrigir a segurança (RLS) da tabela monthly_configs

-- 1. Habilita RLS (Row Level Security) na tabela
ALTER TABLE monthly_configs ENABLE ROW LEVEL SECURITY;

-- 2. Cria uma política de segurança que permite acesso apenas aos membros da "família" (household)
-- Remove a política antiga se existir para evitar erro de duplicidade
DROP POLICY IF EXISTS "Household members can manage monthly_configs" ON monthly_configs;

-- Cria a nova política
CREATE POLICY "Household members can manage monthly_configs"
ON monthly_configs
FOR ALL
USING (
    household_id IN (
        SELECT household_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
);

-- DICA: Sobre o aviso de "Compromised Passwords" (HaveIBeenPwned):
-- Isso deve ser ativado no painel do Supabase, não via SQL.
-- Vá em: Authentication -> Providers -> Email -> Password Protection
