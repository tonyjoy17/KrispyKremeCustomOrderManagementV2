-- Bring older OrderFlow Supabase projects up to the API schema expected by
-- the current backend. Safe to run more than once.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  changed_by_id UUID REFERENCES public.stores(id),
  changed_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id
  ON public.order_history(order_id);

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'ORD-' ||
    to_char(NOW() AT TIME ZONE 'Australia/Adelaide', 'YYYYMM') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');
$$;

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_history FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.order_number_seq FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;

COMMENT ON TABLE public.order_history IS 'Audit trail for order changes';

-- Ask PostgREST to immediately discover the new table and RPC.
NOTIFY pgrst, 'reload schema';
