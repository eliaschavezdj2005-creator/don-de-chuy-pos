import { useNavigate } from 'react-router';
import { ShoppingCart, ChefHat, Zap } from 'lucide-react';
import { useOrders } from './OrderContext';
import { useState } from 'react';
import logo from '../../imports/image-1.png';
import konohaImg from '../../imports/image-22.png';

function LeafSymbol({ size = 32, color = '#FF6B00', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="4"/>
      <path d="M50 15 C50 15 20 35 20 55 C20 72 34 82 50 85 C66 82 80 72 80 55 C80 35 50 15 50 15Z"
        fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round"/>
      <path d="M50 85 L50 35" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <path d="M35 55 C42 48 58 48 65 55" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

/* Kunai SVG */
function Kunai({ size = 40, color = 'rgba(180,180,200,0.35)', rotate = 0 }: { size?: number; color?: string; rotate?: number }) {
  return (
    <svg width={size} height={size * 2.5} viewBox="0 0 40 100" style={{ transform: `rotate(${rotate}deg)` }}>
      {/* Blade */}
      <polygon points="20,2 26,38 20,44 14,38" fill={color}/>
      {/* Guard */}
      <rect x="14" y="44" width="12" height="5" rx="2" fill={color} opacity="0.8"/>
      {/* Handle */}
      <rect x="17" y="49" width="6" height="28" rx="3" fill={color} opacity="0.7"/>
      {/* Wrap lines */}
      <line x1="15" y1="55" x2="25" y2="55" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <line x1="15" y1="61" x2="25" y2="61" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <line x1="15" y1="67" x2="25" y2="67" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      {/* Ring */}
      <circle cx="20" cy="83" r="5" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7"/>
    </svg>
  );
}

/* Shuriken SVG */
function Shuriken({ size = 36, color = 'rgba(180,180,200,0.3)', rotate = 0 }: { size?: number; color?: string; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotate}deg)`, animation: `shuriken-spin ${6 + rotate / 30}s linear infinite` }}>
      <polygon points="50,5 58,40 95,50 58,60 50,95 42,60 5,50 42,40" fill={color}/>
      <circle cx="50" cy="50" r="8" fill="none" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { connected, orders } = useOrders();
  const [logoTaps, setLogoTaps] = useState(0);
  const [jutsuActive, setJutsuActive] = useState<string | null>(null);

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) { navigate('/admin'); setLogoTaps(0); return; }
    setTimeout(() => setLogoTaps(0), 3000);
  };

  const handleJutsu = (route: string, name: string) => {
    setJutsuActive(name);
    setTimeout(() => { setJutsuActive(null); navigate(route); }, 500);
  };

  const activeCount = orders.filter(o => o.status !== 'delivered').length;
  const readyCount  = orders.filter(o => o.status === 'ready').length;

  return (
    <>
      <style>{`
        @keyframes chakra-pulse {
          0%   { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes float-up {
          0%   { transform: translateY(0) scale(1);   opacity: 0.7; }
          100% { transform: translateY(-140px) scale(0.5); opacity: 0; }
        }
        @keyframes rasengan-spin     { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes rasengan-spin-rev { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes jutsu-flash {
          0%  { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes flame-flicker {
          0%,100% { transform: scaleY(1) skewX(0deg); }
          30%     { transform: scaleY(1.06) skewX(-2deg); }
          70%     { transform: scaleY(0.96) skewX(1.5deg); }
        }
        @keyframes seal-glow-blue {
          0%,100% { box-shadow: 0 0 16px rgba(74,144,217,0.5), 0 0 32px rgba(74,144,217,0.2); }
          50%     { box-shadow: 0 0 32px rgba(74,144,217,0.9), 0 0 64px rgba(74,144,217,0.4); }
        }
        @keyframes shuriken-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes kunai-drift {
          0%,100% { transform: translateY(0px) rotate(var(--r,0deg)); }
          50%     { transform: translateY(-8px) rotate(var(--r,0deg)); }
        }
        .jutsu-btn:active { transform: scale(0.93); opacity: 0.85; }
      `}</style>

      {/* Jutsu flash */}
      {jutsuActive && (
        <div style={{
          position:'fixed', inset:0, zIndex:100, pointerEvents:'none',
          background: jutsuActive === 'katon'
            ? 'radial-gradient(circle,rgba(255,80,0,0.45) 0%,transparent 70%)'
            : 'radial-gradient(circle,rgba(74,144,217,0.45) 0%,transparent 70%)',
          animation:'jutsu-flash 0.5s ease-out forwards',
        }}/>
      )}

      <div style={{
        minHeight:'100vh',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'20px 16px', position:'relative', overflow:'hidden',
        fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif',
      }}>

        {/* ── BACKGROUND: Konoha village image ── */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          {/* La imagen real de la aldea */}
          <img src={konohaImg} alt="Aldea Konoha" style={{
            width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%',
            display:'block',
          }}/>
          {/* Overlay oscuro para legibilidad */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(5,8,15,0.55) 0%, rgba(5,8,15,0.3) 40%, rgba(5,8,15,0.65) 70%, rgba(5,8,15,0.92) 100%)' }}/>
          {/* Vignette lateral */}
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, transparent 40%, rgba(5,8,15,0.5) 100%)' }}/>
        </div>

        {/* Kunais decorativos encima del fondo */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'22%', left:10, opacity:0.5 }}>
            <Kunai size={24} rotate={-30} color="rgba(200,180,140,0.7)"/>
          </div>
          <div style={{ position:'absolute', top:'25%', right:12, opacity:0.45 }}>
            <Kunai size={22} rotate={150} color="rgba(200,180,140,0.65)"/>
          </div>
          <div style={{ position:'absolute', top:16, left:'22%', opacity:0.25 }}>
            <Shuriken size={22} color="rgba(255,200,100,0.6)" rotate={0}/>
          </div>
          <div style={{ position:'absolute', top:20, right:'24%', opacity:0.22 }}>
            <Shuriken size={18} color="rgba(255,200,100,0.6)" rotate={25}/>
          </div>
          {/* Partículas de chakra */}
          {[15,35,55,72].map((left,i) => (
            <div key={i} style={{
              position:'absolute', left:`${left}%`, bottom:60,
              width:4, height:4, borderRadius:'50%',
              backgroundColor:i%2===0?'#FF6B00':'#4A90D9',
              animation:`float-up ${3+i}s ease-in ${i*0.9}s infinite`,
              boxShadow:`0 0 6px ${i%2===0?'#FF6B00':'#4A90D9'}`,
            }}/>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ position:'relative', width:'100%', maxWidth:420, zIndex:10 }}>

          {/* ── LOGO / Rasengan blue ── */}
          <div style={{ textAlign:'center', marginBottom:22 }}>
            <div onClick={handleLogoTap} style={{
              display:'inline-block', cursor:'pointer', userSelect:'none',
              marginBottom:14, position:'relative',
            }}>
              <div style={{ position:'relative', width:116, height:116, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {/* Pulse rings — BLUE (Rasengan) */}
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    position:'absolute', width:116, height:116, borderRadius:'50%',
                    border:'2px solid #4A90D9', opacity:0,
                    animation:`chakra-pulse 3s ease-out ${i*1}s infinite`,
                    pointerEvents:'none',
                  }}/>
                ))}

                {/* Spinning dashed rings — BLUE */}
                <div style={{
                  position:'absolute', width:106, height:106, borderRadius:'50%',
                  border:'2px dashed rgba(74,144,217,0.5)',
                  animation:'rasengan-spin 7s linear infinite',
                }}/>
                <div style={{
                  position:'absolute', width:86, height:86, borderRadius:'50%',
                  border:'1.5px dashed rgba(74,144,217,0.3)',
                  animation:'rasengan-spin-rev 5s linear infinite',
                }}/>

                {/* Core — BLUE */}
                <div style={{
                  position:'relative', width:76, height:76, borderRadius:'50%',
                  background:'radial-gradient(circle,#0A1A35 0%,#081525 60%,#040810 100%)',
                  border:'3px solid #4A90D9',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'seal-glow-blue 2.5s ease-in-out infinite',
                }}>
                  <img src={logo} alt="Don de Chuy" style={{ width:50, height:'auto', filter:'drop-shadow(0 0 8px rgba(74,144,217,0.7))' }}/>
                </div>
              </div>
              {/* NO number shown on tap */}
            </div>

            <h1 style={{ fontSize:28, fontWeight:900, color:'#F5EDD8', marginBottom:6, letterSpacing:-0.5, textShadow:'0 0 18px rgba(74,144,217,0.3)' }}>
              Don de Chuy
            </h1>

            {/* Headband */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:10,
              background:'linear-gradient(90deg,#181826 0%,#262638 40%,#343450 50%,#262638 60%,#181826 100%)',
              borderTop:'2px solid #6A6A8A', borderBottom:'2px solid #6A6A8A',
              padding:'5px 18px', marginBottom:4,
              boxShadow:'0 2px 10px rgba(0,0,0,0.6)',
            }}>
              <LeafSymbol size={15} color="#9090B8"/>
              <span style={{ color:'#B0B0D0', fontWeight:700, fontSize:10, letterSpacing:3, textTransform:'uppercase' }}>Aldea Oculta de la Hoja</span>
              <LeafSymbol size={15} color="#9090B8"/>
            </div>

            <p style={{ color:'rgba(74,144,217,0.6)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>
              Sistema POS · Jutsu Comercial
            </p>
          </div>

          {/* ── Chakra status ── */}
          <div style={{ marginBottom:18, display:'flex', justifyContent:'center' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'7px 14px', borderRadius:6,
              backgroundColor: connected ? 'rgba(34,197,94,0.08)' : 'rgba(74,144,217,0.08)',
              border:`1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(74,144,217,0.3)'}`,
            }}>
              <div style={{
                width:8, height:8, borderRadius:'50%',
                backgroundColor: connected ? '#22c55e' : '#4A90D9',
                boxShadow: connected ? '0 0 8px #22c55e' : '0 0 10px #4A90D9',
              }}/>
              <span style={{ color: connected ? '#86efac' : '#90C8FF', fontWeight:700, fontSize:12, letterSpacing:1 }}>
                {connected ? '忍 Chakra sincronizado' : '術 Invocando chakra...'}
              </span>
            </div>
          </div>

          {/* ── JUTSU BUTTONS ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:13 }}>

            {/* KATON — Ventana */}
            <button className="jutsu-btn" onClick={() => handleJutsu('/pos','katon')} style={{
              position:'relative', overflow:'hidden',
              background:'linear-gradient(160deg,#180800 0%,#2B1000 50%,#180A00 100%)',
              border:'1px solid rgba(255,107,0,0.45)', borderRadius:10,
              padding:'18px 12px 14px', cursor:'pointer', minHeight:168,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:10,
              WebkitAppearance:'none', transition:'transform 0.15s',
            }}>
              {/* Fire kanji */}
              <div style={{ position:'absolute', top:4, right:6, fontSize:50, color:'rgba(255,107,0,0.07)', fontWeight:900, lineHeight:1, fontFamily:'serif', userSelect:'none' }}>火</div>
              {/* Top glow line */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#FF6B00,transparent)', opacity:0.8 }}/>
              {/* Decorative shuriken */}
              <div style={{ position:'absolute', top:8, left:8, opacity:0.25 }}>
                <Shuriken size={22} color="rgba(255,107,0,0.8)" rotate={0}/>
              </div>

              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,0,0.2) 0%,transparent 70%)' }}/>
                <div style={{
                  width:58, height:58, borderRadius:11,
                  background:'linear-gradient(135deg,rgba(255,107,0,0.18),rgba(200,50,0,0.09))',
                  border:'1.5px solid rgba(255,107,0,0.5)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 14px rgba(255,107,0,0.22)',
                  position:'relative', animation:'flame-flicker 2.5s ease-in-out infinite',
                }}>
                  <ShoppingCart style={{ width:26, height:26, color:'#FF6B00' }}/>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ color:'rgba(255,107,0,0.5)', fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:1 }}>Katon · 火遁</p>
                <p style={{ color:'#F5EDD8', fontWeight:900, fontSize:16, lineHeight:1 }}>VENTANA</p>
                <p style={{ color:'rgba(255,107,0,0.55)', fontSize:10, fontWeight:600, marginTop:2 }}>Punto de Venta</p>
              </div>
            </button>

            {/* SUITON — Cocina */}
            <button className="jutsu-btn" onClick={() => handleJutsu('/kitchen','suiton')} style={{
              position:'relative', overflow:'hidden',
              background:'linear-gradient(160deg,#000818 0%,#000C26 50%,#000818 100%)',
              border:'1px solid rgba(74,144,217,0.4)', borderRadius:10,
              padding:'18px 12px 14px', cursor:'pointer', minHeight:168,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:10,
              WebkitAppearance:'none', transition:'transform 0.15s',
            }}>
              {/* Water kanji */}
              <div style={{ position:'absolute', top:4, right:6, fontSize:50, color:'rgba(74,144,217,0.07)', fontWeight:900, lineHeight:1, fontFamily:'serif', userSelect:'none' }}>水</div>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#4A90D9,transparent)', opacity:0.7 }}/>
              {/* Decorative kunai */}
              <div style={{ position:'absolute', top:6, left:10, opacity:0.3 }}>
                <Kunai size={18} rotate={-30} color="rgba(74,144,217,0.8)"/>
              </div>

              {readyCount > 0 && (
                <div style={{
                  position:'absolute', top:-5, right:-5, zIndex:10,
                  width:25, height:25, borderRadius:'50%',
                  background:'linear-gradient(135deg,#CC1A00,#FF3300)',
                  border:'2px solid #070A0F',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#F5EDD8', fontWeight:900, fontSize:11,
                  boxShadow:'0 0 10px rgba(204,26,0,0.7)',
                }}>{readyCount}</div>
              )}

              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', inset:-8, borderRadius:'50%', background:'radial-gradient(circle,rgba(74,144,217,0.18) 0%,transparent 70%)' }}/>
                <div style={{
                  width:58, height:58, borderRadius:11,
                  background:'linear-gradient(135deg,rgba(74,144,217,0.14),rgba(30,80,160,0.08))',
                  border:'1.5px solid rgba(74,144,217,0.4)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 14px rgba(74,144,217,0.18)', position:'relative',
                }}>
                  <ChefHat style={{ width:26, height:26, color:'#4A90D9' }}/>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ color:'rgba(74,144,217,0.55)', fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:1 }}>Suiton · 水遁</p>
                <p style={{ color:'#F5EDD8', fontWeight:900, fontSize:16, lineHeight:1 }}>COCINA</p>
                <p style={{ color:'rgba(74,144,217,0.65)', fontSize:10, fontWeight:600, marginTop:2 }}>Display KDS</p>
              </div>
            </button>
          </div>

          {/* ── Pedidos activos ── */}
          {activeCount > 0 && (
            <button className="jutsu-btn" onClick={() => navigate('/pos')} style={{
              width:'100%', marginBottom:12,
              background:'linear-gradient(90deg,rgba(255,107,0,0.05) 0%,rgba(255,107,0,0.1) 50%,rgba(255,107,0,0.05) 100%)',
              border:'1px solid rgba(255,107,0,0.3)', borderRadius:8,
              padding:'10px 14px', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              WebkitAppearance:'none', transition:'transform 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:7, background:'rgba(255,107,0,0.14)', border:'1px solid rgba(255,107,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Zap style={{ width:15, height:15, color:'#FF6B00' }}/>
                </div>
                <div style={{ textAlign:'left' }}>
                  <p style={{ color:'#FF6B00', fontWeight:800, fontSize:12, lineHeight:1.2 }}>
                    {activeCount} misión{activeCount!==1?'es':''} activa{activeCount!==1?'s':''}
                  </p>
                  <p style={{ color:'rgba(255,107,0,0.45)', fontSize:10, marginTop:1 }}>Rasengan · Ver pedidos</p>
                </div>
              </div>
              <span style={{ color:'#FF6B00', fontSize:15 }}>→</span>
            </button>
          )}

          {/* ── Footer ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:6 }}>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(74,144,217,0.18))' }}/>
            <LeafSymbol size={18} color="rgba(74,144,217,0.25)"/>
            <span style={{ color:'rgba(120,120,150,0.4)', fontSize:10, letterSpacing:2, textTransform:'uppercase' }}>Konoha POS</span>
            <LeafSymbol size={18} color="rgba(74,144,217,0.25)"/>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(74,144,217,0.18),transparent)' }}/>
          </div>
        </div>
      </div>
    </>
  );
}
