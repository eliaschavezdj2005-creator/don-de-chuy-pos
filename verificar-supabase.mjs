// Script para verificar la conexión a Supabase
import { createClient } from '@supabase/supabase-js';

const projectId = "ldqohbdvwpsxakjkrjqu";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcW9oYmR2d3BzeGFramtyanF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODgyNjMsImV4cCI6MjA5NjQ2NDI2M30.GdKOyJRXdIcyczu4vdAXuSroCEMIhDvOvoLhu9g60zQ";

console.log('🔍 Verificando proyecto Supabase...');
console.log('📌 Project ID:', projectId);
console.log('📌 URL:', `https://${projectId}.supabase.co`);
console.log('');

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

// Test 1: Verificar que el proyecto responde
console.log('Test 1: Verificando conectividad...');
try {
  const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });

  if (error) {
    console.log('❌ Error conectando:', error.message);
    console.log('   Código:', error.code);
    console.log('   Detalles:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('✅ Proyecto responde correctamente');
  }
} catch (err) {
  console.log('❌ Error de red:', err.message);
  console.log('   Esto indica que el proyecto no existe o no es accesible');
}

console.log('');

// Test 2: Verificar tablas
console.log('Test 2: Verificando tablas...');
try {
  const { data: orders, error: ordersError } = await supabase.from('orders').select('*').limit(1);
  const { data: transactions, error: txError } = await supabase.from('transactions').select('*').limit(1);

  if (!ordersError) {
    console.log('✅ Tabla "orders" existe y es accesible');
  } else {
    console.log('❌ Error en tabla "orders":', ordersError.message);
  }

  if (!txError) {
    console.log('✅ Tabla "transactions" existe y es accesible');
  } else {
    console.log('❌ Error en tabla "transactions":', txError.message);
  }
} catch (err) {
  console.log('❌ Error verificando tablas:', err.message);
}

console.log('');

// Test 3: Intentar insertar datos de prueba
console.log('Test 3: Intentando escribir datos de prueba...');
try {
  const testOrder = {
    id: 'TEST-' + Date.now(),
    items: [{ id: '1', name: 'Test', price: 10, quantity: 1, category: 'Test' }],
    total: 10,
    timestamp: new Date().toISOString(),
    status: 'pending',
    delivered_items: [],
    sent_by: 'test'
  };

  const { data, error } = await supabase.from('orders').insert(testOrder).select();

  if (error) {
    console.log('❌ Error insertando:', error.message);
    console.log('   Código:', error.code);
    console.log('   Esto sugiere un problema con las políticas RLS');
  } else {
    console.log('✅ Escritura exitosa, orden de prueba creada');

    // Limpiar
    await supabase.from('orders').delete().eq('id', testOrder.id);
    console.log('✅ Orden de prueba eliminada');
  }
} catch (err) {
  console.log('❌ Error en test de escritura:', err.message);
}

console.log('');
console.log('═══════════════════════════════════════');
console.log('Diagnóstico completo');
console.log('═══════════════════════════════════════');
