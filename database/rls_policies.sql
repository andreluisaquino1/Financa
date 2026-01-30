-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;

-- 1. user_profiles Policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Expenses Policy
DROP POLICY IF EXISTS "Household members can view expenses" ON expenses;
CREATE POLICY "Household members can view expenses" 
ON expenses FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert expenses" ON expenses;
CREATE POLICY "Household members can insert expenses" 
ON expenses FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update expenses" ON expenses;
CREATE POLICY "Household members can update expenses" 
ON expenses FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 3. Incomes Policy
DROP POLICY IF EXISTS "Household members can view incomes" ON incomes;
CREATE POLICY "Household members can view incomes" 
ON incomes FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert incomes" ON incomes;
CREATE POLICY "Household members can insert incomes" 
ON incomes FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update incomes" ON incomes;
CREATE POLICY "Household members can update incomes" 
ON incomes FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 4. Savings Goals Policy
DROP POLICY IF EXISTS "Household members can view goals" ON savings_goals;
CREATE POLICY "Household members can view goals" 
ON savings_goals FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert goals" ON savings_goals;
CREATE POLICY "Household members can insert goals" 
ON savings_goals FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update goals" ON savings_goals;
CREATE POLICY "Household members can update goals" 
ON savings_goals FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 5. Loans Policy
DROP POLICY IF EXISTS "Household members can view loans" ON loans;
CREATE POLICY "Household members can view loans" 
ON loans FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert loans" ON loans;
CREATE POLICY "Household members can insert loans" 
ON loans FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update loans" ON loans;
CREATE POLICY "Household members can update loans" 
ON loans FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 6. Investments Policy
DROP POLICY IF EXISTS "Household members can view investments" ON investments;
CREATE POLICY "Household members can view investments" 
ON investments FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert investments" ON investments;
CREATE POLICY "Household members can insert investments" 
ON investments FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update investments" ON investments;
CREATE POLICY "Household members can update investments" 
ON investments FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 7. Trips Policy
DROP POLICY IF EXISTS "Household members can view trips" ON trips;
CREATE POLICY "Household members can view trips" 
ON trips FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert trips" ON trips;
CREATE POLICY "Household members can insert trips" 
ON trips FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update trips" ON trips;
CREATE POLICY "Household members can update trips" 
ON trips FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 8. Trip Expenses Policy
DROP POLICY IF EXISTS "Household members can view trip_expenses" ON trip_expenses;
CREATE POLICY "Household members can view trip_expenses" 
ON trip_expenses FOR SELECT 
USING (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Household members can insert trip_expenses" ON trip_expenses;
CREATE POLICY "Household members can insert trip_expenses" 
ON trip_expenses FOR INSERT 
WITH CHECK (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Household members can update trip_expenses" ON trip_expenses;
CREATE POLICY "Household members can update trip_expenses" 
ON trip_expenses FOR UPDATE 
USING (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- 9. Trip Deposits Policy
DROP POLICY IF EXISTS "Household members can view trip_deposits" ON trip_deposits;
CREATE POLICY "Household members can view trip_deposits" 
ON trip_deposits FOR SELECT 
USING (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Household members can insert trip_deposits" ON trip_deposits;
CREATE POLICY "Household members can insert trip_deposits" 
ON trip_deposits FOR INSERT 
WITH CHECK (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Household members can update trip_deposits" ON trip_deposits;
CREATE POLICY "Household members can update trip_deposits" 
ON trip_deposits FOR UPDATE 
USING (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- 10. Monthly Configs Policy
DROP POLICY IF EXISTS "Household members can view monthly_configs" ON monthly_configs;
CREATE POLICY "Household members can view monthly_configs" 
ON monthly_configs FOR SELECT 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can insert monthly_configs" ON monthly_configs;
CREATE POLICY "Household members can insert monthly_configs" 
ON monthly_configs FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Household members can update monthly_configs" ON monthly_configs;
CREATE POLICY "Household members can update monthly_configs" 
ON monthly_configs FOR UPDATE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- ============================================================
-- DELETE POLICIES
-- ============================================================
-- Note: We implement soft delete via UPDATE (setting deleted_at).
-- These hard DELETE policies exist as a security fallback in case
-- the app needs to permanently purge data (e.g., GDPR requests).
-- All DELETE policies follow the same household_id pattern.
-- ============================================================

-- user_profiles: Block DELETE to prevent cascade/ghost issues
DROP POLICY IF EXISTS "Users cannot delete profiles" ON user_profiles;
CREATE POLICY "Users cannot delete profiles" 
ON user_profiles FOR DELETE 
USING (false); -- Always deny - profiles should never be hard deleted

-- Expenses DELETE
DROP POLICY IF EXISTS "Household members can delete expenses" ON expenses;
CREATE POLICY "Household members can delete expenses" 
ON expenses FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- Incomes DELETE
DROP POLICY IF EXISTS "Household members can delete incomes" ON incomes;
CREATE POLICY "Household members can delete incomes" 
ON incomes FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- Savings Goals DELETE
DROP POLICY IF EXISTS "Household members can delete goals" ON savings_goals;
CREATE POLICY "Household members can delete goals" 
ON savings_goals FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- Loans DELETE
DROP POLICY IF EXISTS "Household members can delete loans" ON loans;
CREATE POLICY "Household members can delete loans" 
ON loans FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- Investments DELETE
DROP POLICY IF EXISTS "Household members can delete investments" ON investments;
CREATE POLICY "Household members can delete investments" 
ON investments FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- Trips DELETE
DROP POLICY IF EXISTS "Household members can delete trips" ON trips;
CREATE POLICY "Household members can delete trips" 
ON trips FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- Trip Expenses DELETE
DROP POLICY IF EXISTS "Household members can delete trip_expenses" ON trip_expenses;
CREATE POLICY "Household members can delete trip_expenses" 
ON trip_expenses FOR DELETE 
USING (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- Trip Deposits DELETE
DROP POLICY IF EXISTS "Household members can delete trip_deposits" ON trip_deposits;
CREATE POLICY "Household members can delete trip_deposits" 
ON trip_deposits FOR DELETE 
USING (
  trip_id IN (
    SELECT id FROM trips WHERE household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- Monthly Configs DELETE
DROP POLICY IF EXISTS "Household members can delete monthly_configs" ON monthly_configs;
CREATE POLICY "Household members can delete monthly_configs" 
ON monthly_configs FOR DELETE 
USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- 11. Investment Movements Policy
DROP POLICY IF EXISTS "Household members can view investment movements" ON investment_movements;
CREATE POLICY "Household members can view investment movements"
ON investment_movements FOR SELECT
USING (
    investment_id IN (
        SELECT id FROM investments WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Household members can insert investment movements" ON investment_movements;
CREATE POLICY "Household members can insert investment movements"
ON investment_movements FOR INSERT
WITH CHECK (
    investment_id IN (
        SELECT id FROM investments WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Household members can update investment movements" ON investment_movements;
CREATE POLICY "Household members can update investment movements"
ON investment_movements FOR UPDATE
USING (
    investment_id IN (
        SELECT id FROM investments WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Household members can delete investment movements" ON investment_movements;
CREATE POLICY "Household members can delete investment movements"
ON investment_movements FOR DELETE
USING (
    investment_id IN (
        SELECT id FROM investments WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

-- 12. Goal Transactions Policy
DROP POLICY IF EXISTS "Household members can view goal transactions" ON goal_transactions;
CREATE POLICY "Household members can view goal transactions"
ON goal_transactions FOR SELECT
USING (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Household members can insert goal transactions" ON goal_transactions;
CREATE POLICY "Household members can insert goal transactions"
ON goal_transactions FOR INSERT
WITH CHECK (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Household members can update goal transactions" ON goal_transactions;
CREATE POLICY "Household members can update goal transactions"
ON goal_transactions FOR UPDATE
USING (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Household members can delete goal transactions" ON goal_transactions;
CREATE POLICY "Household members can delete goal transactions"
ON goal_transactions FOR DELETE
USING (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);
