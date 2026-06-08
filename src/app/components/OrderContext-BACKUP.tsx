import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
const LS_KEY = 'don-de-chuy-v3';

console.log('🔧 Supabase URL:', `https://${projectId}.supabase.co`);

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

// Convert Order to database format
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

// Convert database format to Order
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

// Helper to compare arrays deeply
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  const aStr = JSON.stringify(a.map(x => x.id).sort());
  const bStr = JSON.stringify(b.map(x => x.id).sort());
  return aStr === bStr && JSON.stringify(a) === JSON.stringify(b);
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use refs to always have latest state in callbacks
  const ordersRef = useRef<Order[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);

  // Update refs whenever state changes
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 INICIANDO CARGA DE DATOS...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // First, load from localStorage immediately (offline-first)
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setOrders(data.orders || []);
          setTransactions(data.transactions || []);
          console.log('📦 Datos cargados desde localStorage');
        }
      } catch (e) {
        console.log('⚠️ No hay datos en localStorage');
      }

      // Then try to sync with Supabase
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

          // Save to localStorage as backup
          localStorage.setItem(LS_KEY, JSON.stringify({
            orders: loadedOrders,
            transactions: loadedTx
          }));

          // ✅ CONECTADO INMEDIATAMENTE
          setConnected(true);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ CONECTADO A SUPABASE');
          console.log('📊 Pedidos:', loadedOrders.length);
          console.log('💰 Transacciones:', loadedTx.length);
          console.log('🟢 Estado: EN LÍNEA');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('⚠️ ERROR AL CONECTAR CON SUPABASE');
          console.log('Errors:', ordersError, txError);
          console.log('📦 Usando datos de localStorage');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          // FORZAR CONECTADO - El Realtime/polling intentará después
          setConnected(true);
        }
      } catch (error) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ SUPABASE NO DISPONIBLE');
        console.log('Error:', error);
        console.log('📦 Usando modo offline (localStorage)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // FORZAR CONECTADO - El Realtime/polling intentará después
        setConnected(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Subscribe to real-time changes with fallback to polling
  useEffect(() => {
    let ordersChannel: RealtimeChannel;
    let txChannel: RealtimeChannel;
    let pollingInterval: NodeJS.Timeout;
    let isRealtimeWorking = false;

    const pollForChanges = async () => {
      try {
        console.log('🔄 Polling: Verificando cambios...');

        // Get latest data
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

          // Check if orders changed
          if (!arraysEqual(ordersRef.current, loadedOrders)) {
            console.log('🔄 Polling: Nuevos pedidos detectados');
            setOrders(loadedOrders);
            localStorage.setItem(LS_KEY, JSON.stringify({
              orders: loadedOrders,
              transactions: transactionsRef.current
            }));
          }

          // Check if transactions changed
          if (!arraysEqual(transactionsRef.current, loadedTx)) {
            console.log('🔄 Polling: Nuevas transacciones detectadas');
            setTransactions(loadedTx);
            localStorage.setItem(LS_KEY, JSON.stringify({
              orders: ordersRef.current,
              transactions: loadedTx
            }));
          }

          // ✅ CONECTADO via polling
          setConnected(true);
        } else {
          console.log('⚠️ Error en polling:', ordersError, txError);
          setConnected(false);
        }
      } catch (error) {
        console.log('⚠️ Error en polling:', error);
        setConnected(false);
      }
    };

    const setupRealtimeListeners = async () => {
      // Wait a bit for initial load
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔄 Configurando listeners de Realtime...');

      try {
        // Subscribe to orders changes
        ordersChannel = supabase
          .channel('orders-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            async (payload) => {
              console.log('📨 Realtime: Evento en orders:', payload.eventType);
              isRealtimeWorking = true;
              // ✅ CONECTADO via Realtime
              setConnected(true);

              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const order = fromDbOrder(payload.new);
                setOrders(prev => {
                  const filtered = prev.filter(o => o.id !== order.id);
                  const updated = [...filtered, order].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  localStorage.setItem(LS_KEY, JSON.stringify({
                    orders: updated,
                    transactions: transactionsRef.current
                  }));
                  return updated;
                });
              } else if (payload.eventType === 'DELETE') {
                setOrders(prev => {
                  const updated = prev.filter(o => o.id !== payload.old.id);
                  localStorage.setItem(LS_KEY, JSON.stringify({
                    orders: updated,
                    transactions: transactionsRef.current
                  }));
                  return updated;
                });
              }
            }
          )
          .subscribe((status, err) => {
            console.log('📡 Estado de suscripción orders:', status, err ? err.message : '');

            if (status === 'SUBSCRIBED') {
              // ✅ CONECTADO via WebSocket
              setConnected(true);
              isRealtimeWorking = true;
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('✅ REALTIME WEBSOCKET CONECTADO');
              console.log('🟢 Modo: WebSocket en tiempo real');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            } else if (status === 'CHANNEL_ERROR') {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('⚠️ WEBSOCKET FALLÓ - ACTIVANDO POLLING');
              console.log('🟡 Modo: Polling cada 3 segundos');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              if (!pollingInterval) {
                pollingInterval = setInterval(pollForChanges, 3000);
                // ✅ CONECTADO via polling
                setConnected(true);
              }
            } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
              if (!isRealtimeWorking && !pollingInterval) {
                console.log('⚠️ WebSocket timeout, iniciando polling');
                pollingInterval = setInterval(pollForChanges, 3000);
                // ✅ CONECTADO via polling
                setConnected(true);
              }
            }
          });

        // Subscribe to transactions changes
        txChannel = supabase
          .channel('transactions-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'transactions' },
            async (payload) => {
              console.log('📨 Realtime: Evento en transactions:', payload.eventType);
              isRealtimeWorking = true;
              // ✅ CONECTADO via Realtime
              setConnected(true);

              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const tx = payload.new as Transaction;
                tx.amount = parseFloat(tx.amount as any);
                setTransactions(prev => {
                  const filtered = prev.filter(t => t.id !== tx.id);
                  const updated = [...filtered, tx].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );
                  localStorage.setItem(LS_KEY, JSON.stringify({
                    orders: ordersRef.current,
                    transactions: updated
                  }));
                  return updated;
                });
              } else if (payload.eventType === 'DELETE') {
                setTransactions(prev => {
                  const updated = prev.filter(t => t.id !== payload.old.id);
                  localStorage.setItem(LS_KEY, JSON.stringify({
                    orders: ordersRef.current,
                    transactions: updated
                  }));
                  return updated;
                });
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Estado de suscripción transactions:', status);
          });

        // Fallback: Check if Realtime works after 5 seconds
        setTimeout(() => {
          if (!isRealtimeWorking && !pollingInterval) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⚠️ TIMEOUT - ACTIVANDO POLLING');
            console.log('🟡 Modo: Polling cada 3 segundos');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            pollingInterval = setInterval(pollForChanges, 3000);
            // ✅ CONECTADO via polling
            setConnected(true);
          }
        }, 5000);
      } catch (error) {
        console.log('⚠️ Error configurando Realtime, usando polling:', error);
        pollingInterval = setInterval(pollForChanges, 3000);
        // ✅ CONECTADO via polling
        setConnected(true);
      }
    };

    if (!loading) {
      setupRealtimeListeners();
    }

    return () => {
      if (pollingInterval) {
        console.log('🛑 Deteniendo polling');
        clearInterval(pollingInterval);
      }
      if (ordersChannel) supabase.removeChannel(ordersChannel).catch(() => {});
      if (txChannel) supabase.removeChannel(txChannel).catch(() => {});
    };
  }, [loading]);

  const addOrder = useCallback(async (order: Omit<Order, 'deliveredItems'>) => {
    const fullOrder: Order = { ...order, deliveredItems: [] };
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount: order.total,
      type: 'sale',
      description: `Pedido ${order.id}`,
      timestamp: new Date().toISOString(),
    };

    console.log('➕ Agregando pedido:', fullOrder.id);

    // Update local state immediately (optimistic update)
    setOrders(prev => [...prev, fullOrder]);
    setTransactions(prev => [...prev, newTx]);

    // Save to localStorage
    localStorage.setItem(LS_KEY, JSON.stringify({
      orders: [...ordersRef.current, fullOrder],
      transactions: [...transactionsRef.current, newTx]
    }));

    // Try to sync with Supabase in background
    try {
      const { error: orderError } = await supabase.from('orders').insert([toDbOrder(fullOrder)]);
      const { error: txError } = await supabase.from('transactions').insert([newTx]);

      if (orderError) throw orderError;
      if (txError) throw txError;

      console.log('✅ Pedido sincronizado con Supabase');
    } catch (error) {
      console.log('⚠️ Pedido guardado localmente (offline):', error);
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
      await supabase.from('transactions')
        .update({ amount: order.total + extraTotal })
        .eq('description', `Pedido ${orderId}`);
    } catch (error) {
      console.error('⚠️ Error actualizando pedido:', error);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    console.log('🔄 Actualizando estado:', orderId, status);

    // Update local state immediately
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status } : o);
      localStorage.setItem(LS_KEY, JSON.stringify({
        orders: updated,
        transactions: transactionsRef.current
      }));
      return updated;
    });

    // Try to sync with Supabase
    try {
      await supabase.from('orders').update({ status }).eq('id', orderId);
      console.log('✅ Estado sincronizado');
    } catch (error) {
      console.log('⚠️ Estado actualizado localmente (offline)');
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

    console.log('✓ Marcando item:', itemId, 'en pedido:', orderId);

    // Update local state immediately (optimistic update)
    setOrders(prev => {
      const updated = prev.map(o =>
        o.id === orderId
          ? { ...o, deliveredItems, status }
          : o
      );
      localStorage.setItem(LS_KEY, JSON.stringify({
        orders: updated,
        transactions: transactionsRef.current
      }));
      return updated;
    });

    // Try to sync with Supabase
    try {
      await supabase.from('orders').update({
        delivered_items: deliveredItems,
        status: status
      }).eq('id', orderId);
      console.log('✅ Item marcado sincronizado');
    } catch (error) {
      console.log('⚠️ Item marcado localmente (offline)');
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    console.log('🗑️ Eliminando pedido:', orderId);

    // Update local state immediately
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setTransactions(prev => {
      const updated = prev.filter(t => t.description !== `Pedido ${orderId}`);
      localStorage.setItem(LS_KEY, JSON.stringify({
        orders: ordersRef.current.filter(o => o.id !== orderId),
        transactions: updated
      }));
      return updated;
    });

    // Try to sync with Supabase
    try {
      await supabase.from('orders').delete().eq('id', orderId);
      await supabase.from('transactions').delete().eq('description', `Pedido ${orderId}`);
      console.log('✅ Pedido eliminado sincronizado');
    } catch (error) {
      console.log('⚠️ Pedido eliminado localmente (offline)');
    }
  }, []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    console.log('➕ Agregando transacción:', newTx.type);

    // Update local state immediately
    setTransactions(prev => {
      const updated = [...prev, newTx];
      localStorage.setItem(LS_KEY, JSON.stringify({
        orders: ordersRef.current,
        transactions: updated
      }));
      return updated;
    });

    // Try to sync with Supabase
    try {
      await supabase.from('transactions').insert([newTx]);
      console.log('✅ Transacción sincronizada');
    } catch (error) {
      console.log('⚠️ Transacción guardada localmente (offline)');
    }
  }, []);

  const deleteTransaction = useCallback(async (txId: string) => {
    console.log('🗑️ Eliminando transacción:', txId);

    // Update local state immediately
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== txId);
      localStorage.setItem(LS_KEY, JSON.stringify({
        orders: ordersRef.current,
        transactions: updated
      }));
      return updated;
    });

    // Try to sync with Supabase
    try {
      await supabase.from('transactions').delete().eq('id', txId);
      console.log('✅ Transacción eliminada sincronizada');
    } catch (error) {
      console.log('⚠️ Transacción eliminada localmente (offline)');
    }
  }, []);

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
      orders, transactions, connected,
      addOrder, addItemsToOrder, updateOrderStatus, markItemReady, deleteOrder,
      addTransaction, deleteTransaction,
      getTotalSales, getTotalExpenses, getOtherIncome, getNetProfit,
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
