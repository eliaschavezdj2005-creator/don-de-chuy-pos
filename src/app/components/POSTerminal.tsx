import { useState, useEffect } from 'react';
import { useOrders, OrderItem, Order } from './OrderContext';
import { MENU_ITEMS, CATEGORIES, QUICK_DRINKS } from './menuData';
import {
  User, ShoppingCart, Trash2, Send, ArrowLeft, CheckCircle,
  Square, CheckSquare, Calculator, X, Banknote, Zap,
  PlusCircle, ChevronRight, Plus, Coffee, Clock, ChefHat, PackageCheck, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router';
import logo from '../../imports/image-1.png';

const KITCHEN_CATS = new Set(['Desayunos', 'Golosinas', 'Platos Fuertes']);

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', preparing: 'Preparando', ready: '✓ Listo', delivered: 'Entregado'
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-500',
};

const STATUS_HEADER: Record<string, string> = {
  pending: 'bg-amber-400',
  preparing: 'bg-blue-500',
  ready: 'bg-green-500',
  delivered: 'bg-gray-300',
};

// ─── Mini Calculator ──────────────────────────────────────────────────────────
function MiniCalc() {
  const [expr, setExpr] = useState('');
  const [disp, setDisp] = useState('0');
  const press = (v: string) => {
    if (v === 'C') { setExpr(''); setDisp('0'); return; }
    if (v === '=') {
      try {
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict";return(' + expr + ')')();
        const s = String(parseFloat(Number(r).toFixed(4)));
        setDisp(s); setExpr(s);
      } catch { setDisp('Error'); setExpr(''); }
      return;
    }
    if (v === '⌫') { const n = expr.slice(0, -1) || ''; setExpr(n); setDisp(n || '0'); return; }
    const n = expr + v; setExpr(n); setDisp(n);
  };
  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 w-64 p-4 select-none">
      <div className="bg-black/40 rounded-xl px-3 py-3 text-right text-2xl font-bold mb-3 truncate font-mono text-white">{disp}</div>
      <div className="grid grid-cols-4 gap-1.5">
        {['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+','C','⌫'].map(b => (
          <button key={b} onClick={() => press(b === '÷' ? '/' : b === '×' ? '*' : b)}
            className={`h-12 rounded-xl font-bold text-base transition-all active:scale-95 ${
              b === '=' ? 'bg-primary text-primary-foreground shadow-md' :
              b === 'C' ? 'bg-red-500 text-white' :
              ['÷','×','-','+'].includes(b) ? 'bg-white/10 text-white' :
              'bg-white/5 hover:bg-white/10 text-white active:bg-white/20'
            }`}>{b}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Custom "Otro" item modal ─────────────────────────────────────────────────
function OtroModal({ onAdd, onClose }: {
  onAdd: (item: { name: string; price: number; category: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cat, setCat] = useState('Golosinas');
  const submit = () => {
    const p = parseFloat(price);
    if (!name.trim() || !p || p <= 0) return;
    onAdd({ name: name.trim(), price: p, category: cat });
    onClose();
  };
  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" style={{ backgroundColor:'rgba(0,0,0,0.75)' }}>
      <div className="w-full sm:max-w-xs overflow-hidden shadow-2xl" style={{ borderRadius:'20px 20px 0 0', background:'linear-gradient(180deg,#C8A870 0%,#E8D5A8 5%,#F0E0B8 50%,#E8D5A8 95%,#C8A870 100%)', border:'2px solid #A07840' }}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 sm:hidden" style={{ backgroundColor:'rgba(80,50,20,0.25)' }}/>
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 style={{ fontWeight:900, fontSize:17, color:'#2A1A08', fontFamily:'serif' }}>📜 Producto personalizado</h3>
          <button onClick={onClose} className="p-2 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ backgroundColor:'rgba(80,50,20,0.08)' }}>
            <X className="w-5 h-5" style={{ color:'#2A1A08' }}/>
          </button>
        </div>
        <div className="space-y-4 px-5 pb-6">
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'rgba(80,50,20,0.55)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:6, fontFamily:'serif' }}>Nombre</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Elote con chile"
              style={{ width:'100%', padding:'11px 14px', borderRadius:8, border:'1px solid rgba(80,50,20,0.3)', backgroundColor:'rgba(80,50,20,0.06)', color:'#2A1A08', outline:'none', fontSize:15, boxSizing:'border-box', fontFamily:'serif' }}/>
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'rgba(80,50,20,0.55)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:6, fontFamily:'serif' }}>Precio (L.)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
              style={{ width:'100%', padding:'11px 14px', borderRadius:8, border:'1px solid rgba(80,50,20,0.3)', backgroundColor:'rgba(80,50,20,0.06)', color:'#2A1A08', outline:'none', fontSize:15, fontWeight:900, boxSizing:'border-box', fontFamily:'serif' }}/>
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'rgba(80,50,20,0.55)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:6, fontFamily:'serif' }}>Categoría</label>
            <select value={cat} onChange={e => setCat(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', borderRadius:8, border:'1px solid rgba(80,50,20,0.3)', backgroundColor:'rgba(80,50,20,0.06)', color:'#2A1A08', outline:'none', fontSize:15, WebkitAppearance:'none' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={submit} disabled={!name.trim() || !price}
            style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#CC3D00,#FF6B00)', color:'#F5EDD8', fontWeight:900, borderRadius:9, border:'none', fontSize:14, cursor: !name.trim()||!price ? 'not-allowed':'pointer', opacity: !name.trim()||!price ? 0.4:1, fontFamily:'serif', WebkitAppearance:'none' }}>
            📜 Agregar al pergamino
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ order, extraItems, onConfirm, onCancel, onAddDrink }: {
  order: { total: number; items: OrderItem[] };
  extraItems: OrderItem[];
  onConfirm: () => void;
  onCancel: () => void;
  onAddDrink: (drink: { name: string; price: number; category: string }) => void;
}) {
  const [bill, setBill] = useState('');
  const QUICK_BILLS = [50, 100, 200, 500];
  const extrasTotal = extraItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const grandTotal = order.total + extrasTotal;
  const paid = parseFloat(bill) || 0;
  const change = paid - grandTotal;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden"/>
        <div className="bg-[#1A1A1A] px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary"/>Cobrar Pedido
          </h2>
          <button onClick={onCancel} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="overflow-auto flex-1 p-5 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 max-h-36 overflow-auto">
            {order.items.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-gray-500">{i.quantity}× {i.name}</span>
                <span className="font-semibold">L.{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            {extraItems.map(i => (
              <div key={i.id} className="flex justify-between text-sm text-blue-700">
                <span>+{i.quantity}× {i.name}</span>
                <span className="font-semibold">L.{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1 uppercase tracking-wide">
              <Coffee className="w-3 h-3"/>Agregar al pedido
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_DRINKS.map(d => (
                <button key={d.name} onClick={() => onAddDrink(d)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-800 text-sm font-bold transition-colors border border-blue-200 min-h-[40px]">
                  <Plus className="w-3.5 h-3.5"/>{d.name} L.{d.price}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-4 flex items-center justify-between">
            <span className="font-bold text-primary-foreground">Total a cobrar</span>
            <span className="text-3xl font-bold text-primary-foreground">L.{grandTotal.toFixed(2)}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wide">Billete recibido</label>
            <input type="number" inputMode="numeric" value={bill} onChange={e => setBill(e.target.value)}
              placeholder="0.00" autoFocus
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-primary outline-none text-3xl font-bold text-center font-mono"/>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_BILLS.map(v => (
              <button key={v} onClick={() => setBill(String(v))}
                className={`h-12 rounded-xl text-sm font-bold transition-all active:scale-95 ${parseFloat(bill) === v ? 'bg-primary text-primary-foreground shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>
                L.{v}
              </button>
            ))}
          </div>

          <div className={`rounded-2xl p-4 text-center transition-colors ${change >= 0 && paid > 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
            <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Vuelto</p>
            <p className={`text-4xl font-bold font-mono ${change >= 0 && paid > 0 ? 'text-green-600' : 'text-gray-300'}`}>
              {paid > 0 ? (change >= 0 ? `L.${change.toFixed(2)}` : '❌') : '—'}
            </p>
            {paid > 0 && change < 0 && <p className="text-red-500 text-xs mt-1 font-semibold">Billete insuficiente</p>}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onCancel} className="flex-1 h-14 rounded-2xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 text-base">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={change < 0 || paid === 0}
            className="flex-[2] h-14 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base">
            ✓ Entregar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Extras Modal ─────────────────────────────────────────────────────────────
function ExtrasModal({ items, activeOrders, onChargeNow, onAddToOrder, onKeepInCart, onCancel }: {
  items: OrderItem[]; activeOrders: Order[];
  onChargeNow: () => void; onAddToOrder: (id: string) => void;
  onKeepInCart: () => void; onCancel: () => void;
}) {
  const [step, setStep] = useState<'choose' | 'pick'>('choose');
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 max-h-[85vh] overflow-auto">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden"/>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Extras / Directos</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-5 h-5"/></button>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-1.5 max-h-40 overflow-auto">
          {items.map(i => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-gray-500">{i.quantity}× {i.name}</span>
              <span className="font-bold text-primary">L.{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
            <span>Total</span><span className="text-primary">L.{total.toFixed(2)}</span>
          </div>
        </div>
        {step === 'choose' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 text-center mb-2">¿Qué hacemos con estos productos?</p>
            <button onClick={onChargeNow} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 min-h-[60px]">
              <Zap className="w-5 h-5 shrink-0"/>
              <div className="text-left flex-1">
                <p>Cobrar de una vez</p>
                <p className="text-xs opacity-70 font-normal">Venta inmediata sin cocina</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0"/>
            </button>
            {activeOrders.length > 0 && (
              <button onClick={() => setStep('pick')} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#1A1A1A] text-white font-bold hover:opacity-90 min-h-[60px]">
                <PlusCircle className="w-5 h-5 shrink-0"/>
                <div className="text-left flex-1">
                  <p>Agregar a pedido</p>
                  <p className="text-xs opacity-50 font-normal">{activeOrders.length} pedido(s) activos</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0"/>
              </button>
            )}
            <button onClick={onKeepInCart} className="w-full py-3 rounded-2xl bg-gray-100 text-gray-400 font-medium text-sm hover:bg-gray-200 min-h-[44px]">
              Dejar en el carrito
            </button>
          </div>
        ) : (
          <div>
            <button onClick={() => setStep('choose')} className="text-sm text-gray-400 hover:text-gray-700 mb-3 min-h-[44px] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4"/>Volver
            </button>
            <p className="text-sm font-semibold mb-3">Selecciona el pedido:</p>
            <div className="space-y-2 max-h-64 overflow-auto">
              {activeOrders.map(o => (
                <button key={o.id} onClick={() => onAddToOrder(o.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-primary transition-colors text-left min-h-[64px]">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">Pedido {o.id}</p>
                    <p className="text-xs text-gray-400 truncate">{o.items.map(i => `${i.quantity}×${i.name}`).join(', ')}</p>
                    <p className="text-xs text-gray-400">{o.sentBy}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${STATUS_COLOR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cart Item - Estilo Mario ─────────────────────────────────────────────────
function CartItem({ item, onRemove, onQty, isExtra }: {
  item: OrderItem; onRemove: (id: string) => void; onQty: (id: string, q: number) => void; isExtra: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 border-2 shadow-md ${isExtra ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400' : 'bg-gradient-to-br from-gray-100 to-white border-gray-300'}`}>
      <div className="flex items-start justify-between mb-1.5">
        <h4 className="font-bold flex-1 text-xs leading-tight pr-1">{item.name}</h4>
        <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-600 p-1 rounded-md bg-white/50 border border-red-300 min-w-[28px] min-h-[28px] flex items-center justify-center active:scale-95 transition-all">
          <Trash2 className="w-3 h-3"/>
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-white rounded-lg border-2 border-gray-400 overflow-hidden shadow-sm">
          <button onClick={() => onQty(item.id, item.quantity - 1)} className="w-7 h-7 font-black text-xs hover:bg-yellow-100 active:bg-yellow-200 flex items-center justify-center active:scale-95 transition-all">−</button>
          <span className="font-black w-6 text-center text-xs">{item.quantity}</span>
          <button onClick={() => onQty(item.id, item.quantity + 1)} className="w-7 h-7 font-black text-xs hover:bg-yellow-100 active:bg-yellow-200 flex items-center justify-center active:scale-95 transition-all">+</button>
        </div>
        <p className="font-black text-xs text-amber-600">L.{(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
}

// ─── Order Card — Pergamino Ninja ─────────────────────────────────────────────
const STATUS_SEAL: Record<string, { color: string; label: string }> = {
  pending:   { color:'#92400E', label:'⏳ Pendiente' },
  preparing: { color:'#1E40AF', label:'🔥 Preparando' },
  ready:     { color:'#166534', label:'✅ Listo' },
  delivered: { color:'rgba(80,50,20,0.3)', label:'📦 Entregado' },
};

function OrderCard({ order, onDeliver, onPay, onMarkItem, isDelivered }: {
  order: Order;
  onDeliver: () => void;
  onPay: () => void;
  onMarkItem: (itemId: string) => void;
  isDelivered: boolean;
}) {
  const seal = STATUS_SEAL[order.status] || STATUS_SEAL.pending;
  const rollerColor = isDelivered ? '#8A7A60' : '#A07840';
  const opacity = isDelivered ? 0.55 : 1;

  return (
    <div style={{ opacity, filter:`drop-shadow(0 3px 12px ${seal.color}33)` }}>
      {/* Top roller */}
      <div style={{ position:'relative', height:14, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50% 50% 0 0 / 14px 14px 0 0', background:`linear-gradient(180deg,${rollerColor} 0%,#8A6830 100%)`, boxShadow:'inset 0 -2px 4px rgba(0,0,0,0.2)' }}/>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', backgroundColor:seal.color, border:`2px solid ${rollerColor}` }}/>
      </div>

      {/* Parchment */}
      <div style={{
        background:'linear-gradient(180deg,#D4B896 0%,#ECD8B0 5%,#F0E0B8 30%,#ECD8B0 70%,#E0C890 95%,#C8A870 100%)',
        position:'relative', overflow:'hidden',
        boxShadow:'inset 2px 0 6px rgba(80,50,20,0.1), inset -2px 0 6px rgba(80,50,20,0.1)',
      }}>
        {/* Crease lines */}
        <div style={{ position:'absolute', left:'33%', top:0, bottom:0, width:1, backgroundColor:'rgba(80,50,20,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:'66%', top:0, bottom:0, width:1, backgroundColor:'rgba(80,50,20,0.05)', pointerEvents:'none' }}/>

        {/* Header */}
        <div style={{ padding:'8px 10px 6px', borderBottom:'1px solid rgba(80,50,20,0.15)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontWeight:900, fontSize:14, color:'#2A1A08', lineHeight:1, fontFamily:'serif' }}>{order.id}</p>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                <User style={{ width:9, height:9, color:'rgba(80,50,20,0.5)' }}/>
                <span style={{ fontSize:9, color:'rgba(80,50,20,0.6)', fontFamily:'serif' }}>{order.sentBy}</span>
                <Clock style={{ width:9, height:9, color:'rgba(80,50,20,0.5)', marginLeft:2 }}/>
                <span style={{ fontSize:9, color:'rgba(80,50,20,0.5)', fontFamily:'serif' }}>
                  {new Date(order.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            </div>
            <div style={{ padding:'2px 7px', borderRadius:20, backgroundColor:`${seal.color}18`, border:`1px solid ${seal.color}40` }}>
              <span style={{ fontSize:9, fontWeight:800, color:seal.color, fontFamily:'serif' }}>{seal.label}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ padding:'6px 8px', display:'flex', flexDirection:'column', gap:3 }}>
          {order.items.map(item => {
            const done = order.deliveredItems.includes(item.id);
            return (
              <button key={item.id} onClick={() => !isDelivered && onMarkItem(item.id)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:6, padding:'5px 7px',
                  borderRadius:6, textAlign:'left', minHeight:32, border:'none', WebkitAppearance:'none',
                  cursor: isDelivered ? 'default' : 'pointer',
                  backgroundColor: done ? 'rgba(22,101,52,0.12)' : 'rgba(80,50,20,0.06)',
                  borderLeft:`2px solid ${done ? '#166534' : 'rgba(80,50,20,0.18)'}`,
                  transition:'all 0.15s',
                }}>
                {done
                  ? <CheckSquare style={{ width:12, height:12, color:'#166534', flexShrink:0 }}/>
                  : <Square style={{ width:12, height:12, color:'rgba(80,50,20,0.25)', flexShrink:0 }}/>}
                <span style={{ flex:1, fontSize:11, fontWeight:700, color: done ? 'rgba(80,50,20,0.35)' : '#2A1A08', textDecoration: done ? 'line-through' : 'none', fontFamily:'serif', lineHeight:1.2 }}>
                  {item.quantity}× {item.name}
                </span>
                <span style={{ fontSize:10, fontWeight:900, color:'#92400E', fontFamily:'serif' }}>L.{(item.price*item.quantity).toFixed(2)}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'6px 10px 8px', borderTop:'1px solid rgba(80,50,20,0.12)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(80,50,20,0.5)', fontFamily:'serif' }}>Total misión:</span>
            <span style={{ fontWeight:900, color:'#92400E', fontSize:15, fontFamily:'serif' }}>L.{order.total.toFixed(2)}</span>
          </div>
          {!isDelivered && (
            <div className="flex gap-1.5">
              <button onClick={onDeliver}
                className="flex-1 flex items-center justify-center gap-1 active:scale-95 transition-all"
                style={{ padding:'7px 4px', backgroundColor:'rgba(80,50,20,0.1)', border:'1px solid rgba(80,50,20,0.25)', borderRadius:7, color:'#2A1A08', fontWeight:800, fontSize:10, cursor:'pointer', minHeight:38, WebkitAppearance:'none', fontFamily:'serif' }}>
                <PackageCheck style={{ width:11, height:11 }}/>Entregar
              </button>
              <button onClick={onPay}
                className="flex-[2] flex items-center justify-center gap-1 active:scale-95 transition-all"
                style={{ padding:'7px 4px', background:'linear-gradient(135deg,#CC3D00,#FF6B00)', border:'none', borderRadius:7, color:'#F5EDD8', fontWeight:900, fontSize:10, cursor:'pointer', minHeight:38, WebkitAppearance:'none', fontFamily:'serif', boxShadow:'0 0 10px rgba(255,107,0,0.3)' }}>
                <Banknote style={{ width:11, height:11 }}/>💰 Cobrar
            </button>
          </div>
        )}
        {isDelivered && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'6px 0', color:'rgba(80,50,20,0.4)', fontSize:11, fontFamily:'serif' }}>
            <CheckCircle style={{ width:11, height:11, color:'#166534' }}/>
            <span style={{ fontWeight:800 }}>Misión completada</span>
          </div>
        )}
      </div>{/* /footer */}
      </div>{/* /parchment */}

      {/* Bottom roller */}
      <div style={{ height:14, overflow:'hidden' }}>
        <div style={{ height:14, borderBottomLeftRadius:14, borderBottomRightRadius:14, background:`linear-gradient(180deg,#8A6830 0%,${rollerColor} 100%)`, boxShadow:'inset 0 2px 4px rgba(0,0,0,0.2)', position:'relative' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', backgroundColor:seal.color, border:`2px solid ${rollerColor}` }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const VALID_USERS = [
  { username: 'Quedadito1', password: 'eliaselmejor' },
  { username: 'Quedadito2', password: 'eliaselmejor' },
  { username: 'WASHO', password: 'goku000' },
  { username: 'WATA', password: 'goku000' },
  { username: 'elias', password: 'elias123' },
  { username: 'tias', password: 'tranquila' },
];

export default function POSTerminal() {
  const navigate = useNavigate();
  const { addOrder, addItemsToOrder, addTransaction, orders, updateOrderStatus, markItemReady } = useOrders();
  const [selectedCat, setSelectedCat] = useState('Desayunos');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');
  const [view, setView] = useState<'menu' | 'orders'>('menu');
  const [showCalc, setShowCalc] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [showOtro, setShowOtro] = useState(false);
  const [extrasItems, setExtrasItems] = useState<OrderItem[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [quickChargeItems, setQuickChargeItems] = useState<OrderItem[]>([]);
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentExtras, setPaymentExtras] = useState<OrderItem[]>([]);
  const [autoChargeNotif, setAutoChargeNotif] = useState<{ name: string; price: number } | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    if (!showCalc) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-calc]')) setShowCalc(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showCalc]);

  const handleLogin = () => {
    const u = VALID_USERS.find(u => u.username === username && u.password === password);
    if (u) { setIsLoggedIn(true); setLoggedInUser(u.username); }
    else { alert('Usuario o contraseña incorrectos'); setPassword(''); }
  };

  const addToCart = (item: { name: string; price: number; category: string }) => {
    // Categorías que se cobran automáticamente
    const AUTO_CHARGE_CATS = new Set(['Bebidas', 'Chucherías', 'Helados']);

    if (AUTO_CHARGE_CATS.has(item.category)) {
      // Cobrar inmediatamente sin agregar al carrito
      addTransaction({
        amount: item.price,
        type: 'sale',
        description: `Venta directa: 1x ${item.name}`
      });
      // Mostrar notificación breve
      setAutoChargeNotif({ name: item.name, price: item.price });
      setTimeout(() => setAutoChargeNotif(null), 1500);
      return;
    }

    // Para otros items, agregar al carrito normalmente
    setCart(prev => {
      const ex = prev.find(c => c.name === item.name);
      if (ex) return prev.map(c => c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: crypto.randomUUID(), name: item.name, price: item.price, quantity: 1, category: item.category }];
    });
  };
  const removeFromCart = (id: string) => setCart(p => p.filter(i => i.id !== id));
  const updateQty = (id: string, q: number) => { if (q <= 0) removeFromCart(id); else setCart(p => p.map(i => i.id === id ? { ...i, quantity: q } : i)); };
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const kitchenInCart = cart.filter(i => KITCHEN_CATS.has(i.category));
  const extrasInCart = cart.filter(i => !KITCHEN_CATS.has(i.category));

  const sendToKitchen = () => {
    if (cart.length === 0) return;
    const orderId = invoiceNumber.trim()
      ? `#${invoiceNumber.trim()}`
      : `#${Date.now().toString().slice(-6)}`;
    if (kitchenInCart.length > 0) {
      addOrder({
        id: orderId,
        items: kitchenInCart,
        total: kitchenInCart.reduce((s, i) => s + i.price * i.quantity, 0),
        timestamp: new Date().toISOString(),
        status: 'pending',
        sentBy: loggedInUser,
      });
    }
    setInvoiceNumber('');
    if (extrasInCart.length > 0) {
      setExtrasItems(extrasInCart);
      setCart(extrasInCart);
      setShowExtras(true);
    } else {
      setCart([]);
      setCartOpen(false);
    }
  };

  const addDrinkToPayment = (drink: { name: string; price: number; category: string }) => {
    setPaymentExtras(prev => {
      const ex = prev.find(i => i.name === drink.name);
      if (ex) return prev.map(i => i.name === drink.name ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: crypto.randomUUID(), name: drink.name, price: drink.price, quantity: 1, category: drink.category }];
    });
  };

  const confirmOrderPayment = () => {
    if (!payingOrderId) return;
    if (paymentExtras.length > 0) addItemsToOrder(payingOrderId, paymentExtras);
    updateOrderStatus(payingOrderId, 'delivered');
    setPayingOrderId(null);
    setPaymentExtras([]);
  };

  // Categorías que se cobran automáticamente sin modal
  const AUTO_CHARGE_CATS = new Set(['Bebidas', 'Chucherías', 'Helados']);

  const handleOrderPayment = (order: Order) => {
    // Verificar si todos los items son de categorías de auto-cobro
    const allAutoCharge = order.items.every(item => AUTO_CHARGE_CATS.has(item.category));

    if (allAutoCharge) {
      // Cobrar automáticamente sin abrir modal
      updateOrderStatus(order.id, 'delivered');
    } else {
      // Abrir modal normal
      setPayingOrderId(order.id);
      setPaymentExtras([]);
    }
  };

  const confirmQuickCharge = () => {
    const t = quickChargeItems.reduce((s, i) => s + i.price * i.quantity, 0);
    addTransaction({ amount: t, type: 'sale', description: `Venta directa: ${quickChargeItems.map(i => `${i.quantity}×${i.name}`).join(', ')}` });
    setQuickChargeItems([]); setShowQuickPay(false); setCart([]); setExtrasItems([]); setCartOpen(false);
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const deliveredOrders: typeof orders = [];
  const payingOrder = payingOrderId ? orders.find(o => o.id === payingOrderId) : null;
  const filteredItems = MENU_ITEMS.filter(i => i.category === selectedCat);

  // ── Login ────────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="h-screen flex" style={{ backgroundColor:'#070A0F' }}>
        {/* Left — Konoha branding */}
        <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center p-10 relative overflow-hidden" style={{ background:'linear-gradient(160deg,#0A0F1A 0%,#101828 100%)', borderRight:'1px solid rgba(255,107,0,0.2)' }}>
          {/* Shurikens bg */}
          {[{t:'12%',l:'8%',s:44,r:0},{t:'55%',l:'72%',s:36,r:20},{t:'78%',l:'15%',s:28,r:10},{t:'28%',l:'80%',s:32,r:45}].map((p,i)=>(
            <div key={i} style={{ position:'absolute', top:p.t, left:p.l, opacity:0.08 }}>
              <svg width={p.s} height={p.s} viewBox="0 0 100 100" style={{ animation:`shuriken-spin ${8+i*2}s linear infinite` }}>
                <polygon points="50,5 58,40 95,50 58,60 50,95 42,60 5,50 42,40" fill="rgba(255,107,0,0.8)"/>
              </svg>
            </div>
          ))}
          <div style={{ position:'relative', marginBottom:24 }}>
            <div style={{ position:'absolute', inset:-16, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,0,0.15) 0%,transparent 70%)', filter:'blur(8px)' }}/>
            <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'3px solid #FF6B00', borderRadius:20, padding:24, boxShadow:'0 0 32px rgba(255,107,0,0.3)', position:'relative' }}>
              <img src={logo} alt="Don de Chuy" style={{ width:100, height:'auto', filter:'drop-shadow(0 0 10px rgba(255,107,0,0.5))' }}/>
            </div>
          </div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#F5EDD8', marginBottom:6, textShadow:'0 0 16px rgba(255,107,0,0.4)' }}>Don de Chuy</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(90deg,#1C1C28,#2C2C40,#1C1C28)', borderTop:'2px solid #6A6A8A', borderBottom:'2px solid #6A6A8A', padding:'4px 14px' }}>
            <span style={{ color:'#9090B8', fontSize:10, letterSpacing:3, textTransform:'uppercase', fontWeight:700 }}>Katon · Terminal POS</span>
          </div>
        </div>

        {/* Right — login */}
        <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ backgroundColor:'#0D0D0F' }}>
          <button onClick={() => navigate('/')} className="self-start mb-8 flex items-center gap-2 min-h-[44px]" style={{ color:'rgba(255,107,0,0.6)', fontSize:13 }}>
            <ArrowLeft className="w-4 h-4"/>Regresar
          </button>
          <div className="w-full max-w-sm">
            <div className="text-center mb-6 md:hidden">
              <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid rgba(255,107,0,0.4)', borderRadius:14, padding:14, display:'inline-block', marginBottom:12 }}>
                <img src={logo} alt="Don de Chuy" style={{ width:70, height:'auto' }}/>
              </div>
            </div>
            <h2 style={{ fontSize:22, fontWeight:900, color:'#F5EDD8', marginBottom:4 }}>Identificación Ninja</h2>
            <p style={{ color:'rgba(160,144,112,0.6)', fontSize:13, marginBottom:24 }}>Ingresa tus credenciales para continuar</p>
            <div className="space-y-4">
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,107,0,0.6)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:6 }}>Usuario</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nombre ninja"
                  style={{ width:'100%', padding:'14px 16px', borderRadius:10, border:'1px solid rgba(255,107,0,0.3)', backgroundColor:'#1A1510', color:'#F5EDD8', outline:'none', fontSize:15, boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'rgba(255,107,0,0.6)', textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:6 }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Código secreto"
                  style={{ width:'100%', padding:'14px 16px', borderRadius:10, border:'1px solid rgba(255,107,0,0.3)', backgroundColor:'#1A1510', color:'#F5EDD8', outline:'none', fontSize:15, boxSizing:'border-box' }}/>
              </div>
              <button onClick={handleLogin} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#FF6B00,#CC3D00)', color:'#0D0D0F', fontWeight:900, borderRadius:10, border:'none', fontSize:15, cursor:'pointer', boxShadow:'0 0 20px rgba(255,107,0,0.35)', WebkitAppearance:'none', marginTop:4 }}>
                🔥 Activar Jutsu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Cart panel ───────────────────────────────────────────────────────────────
  const CartPanel = (
    <div className="flex flex-col h-full" style={{ backgroundColor:'#0D0D0F' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background:'linear-gradient(90deg,#0A0A08,#1E1200,#0A0A08)', borderBottom:'1px solid rgba(255,107,0,0.3)' }}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary"/>
          <span className="font-bold text-base text-white">Pedido</span>
          {cart.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {loggedInUser[0]}
            </div>
            <span className="text-xs font-bold text-white">{loggedInUser}</span>
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2 rounded-xl hover:bg-white/10 lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-white/50 hover:text-white"/>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center py-12" style={{ color:'rgba(160,144,112,0.4)' }}>
            <ShoppingCart className="w-10 h-10 mx-auto mb-2" style={{ color:'rgba(255,107,0,0.25)' }}/>
            <p className="text-sm">Sin misiones aún</p>
          </div>
        ) : (
          <>
            {kitchenInCart.length > 0 && (
              <p className="text-xs font-bold text-gray-400 px-1 flex items-center gap-1.5 uppercase tracking-wide">
                <ChefHat className="w-3 h-3"/>Cocina
              </p>
            )}
            {kitchenInCart.map(i => <CartItem key={i.id} item={i} onRemove={removeFromCart} onQty={updateQty} isExtra={false}/>)}
            {extrasInCart.length > 0 && (
              <p className="text-xs font-bold text-gray-400 px-1 flex items-center gap-1.5 mt-3 uppercase tracking-wide">
                <Zap className="w-3 h-3"/>Directo
              </p>
            )}
            {extrasInCart.map(i => <CartItem key={i.id} item={i} onRemove={removeFromCart} onQty={updateQty} isExtra={true}/>)}
          </>
        )}
      </div>

      <div className="p-3 space-y-2.5" style={{ borderTop:'1px solid rgba(255,107,0,0.2)', backgroundColor:'#0D0D0F' }}>
        {/* Número de factura */}
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 shrink-0" style={{ color:'rgba(255,107,0,0.5)' }}/>
          <input
            type="text"
            placeholder="# Factura (opcional)"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            style={{ flex:1, fontSize:13, border:'1px solid rgba(255,107,0,0.25)', borderRadius:7, padding:'6px 10px', outline:'none', backgroundColor:'#1A1510', color:'#F5EDD8' }}
          />
        </div>
        <div className="flex justify-between items-center px-3 py-2 rounded-xl" style={{ backgroundColor:'#1A1510', border:'1px solid rgba(255,107,0,0.2)' }}>
          <span className="text-sm font-bold" style={{ color:'rgba(160,144,112,0.7)' }}>Total chakra</span>
          <span className="text-2xl font-bold" style={{ color:'#FF6B00' }}>L.{cartTotal.toFixed(2)}</span>
        </div>
        {extrasInCart.length > 0 && kitchenInCart.length === 0 ? (
          <button onClick={() => { setQuickChargeItems(extrasInCart); setShowQuickPay(true); }}
            className="w-full flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ padding:'13px', background:'linear-gradient(135deg,#166534,#15803d)', color:'#F5EDD8', fontWeight:900, borderRadius:10, border:'none', fontSize:14, cursor:'pointer', minHeight:52, boxShadow:'0 0 16px rgba(34,197,94,0.25)', WebkitAppearance:'none' }}>
            <Zap className="w-5 h-5"/>⚡ Cobrar Jutsu
          </button>
        ) : (
          <button onClick={sendToKitchen} disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ padding:'13px', background: cart.length===0 ? 'rgba(255,107,0,0.2)' : 'linear-gradient(135deg,#FF6B00,#CC3D00)', color: cart.length===0 ? 'rgba(255,107,0,0.4)' : '#0D0D0F', fontWeight:900, borderRadius:10, border:'none', fontSize:14, cursor: cart.length===0 ? 'not-allowed':'pointer', minHeight:52, boxShadow: cart.length>0 ? '0 0 16px rgba(255,107,0,0.3)' : 'none', WebkitAppearance:'none' }}>
            <Send className="w-5 h-5"/>
            {kitchenInCart.length > 0 && extrasInCart.length > 0 ? '🔥 Enviar + Extras' : '🔥 Enviar a Cocina'}
          </button>
        )}
      </div>
    </div>
  );

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor:'#0D0D0F' }}>
      {/* Header - Naruto */}
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 shrink-0 relative overflow-hidden" style={{ background:'linear-gradient(90deg,#0A0A08,#1E1200,#0A0A08)', borderBottom:'2px solid rgba(255,107,0,0.5)', boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
        {/* Chakra glow line */}
        <div className="absolute top-0 left-0 w-full h-0.5" style={{ background:'linear-gradient(90deg,transparent,#FF6B00,transparent)' }}/>

        <div className="flex items-center gap-1.5 sm:gap-3 relative z-10">
          <button onClick={() => navigate('/')} className="flex items-center justify-center active:scale-95 transition-all" style={{ padding:'8px 10px', borderRadius:8, backgroundColor:'rgba(255,107,0,0.1)', border:'1px solid rgba(255,107,0,0.3)', color:'#FF6B00', minWidth:40, minHeight:40 }}>
            <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5"/>
          </button>
          <div className="hidden sm:flex items-center" style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid rgba(255,107,0,0.5)', borderRadius:10, padding:'4px 8px', boxShadow:'0 0 12px rgba(255,107,0,0.2)' }}>
            <img src={logo} alt="Don de Chuy" className="h-7 sm:h-9 w-auto"/>
          </div>
          <div>
            <span className="font-black text-sm sm:text-lg block leading-tight" style={{ color:'#FF6B00', textShadow:'0 0 12px rgba(255,107,0,0.5)' }}>VENTANA</span>
            <span className="text-[10px] sm:text-xs font-bold tracking-widest hidden sm:inline" style={{ color:'rgba(160,144,112,0.7)' }}>★ TERMINAL POS ★</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 relative z-10">
          <div className="relative hidden sm:block" data-calc>
            <button onClick={() => setShowCalc(!showCalc)} className="flex items-center justify-center active:scale-95 transition-all" style={{ padding:'8px 10px', borderRadius:8, minWidth:40, minHeight:40, backgroundColor: showCalc ? '#FF6B00' : 'rgba(255,107,0,0.1)', border:'1px solid rgba(255,107,0,0.3)', color: showCalc ? '#0D0D0F' : '#FF6B00' }}>
              <Calculator className="w-4 sm:w-5 h-4 sm:h-5"/>
            </button>
            {showCalc && (
              <div className="absolute right-0 top-13 z-50 mt-1" data-calc>
                <MiniCalc/>
              </div>
            )}
          </div>

          <div className="flex rounded-lg sm:rounded-xl p-0.5 gap-0.5" style={{ backgroundColor:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)' }}>
            <button onClick={() => setView('menu')} className="px-2 sm:px-3 h-8 sm:h-9 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black transition-all active:scale-95" style={{ backgroundColor: view==='menu' ? '#FF6B00' : 'transparent', color: view==='menu' ? '#0D0D0F' : '#A09070' }}>
              Menú
            </button>
            <button onClick={() => setView('orders')} className="px-2 sm:px-3 h-8 sm:h-9 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black transition-all relative active:scale-95" style={{ backgroundColor: view==='orders' ? '#FF6B00' : 'transparent', color: view==='orders' ? '#0D0D0F' : '#A09070' }}>
              Pedidos
              {activeOrders.length > 0 && (
                <span className="absolute -top-1 sm:-top-1.5 -right-1 sm:-right-1.5 font-bold rounded-full w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center leading-none animate-bounce" style={{ backgroundColor:'#CC1A00', color:'#F5EDD8', fontSize:10, border:'1px solid #0D0D0F' }}>
                  {activeOrders.length}
                </span>
              )}
            </button>
          </div>

          <button onClick={() => setCartOpen(true)}
            className="lg:hidden relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-yellow-400 text-gray-900 border-2 border-yellow-600 min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center shadow-xl active:scale-95 transition-all">
            <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5 drop-shadow-md"/>
            {cart.length > 0 && (
              <span className="absolute -top-1 sm:-top-1.5 -right-1 sm:-right-1.5 bg-green-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                {cart.length}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 border-white/30 shadow-lg">
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-xs font-black border-2 border-yellow-600 shadow-md">
              {loggedInUser[0]}
            </div>
            <span className="font-black text-xs sm:text-sm text-white drop-shadow-md">{loggedInUser}</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor:'#0D0D0F' }}>
          {view === 'menu' ? (
            <>
              {/* Category tabs */}
              <div className="px-3 pt-3 pb-0 shrink-0" style={{ backgroundColor:'rgba(10,10,8,0.95)', borderBottom:'1px solid rgba(255,107,0,0.15)' }}>
                <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth:'none' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSelectedCat(cat)}
                      className="shrink-0 px-3.5 h-10 rounded-xl font-bold text-xs transition-all whitespace-nowrap active:scale-95"
                      style={{
                        backgroundColor: selectedCat===cat ? '#FF6B00' : 'rgba(255,107,0,0.08)',
                        color: selectedCat===cat ? '#0D0D0F' : 'rgba(160,144,112,0.8)',
                        border: `1px solid ${selectedCat===cat ? '#FF6B00' : 'rgba(255,107,0,0.2)'}`,
                        boxShadow: selectedCat===cat ? '0 0 12px rgba(255,107,0,0.3)' : 'none',
                      }}>
                      {cat}{!KITCHEN_CATS.has(cat) && <span className="ml-1 opacity-50 text-xs">⚡</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredItems.map((item, i) => (
                    <button key={i} onClick={() => addToCart(item)}
                      className="active:scale-95 transition-all text-left min-h-[64px]"
                      style={{ background:'linear-gradient(135deg,#1A1510,#221C10)', border:'1px solid rgba(255,107,0,0.2)', borderRadius:10, padding:'8px 10px', cursor:'pointer', WebkitAppearance:'none' }}>
                      <p className="font-bold text-[11px] mb-1 leading-tight line-clamp-2" style={{ color:'#F5EDD8' }}>{item.name}</p>
                      <p className="text-sm font-black" style={{ color:'#FF6B00' }}>L.{item.price}</p>
                    </button>
                  ))}
                  <button onClick={() => setShowOtro(true)}
                    className="active:scale-95 transition-all text-left min-h-[64px] flex flex-col justify-center items-center gap-1"
                    style={{ background:'rgba(255,107,0,0.04)', border:'1px dashed rgba(255,107,0,0.25)', borderRadius:10, padding:'8px', cursor:'pointer', WebkitAppearance:'none' }}>
                    <Plus className="w-4 h-4" style={{ color:'rgba(255,107,0,0.5)' }}/>
                    <p className="text-[10px] font-bold" style={{ color:'rgba(255,107,0,0.5)' }}>Otro</p>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto p-4 space-y-6" style={{ backgroundColor:'#0D0D0F' }}>
              {/* Active orders */}
              <div>
                <div className="px-4 py-2.5 rounded-xl mb-3 flex items-center gap-2" style={{ backgroundColor:'rgba(255,107,0,0.06)', border:'1px solid rgba(255,107,0,0.15)' }}>
                  <span className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" style={{ backgroundColor:'#FF6B00' }}/>
                  <h2 className="text-base font-bold" style={{ color:'#F5EDD8' }}>Activos</h2>
                  {activeOrders.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{activeOrders.length}</span>
                  )}
                </div>
                {activeOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-300 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm">
                    <CheckCircle className="w-12 h-12 mb-2"/>
                    <p className="text-sm font-bold">Sin pedidos activos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isDelivered={false}
                        onDeliver={() => updateOrderStatus(order.id, 'delivered')}
                        onPay={() => handleOrderPayment(order)}
                        onMarkItem={itemId => markItemReady(order.id, itemId)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Delivered orders — always visible */}
              {deliveredOrders.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/>
                    Entregados hoy
                    <span className="bg-gray-100 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">{deliveredOrders.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deliveredOrders.slice().reverse().map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isDelivered={true}
                        onDeliver={() => {}}
                        onPay={() => {}}
                        onMarkItem={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:flex w-72 bg-white border-l border-gray-100 shadow-sm flex-col">
          {CartPanel}
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setCartOpen(false)}/>
          <div className="fixed right-0 top-0 bottom-0 w-72 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col lg:hidden">
            {CartPanel}
          </div>
        </>
      )}

      {/* Modals */}
      {showOtro && <OtroModal onAdd={addToCart} onClose={() => setShowOtro(false)}/>}

      {showExtras && (
        <ExtrasModal
          items={extrasItems}
          activeOrders={orders.filter(o => o.status !== 'delivered')}
          onChargeNow={() => { setShowExtras(false); setQuickChargeItems(extrasItems); setShowQuickPay(true); }}
          onAddToOrder={id => { addItemsToOrder(id, extrasItems); setExtrasItems([]); setCart([]); setShowExtras(false); setCartOpen(false); }}
          onKeepInCart={() => { setShowExtras(false); setExtrasItems([]); }}
          onCancel={() => { setShowExtras(false); setExtrasItems([]); }}
        />
      )}

      {showQuickPay && (
        <PaymentModal
          order={{ total: quickChargeItems.reduce((s, i) => s + i.price * i.quantity, 0), items: quickChargeItems }}
          extraItems={[]}
          onConfirm={confirmQuickCharge}
          onCancel={() => { setShowQuickPay(false); setQuickChargeItems([]); }}
          onAddDrink={() => {}}
        />
      )}

      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          extraItems={paymentExtras}
          onConfirm={confirmOrderPayment}
          onCancel={() => { setPayingOrderId(null); setPaymentExtras([]); }}
          onAddDrink={addDrinkToPayment}
        />
      )}

      {/* Auto-charge notification */}
      {autoChargeNotif && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white"/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">¡Cobrado!</p>
              <p className="text-xs text-white/80">{autoChargeNotif.name} · L.{autoChargeNotif.price.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
