import { createClient } from '@supabase/supabase-js';

const projectId = 'xlqmsvswprflqtjuqkzk';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscW1zdnN3cHJmbHF0anVxa3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDUyMjAsImV4cCI6MjA5NDg4MTIyMH0._E5nPqzD8_-FdjAHSd399YOoqpxbXosRYa1tNKV8g2M';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

async function diagnoseConnection() {
  console.log('🔍 Diagnosticando conexión Supabase...\n');

  // Test 1: Verificar conexión básica
  console.log('1️⃣ Probando conexión básica...');
  try {
    const { error } = await supabase.from('orders').select('id').limit(1);
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('❌ Las tablas NO existen\n');
        console.log('📋 PASOS PARA CREAR LAS TABLAS:\n');
        console.log('1. Abre: https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/sql/new\n');
        console.log('2. Copia este SQL SIMPLE:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  delivered_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_by TEXT NOT NULL
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_all" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "transactions_all" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('3. Haz clic en RUN');
        console.log('4. Luego ejecuta este comando de nuevo\n');
        return;
      }
      throw error;
    }
    console.log('✅ Conexión básica OK\n');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return;
  }

  // Test 2: Contar registros
  console.log('2️⃣ Verificando datos...');
  const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  console.log(`   - Pedidos: ${ordersCount || 0}`);
  console.log(`   - Transacciones: ${txCount || 0}\n`);

  // Test 3: Probar Realtime
  console.log('3️⃣ Probando Realtime...');
  const channel = supabase.channel('test-connection');

  return new Promise((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime conectado correctamente\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ ¡TODO FUNCIONA! Tu aplicación está lista.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📝 ÚLTIMO PASO: Habilitar Realtime en las tablas\n');
        console.log('Ve a: https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/sql/new\n');
        console.log('Y ejecuta:\n');
        console.log('ALTER PUBLICATION supabase_realtime ADD TABLE orders;');
        console.log('ALTER PUBLICATION supabase_realtime ADD TABLE transactions;\n');
        supabase.removeChannel(channel);
        resolve();
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Error en canal Realtime');
        console.log('   Verifica en: https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/settings/api\n');
        supabase.removeChannel(channel);
        resolve();
      }
    });

    // Timeout después de 5 segundos
    setTimeout(() => {
      console.log('⏱️  Timeout - Cerrando prueba de Realtime');
      supabase.removeChannel(channel);
      resolve();
    }, 5000);
  });
}

diagnoseConnection().catch(console.error);
