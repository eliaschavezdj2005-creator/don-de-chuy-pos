import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// ============================================
// SUPABASE CLIENT — con proxy para WiFi que bloquea DNS de supabase.co
// ============================================
const SUPABASE_DIRECT = `https://ldqohbdvwpsxakjkrjqu.supabase.co`;

// En producción, todas las llamadas REST van a /api/supabase?_url=<encoded>
// Vercel ejecuta ese edge function y reenvía a Supabase desde sus servidores,
// esquivando el bloqueo de DNS del WiFi. El WebSocket de Realtime se intenta
// directo; si falla, el polling de 4s lo reemplaza automáticamente.
const IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

function proxyFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = url.toString();
  if (IS_PROD && urlStr.startsWith(SUPABASE_DIRECT)) {
    const proxyUrl = `/api/supabase?_url=${encodeURIComponent(urlStr)}`;
    return fetch(proxyUrl, init);
  }
  return fetch(url, init);
}

const supabase = createClient(SUPABASE_DIRECT, publicAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
  global: { fetch: proxyFetch },
});

const LS_KEY = 'don-de-chuy-v5';
const QUEUE_KEY = 'don-de-chuy-queue-v5';
const BC_CHANNEL = 'don-de-chuy-bc';

// ============================================
// TYPES
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

type SyncOp =
  | { type: 'INSERT_ORDER'; data: ReturnType<typeof toDbOrder> }
  | { type: 'UPDATE_ORDER'; id: string; data: Partial<ReturnType<typeof toDbOrder>> }
  | { type: 'DELETE_ORDER'; id: string }
  | { type: 'INSERT_TX'; data: Transaction }
  | { type: 'UPDATE_TX'; id: string; amount: number }
  | { type: 'DELETE_TX'; id: string }
  | { type: 'DELETE_TX_BY_DESC'; description: string };

interface SyncQueueItem {
  id: string;
  op: SyncOp;
  createdAt: string;
  attempts: number;
}

interface LocalState {
  orders: Order[];
  transactions: Transaction[];
}

interface BroadcastMsg {
  type: 'STATE_UPDATE';
  state: LocalState;
  from: string;
}

interface OrderContextType {
  orders: Order[];
  transactions: Transaction[];
  connected: boolean;
  pendingCount: number;
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
// DB CONVERTERS
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
// QUEUE HELPERS
// ============================================
function loadQueue(): SyncQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch { return []; }
}

function saveQueue(q: SyncQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function enqueue(op: SyncOp) {
  const q = loadQueue();
  q.push({ id: crypto.randomUUID(), op, createdAt: new Date().toISOString(), attempts: 0 });
  saveQueue(q);
}

// ============================================
// STATE HELPERS
// ============================================
function loadState(): LocalState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { orders: [], transactions: [] };
}

