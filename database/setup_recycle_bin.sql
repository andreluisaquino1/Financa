-- Script para implementar "Soft Delete" (Lixeira) nas tabelas principais
-- Execute este script no SQL Editor do seu painel Supabase.

DO $$
BEGIN
    -- 1. Adicionar deleted_at na tabela expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'deleted_at') THEN
        ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- 2. Adicionar deleted_at na tabela incomes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'deleted_at') THEN
        ALTER TABLE incomes ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- 3. Adicionar deleted_at na tabela savings_goals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'deleted_at') THEN
        ALTER TABLE savings_goals ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

END $$;

-- Criar índices para performance (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_incomes_deleted_at ON incomes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_savings_goals_deleted_at ON savings_goals(deleted_at) WHERE deleted_at IS NULL;
