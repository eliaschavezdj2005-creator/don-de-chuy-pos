-- ============================================
-- SETUP COMPLETO SUPABASE - DON DE CHUY POS
-- Ejecutar en: SQL Editor de Supabase
-- ============================================

-- 1. CREAR TABLAS
-- ============================================

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

-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_timestamp_idx ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS orders_sent_by_idx ON orders(sent_by);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_timestamp_idx ON transactions(timestamp DESC);

-- 3. TRIGGER PARA UPDATED_AT
-- ============================================

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

-- 4. HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS - ACCESO PÚBLICO (ANON)
-- ============================================

-- Borrar políticas existentes
DROP POLICY IF EXISTS "orders_all" ON orders;
DROP POLICY IF EXISTS "transactions_all" ON transactions;

-- Crear nuevas políticas permisivas
CREATE POLICY "orders_all" ON orders
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "transactions_all" ON transactions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 6. HABILITAR REALTIME
-- ============================================

-- Primero remover si ya están
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS transactions;

-- Agregar tablas a Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- 7. DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Descomentar las siguientes líneas para agregar datos de prueba:

/*
INSERT INTO orders (id, items, total, timestamp, status, delivered_items, sent_by) VALUES
  ('TEST-001', '[{"id":"1","name":"Desayuno Típico","price":45,"quantity":1,"category":"Desayunos"}]', 45.00, NOW(), 'delivered', '["1"]', 'elias'),
  ('TEST-002', '[{"id":"2","name":"Baleada Sencilla","price":15,"quantity":2,"category":"Desayunos"}]', 30.00, NOW() - INTERVAL '10 minutes', 'ready', '["2"]', 'WASHO');

INSERT INTO transactions (id, amount, type, description, timestamp) VALUES
  ('TX-001', 45.00, 'sale', 'Pedido TEST-001', NOW()),
  ('TX-002', 30.00, 'sale', 'Pedido TEST-002', NOW() - INTERVAL '10 minutes'),
  ('TX-003', 50.00, 'expense', 'Compra de ingredientes', NOW() - INTERVAL '1 hour');
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Setup completado exitosamente!' AS message;
SELECT
  'orders' AS tabla,
  COUNT(*) AS registros
FROM orders
UNION ALL
SELECT
  'transactions' AS tabla,
  COUNT(*) AS registros
FROM transactions;

-- Verificar que Realtime está habilitado
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
