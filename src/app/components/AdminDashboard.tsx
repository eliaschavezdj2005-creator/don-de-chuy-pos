import { useState, useMemo } from 'react';
import { useOrders, Transaction } from './OrderContext';
import {
  TrendingUp, DollarSign, ShoppingCart, Receipt, CreditCard,
  Menu, ArrowLeft, Trash2, Package, BarChart2, Filter, Wifi, WifiOff,
  ChevronDown, ChevronRight, Calendar, GlassWater, UtensilsCrossed
} from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import logo from '../../imports/image-1.png';

const CHART_COLORS = ['#F2B705', '#22c55e', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316'];

type TxFilter = 'all' | 'sale' | 'expense' | 'other-income' | 'card-close';

const TYPE_LABELS: Record<string, string> = {
  sale: 'Venta',
  expense: 'Gasto',
  'other-income': 'Otra Ganancia',
  'card-close': 'Cierre de Tarjeta',
};

const TYPE_COLORS: Record<string, string> = {
  sale: 'bg-primary/15 text-yellow-800',
  expense: 'bg-red-100 text-red-700',
  'other-income': 'bg-green-100 text-green-700',
  'card-close': 'bg-blue-100 text-blue-700',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    getTotalSales, getTotalExpenses, getOtherIncome, getNetProfit,
    addTransaction, transactions, deleteTransaction, orders, deleteOrder, connected, pendingCount
  } = useOrders();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [otherIncome, setOtherIncome] = useState('');
  const [otherIncomeDesc, setOtherIncomeDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseInvoice, setExpenseInvoice] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentInvoice, setPaymentInvoice] = useState('');
  const [cardTotal, setCardTotal] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'dias'>('dashboard');
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const toggleDay = (day: string) => setOpenDays(p => ({ ...p, [day]: !p[day] }));

  const handleAddOtherIncome = () => {
    const amount = parseFloat(otherIncome);
    if (amount > 0) {
      addTransaction({ amount, type: 'other-income', description: otherIncomeDesc.trim() || 'Otras Ganancias' });
      setOtherIncome('');
      setOtherIncomeDesc('');
    }
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (amount > 0 && expenseDescription.trim()) {
      const desc = expenseInvoice.trim()
        ? `${expenseDescription} | Factura: ${expenseInvoice}`
        : expenseDescription;
      addTransaction({ amount, type: 'expense', description: desc });
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseInvoice('');
    }
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && paymentDescription.trim()) {
      const desc = paymentInvoice.trim()
        ? `PAGO: ${paymentDescription} | Factura: ${paymentInvoice}`
        : `PAGO: ${paymentDescription}`;
      addTransaction({ amount, type: 'expense', description: desc });
      setPaymentAmount('');
      setPaymentDescription('');
      setPaymentInvoice('');
    }
  };

  const handleSaveCardTotal = () => {
    const amount = parseFloat(cardTotal);
    if (amount > 0) {
      addTransaction({ amount, type: 'card-close', description: 'Cierre de Tarjeta' });
      setCardTotal('');
    }
  };

  const handlePinSubmit = () => {
    if (pin === '19881986') {
      setIsAuthenticated(true);
    } else {
      alert('PIN incorrecto');
      setPin('');
    }
  };

  // Chart data
  const salesByHour = useMemo(() => {
    const map: Record<number, number> = {};
    transactions.filter(t => t.type === 'sale').forEach(t => {
      const h = new Date(t.timestamp).getHours();
      map[h] = (map[h] || 0) + t.amount;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`, ventas: map[i] || 0,
    })).filter(d => d.ventas > 0 || Object.keys(map).length === 0);
  }, [transactions]);

  const pieData = useMemo(() => {
    return [
      { name: 'Ventas', value: getTotalSales(), id: 'sales' },
      { name: 'Otras Ganancias', value: getOtherIncome(), id: 'other' },
      { name: 'Gastos', value: getTotalExpenses(), id: 'expenses' },
    ].filter(d => d.value > 0);
  }, [transactions]);

  // Top products sold (by quantity)
  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; cat: string }> = {};
    orders.forEach(o => o.items.forEach(item => {
      if (!map[item.name]) map[item.name] = { qty: 0, cat: item.category };
      map[item.name].qty += item.quantity;
    }));
    return Object.entries(map)
      .map(([name, { qty, cat }]) => ({ name, qty, cat }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [orders]);

  // Top drinks — from orders (Bebidas category)
  const topDrinks = useMemo(() => {
    const map: Record<string, number> = {};
    // From orders
    orders.forEach(o => o.items.filter(i => i.category === 'Bebidas').forEach(item => {
      map[item.name] = (map[item.name] || 0) + item.quantity;
    }));
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [orders]);

  // Transactions grouped by day
  const txByDay = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const day = new Date(t.timestamp).toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!map[day]) map[day] = [];
      map[day].push(t);
    });
    return Object.entries(map)
      .sort((a, b) => new Date(b[1][0].timestamp).getTime() - new Date(a[1][0].timestamp).getTime())
      .map(([day, txs]) => ({
        day,
        txs: txs.slice().reverse(),
        total: txs.filter(t => t.type !== 'expense').reduce((s, t) => s + t.amount, 0),
        expenses: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => txFilter === 'all' || t.type === txFilter)
      .slice().reverse();
  }, [transactions, txFilter]);

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex bg-[#111111]">
        <div className="hidden md:flex md:w-2/5 bg-[#1A1A1A] border-r border-white/10 flex-col items-center justify-center p-12">
          <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
            <img src={logo} alt="Don de Chuy" className="w-32 h-auto"/>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Administración</h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">Don de Chuy</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
          <button onClick={() => navigate('/')} className="self-start mb-8 flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />Regresar
          </button>
          <div className="w-full max-w-sm">
            <div className="md:hidden text-center mb-8">
              <div className="bg-gray-50 rounded-2xl p-4 inline-block mb-4">
                <img src={logo} alt="Don de Chuy" className="w-24 h-auto"/>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1 text-gray-900">Acceso Admin</h2>
            <p className="text-gray-400 text-sm mb-8">Introduce tu PIN para continuar</p>
            <div className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePinSubmit()}
                placeholder="● ● ● ● ● ● ● ●"
                maxLength={8}
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-primary outline-none text-center text-3xl tracking-[0.5em] font-mono"
              />
              <button onClick={handlePinSubmit} className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-opacity text-base shadow-md">
                Acceder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border-r border-white/10 overflow-hidden shrink-0 shadow-2xl`}>
        <div className="p-6">
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-xl">
            <img src={logo} alt="Don de Chuy" className="w-full h-auto" />
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-primary to-[#FFB905] text-primary-foreground shadow-lg'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-primary to-[#FFB905] text-primary-foreground shadow-lg'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Gestión de Pedidos</span>
            </button>
            <button
              onClick={() => setActiveTab('dias')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'dias'
                  ? 'bg-gradient-to-r from-primary to-[#FFB905] text-primary-foreground shadow-lg'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Historial por Día</span>
            </button>

            <div className="pt-4 mt-4 border-t border-white/10">
              <p className="text-xs text-white/30 font-bold uppercase tracking-wider px-4 mb-2">Accesos Rápidos</p>
              <a href="/#/pos" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all font-bold text-sm">
                <ShoppingCart className="w-5 h-5" />
                <span>Ventana</span>
              </a>
              <a href="/#/kitchen" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all font-bold text-sm">
                <Receipt className="w-5 h-5" />
                <span>Cocina (KDS)</span>
              </a>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] border-b border-white/10 px-6 py-4 flex items-center gap-4 shadow-xl sticky top-0 z-10">
          <button onClick={() => navigate('/')} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="bg-white rounded-xl p-2 shadow-md">
            <img src={logo} alt="Don de Chuy" className="h-10 w-auto" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Panel de Administración</h2>
            <p className="text-xs text-white/40">Don de Chuy Business</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
            {connected
              ? <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-300 font-bold">En línea</span>
                  {pendingCount > 0 && <span className="text-xs text-yellow-300 font-bold">({pendingCount} pend.)</span>}
                </>
              : <>
                  <WifiOff className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-xs text-yellow-300 font-medium">Sin conexión</span>
                  {pendingCount > 0 && <span className="text-xs text-yellow-300 font-bold">· {pendingCount} en cola</span>}
                </>
            }
          </div>
        </header>

        <div className="p-6 space-y-6">
          {activeTab === 'dashboard' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-primary via-[#FFB905] to-[#F2B705] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wide">Ventas</p>
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">L.{getTotalSales().toFixed(2)}</p>
                  <p className="text-xs text-white/70 mt-2 font-medium">En tiempo real</p>
                </div>
                <div className="bg-white border-2 border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Otros</p>
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-700">L.{getOtherIncome().toFixed(2)}</p>
                  <p className="text-xs text-green-500 mt-2 font-medium">Tarjetas + Extras</p>
                </div>
                <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Gastos</p>
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-red-700">L.{getTotalExpenses().toFixed(2)}</p>
                  <p className="text-xs text-red-500 mt-2 font-medium">Proveedores y otros</p>
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wide">Neto</p>
                    <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-primary">L.{getNetProfit().toFixed(2)}</p>
                  <p className="text-xs text-white/40 mt-2 font-medium">Ganancia diaria</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ventas por hora */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 border-2 border-primary/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                  <h3 className="font-bold mb-5 flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-gradient-to-br from-primary to-[#FFB905] rounded-xl shadow-md">
                      <BarChart2 className="w-5 h-5 text-white" />
                    </div>
                    Ventas por Hora
                  </h3>
                  {salesByHour.length === 0 || getTotalSales() === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                      Sin ventas registradas aún
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-3 shadow-inner">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={salesByHour} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F2B705" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#FFB905" stopOpacity={0.8}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <Tooltip
                            formatter={(v: number) => [`L.${v.toFixed(2)}`, 'Ventas']}
                            contentStyle={{ borderRadius: '12px', border: '2px solid #F2B705', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="ventas" fill="url(#barGradient)" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Distribución de ingresos */}
                <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-primary/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                  <h3 className="font-bold mb-5 text-gray-800 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary to-[#FFB905] rounded-xl shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Distribución
                  </h3>
                  {pieData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                      Sin datos
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-xl p-3 shadow-inner">
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <defs>
                              <filter id="shadow" height="130%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                                <feOffset dx="2" dy="2" result="offsetblur"/>
                                <feComponentTransfer>
                                  <feFuncA type="linear" slope="0.2"/>
                                </feComponentTransfer>
                                <feMerge>
                                  <feMergeNode/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            <Pie
                              data={pieData}
                              cx="50%" cy="50%"
                              innerRadius={50} outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                              isAnimationActive={false}
                            >
                              {pieData.map((entry) => (
                                <Cell key={`pie-cell-${entry.id}`} fill={CHART_COLORS[pieData.indexOf(entry) % CHART_COLORS.length]} filter="url(#shadow)" />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: number) => `L.${v.toFixed(2)}`}
                              contentStyle={{ borderRadius: '12px', border: '2px solid #F2B705', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Custom legend */}
                      <div className="flex flex-col gap-2 mt-4">
                        {pieData.map((entry, i) => (
                          <div key={`legend-${entry.id}`} className="flex items-center gap-2 text-xs bg-gradient-to-r from-gray-50 to-white px-3 py-2.5 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                            <span className="w-4 h-4 rounded-full shrink-0 shadow-md" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-gray-700 font-medium">{entry.name}</span>
                            <span className="ml-auto font-bold text-gray-900">L.{entry.value.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Top productos y refrescos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {topProducts.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                    <h3 className="font-bold mb-5 flex items-center gap-2 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-md">
                        <UtensilsCrossed className="w-5 h-5 text-white" />
                      </div>
                      Platos más vendidos
                    </h3>
                    <div className="bg-white rounded-xl p-3 shadow-inner">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                          <defs>
                            <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#F2B705" stopOpacity={0.8}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#78716c' }} width={110} />
                          <Tooltip
                            formatter={(v: number) => [`${v} uds`, 'Vendidos']}
                            contentStyle={{ borderRadius: '12px', border: '2px solid #f59e0b', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="qty" fill="url(#productGradient)" radius={[0, 8, 8, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {topDrinks.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                    <h3 className="font-bold mb-5 flex items-center gap-2 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md">
                        <GlassWater className="w-5 h-5 text-white" />
                      </div>
                      Bebidas más vendidas
                    </h3>
                    <div className="bg-white rounded-xl p-3 shadow-inner">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topDrinks} layout="vertical" margin={{ left: 8 }}>
                          <defs>
                            <linearGradient id="drinkGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={110} />
                          <Tooltip
                            formatter={(v: number) => [`${v} uds`, 'Vendidos']}
                            contentStyle={{ borderRadius: '12px', border: '2px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="qty" fill="url(#drinkGradient)" radius={[0, 8, 8, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Other Income */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-green-800">
                    <div className="p-2 bg-green-500 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Otras Ganancias
                  </h3>
                  <div className="space-y-3">
                    <input type="text" value={otherIncomeDesc} onChange={e => setOtherIncomeDesc(e.target.value)}
                      placeholder="Descripción"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none text-sm font-medium" />
                    <div className="flex gap-2">
                      <input type="number" value={otherIncome} onChange={e => setOtherIncome(e.target.value)}
                        placeholder="Monto (L.)"
                        className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none text-sm font-bold" />
                      <button onClick={handleAddOtherIncome} className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Close */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-800">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    Cierre de Tarjeta
                  </h3>
                  <div className="flex gap-2 mt-7">
                    <input type="number" value={cardTotal} onChange={e => setCardTotal(e.target.value)}
                      placeholder="Monto (L.)"
                      className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-bold" />
                    <button onClick={handleSaveCardTotal} className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Expense */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-red-800">
                    <div className="p-2 bg-red-500 rounded-xl">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    Gastos / Proveedores
                  </h3>
                  <div className="space-y-3">
                    <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)}
                      placeholder="Descripción del gasto"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none text-sm font-medium" />
                    <input type="text" value={expenseInvoice} onChange={e => setExpenseInvoice(e.target.value)}
                      placeholder="No. Factura (opcional)"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none text-sm font-medium" />
                    <div className="flex gap-2">
                      <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                        placeholder="Monto (L.)"
                        className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none text-sm font-bold" />
                      <button onClick={handleAddExpense} className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment - Descontar de una vez */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-orange-800">
                    <div className="p-2 bg-orange-500 rounded-xl">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    Pagos (Descontar de una vez)
                  </h3>
                  <div className="space-y-3">
                    <input type="text" value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)}
                      placeholder="Descripción del pago"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium" />
                    <input type="text" value={paymentInvoice} onChange={e => setPaymentInvoice(e.target.value)}
                      placeholder="No. Factura (opcional)"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium" />
                    <div className="flex gap-2">
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="Monto a descontar (L.)"
                        className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-bold" />
                      <button onClick={handleAddPayment} className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm">
                        Descontar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'orders' ? (
            /* ─── GESTIÓN DE PEDIDOS TAB ─── */
            <div className="space-y-6">
              {/* Active Orders */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold mb-5 flex items-center gap-2 text-gray-800">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  Pedidos Activos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-bold">Pedido</th>
                        <th className="text-left p-3 font-bold">Hora</th>
                        <th className="text-left p-3 font-bold">Estado</th>
                        <th className="text-left p-3 font-bold">Items</th>
                        <th className="text-right p-3 font-bold">Total</th>
                        <th className="text-center p-3 font-bold">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No hay pedidos registrados</td></tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-3 font-bold">{order.id}</td>
                            <td className="p-3">{new Date(order.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {order.status === 'pending' ? 'Pendiente' : order.status === 'preparing' ? 'Preparando' : order.status === 'ready' ? 'Listo' : 'Entregado'}
                              </span>
                            </td>
                            <td className="p-3">
                              {order.items.map(item => (
                                <div key={item.id} className="text-xs">{item.quantity}x {item.name}</div>
                              ))}
                            </td>
                            <td className="p-3 text-right font-bold text-primary">L.{order.total.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => { if (confirm(`¿Eliminar pedido ${order.id}?`)) deleteOrder(order.id); }}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Unified Transactions Table */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h3 className="font-bold flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Filter className="w-5 h-5 text-primary" />
                    </div>
                    Transacciones (Cierres, Ganancias, Gastos, Ventas)
                  </h3>
                  {/* Filter */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(['all', 'sale', 'expense', 'other-income', 'card-close'] as TxFilter[]).map(f => (
                      <button key={f} onClick={() => setTxFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${txFilter === f ? 'bg-gradient-to-r from-primary to-[#FFB905] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {f === 'all' ? 'Todos' : TYPE_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-bold">Fecha/Hora</th>
                        <th className="text-left p-3 font-bold">Tipo</th>
                        <th className="text-left p-3 font-bold">Descripción</th>
                        <th className="text-right p-3 font-bold">Monto</th>
                        <th className="text-center p-3 font-bold">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No hay transacciones</td></tr>
                      ) : (
                        filteredTransactions.map(tx => (
                          <tr key={tx.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-3 text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleString('es-HN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${TYPE_COLORS[tx.type] || 'bg-muted text-muted-foreground'}`}>
                                {TYPE_LABELS[tx.type] || tx.type}
                              </span>
                            </td>
                            <td className="p-3">{tx.description}</td>
                            <td className={`p-3 text-right font-bold ${tx.type === 'expense' ? 'text-destructive' : 'text-green-700'}`}>
                              {tx.type === 'expense' ? '-' : '+'}L.{tx.amount.toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => { if (confirm('¿Eliminar esta transacción?')) deleteTransaction(tx.id); }}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ─── HISTORIAL POR DÍA ─── */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Historial por Día</h2>
              </div>
              {txByDay.length === 0 ? (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center text-gray-400 shadow-lg">
                  Sin transacciones registradas
                </div>
              ) : txByDay.map(({ day, txs, total, expenses }) => (
                <div key={day} className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <button onClick={() => toggleDay(day)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl transition-colors ${openDays[day] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                        {openDays[day]
                          ? <ChevronDown className="w-5 h-5 text-primary" />
                          : <ChevronRight className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold capitalize text-gray-800">{day}</p>
                        <p className="text-xs text-gray-500 font-medium">{txs.length} transacciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-base">+L.{total.toFixed(2)}</p>
                      {expenses > 0 && <p className="text-xs text-red-600 font-medium">-L.{expenses.toFixed(2)}</p>}
                      <p className="text-sm font-bold text-primary mt-1">Neto: L.{(total - expenses).toFixed(2)}</p>
                    </div>
                  </button>
                  {openDays[day] && (
                    <div className="border-t border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left p-3 font-semibold text-xs">Hora</th>
                            <th className="text-left p-3 font-semibold text-xs">Tipo</th>
                            <th className="text-left p-3 font-semibold text-xs">Descripción</th>
                            <th className="text-right p-3 font-semibold text-xs">Monto</th>
                            <th className="text-center p-3 font-semibold text-xs">×</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txs.map(tx => (
                            <tr key={tx.id} className="border-t border-border hover:bg-muted/20">
                              <td className="p-3 text-muted-foreground text-xs">
                                {new Date(tx.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[tx.type] || 'bg-muted text-muted-foreground'}`}>
                                  {TYPE_LABELS[tx.type] || tx.type}
                                </span>
                              </td>
                              <td className="p-3 text-xs">{tx.description}</td>
                              <td className={`p-3 text-right font-bold text-xs ${tx.type === 'expense' ? 'text-red-600' : 'text-green-700'}`}>
                                {tx.type === 'expense' ? '-' : '+'}L.{tx.amount.toFixed(2)}
                              </td>
                              <td className="p-3 text-center">
                                <button onClick={() => { if (confirm('¿Eliminar?')) deleteTransaction(tx.id); }}
                                  className="p-1 rounded hover:bg-destructive/10 text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