function saveState(state: LocalState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// ============================================
// FLUSH QUEUE - send pending ops to Supabase
// ============================================
async function flushQueue(): Promise<boolean> {
  const q = loadQueue();
  if (q.length === 0) return true;

  const remaining: SyncQueueItem[] = [];
  let allOk = true;

  for (const item of q) {
    try {
      const { op } = item;
      let ok = false;

      if (op.type === 'INSERT_ORDER') {
        const { error } = await supabase.from('orders').upsert([op.data]);
        ok = !error;
      } else if (op.type === 'UPDATE_ORDER') {
        const { error } = await supabase.from('orders').update(op.data).eq('id', op.id);
        ok = !error;
      } else if (op.type === 'DELETE_ORDER') {
        const { error } = await supabase.from('orders').delete().eq('id', op.id);
        ok = !error;
      } else if (op.type === 'INSERT_TX') {
        const { error } = await supabase.from('transactions').upsert([op.data]);
        ok = !error;
      } else if (op.type === 'UPDATE_TX') {
        const { error } = await supabase.from('transactions').update({ amount: op.amount }).eq('id', op.id);
        ok = !error;
      } else if (op.type === 'DELETE_TX') {
        const { error } = await supabase.from('transactions').delete().eq('id', op.id);
        ok = !error;
      } else if (op.type === 'DELETE_TX_BY_DESC') {
        const { error } = await supabase.from('transactions').delete().eq('description', op.description);
        ok = !error;
      }

      if (!ok) {
        remaining.push({ ...item, attempts: item.attempts + 1 });
        allOk = false;
      }
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
      allOk = false;
    }
  }

  saveQueue(remaining);
  if (remaining.length > 0) {
    console.log(`📦 Cola: ${remaining.length} operaciones pendientes`);
  } else if (q.length > 0) {
    console.log(`✅ Cola vaciada: ${q.length} operaciones sincronizadas`);
  }
  return allOk;
}

// ============================================
// PROVIDER
// ============================================
export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const ordersRef = useRef<Order[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);
  const connectedRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const flushingRef = useRef(false);
  const tabId = useRef(crypto.randomUUID());

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);
  useEffect(() => { connectedRef.current = connected; }, [connected]);

  // ============================================
  // APPLY REMOTE STATE (merges remote into local)
  // ============================================
  const applyRemoteState = useCallback((remoteOrders: Order[], remoteTx: Transaction[]) => {
    setOrders(remoteOrders);
    setTransactions(remoteTx);
    saveState({ orders: remoteOrders, transactions: remoteTx });
    setPendingCount(loadQueue().length);
  }, []);

  // ============================================
  // BROADCAST CHANNEL (cross-tab sync)
  // ============================================
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(BC_CHANNEL);
    bcRef.current = bc;

    bc.onmessage = (e: MessageEvent<BroadcastMsg>) => {
      if (e.data.type === 'STATE_UPDATE' && e.data.from !== tabId.current) {
        setOrders(e.data.state.orders);
        setTransactions(e.data.state.transactions);
      }
    };

    return () => bc.close();
  }, []);

  const broadcastState = useCallback((state: LocalState) => {
    bcRef.current?.postMessage({ type: 'STATE_UPDATE', state, from: tabId.current } as BroadcastMsg);
  }, []);

  // ============================================
  // FETCH FROM SUPABASE
  // ============================================
  const fetchFromSupabase = useCallback(async (): Promise<boolean> => {
    try {
      const [{ data: od, error: oe }, { data: td, error: te }] = await Promise.all([
        supabase.from('orders').select('*').order('timestamp', { ascending: false }),
        supabase.from('transactions').select('*').order('timestamp', { ascending: false }),
      ]);

      if (oe || te) return false;

      const newOrders = (od || []).map(fromDbOrder);
      const newTx = (td || []).map((t: any) => ({ ...t, amount: parseFloat(t.amount) }));

      applyRemoteState(newOrders, newTx);
      broadcastState({ orders: newOrders, transactions: newTx });
      return true;
    } catch {
      return false;
    }
  }, [applyRemoteState, broadcastState]);

  // ============================================
  // TRY SYNC (flush queue + optional fetch)
  // ============================================
  const trySync = useCallback(async (withFetch = false) => {
    if (flushingRef.current) return;
    flushingRef.current = true;

    try {
      const queueOk = await flushQueue();
      setPendingCount(loadQueue().length);

      if (withFetch || !connectedRef.current) {
        const ok = await fetchFromSupabase();
        if (ok && !connectedRef.current) {
          console.log('✅ Reconectado a Supabase');
          setConnected(true);
        } else if (!ok && connectedRef.current) {
          console.log('⚠️ Supabase no disponible, modo offline');
          setConnected(false);
        }
      } else if (!queueOk) {
        setConnected(false);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [fetchFromSupabase]);

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    const init = async () => {
      // Load local state immediately
      const local = loadState();
      setOrders(local.orders);
      setTransactions(local.transactions);
      setPendingCount(loadQueue().length);
      ordersRef.current = local.orders;
      transactionsRef.current = local.transactions;

      console.log('🔄 Conectando a Supabase...');

      // Try to connect with retries
      for (let i = 0; i < 4; i++) {
        const ok = await fetchFromSupabase();
        if (ok) {
          setConnected(true);
          await flushQueue();
          setPendingCount(loadQueue().length);
          console.log('✅ Conectado a Supabase');
          break;
        }
        if (i < 3) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      }

      setLoading(false);
    };

    init();
  }, [fetchFromSupabase]);

  // ============================================
  // POLLING: retry sync every 4s when offline, 30s when online
  // ============================================
  useEffect(() => {
    if (loading) return;

    const tick = async () => {
      const interval = connectedRef.current ? 30000 : 4000;
      clearInterval(pollingRef.current!);
      pollingRef.current = setInterval(async () => {
        await trySync(true);
      }, interval);
    };

    tick();
    const unsub = () => { if (pollingRef.current) clearInterval(pollingRef.current); };

    // Re-setup interval when connected state changes
    return unsub;
  }, [loading, connected, trySync]);

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    if (loading) return;

    let ordersChannel: RealtimeChannel;
    let txChannel: RealtimeChannel;

    const setup = async () => {
      await new Promise(r => setTimeout(r, 500));

      ordersChannel = supabase
        .channel('orders-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          setConnected(true);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const order = fromDbOrder(payload.new);
            setOrders(prev => {
              const updated = [...prev.filter(o => o.id !== order.id), order]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const state = { orders: updated, transactions: transactionsRef.current };
              saveState(state);
              broadcastState(state);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => {
              const updated = prev.filter(o => o.id !== payload.old.id);
              const state = { orders: updated, transactions: transactionsRef.current };
              saveState(state);
              broadcastState(state);
              return updated;
            });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            console.log('📡 Realtime conectado');
          }
        });

      txChannel = supabase
        .channel('transactions-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
          setConnected(true);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const tx = { ...payload.new as Transaction, amount: parseFloat((payload.new as any).amount) };
            setTransactions(prev => {
              const updated = [...prev.filter(t => t.id !== tx.id), tx]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const state = { orders: ordersRef.current, transactions: updated };
              saveState(state);
              broadcastState(state);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => {
              const updated = prev.filter(t => t.id !== payload.old.id);
              const state = { orders: ordersRef.current, transactions: updated };
              saveState(state);
              broadcastState(state);
              return updated;
            });
          }
        })
        .subscribe();
    };

    setup();

    return () => {
      ordersChannel && supabase.removeChannel(ordersChannel).catch(() => {});
      txChannel && supabase.removeChannel(txChannel).catch(() => {});
    };
  }, [loading, broadcastState]);

  // ============================================
  // RECONNECT ON BROWSER ONLINE EVENT
  // ============================================
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexión de red detectada, reconectando...');
      trySync(true);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [trySync]);

  // ============================================
  // MUTATIONS
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

    // Optimistic update
    setOrders(prev => {
      const updated = [...prev, fullOrder];
      const state = { orders: updated, transactions: transactionsRef.current };
      saveState(state);
      broadcastState(state);
      return updated;
    });
    setTransactions(prev => {
      const updated = [...prev, newTx];
      const state = { orders: ordersRef.current, transactions: updated };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    // Enqueue for sync
    enqueue({ type: 'INSERT_ORDER', data: toDbOrder(fullOrder) });
    enqueue({ type: 'INSERT_TX', data: newTx });
    setPendingCount(loadQueue().length);

    // Try immediate sync
    trySync(false);
  }, [broadcastState, trySync]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status } : o);
      const state = { orders: updated, transactions: transactionsRef.current };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    enqueue({ type: 'UPDATE_ORDER', id: orderId, data: { status } });
    setPendingCount(loadQueue().length);
    trySync(false);
  }, [broadcastState, trySync]);

  const markItemReady = useCallback(async (orderId: string, itemId: string) => {
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order) return;

    const deliveredItems = order.deliveredItems.includes(itemId)
      ? order.deliveredItems.filter(id => id !== itemId)
      : [...order.deliveredItems, itemId];

    const allReady = order.items.every(item => deliveredItems.includes(item.id));
    const status: Order['status'] = allReady ? 'ready' : (order.status === 'ready' ? 'preparing' : order.status);

    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, deliveredItems, status } : o);
      const state = { orders: updated, transactions: transactionsRef.current };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    enqueue({ type: 'UPDATE_ORDER', id: orderId, data: { delivered_items: deliveredItems, status } });
    setPendingCount(loadQueue().length);
    trySync(false);
  }, [broadcastState, trySync]);

  const deleteOrder = useCallback(async (orderId: string) => {
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      const state = { orders: updated, transactions: transactionsRef.current };
      saveState(state);
      broadcastState(state);
      return updated;
    });
    setTransactions(prev => {
      const updated = prev.filter(t => t.description !== `Pedido ${orderId}`);
      const state = { orders: ordersRef.current.filter(o => o.id !== orderId), transactions: updated };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    enqueue({ type: 'DELETE_ORDER', id: orderId });
    enqueue({ type: 'DELETE_TX_BY_DESC', description: `Pedido ${orderId}` });
    setPendingCount(loadQueue().length);
    trySync(false);
  }, [broadcastState, trySync]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = { ...tx, id: crypto.randomUUID(), timestamp: new Date().toISOString() };

    setTransactions(prev => {
      const updated = [...prev, newTx];
      const state = { orders: ordersRef.current, transactions: updated };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    enqueue({ type: 'INSERT_TX', data: newTx });
    setPendingCount(loadQueue().length);
    trySync(false);
  }, [broadcastState, trySync]);

  const deleteTransaction = useCallback(async (txId: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== txId);
      const state = { orders: ordersRef.current, transactions: updated };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    enqueue({ type: 'DELETE_TX', id: txId });
    setPendingCount(loadQueue().length);
    trySync(false);
  }, [broadcastState, trySync]);

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

    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? updatedOrder : o);
      const state = { orders: updated, transactions: transactionsRef.current };
      saveState(state);
      broadcastState(state);
      return updated;
    });

    enqueue({ type: 'UPDATE_ORDER', id: orderId, data: toDbOrder(updatedOrder) });

    // Update transaction amount
    const existingTx = transactionsRef.current.find(t => t.description === `Pedido ${orderId}`);
    if (existingTx) {
      enqueue({ type: 'UPDATE_TX', id: existingTx.id, amount: order.total + extraTotal });
    }

    setPendingCount(loadQueue().length);
    trySync(false);
  }, [broadcastState, trySync]);

  // ============================================
  // CALCULATORS
  // ============================================
  const getTotalSales = useCallback(() =>
    transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0),
    [transactions]);

  const getTotalExpenses = useCallback(() =>
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]);

  const getOtherIncome = useCallback(() =>
    transactions.filter(t => t.type === 'other-income' || t.type === 'card-close').reduce((s, t) => s + t.amount, 0),
    [transactions]);

  const getNetProfit = useCallback(() =>
    getTotalSales() + getOtherIncome() - getTotalExpenses(),
    [getTotalSales, getOtherIncome, getTotalExpenses]);

  return (
    <OrderContext.Provider value={{
      orders,
      transactions,
      connected,
      pendingCount,
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
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
