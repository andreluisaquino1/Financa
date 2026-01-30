-- Create goal_transactions table
CREATE TABLE IF NOT EXISTS goal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    value NUMERIC NOT NULL CHECK (value > 0),
    person TEXT NOT NULL CHECK (person IN ('person1', 'person2')),
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Add is_emergency to savings_goals
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;

-- RLS Policies for goal_transactions
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to see transactions for goals in their household
DROP POLICY IF EXISTS "Users can view transactions for their household goals" ON goal_transactions;
CREATE POLICY "Household members can view goal transactions"
ON goal_transactions
FOR SELECT
USING (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

-- Allow users to insert transactions for goals in their household
DROP POLICY IF EXISTS "Users can insert transactions for their household goals" ON goal_transactions;
CREATE POLICY "Household members can insert goal transactions"
ON goal_transactions
FOR INSERT
WITH CHECK (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

-- Allow users to update their household goal transactions
DROP POLICY IF EXISTS "Users can update their household goal transactions" ON goal_transactions;
CREATE POLICY "Household members can update goal transactions"
ON goal_transactions
FOR UPDATE
USING (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

-- Allow users to delete their household goal transactions
DROP POLICY IF EXISTS "Household members can delete goal transactions" ON goal_transactions;
CREATE POLICY "Household members can delete goal transactions"
ON goal_transactions
FOR DELETE
USING (
    goal_id IN (
        SELECT id FROM savings_goals WHERE household_id IN (
            SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_goal_transactions_goal_id ON goal_transactions(goal_id);
