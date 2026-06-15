import { useState, useMemo } from 'react';
import { useOrders, Transaction, DailySummary } from './OrderContext';
import {
  TrendingUp, DollarSign, ShoppingCart, Receipt, CreditCard,
  Menu, ArrowLeft, Trash2, Package, BarChart2, Filter, Wifi, WifiOff,
  ChevronDown, ChevronRight, Calendar, GlassWater, UtensilsCrossed,
  FileDown, X, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
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
    addTransaction, transactions, deleteTransaction, orders, deleteOrder,
    connected, pendingCount, buildDailySummary, closeDayAndClean,
  } = useOrders();

  const [closingDay, setClosingDay] = useState<string | null>(null);
  const [closingLoading, setClosingLoading] = useState(false);

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

  // Days that have data (YYYY-MM-DD)
  const daysWithData = useMemo(() => {
    const days = new Set<string>();
    transactions.forEach(t => days.add(t.timestamp.slice(0, 10)));
    orders.forEach(o => days.add(o.timestamp.slice(0, 10)));
    return Array.from(days).sort().reverse();
  }, [transactions, orders]);

  const generatePDF = (summary: DailySummary) => {
    const doc = new jsPDF();
    const dateLabel = new Date(summary.date + 'T12:00:00').toLocaleDateString('es-HN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Header
    doc.setFillColor(242, 183, 5);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text('DON DE CHUY BUSINESS', 105, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.text('Resumen de Ventas Diario', 105, 23, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1), 105, 31, { align: 'center' });

    let y = 48;

    // Totals box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(14, y, 182, 44, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Ventas totales:', 20, y + 10);
    doc.text('Otros ingresos:', 20, y + 20);
    doc.text('Gastos:', 20, y + 30);
    doc.text('GANANCIA NETA:', 20, y + 40);
    doc.setTextColor(34, 197, 94);
    doc.text(`L. ${summary.totalSales.toFixed(2)}`, 190, y + 10, { align: 'right' });
    doc.setTextColor(59, 130, 246);
    doc.text(`L. ${summary.otherIncome.toFixed(2)}`, 190, y + 20, { align: 'right' });
    doc.setTextColor(239, 68, 68);
    doc.text(`L. ${summary.totalExpenses.toFixed(2)}`, 190, y + 30, { align: 'right' });
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(12);
    doc.text(`L. ${summary.netProfit.toFixed(2)}`, 190, y + 40, { align: 'right' });

    y += 56;

    // Items sold
    if (summary.itemsSold.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 26);
      doc.text('Productos vendidos', 14, y);
      y += 7;
      doc.setFillColor(242, 183, 5);
      doc.rect(14, y, 182, 0.5, 'F');
      y += 6;

      doc.setFontSize(9);
      summary.itemsSold.forEach((item, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255);
        doc.rect(14, y - 4, 182, 8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(`${item.name}`, 18, y);
        doc.text(`x${item.qty}`, 140, y, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 26, 26);
        doc.text(`L. ${item.total.toFixed(2)}`, 193, y, { align: 'right' });
        y += 9;
      });
    }

    y += 6;

    // Transactions detail
    if (summary.transactions.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 26);
      doc.text('Detalle de transacciones', 14, y);
      y += 7;
      doc.setFillColor(242, 183, 5);
      doc.rect(14, y, 182, 0.5, 'F');
      y += 6;

      const txLabels: Record<string, string> = {
        sale: 'Venta', expense: 'Gasto', 'other-income': 'Otro Ingreso', 'card-close': 'Tarjeta',
      };
      summary.transactions.forEach((tx, idx) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255);
        doc.rect(14, y - 4, 182, 8, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const hora = new Date(tx.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
        doc.text(hora, 18, y);
        doc.text(txLabels[tx.type] || tx.type, 36, y);
        const desc = tx.description.length > 45 ? tx.description.slice(0, 42) + '...' : tx.description;
        doc.setTextColor(50, 50, 50);
        doc.text(desc, 62, y);
        const color = tx.type === 'expense' ? [239, 68, 68] : [34, 197, 94];
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${tx.type === 'expense' ? '-' : '+'}L.${tx.amount.toFixed(2)}`, 193, y, { align: 'right' });
        y += 9;
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(`Don de Chuy Business • Generado: ${new Date().toLocaleString('es-HN')}`, 105, 292, { align: 'center' });
    }

    doc.save(`DonDeChuy_${summary.date}.pdf`);
  };

  const handleCloseDay = async (date: string) => {
    const summary = buildDailySummary(date);
    generatePDF(summary);
    setClosingLoading(true);
    await closeDayAndClean(date);
    setClosingLoading(false);
    setClosingDay(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex" style={{ backgroundColor:'#0D0D0F' }}>
        <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center p-12" style={{ backgroundColor:'#0D0D0F', borderRight:'1px solid rgba(255,107,0,0.2)' }}>
          <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'3px solid #FF6B00', borderRadius:16, padding:24, marginBottom:24, boxShadow:'0 0 40px rgba(255,107,0,0.3)' }}>
            <img src={logo} alt="Don de Chuy" style={{ width:120, height:'auto' }}/>
          </div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#F5EDD8', marginBottom:6 }}>Administración</h1>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(90deg,#2C2C3A,#3D3D52,#2C2C3A)', borderTop:'2px solid #8B8FA8', borderBottom:'2px solid #8B8FA8', padding:'4px 16px' }}>
            <span style={{ color:'#C8C8DC', fontSize:11, letterSpacing:4, textTransform:'uppercase' }}>Don de Chuy</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ backgroundColor:'#0D0D0F' }}>
          <button onClick={() => navigate('/')} className="self-start mb-8 flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />Regresar
          </button>
          <div className="w-full max-w-sm">
            <div className="md:hidden text-center mb-8">
              <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid #FF6B00', borderRadius:12, padding:16, display:'inline-block', marginBottom:16, boxShadow:'0 0 24px rgba(255,107,0,0.3)' }}>
                <img src={logo} alt="Don de Chuy" style={{ width:80, height:'auto' }}/>
              </div>
            </div>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#F5EDD8', marginBottom:4 }}>Acceso Admin</h2>
            <p style={{ color:'rgba(160,144,112,0.7)', fontSize:13, marginBottom:24 }}>Introduce tu PIN para continuar</p>
            <div className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePinSubmit()}
                placeholder="● ● ● ● ● ● ● ●"
                maxLength={8}
                style={{ width:'100%', padding:'14px 16px', borderRadius:10, border:'2px solid rgba(255,107,0,0.4)', backgroundColor:'#1A1510', color:'#F5EDD8', outline:'none', textAlign:'center', fontSize:28, letterSpacing:'0.5em', fontFamily:'monospace', boxSizing:'border-box' }}
              />
              <button onClick={handlePinSubmit} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#FF6B00,#CC3D00)', color:'#0D0D0F', fontWeight:900, borderRadius:10, border:'none', fontSize:15, cursor:'pointer', boxShadow:'0 0 20px rgba(255,107,0,0.4)', WebkitAppearance:'none' }}>
                🔑 ENTRAR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor:'#0D0D0F' }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0`} style={{ backgroundColor:'#0A0A08', borderRight:'1px solid rgba(255,107,0,0.2)', boxShadow:'4px 0 24px rgba(0,0,0,0.6)' }}>
        <div className="p-6">
          <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid rgba(255,107,0,0.5)', borderRadius:12, padding:12, marginBottom:20, boxShadow:'0 0 16px rgba(255,107,0,0.2)' }}>
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
      <main className="flex-1 overflow-auto min-w-0" style={{ backgroundColor:'#0D0D0F' }}>
        {/* Header */}
        <header className="px-6 py-4 flex items-center gap-4 sticky top-0 z-10" style={{ background:'linear-gradient(90deg,#0A0A08,#15110A,#0A0A08)', borderBottom:'1px solid rgba(255,107,0,0.25)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
          <button onClick={() => navigate('/')} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid rgba(255,107,0,0.5)', borderRadius:10, padding:'6px 10px', boxShadow:'0 0 12px rgba(255,107,0,0.2)' }}>
            <img src={logo} alt="Don de Chuy" className="h-10 w-auto" />
          </div>
          <div>
            <h2 style={{ fontSize:15, fontWeight:900, color:'#F5EDD8', lineHeight:1.2 }}>Panel de Administración</h2>
            <p style={{ fontSize:11, color:'rgba(255,107,0,0.6)', letterSpacing:1 }}>Don de Chuy Business</p>
          </div>
          <div className="ml-auto flex items-center gap-2" style={{ padding:'6px 12px', borderRadius:8, backgroundColor: connected ? 'rgba(34,197,94,0.12)' : 'rgba(255,107,0,0.12)', border:`1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(255,107,0,0.3)'}` }}>
            {connected
              ? <>
                  <Wifi className="w-4 h-4" style={{ color:'#22c55e' }} />
                  <span style={{ fontSize:11, color:'#86efac', fontWeight:700 }}>Chakra activo</span>
                  {pendingCount > 0 && <span style={{ fontSize:11, color:'#FF6B00', fontWeight:700 }}>({pendingCount})</span>}
                </>
              : <>
                  <WifiOff className="w-4 h-4 animate-pulse" style={{ color:'#FF6B00' }} />
                  <span style={{ fontSize:11, color:'#FF6B00', fontWeight:700 }}>Sin conexión</span>
                  {pendingCount > 0 && <span style={{ fontSize:11, color:'#FF6B00', fontWeight:700 }}>· {pendingCount}</span>}
                </>
            }
          </div>
        </header>

        <div className="p-6 space-y-6">
          {activeTab === 'dashboard' ? (
            <>
              {/* Stats Cards — Naruto scroll style */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label:'Ventas', value: getTotalSales(), icon: DollarSign, color:'#FF6B00', bg:'rgba(255,107,0,0.1)', border:'rgba(255,107,0,0.35)', sub:'En tiempo real' },
                  { label:'Otros', value: getOtherIncome(), icon: TrendingUp, color:'#22c55e', bg:'rgba(34,197,94,0.08)', border:'rgba(34,197,94,0.25)', sub:'Tarjetas + Extras' },
                  { label:'Gastos', value: getTotalExpenses(), icon: Receipt, color:'#CC1A00', bg:'rgba(204,26,0,0.1)', border:'rgba(204,26,0,0.3)', sub:'Proveedores' },
                  { label:'Ganancia', value: getNetProfit(), icon: TrendingUp, color:'#F5C842', bg:'rgba(245,200,66,0.08)', border:'rgba(245,200,66,0.25)', sub:'Neto del día' },
                ].map(({ label, value, icon: Icon, color, bg, border, sub }) => (
                  <div key={label} style={{ backgroundColor:'#1A1510', border:`1px solid ${border}`, borderRadius:12, padding:20, boxShadow:`0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,100,0.04)` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <p style={{ fontSize:10, fontWeight:800, color, textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
                      <div style={{ width:36, height:36, borderRadius:8, backgroundColor:bg, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon style={{ width:18, height:18, color }} />
                      </div>
                    </div>
                    <p style={{ fontSize:26, fontWeight:900, color:'#F5EDD8' }}>L.{value.toFixed(2)}</p>
                    <p style={{ fontSize:10, color:'rgba(160,144,112,0.7)', marginTop:4 }}>{sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ventas por hora */}
                <div className="lg:col-span-2 rounded-2xl p-6 shadow-xl transition-all" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.25)' }}>
                  <h3 className="font-bold mb-5 flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-gradient-to-br from-primary to-[#FFB905] rounded-xl shadow-md">
                      <BarChart2 className="w-5 h-5 text-white" />
                    </div>
                    Ventas por Hora
                  </h3>
                  {salesByHour.length === 0 || getTotalSales() === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm rounded-xl" style={{ backgroundColor:'#221C10' }}>
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
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,107,0,0.1)" />
                          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#A09070' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#A09070' }} />
                          <Tooltip
                            formatter={(v: number) => [`L.${v.toFixed(2)}`, 'Ventas']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,107,0,0.4)', backgroundColor: '#1A1510', color: '#F5EDD8', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                          />
                          <Bar dataKey="ventas" fill="url(#barGradient)" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Distribución de ingresos */}
                <div className="rounded-2xl p-6 shadow-xl transition-all" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.25)' }}>
                  <h3 className="font-bold mb-5 text-gray-800 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary to-[#FFB905] rounded-xl shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Distribución
                  </h3>
                  {pieData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm rounded-xl" style={{ backgroundColor:'#221C10' }}>
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
                              contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,107,0,0.4)', backgroundColor: '#1A1510', color: '#F5EDD8', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
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
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm font-medium" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(34,197,94,0.3)', color:'#F5EDD8' }} />
                    <div className="flex gap-2">
                      <input type="number" value={otherIncome} onChange={e => setOtherIncome(e.target.value)}
                        placeholder="Monto (L.)"
                        className="flex-1 px-4 py-3 rounded-xl outline-none text-sm font-bold" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(34,197,94,0.3)', color:'#F5EDD8' }} />
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
                      className="flex-1 px-4 py-3 rounded-xl outline-none text-sm font-bold" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(74,144,217,0.3)', color:'#F5EDD8' }} />
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
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm font-medium" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(204,26,0,0.3)', color:'#F5EDD8' }} />
                    <input type="text" value={expenseInvoice} onChange={e => setExpenseInvoice(e.target.value)}
                      placeholder="No. Factura (opcional)"
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm font-medium" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(204,26,0,0.3)', color:'#F5EDD8' }} />
                    <div className="flex gap-2">
                      <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                        placeholder="Monto (L.)"
                        className="flex-1 px-4 py-3 rounded-xl outline-none text-sm font-bold" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(204,26,0,0.3)', color:'#F5EDD8' }} />
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
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm font-medium" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(255,107,0,0.3)', color:'#F5EDD8' }} />
                    <input type="text" value={paymentInvoice} onChange={e => setPaymentInvoice(e.target.value)}
                      placeholder="No. Factura (opcional)"
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm font-medium" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(255,107,0,0.3)', color:'#F5EDD8' }} />
                    <div className="flex gap-2">
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="Monto a descontar (L.)"
                        className="flex-1 px-4 py-3 rounded-xl outline-none text-sm font-bold" style={{ backgroundColor:'#2A2318', border:'1px solid rgba(255,107,0,0.3)', color:'#F5EDD8' }} />
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
              <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.2)' }}>
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
              <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.2)' }}>
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
            /* ─── CIERRE POR DÍA ─── */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Cierre por Día</h2>
                    <p className="text-xs text-gray-400">Descarga el PDF y limpia Supabase</p>
                  </div>
                </div>
              </div>

              {/* Modal de confirmación de cierre */}
              {closingDay && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.3)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Cerrar día</h3>
                      <button onClick={() => setClosingDay(null)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5"/>
                      </button>
                    </div>
                    {(() => {
                      const s = buildDailySummary(closingDay);
                      return (
                        <>
                          <p className="text-sm text-gray-500 mb-4">
                            {new Date(closingDay + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
                            <div className="flex justify-between"><span className="text-gray-500">Ventas</span><span className="font-bold text-green-600">L.{s.totalSales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Otros ingresos</span><span className="font-bold text-blue-600">L.{s.otherIncome.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Gastos</span><span className="font-bold text-red-600">L.{s.totalExpenses.toFixed(2)}</span></div>
                            <div className="flex justify-between border-t pt-2"><span className="font-bold">Ganancia neta</span><span className="font-bold text-primary text-base">L.{s.netProfit.toFixed(2)}</span></div>
                          </div>
                          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 mb-5">
                            ⚠️ Se descargará el PDF y luego se eliminarán {s.transactions.length} transacciones de Supabase. Solo quedará el total diario en tu PDF.
                          </p>
                          <button
                            onClick={() => handleCloseDay(closingDay)}
                            disabled={closingLoading}
                            className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {closingLoading
                              ? <><Loader2 className="w-4 h-4 animate-spin"/>Limpiando...</>
                              : <><FileDown className="w-4 h-4"/>Descargar PDF y cerrar día</>}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {daysWithData.length === 0 ? (
                <div className="rounded-2xl p-12 text-center shadow-lg" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.2)', color:'rgba(160,144,112,0.6)' }}>
                  Sin datos registrados
                </div>
              ) : daysWithData.map(date => {
                const s = buildDailySummary(date);
                const label = new Date(date + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                return (
                  <div key={date} className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.2)' }}>
                    <button onClick={() => toggleDay(date)}
                      className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${openDays[date] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                          {openDays[date] ? <ChevronDown className="w-5 h-5 text-primary"/> : <ChevronRight className="w-5 h-5 text-gray-500"/>}
                        </div>
                        <div className="text-left">
                          <p className="font-bold capitalize text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500">{s.transactions.length} transacciones · {s.itemsSold.length} productos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="font-bold text-green-600">+L.{s.totalSales.toFixed(2)}</p>
                          <p className="text-sm font-bold text-primary">Neto: L.{s.netProfit.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setClosingDay(date); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs transition-colors"
                        >
                          <FileDown className="w-4 h-4"/>PDF + Cerrar
                        </button>
                      </div>
                    </button>
                    {openDays[date] && (
                      <div className="border-t border-gray-100">
                        {/* Items vendidos */}
                        {s.itemsSold.length > 0 && (
                          <div className="p-4 border-b border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Productos vendidos</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {s.itemsSold.slice(0, 9).map(item => (
                                <div key={item.name} className="bg-gray-50 rounded-lg px-3 py-2 text-xs">
                                  <p className="font-bold text-gray-700 truncate">{item.name}</p>
                                  <p className="text-gray-500">x{item.qty} · L.{item.total.toFixed(0)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Transacciones */}
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-3 font-semibold text-xs">Hora</th>
                              <th className="text-left p-3 font-semibold text-xs">Tipo</th>
                              <th className="text-left p-3 font-semibold text-xs">Descripción</th>
                              <th className="text-right p-3 font-semibold text-xs">Monto</th>
                              <th className="text-center p-3 font-semibold text-xs">×</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.transactions.map(tx => (
                              <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="p-3 text-gray-400 text-xs">
                                  {new Date(tx.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                                    {TYPE_LABELS[tx.type] || tx.type}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-gray-700">{tx.description}</td>
                                <td className={`p-3 text-right font-bold text-xs ${tx.type === 'expense' ? 'text-red-600' : 'text-green-700'}`}>
                                  {tx.type === 'expense' ? '-' : '+'}L.{tx.amount.toFixed(2)}
                                </td>
                                <td className="p-3 text-center">
                                  <button onClick={() => { if (confirm('¿Eliminar?')) deleteTransaction(tx.id); }}
                                    className="p-1 rounded hover:bg-red-50 text-red-400">
                                    <Trash2 className="w-3.5 h-3.5"/>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
