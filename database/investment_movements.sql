-- Create investment_movements table
CREATE TABLE IF NOT EXISTS public.investment_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'yield', 'adjustment')),
    value NUMERIC(15, 2) NOT NULL,
    quantity NUMERIC(20, 8),
    price_per_unit NUMERIC(20, 8),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    person TEXT NOT NULL CHECK (person IN ('person1', 'person2')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_investment_movements_investment_id ON public.investment_movements(investment_id);

-- Enable RLS
ALTER TABLE public.investment_movements ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Policy: Household members can view movements
DROP POLICY IF EXISTS "Users can see movements of their household investments" ON public.investment_movements;
CREATE POLICY "Household members can view investment movements"
ON public.investment_movements
FOR SELECT
USING (
    investment_id IN (
        SELECT id FROM public.investments WHERE household_id IN (
            SELECT household_id FROM public.user_profiles WHERE id = auth.uid()
        )
    )
);

-- Policy: Household members can insert movements
DROP POLICY IF EXISTS "Users can insert movements for their household investments" ON public.investment_movements;
CREATE POLICY "Household members can insert investment movements"
ON public.investment_movements
FOR INSERT
WITH CHECK (
    investment_id IN (
        SELECT id FROM public.investments WHERE household_id IN (
            SELECT household_id FROM public.user_profiles WHERE id = auth.uid()
        )
    )
);

-- Policy: Household members can update movements
DROP POLICY IF EXISTS "Users can update their own movements" ON public.investment_movements;
CREATE POLICY "Household members can update investment movements"
ON public.investment_movements
FOR UPDATE
USING (
    investment_id IN (
        SELECT id FROM public.investments WHERE household_id IN (
            SELECT household_id FROM public.user_profiles WHERE id = auth.uid()
        )
    )
);

-- Policy: Household members can delete movements
DROP POLICY IF EXISTS "Household members can delete investment movements" ON public.investment_movements;
CREATE POLICY "Household members can delete investment movements"
ON public.investment_movements
FOR DELETE
USING (
    investment_id IN (
        SELECT id FROM public.investments WHERE household_id IN (
            SELECT household_id FROM public.user_profiles WHERE id = auth.uid()
        )
    )
);

-- Update investments table with new fields
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS indexer TEXT,
ADD COLUMN IF NOT EXISTS risk TEXT CHECK (risk IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS liquidity TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
