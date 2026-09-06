-- =============================================
-- Retail Order Management System - Database Schema
-- =============================================

-- pgcrypto and gen_random_uuid() are available on Supabase.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- STORES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  store_code VARCHAR(20) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  is_factory BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES stores(id)
);

-- Default settings
INSERT INTO system_settings (key, value) VALUES
  ('email_new_order_enabled', 'true'),
  ('email_order_updated_enabled', 'true'),
  ('email_customer_ready_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  order_details TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  reference_image_path TEXT,
  pickup_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  pickup_date DATE NOT NULL,
  pickup_time TIME,
  total_price NUMERIC(10,2) CONSTRAINT orders_total_price_nonnegative CHECK (total_price IS NULL OR total_price >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'ready', 'completed', 'cancelled')),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  customer_notified BOOLEAN DEFAULT FALSE,
  customer_notified_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES stores(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upgrade an existing OrderFlow database without removing its data.
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TIME;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);
ALTER TABLE orders ALTER COLUMN reference_image_path TYPE TEXT;

-- Compatibility with the earlier OrderFlow schema. Keep any existing values,
-- while allowing this version (which has no total_dozen field) to create orders.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'total_dozen'
  ) THEN
    ALTER TABLE public.orders ALTER COLUMN total_dozen SET DEFAULT 0;
  END IF;
END $$;

-- =============================================
-- ORDER HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  changed_by_id UUID REFERENCES stores(id),
  changed_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(40) NOT NULL,
  report_date DATE NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT scheduled_email_log_unique_delivery UNIQUE (report_type, report_date, recipient)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_store_id ON orders(pickup_store_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON orders(pickup_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_stores_username ON stores(username);
CREATE INDEX IF NOT EXISTS idx_stores_is_factory ON stores(is_factory);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_email_log_date ON scheduled_email_log(report_date);

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ORDER NUMBER SEQUENCE
-- =============================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- PostgREST RPC used by the backend because sequence access is not available
-- through table operations.
CREATE OR REPLACE FUNCTION next_order_number()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'ORD-' || to_char(NOW() AT TIME ZONE 'Australia/Adelaide', 'YYYYMM') || '-' ||
    lpad(nextval('order_number_seq')::text, 4, '0');
$$;

-- =============================================
-- SEED DATA
-- =============================================
-- Master admin (username: admin, password: admin123)
INSERT INTO stores (name, store_code, username, password_hash, is_factory, is_admin, is_active)
VALUES ('Master Admin', 'ADMIN', 'admin', 'admin123', FALSE, TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- Default factory (username: factory, password: factory123)
INSERT INTO stores (name, store_code, username, password_hash, is_factory, is_active)
VALUES ('Factory / Production', 'FACTORY', 'factory', 'factory123', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- =============================================
-- VIEWS
-- =============================================
CREATE OR REPLACE VIEW orders_detailed AS
SELECT o.*, s.name AS store_name, s.store_code,
  ps.name AS pickup_store_name, ps.store_code AS pickup_store_code
FROM orders o
JOIN stores s ON o.store_id = s.id
JOIN stores ps ON o.pickup_store_id = ps.id;

-- The application authorizes access in Express and connects as the database
-- owner. Prevent Supabase's public Data API roles from accessing these tables.
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_email_log ENABLE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION next_order_number() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE stores, system_settings, orders, order_history, scheduled_email_log, orders_detailed FROM anon;
    REVOKE ALL ON SEQUENCE order_number_seq FROM anon;
    REVOKE EXECUTE ON FUNCTION next_order_number() FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE stores, system_settings, orders, order_history, scheduled_email_log, orders_detailed FROM authenticated;
    REVOKE ALL ON SEQUENCE order_number_seq FROM authenticated;
    REVOKE EXECUTE ON FUNCTION next_order_number() FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION next_order_number() TO service_role;
  END IF;
END
$$;

COMMENT ON TABLE stores IS 'Retail stores, factory and admin accounts';
COMMENT ON TABLE orders IS 'Customer orders placed by retail stores';
COMMENT ON TABLE order_history IS 'Audit trail for order changes';
COMMENT ON TABLE system_settings IS 'Global system configuration';
COMMENT ON TABLE scheduled_email_log IS 'Idempotency log for daily email reports';

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Private bucket: authorized API responses provide one-hour signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-images', 'order-images', FALSE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public,
  file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;
