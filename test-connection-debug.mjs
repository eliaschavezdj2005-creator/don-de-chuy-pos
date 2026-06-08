import { createClient } from '@supabase/supabase-js';

const projectId = 'xlqmsvswprflqtjuqkzk';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscW1zdnN3cHJmbHF0anVxa3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDUyMjAsImV4cCI6MjA5NDg4MTIyMH0._E5nPqzD8_-FdjAHSd399YOoqpxbXosRYa1tNKV8g2M';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DIAGNÓSTICO COMPLETO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

console.log('1️⃣ Probando conexión REST API...');
try {
  const start = Date.now();
  const { data, error } = await supabase.from('orders').select('id').limit(1);
  const duration = Date.now() - start;
  
  if (error) {
    console.log('❌ ERROR EN REST API');
    console.log('   Mensaje:', error.message);
    console.log('   Código:', error.code);
    console.log('   Detalles:', JSON.stringify(error.details));
    console.log('   Hint:', error.hint);
  } else {
    console.log('✅ REST API funciona correctamente');
    console.log('   Tiempo de respuesta:', duration, 'ms');
    console.log('   Registros encontrados:', data ? data.length : 0);
  }
} catch (e) {
  console.log('❌ EXCEPCIÓN EN REST API');
  console.log('   Error:', e.message);
  console.log('   Stack:', e.stack);
}

console.log('\n2️⃣ Cargando todos los datos...');
try {
  const start = Date.now();
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('timestamp', { ascending: false });
  
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .order('timestamp', { ascending: false });
  
  const duration = Date.now() - start;
  
  if (ordersError || txError) {
    console.log('❌ ERROR AL CARGAR DATOS');
    console.log('   Orders error:', ordersError?.message);
    console.log('   Transactions error:', txError?.message);
  } else {
    console.log('✅ Datos cargados exitosamente');
    console.log('   Pedidos:', ordersData.length);
    console.log('   Transacciones:', txData.length);
    console.log('   Tiempo total:', duration, 'ms');
  }
} catch (e) {
  console.log('❌ EXCEPCIÓN AL CARGAR DATOS');
  console.log('   Error:', e.message);
}

console.log('\n3️⃣ Probando Realtime WebSocket...');
let realtimeWorked = false;
const channel = supabase.channel('diagnostic-test');

channel
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    console.log('📨 Evento recibido:', payload);
  })
  .subscribe((status, err) => {
    console.log('📡 Estado de suscripción:', status);
    if (err) {
      console.log('   Error:', err.message);
    }
    
    if (status === 'SUBSCRIBED') {
      realtimeWorked = true;
      console.log('✅ REALTIME WEBSOCKET FUNCIONA PERFECTAMENTE');
      cleanup();
    } else if (status === 'CHANNEL_ERROR') {
      console.log('⚠️ WEBSOCKET NO DISPONIBLE - Necesita usar polling');
      cleanup();
    } else if (status === 'TIMED_OUT') {
      console.log('⏱️ TIMEOUT EN WEBSOCKET - Necesita usar polling');
      cleanup();
    }
  });

function cleanup() {
  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (realtimeWorked) {
      console.log('✅ TODO FUNCIONA - WebSocket + REST API');
      console.log('   El problema está en el código del frontend');
    } else {
      console.log('⚠️ REST API funciona, WebSocket NO');
      console.log('   Solución: Debe usar polling fallback');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  }, 500);
}

setTimeout(() => {
  if (!realtimeWorked) {
    console.log('\n⏱️ Timeout general (8s) - WebSocket no respondió');
    cleanup();
  }
}, 8000);
