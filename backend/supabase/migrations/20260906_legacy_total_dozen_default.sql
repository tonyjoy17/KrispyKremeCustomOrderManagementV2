-- Restore total dozen as required order data. Existing installations already
-- containing this column are left intact.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'total_dozen'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total_dozen INTEGER;
    UPDATE public.orders SET total_dozen = 1 WHERE total_dozen IS NULL;
    ALTER TABLE public.orders ALTER COLUMN total_dozen SET NOT NULL;
    ALTER TABLE public.orders ADD CONSTRAINT orders_total_dozen_positive CHECK (total_dozen > 0);
  END IF;
END
$$;
