import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// ============================================
// CONFIGURACIÓN SUPABASE - ULTRA SIMPLE
// ============================================
const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

const LS_KEY = 'don-de-chuy-v4'; // Nueva versión de localStorage

console.log('🚀 Iniciando app con Supabase:', `https://${projectId}.supabase.co`.substring(0, 40) + '...');

// ============================================
// TIPOS
// ============================================
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  deliveredItems: string[];
  sentBy: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'sale' | 'expense' | 'other-income' | 'card-close' | 'drink-log';
  description: string;
  timestamp: string;
}

interface OrderContextType {
  orders: Order[];
  transactions: Transaction[];
  connected: boolean;
  addOrder: (order: Omit<Order, 'deliveredItems'>) => void;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  markItemReady: (orderId: string, itemId: string) => void;
  deleteOrder: (orderId: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deleteTransaction: (transactionId: string) => void;
  getTotalSales: () => number;
  getTotalExpenses: () => number;
  getOtherIncome: () => number;
  getNetProfit: () => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// ============================================
// HELPERS DE CONVERSIÓN
// ============================================
function toDbOrder(order: Order) {
  return {
    id: order.id,
    items: order.items,
    total: order.total,
    timestamp: order.timestamp,
    status: order.status,
    delivered_items: order.deliveredItems,
    sent_by: order.sentBy,
  };
}

function fromDbOrder(row: any): Order {
  return {
    id: row.id,
    items: row.items,
    total: parseFloat(row.total),
    timestamp: row.timestamp,
    status: row.status,
    deliveredItems: row.delivered_items || [],
    sentBy: row.sent_by,
  };
}

// ============================================
// PROVIDER - LÓGICA PRINCIPAL
// ============================================
export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const ordersRef = useRef<Order[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  // ============================================
  // FUNCIÓN DE POLLING (FALLBACK)
  // ============================================
  const pollForChanges = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('timestamp', { ascending: false });

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!ordersError && !txError && ordersData && txData) {
        const loadedOrders = (ordersData || []).map(fromDbOrder);
        const loadedTx = txData || [];

        // Actualizar si hay cambios
        const ordersChanged = JSON.stringify(ordersRef.current) !== JSON.stringify(loadedOrders);
        const txChanged = JSON.stringify(transactionsRef.current) !== JSON.stringify(loadedTx);

        if (ordersChanged) {
          console.log('🔄 Polling: Actualizando pedidos');
          setOrders(loadedOrders);
          localStorage.setItem(LS_KEY, JSON.stringify({ orders: loadedOrders, transactions: transactionsRef.current }));
        }

        if (txChanged) {
          console.log('🔄 Polling: Actualizando transacciones');
          setTransactions(loadedTx);
          localStorage.setItem(LS_KEY, JSON.stringify({ orders: ordersRef.current, transactions: loadedTx }));
        }

        // SIEMPRE conectado si polling funciona
        if (!connected) {
          console.log('✅ Conectado via polling');
          setConnected(true);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error en polling:', error);
    }
  }, [connected]);

  // ============================================
  // CARGA INICIAL
  // ============================================
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('📦 Cargando desde localStorage...');

