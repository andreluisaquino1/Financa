-- Add deleted_at column to tables if it doesn't exist
DO $$ 
BEGIN 
  -- Expenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'deleted_at') THEN
    ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Incomes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'deleted_at') THEN
    ALTER TABLE incomes ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Savings Goals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'deleted_at') THEN
    ALTER TABLE savings_goals ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Loans
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'deleted_at') THEN
    ALTER TABLE loans ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Investments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investments' AND column_name = 'deleted_at') THEN
    ALTER TABLE investments ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Trips
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'deleted_at') THEN
    ALTER TABLE trips ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Trip Expenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_expenses' AND column_name = 'deleted_at') THEN
    ALTER TABLE trip_expenses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Trip Deposits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_deposits' AND column_name = 'deleted_at') THEN
    ALTER TABLE trip_deposits ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
  
  -- Goal Transactions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goal_transactions' AND column_name = 'deleted_at') THEN
    ALTER TABLE goal_transactions ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Investment Movements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investment_movements' AND column_name = 'deleted_at') THEN
    ALTER TABLE investment_movements ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Monthly Configs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_configs' AND column_name = 'deleted_at') THEN
    ALTER TABLE monthly_configs ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;
