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

console.log('🧪 Prueba completa de Realtime: Insertar y Escuchar\n');

// Step 1: Setup listener
console.log('1️⃣ Configurando listener de Realtime...');

const channel = supabase
  .channel('test-insert-channel')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'transactions' },
    (payload) => {
      console.log('\n🎉 ¡EVENTO RECIBIDO!');
      console.log('Datos:', payload.new);
      console.log('\n✅ Realtime funciona correctamente!\n');
      cleanup();
    }
  )
  .subscribe(async (status) => {
    console.log('📡 Estado:', status);

    if (status === 'SUBSCRIBED') {
      console.log('✅ Listener conectado\n');
      console.log('2️⃣ Insertando registro de prueba en 2 segundos...\n');

      // Step 2: Insert test record after subscription is confirmed
      setTimeout(async () => {
        const testTransaction = {
          id: 'test-' + Date.now(),
          amount: 100,
          type: 'other-income',
          description: 'Prueba de Realtime',
          timestamp: new Date().toISOString()
        };

        console.log('📝 Insertando:', testTransaction);
        const { error } = await supabase.from('transactions').insert([testTransaction]);

        if (error) {
          console.log('❌ Error al insertar:', error.message);
          cleanup();
        } else {
          console.log('✅ Registro insertado, esperando evento...\n');

          // Cleanup after 5 seconds if no event received
          setTimeout(() => {
            console.log('\n⏱️  No se recibió evento en 5 segundos');
            console.log('\n❌ Problema detectado: Realtime no está transmitiendo eventos\n');
            console.log('Solución: Verifica que Realtime esté habilitado en:');
            console.log('https://supabase.com/dashboard/project/xlqmsvswprflqtjuqkzk/database/replication\n');
            cleanup();
          }, 5000);
        }
      }, 2000);
    } else if (status === 'CHANNEL_ERROR') {
      console.log('❌ Error en canal\n');
      cleanup();
    }
  });

function cleanup() {
  supabase.removeChannel(channel);
  setTimeout(() => process.exit(0), 500);
}

// Global timeout
setTimeout(() => {
  console.log('\n⏱️  Timeout general - Cerrando prueba');
  cleanup();
}, 15000);
