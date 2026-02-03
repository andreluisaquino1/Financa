-- Migration: 01_security_and_integrity.sql
-- Description: Standardize RLS, Soft Delete, and Indexes across the entire project.


-- 1.1 Add household_id to sub-tables for Performant RLS (Denormalization)
DO $$
BEGIN
    -- goal_transactions
    BEGIN
        ALTER TABLE goal_transactions ADD COLUMN household_id UUID DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    -- trip_expenses
    BEGIN
        ALTER TABLE trip_expenses ADD COLUMN household_id UUID DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    -- trip_deposits
    BEGIN
        ALTER TABLE trip_deposits ADD COLUMN household_id UUID DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    -- investment_movements
    BEGIN
        ALTER TABLE investment_movements ADD COLUMN household_id UUID DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 1.2 Backfill household_id from parents
UPDATE goal_transactions gt SET household_id = sg.household_id FROM savings_goals sg WHERE gt.goal_id = sg.id AND gt.household_id IS NULL;
UPDATE trip_expenses te SET household_id = t.household_id FROM trips t WHERE te.trip_id = t.id AND te.household_id IS NULL;
UPDATE trip_deposits td SET household_id = t.household_id FROM trips t WHERE td.trip_id = t.id AND td.household_id IS NULL;
-- Handle investment_movements only if investments table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investments') THEN
        UPDATE investment_movements im SET household_id = i.household_id FROM investments i WHERE im.investment_id = i.id AND im.household_id IS NULL;
    END IF;
END $$;

-- 1.3 Enable RLS on all tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY; -- If it exists



-- 2. Add deleted_at column (Idempotent: only if not exists)
DO $$
BEGIN
    BEGIN
        ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE incomes ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE savings_goals ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE goal_transactions ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE loans ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE trips ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE trip_expenses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE trip_deposits ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE investment_movements ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 3. Standard RLS Policies (Drop existing to ensure clean state, then create)
-- Helper macro not possible in standard SQL script without functions, so we repeat for safety.
-- Pattern: Access allowed if household_id matches user's household_id OR user_id matches auth.uid()
-- Note: For simple multi-tenant where household_id is key:

-- Policy: expenses
DROP POLICY IF EXISTS "Access own household expenses" ON expenses;
CREATE POLICY "Access own household expenses" ON expenses
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid() -- Fallback if household_id is self
    ));

-- Policy: incomes
DROP POLICY IF EXISTS "Access own household incomes" ON incomes;
CREATE POLICY "Access own household incomes" ON incomes
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- Policy: savings_goals
DROP POLICY IF EXISTS "Access own household goals" ON savings_goals;
CREATE POLICY "Access own household goals" ON savings_goals
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- Policy: goal_transactions
DROP POLICY IF EXISTS "Access own household goal transactions" ON goal_transactions;
CREATE POLICY "Access own household goal transactions" ON goal_transactions
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- Policy: loans
DROP POLICY IF EXISTS "Access own household loans" ON loans;
CREATE POLICY "Access own household loans" ON loans
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- Policy: trips
DROP POLICY IF EXISTS "Access own household trips" ON trips;
CREATE POLICY "Access own household trips" ON trips
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));
-- Policy: trip_expenses
DROP POLICY IF EXISTS "Access own household trip expenses" ON trip_expenses;
CREATE POLICY "Access own household trip expenses" ON trip_expenses
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- Policy: trip_deposits
DROP POLICY IF EXISTS "Access own household trip deposits" ON trip_deposits;
CREATE POLICY "Access own household trip deposits" ON trip_deposits
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- Policy: investment_movements
DROP POLICY IF EXISTS "Access own household investment movements" ON investment_movements;
CREATE POLICY "Access own household investment movements" ON investment_movements
    USING (household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
        UNION 
        SELECT id FROM user_profiles WHERE id = auth.uid()
    ));

-- 4. Performance Indexes (Idempotent creation)
-- household_id + date/month (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_expenses_household_date ON expenses(household_id, date);
CREATE INDEX IF NOT EXISTS idx_incomes_household_date ON incomes(household_id, date);
CREATE INDEX IF NOT EXISTS idx_goal_tx_household_date ON goal_transactions(household_id, date);

-- deleted_at (for filtering)
CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_incomes_deleted ON incomes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_goals_deleted ON savings_goals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_loans_deleted ON loans(deleted_at);
CREATE INDEX IF NOT EXISTS idx_trips_deleted ON trips(deleted_at);

-- Goal ID (for transaction lookups)
CREATE INDEX IF NOT EXISTS idx_goal_tx_goal_id ON goal_transactions(goal_id);

-- Trip ID (for trip expenses)
CREATE INDEX IF NOT EXISTS idx_trip_exp_trip_id ON trip_expenses(trip_id);
