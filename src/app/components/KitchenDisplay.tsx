import { useOrders } from './OrderContext';
import { Clock, CheckCircle, ArrowLeft, Square, CheckSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import logo from '../../imports/image-1.png';

const USER_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  'Quedadito1': { bg:'#1A2A6C', border:'#3B5BDB', glow:'rgba(59,91,219,0.4)' },
  'Quedadito2': { bg:'#4A1A6C', border:'#8B5CF6', glow:'rgba(139,92,246,0.4)' },
  'WASHO':      { bg:'#6C2A00', border:'#FF6B00', glow:'rgba(255,107,0,0.4)' },
  'WATA':       { bg:'#0A3A20', border:'#22C55E', glow:'rgba(34,197,94,0.4)' },
  'elias':      { bg:'#5A0A0A', border:'#EF4444', glow:'rgba(239,68,68,0.4)' },
  'tias':       { bg:'#5A0A3A', border:'#EC4899', glow:'rgba(236,72,153,0.4)' },
};
const DEFAULT_COLOR = { bg:'#1A1510', border:'#FF6B00', glow:'rgba(255,107,0,0.3)' };

function Shuriken({ size = 20, color = 'rgba(180,180,200,0.3)', spin = false }: { size?: number; color?: string; spin?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={spin ? { animation:'kds-shuriken-spin 6s linear infinite' } : {}}>
      <polygon points="50,5 58,40 95,50 58,60 50,95 42,60 5,50 42,40" fill={color}/>
      <circle cx="50" cy="50" r="7" fill="none" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

function TimerBadge({ minutes }: { minutes: number }) {
  const [color, bg] = minutes < 5
    ? ['#4ADE80','rgba(34,197,94,0.15)']
    : minutes < 10
    ? ['#FCD34D','rgba(234,179,8,0.15)']
    : ['#F87171','rgba(239,68,68,0.15)'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, backgroundColor:bg, border:`1px solid ${color}30` }}>
      <Clock style={{ width:11, height:11, color }}/>
      <span style={{ color, fontWeight:800, fontSize:11 }}>{minutes}m</span>
    </div>
  );
}

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { orders, markItemReady } = useOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeElapsed = (t: string) =>
    Math.floor((currentTime.getTime() - new Date(t).getTime()) / 60000);

  const activeOrders = orders.filter(o => o.status !== 'delivered');

  return (
    <>
      <style>{`
        @keyframes kds-shuriken-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes kds-chakra-pulse {
          0%,100% { opacity:0.4; } 50% { opacity:0.9; }
        }
        @keyframes kds-kunai-float {
          0%,100% { transform:translateY(0px) rotate(-40deg); }
          50%     { transform:translateY(-6px) rotate(-40deg); }
        }
      `}</style>

      <div style={{ minHeight:'100vh', backgroundColor:'#070A0F', color:'#F5EDD8', display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif' }}>

        {/* ── HEADER ── */}
        <header style={{ background:'linear-gradient(90deg,#0A0A08,#15110A,#0A0A08)', borderBottom:'2px solid rgba(255,107,0,0.35)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:'0 4px 20px rgba(0,0,0,0.6)', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => navigate('/')} style={{ padding:'7px 9px', borderRadius:8, backgroundColor:'rgba(255,107,0,0.1)', border:'1px solid rgba(255,107,0,0.3)', color:'#FF6B00', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitAppearance:'none' }}>
              <ArrowLeft style={{ width:18, height:18 }}/>
            </button>
            <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid rgba(255,107,0,0.5)', borderRadius:10, padding:'5px 8px', boxShadow:'0 0 12px rgba(255,107,0,0.2)' }}>
              <img src={logo} alt="Don de Chuy" style={{ height:36, width:'auto' }}/>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <h1 style={{ fontSize:15, fontWeight:900, color:'#F5EDD8', lineHeight:1 }}>Cocina — KDS</h1>
                <Shuriken size={14} color="rgba(255,107,0,0.5)" spin/>
              </div>
              <p style={{ fontSize:10, color:'rgba(255,107,0,0.5)', letterSpacing:1, marginTop:1 }}>Doton · 土遁 · Aldea Konoha</p>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:24, fontWeight:900, color:'#FF6B00', fontVariantNumeric:'tabular-nums', textShadow:'0 0 12px rgba(255,107,0,0.4)', lineHeight:1 }}>
              {currentTime.toLocaleTimeString('es-HN', { hour:'2-digit', minute:'2-digit' })}
            </p>
            <p style={{ fontSize:10, color:'rgba(160,144,112,0.6)', marginTop:2, textTransform:'capitalize' }}>
              {currentTime.toLocaleDateString('es-HN', { weekday:'short', month:'short', day:'numeric' })}
            </p>
          </div>
        </header>

        {/* ── STATS BAR ── */}
        <div style={{ background:'rgba(10,10,8,0.9)', borderBottom:'1px solid rgba(255,107,0,0.1)', padding:'8px 16px', display:'flex', alignItems:'center', gap:20 }}>
          {[
            { dot:'#F59E0B', label:'Activos', val: activeOrders.length },
            { dot:'#22C55E', label:'Listos',  val: orders.filter(o=>o.status==='ready').length },
            { dot:'rgba(160,144,112,0.4)', label:'Entregados', val: orders.filter(o=>o.status==='delivered').length },
          ].map(({ dot, label, val }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor:dot, boxShadow:`0 0 6px ${dot}` }}/>
              <span style={{ color:'rgba(160,144,112,0.5)' }}>{label}:</span>
              <span style={{ fontWeight:800, color:'#F5EDD8' }}>{val}</span>
            </div>
          ))}
          {/* Decorative shurikens */}
          <div style={{ marginLeft:'auto', display:'flex', gap:8, opacity:0.25 }}>
            <Shuriken size={16} color="rgba(255,107,0,0.8)" spin/>
            <Shuriken size={14} color="rgba(74,144,217,0.8)"/>
          </div>
        </div>

        {/* ── ORDERS GRID ── */}
        <div style={{ flex:1, padding:14, overflowY:'auto' }}>
          {activeOrders.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:280, gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', backgroundColor:'rgba(34,197,94,0.1)', border:'2px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(34,197,94,0.15)' }}>
                <CheckCircle style={{ width:36, height:36, color:'rgba(34,197,94,0.7)' }}/>
              </div>
              <p style={{ fontSize:18, fontWeight:900, color:'rgba(160,144,112,0.4)' }}>Todo listo — Nakama</p>
              <p style={{ fontSize:12, color:'rgba(160,144,112,0.25)' }}>Los nuevos pedidos aparecerán aquí</p>
              <div style={{ display:'flex', gap:12, opacity:0.15, marginTop:8 }}>
                <Shuriken size={32} color="rgba(255,107,0,0.8)" spin/>
                <Shuriken size={28} color="rgba(74,144,217,0.8)"/>
                <Shuriken size={24} color="rgba(255,107,0,0.8)" spin/>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
              {activeOrders.map(order => {
                const elapsed = getTimeElapsed(order.timestamp);
                const checkedCount = order.deliveredItems.length;
                const totalItems = order.items.length;
                const allChecked = checkedCount === totalItems;
                const uc = USER_COLORS[order.sentBy] || DEFAULT_COLOR;
                const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

                return (
                  <div key={order.id} style={{ borderRadius:12, overflow:'hidden', border:`2px solid ${uc.border}`, boxShadow:`0 4px 20px ${uc.glow}, 0 0 0 0 transparent`, display:'flex', flexDirection:'column', backgroundColor:'#0E0E12' }}>

                    {/* Card header */}
                    <div style={{ backgroundColor:uc.bg, padding:'12px 14px', position:'relative', overflow:'hidden' }}>
                      {/* Kanji watermark */}
                      <div style={{ position:'absolute', right:8, top:-4, fontSize:52, color:'rgba(255,255,255,0.05)', fontWeight:900, fontFamily:'serif', userSelect:'none', lineHeight:1 }}>忍</div>
                      {/* Headband stripe */}
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${uc.border},transparent)`, opacity:0.8 }}/>

                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                        <div>
                          <h3 style={{ fontSize:22, fontWeight:900, color:'#F5EDD8', lineHeight:1 }}>Pedido {order.id}</h3>
                          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                            <Clock style={{ width:10, height:10, color:'rgba(255,255,255,0.5)' }}/>
                            <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>
                              {new Date(order.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                          <TimerBadge minutes={elapsed}/>
                          <div style={{ padding:'2px 8px', borderRadius:20, backgroundColor:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.15)' }}>
                            <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                              {order.status==='pending'?'⏳ Pendiente':order.status==='preparing'?'🔥 En curso':'✅ Listo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:'rgba(0,0,0,0.25)', borderRadius:8, padding:'7px 10px' }}>
                        <User style={{ width:16, height:16, color:'rgba(255,255,255,0.7)' }}/>
                        <span style={{ fontSize:17, fontWeight:900, color:'#F5EDD8', letterSpacing:0.5 }}>{order.sentBy||'Ventana'}</span>
                        <div style={{ marginLeft:'auto', opacity:0.5 }}>
                          <Shuriken size={14} color="rgba(255,255,255,0.8)"/>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ flex:1, padding:'10px 10px 4px', display:'flex', flexDirection:'column', gap:6 }}>
                      {order.items.map(item => {
                        const done = order.deliveredItems.includes(item.id);
                        return (
                          <button key={item.id} onClick={() => markItemReady(order.id, item.id)}
                            style={{
                              width:'100%', display:'flex', alignItems:'center', gap:10,
                              borderRadius:8, padding:'9px 10px', textAlign:'left',
                              cursor:'pointer', border:'none', WebkitAppearance:'none',
                              backgroundColor: done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                              borderLeft: `3px solid ${done ? '#22C55E' : 'rgba(255,255,255,0.08)'}`,
                              transition:'all 0.2s',
                            }}>
                            {done
                              ? <CheckSquare style={{ width:18, height:18, color:'#4ADE80', flexShrink:0 }}/>
                              : <Square style={{ width:18, height:18, color:'rgba(255,255,255,0.2)', flexShrink:0 }}/>
                            }
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontWeight:700, fontSize:13, lineHeight:1.2, color: done ? 'rgba(255,255,255,0.25)' : '#F5EDD8', textDecoration: done ? 'line-through' : 'none' }}>
                                {item.name}
                              </p>
                              <p style={{ fontSize:10, color:'rgba(160,144,112,0.4)', marginTop:1 }}>{item.category}</p>
                            </div>
                            <div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:'#FF6B00', color:'#0D0D0F', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, boxShadow:'0 0 8px rgba(255,107,0,0.3)' }}>
                              {item.quantity}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Progress */}
                    <div style={{ padding:'8px 10px 4px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:10, color:'rgba(160,144,112,0.4)' }}>Preparados</span>
                        <span style={{ fontSize:10, fontWeight:700, color:'rgba(160,144,112,0.6)' }}>{checkedCount}/{totalItems}</span>
                      </div>
                      <div style={{ height:4, backgroundColor:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', backgroundColor: allChecked ? '#22C55E' : '#FF6B00', borderRadius:4, width:`${progress}%`, transition:'width 0.4s ease', boxShadow: allChecked ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(255,107,0,0.5)' }}/>
                      </div>
                    </div>

                    {/* Footer status */}
                    <div style={{
                      padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      backgroundColor: allChecked ? 'rgba(34,197,94,0.15)' : checkedCount>0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                      borderTop: `1px solid ${allChecked ? 'rgba(34,197,94,0.3)' : checkedCount>0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      fontSize:11, fontWeight:700,
                      color: allChecked ? '#4ADE80' : checkedCount>0 ? '#FCD34D' : 'rgba(160,144,112,0.3)',
                    }}>
                      <CheckCircle style={{ width:12, height:12 }}/>
                      {allChecked ? '✦ Listo · Esperando entrega' :
                       checkedCount>0 ? `🔥 En preparación (${checkedCount}/${totalItems})` :
                       'Pendiente de preparar'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
