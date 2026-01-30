-- Add moderation_status to signals safely
BEGIN;

-- 1) Add the column without constraint (no-op if it already exists)
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS moderation_status TEXT;

-- 2) Populate existing rows:
--    treat currently visible signals as 'approved', others as 'pending'
UPDATE public.signals
SET moderation_status = CASE
  WHEN status = 'active' THEN 'approved'
  ELSE 'pending'
END
WHERE moderation_status IS NULL;

-- 3) Ensure a default
ALTER TABLE public.signals
  ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- 4) Add a CHECK constraint to match app expectations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'signals' AND c.conname = 'chk_signals_moderation_status'
  ) THEN
    ALTER TABLE public.signals
      ADD CONSTRAINT chk_signals_moderation_status
      CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;
END;
$$;

COMMIT;
