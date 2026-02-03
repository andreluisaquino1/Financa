-- Script para atualizar a tabela de metas (savings_goals) com os novos campos do Hub Financeiro
-- Execute este script no SQL Editor do seu painel Supabase.

DO $$
BEGIN
    -- Adicionar goal_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'goal_type') THEN
        ALTER TABLE savings_goals ADD COLUMN goal_type TEXT DEFAULT 'couple';
    END IF;

    -- Adicionar aportes mensais individuais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'monthly_contribution_p1') THEN
        ALTER TABLE savings_goals ADD COLUMN monthly_contribution_p1 NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'monthly_contribution_p2') THEN
        ALTER TABLE savings_goals ADD COLUMN monthly_contribution_p2 NUMERIC DEFAULT 0;
    END IF;

    -- Adicionar saldos alocados individuais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'current_savings_p1') THEN
        ALTER TABLE savings_goals ADD COLUMN current_savings_p1 NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'current_savings_p2') THEN
        ALTER TABLE savings_goals ADD COLUMN current_savings_p2 NUMERIC DEFAULT 0;
    END IF;

    -- Adicionar taxa de juros e gastos esperados
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'interest_rate') THEN
        ALTER TABLE savings_goals ADD COLUMN interest_rate NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'expected_monthly_expense') THEN
        ALTER TABLE savings_goals ADD COLUMN expected_monthly_expense NUMERIC DEFAULT 0;
    END IF;

    -- Adicionar datas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'start_date') THEN
        ALTER TABLE savings_goals ADD COLUMN start_date TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'deadline') THEN
        ALTER TABLE savings_goals ADD COLUMN deadline TEXT;
    END IF;

    -- Adicionar icon e priority
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'icon') THEN
        ALTER TABLE savings_goals ADD COLUMN icon TEXT DEFAULT '💰';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'priority') THEN
        ALTER TABLE savings_goals ADD COLUMN priority TEXT DEFAULT 'medium';
    END IF;

    -- Adicionar locais de investimento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'investment_location_p1') THEN
        ALTER TABLE savings_goals ADD COLUMN investment_location_p1 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'investment_location_p2') THEN
        ALTER TABLE savings_goals ADD COLUMN investment_location_p2 TEXT;
    END IF;

    -- Adicionar controle de aporte mensal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'last_contribution_month') THEN
        ALTER TABLE savings_goals ADD COLUMN last_contribution_month TEXT;
    END IF;

    -- Adicionar status de conclusão
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'is_completed') THEN
        ALTER TABLE savings_goals ADD COLUMN is_completed BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar divisões de porcentagem e retiradas iniciais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'split_p1_percentage') THEN
        ALTER TABLE savings_goals ADD COLUMN split_p1_percentage NUMERIC DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'split_p2_percentage') THEN
        ALTER TABLE savings_goals ADD COLUMN split_p2_percentage NUMERIC DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'initial_withdrawal_p1') THEN
        ALTER TABLE savings_goals ADD COLUMN initial_withdrawal_p1 NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'initial_withdrawal_p2') THEN
        ALTER TABLE savings_goals ADD COLUMN initial_withdrawal_p2 NUMERIC DEFAULT 0;
    END IF;

END $$;
