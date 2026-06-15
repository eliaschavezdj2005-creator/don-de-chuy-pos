import { createClient } from '@supabase/supabase-js';

const projectId = 'xlqmsvswprflqtjuqkzk';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscW1zdnN3cHJmbHF0anVxa3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDUyMjAsImV4cCI6MjA5NDg4MTIyMH0._E5nPqzD8_-FdjAHSd399YOoqpxbXosRYa1tNKV8g2M';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

console.log('🔍 Probando conexión Realtime detallada...\n');

// Test 1: Verificar que las tablas existen
console.log('1️⃣ Verificando tablas...');
const { data: orders, error: ordersError } = await supabase.from('orders').select('id').limit(1);
const { data: tx, error: txError } = await supabase.from('transactions').select('id').limit(1);

if (ordersError) {
  console.log('❌ Error en orders:', ordersError.message);
} else {
  console.log('✅ Tabla orders existe');
}

if (txError) {
  console.log('❌ Error en transactions:', txError.message);
} else {
  console.log('✅ Tabla transactions existe');
}

console.log('\n2️⃣ Probando canal de Realtime...');

const channel = supabase.channel('test-realtime-connection');

channel
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('📨 Evento recibido:', payload);
    }
  )
  .subscribe((status, err) => {
    console.log('📡 Estado de suscripción:', status);
    if (err) {
      console.log('❌ Error:', err);
    }

    if (status === 'SUBSCRIBED') {
      console.log('✅ ¡REALTIME CONECTADO!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ Todo funciona correctamente');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('Si tu app no muestra "En línea", revisa:');
      console.log('1. La consola del navegador (F12) para ver errores');
      console.log('2. Que hayas recargado con Ctrl+R o Cmd+R');
      console.log('3. Limpia caché: Ctrl+Shift+R o Cmd+Shift+R\n');

      setTimeout(() => {
        supabase.removeChannel(channel);
        process.exit(0);
      }, 2000);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.log('❌ Error conectando a Realtime\n');
      console.log('Posibles causas:');
      console.log('1. Realtime no está habilitado en las tablas');
      console.log('2. Problema con la configuración de Supabase');
      console.log('3. Las políticas RLS están bloqueando Realtime\n');

      console.log('Intenta ejecutar este SQL:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;');
      console.log('ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS transactions;');
      console.log('ALTER PUBLICATION supabase_realtime ADD TABLE orders;');
      console.log('ALTER PUBLICATION supabase_realtime ADD TABLE transactions;');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      supabase.removeChannel(channel);
      process.exit(1);
    }
  });

// Timeout después de 10 segundos
setTimeout(() => {
  console.log('\n⏱️  Timeout - No se recibió confirmación de Realtime');
  console.log('\nVerifica la configuración de Realtime en:');
  console.log('https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/database/replication\n');
  supabase.removeChannel(channel);
  process.exit(1);
}, 10000);
