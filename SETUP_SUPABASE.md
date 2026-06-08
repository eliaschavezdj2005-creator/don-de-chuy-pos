# 🚀 Setup Supabase - Sincronización en Tiempo Real

## ✅ Lo que hice:
- Actualicé el código para conectarse directamente a Supabase Database
- Implementé sincronización en tiempo real automática
- Agregué localStorage como backup si falla la conexión

## 📋 Lo que DEBES hacer ahora (5 minutos):

### Paso 1: Crear las tablas en Supabase

1. **Ve a tu proyecto en Supabase:**
   [https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/sql/new](https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/sql/new)

2. **Copia y pega este SQL completo:**

```sql
-- Tabla para pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  delivered_items JSONB NOT NULL DEFAULT '[]',
  sent_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_timestamp_idx ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_timestamp_idx ON transactions(timestamp DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir todo (público anon)
CREATE POLICY "Allow all operations on orders" ON orders
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions" ON transactions
FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

3. **Haz clic en "RUN" o "Ejecutar"**

### Paso 2: Verificar que funciona

1. **Recarga tu aplicación**
2. **El indicador debería decir "En línea" en verde**
3. **Crea un pedido de prueba**
4. **Abre la app en otro dispositivo/pestaña** - debería aparecer automáticamente

---

## ✨ Lo que obtienes:

✅ **Sincronización en tiempo real** - Todos los dispositivos ven los cambios al instante
✅ **Nada se pierde nunca** - Todo está en base de datos PostgreSQL
✅ **Funciona offline** - Si no hay internet, usa localStorage y sincroniza después
✅ **Más simple** - No necesita Edge Functions ni configuración compleja

---

## 🔍 Verificar que las tablas se crearon:

Ve a: [https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/database/tables](https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/database/tables)

Deberías ver las tablas `orders` y `transactions`.

---

## 📞 ¿Necesitas ayuda?

Si ves algún error al ejecutar el SQL, avísame y te ayudo a resolverlo.
