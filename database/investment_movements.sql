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

-- Add RLS Policies (using helper function if exists, but we'll use raw SQL for clarity)
-- Policy: User can see movements of investments they have access to
CREATE POLICY "Users can see movements of their household investments"
ON public.investment_movements
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.investments i
        WHERE i.id = investment_id
    )
);

CREATE POLICY "Users can insert movements for their household investments"
ON public.investment_movements
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.investments i
        WHERE i.id = investment_id
    )
);

CREATE POLICY "Users can update their own movements"
ON public.investment_movements
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.investments i
        WHERE i.id = investment_id
    )
);

-- Update investments table with new fields
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS indexer TEXT,
ADD COLUMN IF NOT EXISTS risk TEXT CHECK (risk IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS liquidity TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
