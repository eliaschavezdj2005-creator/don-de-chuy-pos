-- ============================================
-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/ldqohbdvwpsxakjkrjqu/sql/new
-- ============================================

-- 1. CREAR TABLAS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'delivered')),
  delivered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'expense', 'other-income', 'card-close', 'drink-log')),
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_timestamp_idx ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_timestamp_idx ON transactions(timestamp DESC);

-- 3. TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_all" ON orders;
DROP POLICY IF EXISTS "transactions_all" ON transactions;

CREATE POLICY "orders_all" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "transactions_all" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. REALTIME
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- VERIFICACIÓN
SELECT 'Setup completado!' AS message;
