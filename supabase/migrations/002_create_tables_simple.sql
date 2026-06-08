-- Eliminar tablas si existen (para empezar limpio)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- Crear tabla de pedidos
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  delivered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de transacciones
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_timestamp_idx ON orders(timestamp DESC);
CREATE INDEX transactions_type_idx ON transactions(type);
CREATE INDEX transactions_timestamp_idx ON transactions(timestamp DESC);

-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas (permitir todo)
CREATE POLICY "orders_all" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "orders_auth" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "transactions_all" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "transactions_auth" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
