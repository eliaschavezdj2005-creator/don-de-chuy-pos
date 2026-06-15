import { useOrders } from './OrderContext';
import { Clock, CheckCircle, ArrowLeft, Square, CheckSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import logo from '../../imports/image-1.png';

// ── Colores por usuario ──────────────────────────────────────────────────────
const USER_COLORS: Record<string, { seal: string; ink: string; accent: string }> = {
  'Quedadito1': { seal:'#3B5BDB', ink:'#1A1A3A', accent:'#4A6AFF' },
  'Quedadito2': { seal:'#7C3AED', ink:'#2A1A3A', accent:'#9B6AFF' },
  'WASHO':      { seal:'#CC3D00', ink:'#2A0E00', accent:'#FF6B00' },
  'WATA':       { seal:'#166534', ink:'#0A2010', accent:'#22C55E' },
  'elias':      { seal:'#991B1B', ink:'#2A0808', accent:'#EF4444' },
  'tias':       { seal:'#9D174D', ink:'#2A0818', accent:'#EC4899' },
};
const DEFAULT_COLOR = { seal:'#CC3D00', ink:'#2A0E00', accent:'#FF6B00' };

// ── Shuriken decorativo ──────────────────────────────────────────────────────
function Shuriken({ size = 20, color = 'rgba(100,70,30,0.4)', spin = false }: { size?: number; color?: string; spin?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={spin ? { animation:'kds-spin 8s linear infinite' } : {}}>
      <polygon points="50,5 58,40 95,50 58,60 50,95 42,60 5,50 42,40" fill={color}/>
      <circle cx="50" cy="50" r="7" fill="none" stroke={color} strokeWidth="2.5"/>
    </svg>
  );
}

// ── Scroll end SVG — el rollo del pergamino ──────────────────────────────────
function ScrollEnd({ color, width = 280 }: { color: string; width?: number }) {
  return (
    <svg width="100%" height="22" viewBox={`0 0 ${width} 22`} preserveAspectRatio="none">
      {/* Roller cylinder */}
      <ellipse cx={width / 2} cy="11" rx={width / 2} ry="11" fill={color}/>
      <ellipse cx={width / 2} cy="11" rx={width / 2 - 2} ry="9" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/>
      {/* Highlight */}
      <ellipse cx={width / 2} cy="7" rx={width / 2 - 10} ry="3" fill="rgba(255,255,255,0.12)"/>
      {/* Shadow under */}
      <ellipse cx={width / 2} cy="19" rx={width / 2 - 4} ry="3" fill="rgba(0,0,0,0.18)"/>
    </svg>
  );
}

// ── Sello de clan (círculo con kanji) ────────────────────────────────────────
function ClanSeal({ color, size = 44 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="28" fill="none" stroke={color} strokeWidth="3"/>
      <circle cx="30" cy="30" r="22" fill={color} opacity="0.15"/>
      <circle cx="30" cy="30" r="26" fill="none" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="4 3"/>
      <text x="30" y="36" textAnchor="middle" fontSize="22" fontWeight="900"
        fontFamily="serif" fill={color} opacity="0.9">忍</text>
    </svg>
  );
}

// ── Timer badge ──────────────────────────────────────────────────────────────
function TimerBadge({ minutes }: { minutes: number }) {
  const [c, bg] = minutes < 5
    ? ['#166534','rgba(21,128,61,0.2)']
    : minutes < 10
    ? ['#92400E','rgba(146,64,14,0.2)']
    : ['#991B1B','rgba(153,27,27,0.2)'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, backgroundColor:bg, border:`1px solid ${c}50` }}>
      <Clock style={{ width:10, height:10, color:c }}/>
      <span style={{ color:c, fontWeight:900, fontSize:11, fontFamily:'serif' }}>{minutes}m</span>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { orders, markItemReady } = useOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = (ts: string) =>
    Math.floor((currentTime.getTime() - new Date(ts).getTime()) / 60000);

  const activeOrders = orders.filter(o => o.status !== 'delivered');

  // Parchment palette
  const P = {
    base:    '#E8D5A8',
    light:   '#F0E0B8',
    dark:    '#C8A870',
    roller:  '#A07840',
    text:    '#2A1A08',
    textFaint:'rgba(80,50,20,0.45)',
    crease:  'rgba(80,50,20,0.06)',
  };

  return (
    <>
      <style>{`
        @keyframes kds-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes kds-unspin { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes kds-chakra { 0%,100%{opacity:.35} 50%{opacity:.8} }
        @keyframes kds-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes scroll-in  {
          from { opacity:0; transform:scaleY(0.7) translateY(-10px); }
          to   { opacity:1; transform:scaleY(1) translateY(0); }
        }
      `}</style>

      <div style={{ minHeight:'100vh', backgroundColor:'#070A0F', color:P.text, display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif' }}>

        {/* ── HEADER ── */}
        <header style={{ background:'linear-gradient(90deg,#0A0A08,#15110A,#0A0A08)', borderBottom:'2px solid rgba(255,107,0,0.35)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, position:'sticky', top:0, zIndex:10, boxShadow:'0 4px 20px rgba(0,0,0,0.7)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => navigate('/')} style={{ padding:'7px 9px', borderRadius:8, backgroundColor:'rgba(255,107,0,0.1)', border:'1px solid rgba(255,107,0,0.3)', color:'#FF6B00', cursor:'pointer', display:'flex', alignItems:'center', WebkitAppearance:'none' }}>
              <ArrowLeft style={{ width:18, height:18 }}/>
            </button>
            <div style={{ background:'linear-gradient(135deg,#2A1F08,#3D2E0A)', border:'2px solid rgba(255,107,0,0.5)', borderRadius:10, padding:'5px 8px' }}>
              <img src={logo} alt="Don de Chuy" style={{ height:36, width:'auto' }}/>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <h1 style={{ fontSize:15, fontWeight:900, color:'#F5EDD8', lineHeight:1 }}>Cocina — KDS</h1>
                <Shuriken size={13} color="rgba(255,107,0,0.5)" spin/>
              </div>
              <p style={{ fontSize:10, color:'rgba(255,107,0,0.5)', letterSpacing:1, marginTop:1 }}>Misiones de la Aldea · Konoha</p>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:24, fontWeight:900, color:'#FF6B00', fontVariantNumeric:'tabular-nums', textShadow:'0 0 12px rgba(255,107,0,0.4)', lineHeight:1 }}>
              {currentTime.toLocaleTimeString('es-HN', { hour:'2-digit', minute:'2-digit' })}
            </p>
            <p style={{ fontSize:10, color:'rgba(160,144,112,0.5)', marginTop:2, textTransform:'capitalize' }}>
              {currentTime.toLocaleDateString('es-HN', { weekday:'short', month:'short', day:'numeric' })}
            </p>
          </div>
        </header>

        {/* ── STATS BAR ── */}
        <div style={{ background:'rgba(10,10,8,0.95)', borderBottom:'1px solid rgba(255,107,0,0.1)', padding:'7px 16px', display:'flex', alignItems:'center', gap:20 }}>
          {[
            { dot:'#F59E0B', label:'Misiones activas', val: activeOrders.length },
            { dot:'#22C55E', label:'Listas',           val: orders.filter(o => o.status === 'ready').length },
            { dot:'rgba(160,144,112,0.35)', label:'Completadas', val: orders.filter(o => o.status === 'delivered').length },
          ].map(({ dot, label, val }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor:dot, boxShadow:`0 0 5px ${dot}` }}/>
              <span style={{ color:'rgba(160,144,112,0.45)' }}>{label}:</span>
              <span style={{ fontWeight:900, color:'#F5EDD8' }}>{val}</span>
            </div>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:8, opacity:0.2 }}>
            <Shuriken size={15} color="rgba(255,107,0,0.9)" spin/>
            <Shuriken size={13} color="rgba(200,168,112,0.9)"/>
          </div>
        </div>

        {/* ── ORDERS ── */}
        <div style={{ flex:1, padding:16, overflowY:'auto', background:'linear-gradient(180deg,#0A0A0F 0%,#0D0A08 100%)' }}>
          {activeOrders.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:14 }}>
              {/* Empty state as a tiny scroll */}
              <div style={{ position:'relative', width:220 }}>
                <ScrollEnd color={P.roller} width={220}/>
                <div style={{ background:`linear-gradient(180deg,${P.dark} 0%,${P.light} 8%,${P.base} 50%,${P.light} 92%,${P.dark} 100%)`, padding:'20px 24px', textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                    <ClanSeal color="rgba(100,70,30,0.3)" size={48}/>
                  </div>
                  <p style={{ fontSize:15, fontWeight:900, color:'rgba(80,50,20,0.5)', fontFamily:'serif' }}>Sin misiones activas</p>
                  <p style={{ fontSize:11, color:'rgba(80,50,20,0.35)', marginTop:4 }}>Los pergaminos aparecerán aquí</p>
                </div>
                <ScrollEnd color={P.roller} width={220}/>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:20 }}>
              {activeOrders.map(order => {
                const mins = elapsed(order.timestamp);
                const checkedCount = order.deliveredItems.length;
                const totalItems = order.items.length;
                const allChecked = checkedCount === totalItems;
                const uc = USER_COLORS[order.sentBy] || DEFAULT_COLOR;
                const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

                // Urgency tint on parchment
                const urgencyTint = mins >= 15
                  ? 'rgba(153,27,27,0.08)'
                  : mins >= 8
                  ? 'rgba(146,64,14,0.05)'
                  : 'transparent';

                return (
                  <div key={order.id} style={{ animation:'scroll-in 0.35s ease-out', filter:`drop-shadow(0 6px 20px ${uc.seal}44)` }}>

                    {/* ── TOP ROLLER ── */}
                    <div style={{ position:'relative' }}>
                      <ScrollEnd color={P.roller} width={280}/>
                      {/* Cord knot center */}
                      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', backgroundColor:uc.seal, border:`2px solid ${P.roller}`, boxShadow:`0 0 8px ${uc.seal}` }}/>
                    </div>

                    {/* ── PARCHMENT BODY — fondo blanco, texto grande ── */}
                    <div style={{
                      backgroundColor:'#FFFFFF',
                      position:'relative', overflow:'hidden',
                      borderLeft:`3px solid ${uc.seal}`,
                      borderRight:`3px solid ${uc.seal}`,
                      boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)',
                    }}>
                      {/* Urgency tint overlay */}
                      {urgencyTint !== 'transparent' && (
                        <div style={{ position:'absolute', inset:0, backgroundColor:urgencyTint, pointerEvents:'none', zIndex:0 }}/>
                      )}
                      {/* Shuriken watermark */}
                      <div style={{ position:'absolute', right:8, top:8, opacity:0.04, pointerEvents:'none', zIndex:0 }}>
                        <Shuriken size={70} color={uc.seal}/>
                      </div>

                      <div style={{ position:'relative', zIndex:1, padding:'16px 16px 12px' }}>

                        {/* ── HEADER ── */}
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <ClanSeal color={uc.seal} size={38}/>
                            <div>
                              <h3 style={{ fontSize:26, fontWeight:900, color:'#1A1A1A', lineHeight:1 }}>{order.id}</h3>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                                <Clock style={{ width:12, height:12, color:'#888' }}/>
                                <span style={{ fontSize:12, color:'#666' }}>
                                  {new Date(order.timestamp).toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                            <TimerBadge minutes={mins}/>
                            <div style={{ padding:'3px 10px', borderRadius:20, backgroundColor:uc.seal, }}>
                              <span style={{ fontSize:11, fontWeight:800, color:'#fff' }}>
                                {order.status==='pending'?'⏳ Pendiente':order.status==='preparing'?'🔥 Preparando':'✅ Listo'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── USUARIO ── */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:`${uc.seal}12`, border:`1.5px solid ${uc.seal}`, borderRadius:8, padding:'8px 12px', marginBottom:14 }}>
                          <User style={{ width:16, height:16, color:uc.seal }}/>
                          <span style={{ fontSize:17, fontWeight:900, color:'#1A1A1A', letterSpacing:0.5 }}>{order.sentBy || 'Ventana'}</span>
                          <div style={{ marginLeft:'auto', width:22, height:22, borderRadius:'50%', backgroundColor:uc.seal }}/>
                        </div>

                        {/* ── DIVIDER ── */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                          <div style={{ flex:1, height:1.5, background:`linear-gradient(90deg,transparent,${uc.seal},transparent)` }}/>
                          <Shuriken size={12} color={uc.seal}/>
                          <div style={{ flex:1, height:1.5, background:`linear-gradient(90deg,transparent,${uc.seal},transparent)` }}/>
                        </div>

                        {/* ── ITEMS ── */}
                        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                          {order.items.map(item => {
                            const done = order.deliveredItems.includes(item.id);
                            return (
                              <button key={item.id} onClick={() => markItemReady(order.id, item.id)}
                                style={{
                                  width:'100%', display:'flex', alignItems:'center', gap:10,
                                  borderRadius:8, padding:'10px 12px', textAlign:'left',
                                  cursor:'pointer', border:`1.5px solid ${done ? uc.seal : '#E5E5E5'}`,
                                  WebkitAppearance:'none',
                                  backgroundColor: done ? `${uc.seal}10` : '#F8F8F8',
                                  transition:'all 0.2s',
                                }}>
                                {done
                                  ? <CheckSquare style={{ width:20, height:20, color:uc.seal, flexShrink:0 }}/>
                                  : <Square style={{ width:20, height:20, color:'#CCC', flexShrink:0 }}/>
                                }
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontWeight:800, fontSize:15, lineHeight:1.3, color: done ? '#AAA' : '#1A1A1A', textDecoration: done ? 'line-through' : 'none' }}>
                                    {item.name}
                                  </p>
                                  <p style={{ fontSize:11, color:'#999', marginTop:1 }}>{item.category}</p>
                                </div>
                                <div style={{ width:32, height:32, borderRadius:'50%', backgroundColor:uc.seal, color:'#fff', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, boxShadow:`0 2px 8px ${uc.seal}60` }}>
                                  {item.quantity}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* ── PROGRESS ── */}
                        <div style={{ marginBottom:10 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <span style={{ fontSize:12, color:'#888', fontWeight:600 }}>Progreso</span>
                            <span style={{ fontSize:12, fontWeight:900, color:uc.seal }}>{checkedCount}/{totalItems}</span>
                          </div>
                          <div style={{ height:7, backgroundColor:'#EFEFEF', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ height:'100%', backgroundColor:uc.seal, borderRadius:4, width:`${progress}%`, transition:'width 0.4s ease', boxShadow:`0 0 6px ${uc.seal}60` }}/>
                          </div>
                        </div>

                      </div>

                      {/* ── STATUS FOOTER ── */}
                      <div style={{
                        padding:'10px 16px',
                        borderTop:`1.5px solid ${uc.seal}30`,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        backgroundColor: allChecked ? `${uc.seal}12` : '#FAFAFA',
                      }}>
                        <CheckCircle style={{ width:14, height:14, color: allChecked ? uc.seal : '#BBB' }}/>
                        <span style={{ fontSize:13, fontWeight:800, color: allChecked ? uc.seal : '#888' }}>
                          {allChecked
                            ? '✦ Misión completa · Entregar en Ventana'
                            : checkedCount > 0
                            ? `🔥 En preparación · ${checkedCount}/${totalItems}`
                            : 'Esperando preparación'}
                        </span>
                      </div>

                    </div>
                    {/* ── BOTTOM ROLLER ── */}
                    <div style={{ position:'relative' }}>
                      <ScrollEnd color={P.roller} width={280}/>
                      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', backgroundColor:uc.seal, border:`2px solid ${P.roller}`, boxShadow:`0 0 8px ${uc.seal}` }}/>
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