      // Cargar localStorage primero
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setOrders(data.orders || []);
          setTransactions(data.transactions || []);
          console.log('✅ Datos cargados desde localStorage');
        }
      } catch (e) {
        console.log('ℹ️ No hay datos previos');
      }

      // Intentar cargar desde Supabase
      console.log('🌐 Conectando a Supabase...');
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('timestamp', { ascending: false });

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!ordersError && !txError && ordersData && txData) {
          const loadedOrders = (ordersData || []).map(fromDbOrder);
          const loadedTx = txData || [];

          setOrders(loadedOrders);
          setTransactions(loadedTx);
          localStorage.setItem(LS_KEY, JSON.stringify({ orders: loadedOrders, transactions: loadedTx }));

          console.log('✅ CONECTADO A SUPABASE');
          console.log(`   Pedidos: ${loadedOrders.length} | Transacciones: ${loadedTx.length}`);
          setConnected(true);
        } else {
          console.warn('⚠️ Error cargando datos:', ordersError || txError);
          // Continuar con localStorage y esperar polling
          setConnected(false);
        }
      } catch (error) {
        console.error('❌ No se pudo conectar a Supabase:', error);
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ============================================
  // REALTIME + POLLING FALLBACK
  // ============================================
  useEffect(() => {
    if (loading) return;

    let ordersChannel: RealtimeChannel;
    let txChannel: RealtimeChannel;
    let realtimeWorking = false;

    const setupSync = async () => {
      // Esperar un poco después de la carga inicial
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('🔌 Configurando sincronización en tiempo real...');

      try {
        // Canal de pedidos
        ordersChannel = supabase
          .channel('orders-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            console.log('📨 Cambio en orders:', payload.eventType);
            realtimeWorking = true;
            setConnected(true);

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const order = fromDbOrder(payload.new);
              setOrders(prev => {
                const filtered = prev.filter(o => o.id !== order.id);
                const updated = [...filtered, order].sort((a, b) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                localStorage.setItem(LS_KEY, JSON.stringify({ orders: updated, transactions: transactionsRef.current }));
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => {
                const updated = prev.filter(o => o.id !== payload.old.id);
                localStorage.setItem(LS_KEY, JSON.stringify({ orders: updated, transactions: transactionsRef.current }));
                return updated;
              });
            }
          })
          .subscribe((status) => {
            console.log('📡 Orders channel:', status);
            if (status === 'SUBSCRIBED') {
              realtimeWorking = true;
              setConnected(true);
              console.log('✅ WebSocket conectado');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.log('⚠️ WebSocket falló, usando polling');
              if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = setInterval(pollForChanges, 3000);
                setConnected(true);
              }
            }
          });

        // Canal de transacciones
        txChannel = supabase
          .channel('transactions-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
            console.log('📨 Cambio en transactions:', payload.eventType);
            realtimeWorking = true;

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const tx = payload.new as Transaction;
              tx.amount = parseFloat(tx.amount as any);
              setTransactions(prev => {
                const filtered = prev.filter(t => t.id !== tx.id);
                const updated = [...filtered, tx].sort((a, b) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                localStorage.setItem(LS_KEY, JSON.stringify({ orders: ordersRef.current, transactions: updated }));
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              setTransactions(prev => {
                const updated = prev.filter(t => t.id !== payload.old.id);
                localStorage.setItem(LS_KEY, JSON.stringify({ orders: ordersRef.current, transactions: updated }));
                return updated;
              });
            }
          })
          .subscribe();

        // Timeout: Si no funciona WebSocket en 5s, usar polling
        setTimeout(() => {
          if (!realtimeWorking && !pollingIntervalRef.current) {
            console.log('⏱️ Activando polling (timeout)');
            pollingIntervalRef.current = setInterval(pollForChanges, 3000);
            setConnected(true);
          }
        }, 5000);
      } catch (error) {
        console.error('❌ Error en sync:', error);
        // Fallback a polling
        pollingIntervalRef.current = setInterval(pollForChanges, 3000);
        setConnected(true);
      }
    };

    setupSync();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (ordersChannel) supabase.removeChannel(ordersChannel).catch(() => {});
      if (txChannel) supabase.removeChannel(txChannel).catch(() => {});
    };
  }, [loading, pollForChanges]);

  // ============================================
  // FUNCIONES DE MUTACIÓN
  // ============================================
  const addOrder = useCallback(async (order: Omit<Order, 'deliveredItems'>) => {
    const fullOrder: Order = { ...order, deliveredItems: [] };
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount: order.total,
      type: 'sale',
      description: `Pedido ${order.id}`,
      timestamp: new Date().toISOString(),
    };

    // Actualización optimista
    setOrders(prev => [...prev, fullOrder]);
    setTransactions(prev => [...prev, newTx]);
    localStorage.setItem(LS_KEY, JSON.stringify({
      orders: [...ordersRef.current, fullOrder],
      transactions: [...transactionsRef.current, newTx]
    }));

    // Sincronizar con Supabase
    try {
      await supabase.from('orders').insert([toDbOrder(fullOrder)]);
      await supabase.from('transactions').insert([newTx]);
      console.log('✅ Pedido sincronizado');
    } catch (error) {
      console.warn('⚠️ Error sincronizando pedido:', error);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status } : o);
      localStorage.setItem(LS_KEY, JSON.stringify({ orders: updated, transactions: transactionsRef.current }));
      return updated;
    });

    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
    } catch (error) {
      console.warn('⚠️ Error actualizando estado:', error);
    }
  }, []);

  const markItemReady = useCallback(async (orderId: string, itemId: string) => {
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order) return;

    const deliveredItems = order.deliveredItems.includes(itemId)
      ? order.deliveredItems.filter(id => id !== itemId)
      : [...order.deliveredItems, itemId];

    const allReady = order.items.every(item => deliveredItems.includes(item.id));
    const status = allReady ? 'ready' : (order.status === 'ready' ? 'preparing' : order.status);

    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, deliveredItems, status } : o);
      localStorage.setItem(LS_KEY, JSON.stringify({ orders: updated, transactions: transactionsRef.current }));
      return updated;
    });

    try {
      await supabase.from('orders').update({ delivered_items: deliveredItems, status }).eq('id', orderId);
    } catch (error) {
      console.warn('⚠️ Error marcando item:', error);
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setTransactions(prev => {
      const updated = prev.filter(t => t.description !== `Pedido ${orderId}`);
      localStorage.setItem(LS_KEY, JSON.stringify({
        orders: ordersRef.current.filter(o => o.id !== orderId),
        transactions: updated
      }));
      return updated;
    });

    try {
      await supabase.from('orders').delete().eq('id', orderId);
      await supabase.from('transactions').delete().eq('description', `Pedido ${orderId}`);
    } catch (error) {
      console.warn('⚠️ Error eliminando pedido:', error);
    }
  }, []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    setTransactions(prev => {
      const updated = [...prev, newTx];
      localStorage.setItem(LS_KEY, JSON.stringify({ orders: ordersRef.current, transactions: updated }));
      return updated;
    });

    try {
      await supabase.from('transactions').insert([newTx]);
    } catch (error) {
      console.warn('⚠️ Error agregando transacción:', error);
    }
  }, []);

  const deleteTransaction = useCallback(async (txId: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== txId);
      localStorage.setItem(LS_KEY, JSON.stringify({ orders: ordersRef.current, transactions: updated }));
      return updated;
    });

    try {
      await supabase.from('transactions').delete().eq('id', txId);
    } catch (error) {
      console.warn('⚠️ Error eliminando transacción:', error);
    }
  }, []);

  const addItemsToOrder = useCallback(async (orderId: string, newItems: OrderItem[]) => {
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order) return;

    const merged = [...order.items];
    newItems.forEach(ni => {
      const existing = merged.find(i => i.name === ni.name);
      if (existing) existing.quantity += ni.quantity;
      else merged.push({ ...ni, id: crypto.randomUUID() });
    });
    const newTotal = merged.reduce((s, i) => s + i.price * i.quantity, 0);
    const updatedOrder = { ...order, items: merged, total: newTotal };
    const extraTotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);

    try {
      await supabase.from('orders').update(toDbOrder(updatedOrder)).eq('id', orderId);
      await supabase.from('transactions').update({ amount: order.total + extraTotal }).eq('description', `Pedido ${orderId}`);
    } catch (error) {
      console.warn('⚠️ Error agregando items:', error);
    }
  }, []);

  // Calculadoras
  const getTotalSales = useCallback(() =>
    transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const getTotalExpenses = useCallback(() =>
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const getOtherIncome = useCallback(() =>
    transactions.filter(t => t.type === 'other-income' || t.type === 'card-close').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const getNetProfit = useCallback(() =>
    getTotalSales() + getOtherIncome() - getTotalExpenses(),
    [getTotalSales, getOtherIncome, getTotalExpenses]
  );

  return (
    <OrderContext.Provider value={{
      orders,
      transactions,
      connected,
      addOrder,
      addItemsToOrder,
      updateOrderStatus,
      markItemReady,
      deleteOrder,
      addTransaction,
      deleteTransaction,
      getTotalSales,
      getTotalExpenses,
      getOtherIncome,
      getNetProfit,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
}
