-- Optional order fields. Existing records remain valid with NULL values.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_time TIME,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_total_price_nonnegative'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_total_price_nonnegative
      CHECK (total_price IS NULL OR total_price >= 0);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
