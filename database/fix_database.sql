-- Script para corrigir todas as colunas necessárias no banco de dados
-- Ele verifica se a coluna já existe antes de tentar criar, evitando erros.

-- 1. Garante que a coluna 'reminder_day' existe na tabela 'expenses' (Para os lembretes de gastos)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reminder_day') THEN
        ALTER TABLE expenses ADD COLUMN reminder_day INTEGER CHECK (reminder_day >= 1 AND reminder_day <= 31);
    END IF;
END $$;

-- 2. Garante que a coluna 'category' existe na tabela 'incomes' (Para as categorias de renda)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'category') THEN
        ALTER TABLE incomes ADD COLUMN category TEXT DEFAULT 'Salário';
    END IF;
END $$;
