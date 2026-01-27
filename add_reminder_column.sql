-- Add reminder_day column to expenses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reminder_day') THEN
        ALTER TABLE expenses ADD COLUMN reminder_day INTEGER CHECK (reminder_day >= 1 AND reminder_day <= 31);
    END IF;
END $$;
