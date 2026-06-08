# 🚀 Instrucciones para Habilitar Sincronización en Tiempo Real

Tu aplicación POS necesita que despliegues la Edge Function en Supabase para que la sincronización en tiempo real funcione.

## 📋 Opción 1: Desplegar Edge Function (Recomendado)

### Paso 1: Crear la tabla KV Store
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/sql/new)
2. Ejecuta este SQL:

```sql
CREATE TABLE IF NOT EXISTS kv_store_96525332 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

### Paso 2: Desplegar la Edge Function
1. Ve a [Edge Functions](https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/functions)
2. Haz clic en **"Deploy a new function"**
3. Nombre: `server`
4. Copia el contenido de `supabase/functions/server/index.tsx`
5. Haz clic en **"Deploy"**

### Paso 3: Verificar que funciona
1. Abre tu aplicación
2. El indicador debería cambiar de "Conectando..." a "En línea"
3. Prueba crear un pedido en un dispositivo y verifica que aparezca en otro

---

## 📋 Opción 2: Usar Supabase Database + Realtime (Sin Edge Functions)

Esta opción usa directamente una tabla de Supabase en lugar de Edge Functions.

### Ventajas:
- ✅ Más simple de configurar
- ✅ Sincronización automática vía Supabase Realtime
- ✅ No requiere Edge Functions
- ✅ Persistencia garantizada en base de datos PostgreSQL

### Paso 1: Crear las tablas
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

### Paso 2: Actualizar el código
Te prepararé el código actualizado que usa directamente las tablas de Supabase.

---

## ❓ ¿Cuál opción elegir?

**Elige Opción 1 (Edge Functions)** si:
- Quieres mantener la arquitectura actual
- Necesitas flexibilidad para agregar lógica custom
- Te sientes cómodo con Edge Functions

**Elige Opción 2 (Database + Realtime)** si:
- Quieres la solución más simple y robusta
- Prefieres usar funcionalidades nativas de Supabase
- Quieres garantizar que los datos nunca se pierdan

---

## 📞 ¿Necesitas ayuda?

Si prefieres que implemente la **Opción 2** (más simple), dime y actualizo el código automáticamente.
