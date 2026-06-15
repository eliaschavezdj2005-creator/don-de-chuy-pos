import { useNavigate } from 'react-router';
import { ShoppingCart, ChefHat, Zap } from 'lucide-react';
import { useOrders } from './OrderContext';
import { useState } from 'react';
import logo from '../../imports/image-1.png';

// Leaf Village SVG symbol
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

// Chakra ring animation
function ChakraRing({ size, color, delay = 0 }: { size: number; color: string; delay?: number }) {
  return (
    <div style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      opacity: 0,
      animation: `chakra-pulse 3s ease-out ${delay}s infinite`,
      pointerEvents: 'none',
    }}/>
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
    setTimeout(() => { setJutsuActive(null); navigate(route); }, 600);
  };

  const activeCount = orders.filter(o => o.status !== 'delivered').length;
  const readyCount  = orders.filter(o => o.status === 'ready').length;

  return (
    <>
      <style>{`
        @keyframes chakra-pulse {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes float-up {
          0%   { transform: translateY(0px);   opacity: 0.6; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        @keyframes rasengan-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rasengan-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes jutsu-flash {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flame-flicker {
          0%,100% { transform: scaleY(1) skewX(0deg); }
          25%     { transform: scaleY(1.08) skewX(-2deg); }
          75%     { transform: scaleY(0.95) skewX(2deg); }
        }
        @keyframes seal-glow {
          0%,100% { box-shadow: 0 0 12px rgba(255,107,0,0.4); }
          50%     { box-shadow: 0 0 28px rgba(255,107,0,0.8), 0 0 48px rgba(255,107,0,0.3); }
        }
        .jutsu-btn { transition: transform 0.15s, opacity 0.15s; }
        .jutsu-btn:active { transform: scale(0.94); opacity: 0.85; }
      `}</style>

      {/* Jutsu flash overlay */}
      {jutsuActive && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none',
          background: jutsuActive === 'katon'
            ? 'radial-gradient(circle, rgba(255,80,0,0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(74,144,217,0.5) 0%, transparent 70%)',
          animation: 'jutsu-flash 0.6s ease-out forwards',
        }}/>
      )}

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#070A0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        position: 'relative', overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
      }}>

        {/* ── BACKGROUND: Konoha night scene ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>

          {/* Stars */}
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 60}%`,
              width: i % 5 === 0 ? 3 : 2,
              height: i % 5 === 0 ? 3 : 2,
              borderRadius: '50%',
              backgroundColor: '#E8E0CC',
              opacity: 0.3 + (i % 4) * 0.15,
            }}/>
          ))}

          {/* Moon */}
          <div style={{
            position: 'absolute', top: 20, right: 28,
            width: 52, height: 52, borderRadius: '50%',
            backgroundColor: '#F0E8C8',
            boxShadow: '0 0 30px rgba(240,232,200,0.4), 0 0 60px rgba(240,232,200,0.15)',
          }}/>

          {/* Hokage Rock silhouette — 4 carved faces */}
          <svg style={{ position: 'absolute', bottom: 60, left: 0, right: 0, width: '100%', height: 140, opacity: 0.18 }}
            viewBox="0 0 400 140" preserveAspectRatio="none">
            {/* Rock base */}
            <rect x="0" y="60" width="400" height="80" fill="#1A1510"/>
            {/* Carved face 1 */}
            <ellipse cx="60"  cy="55" rx="28" ry="34" fill="#1A1510"/>
            <ellipse cx="140" cy="50" rx="28" ry="36" fill="#1A1510"/>
            <ellipse cx="220" cy="48" rx="28" ry="38" fill="#1A1510"/>
            <ellipse cx="300" cy="52" rx="28" ry="35" fill="#1A1510"/>
            {/* Headbands on rocks */}
            <rect x="34" y="38" width="52" height="7" fill="#2C2C3A" rx="2"/>
            <rect x="114" y="33" width="52" height="7" fill="#2C2C3A" rx="2"/>
            <rect x="194" y="30" width="52" height="7" fill="#2C2C3A" rx="2"/>
            <rect x="274" y="35" width="52" height="7" fill="#2C2C3A" rx="2"/>
          </svg>

          {/* Village silhouette */}
          <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 80 }}
            viewBox="0 0 400 80" preserveAspectRatio="none">
            <polygon points="0,80 0,55 15,55 15,30 25,30 25,55 50,55 50,40 65,20 80,40 80,55 110,55 110,45 120,35 130,45 130,55 160,55 160,30 175,15 190,30 190,55 220,55 220,42 232,28 244,42 244,55 270,55 270,38 285,20 300,38 300,55 330,55 330,48 342,36 354,48 354,55 380,55 380,60 400,60 400,80"
              fill="#0D0D0F"/>
          </svg>

          {/* Chakra particles floating up */}
          {[12, 28, 45, 62, 78].map((left, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${left}%`, bottom: 80,
              width: 4, height: 4, borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? '#FF6B00' : '#4A90D9',
              animation: `float-up ${3 + i}s ease-in ${i * 0.8}s infinite`,
              boxShadow: `0 0 6px ${i % 2 === 0 ? '#FF6B00' : '#4A90D9'}`,
            }}/>
          ))}

          {/* Ground glow */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(0deg, rgba(255,107,0,0.08) 0%, transparent 100%)',
          }}/>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 420, zIndex: 10 }}>

          {/* ── LOGO / Rasengan seal ── */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div onClick={handleLogoTap} style={{
              display: 'inline-block', cursor: 'pointer', userSelect: 'none',
              marginBottom: 16, position: 'relative',
            }}>
              {/* Rasengan outer rings */}
              <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChakraRing size={120} color="#FF6B00" delay={0}/>
                <ChakraRing size={120} color="#4A90D9" delay={1}/>
                <ChakraRing size={120} color="#FF6B00" delay={2}/>

                {/* Spinning chakra rings */}
                <div style={{
                  position: 'absolute', width: 110, height: 110, borderRadius: '50%',
                  border: '2px dashed rgba(255,107,0,0.4)',
                  animation: 'rasengan-spin 8s linear infinite',
                }}/>
                <div style={{
                  position: 'absolute', width: 90, height: 90, borderRadius: '50%',
                  border: '2px dashed rgba(74,144,217,0.3)',
                  animation: 'rasengan-spin-rev 6s linear infinite',
                }}/>

                {/* Logo core */}
                <div style={{
                  position: 'relative', width: 80, height: 80, borderRadius: '50%',
                  background: 'radial-gradient(circle, #2A1F08 0%, #1A1208 60%, #0A0A0F 100%)',
                  border: '3px solid #FF6B00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(255,107,0,0.5), 0 0 48px rgba(255,107,0,0.2), inset 0 0 20px rgba(255,107,0,0.1)',
                  animation: 'seal-glow 2.5s ease-in-out infinite',
                }}>
                  <img src={logo} alt="Don de Chuy" style={{ width: 52, height: 'auto', filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.6))' }}/>
                </div>
              </div>

              {/* Tap counter for admin */}
              {logoTaps > 0 && (
                <div style={{
                  position: 'absolute', top: 0, right: -8,
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: '#CC1A00', color: '#F5EDD8',
                  fontSize: 11, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(204,26,0,0.8)',
                }}>{logoTaps}</div>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 30, fontWeight: 900, color: '#F5EDD8',
              marginBottom: 4, letterSpacing: -1,
              textShadow: '0 0 20px rgba(255,107,0,0.4)',
            }}>Don de Chuy</h1>

            {/* Hitai-ate / headband */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(90deg,#1C1C28 0%,#2C2C40 40%,#3A3A52 50%,#2C2C40 60%,#1C1C28 100%)',
              borderTop: '2px solid #7A7A9A', borderBottom: '2px solid #7A7A9A',
              padding: '5px 18px', marginBottom: 4,
              boxShadow: '0 2px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <LeafSymbol size={16} color="#A0A0C0"/>
              <span style={{ color: '#C0C0D8', fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Aldea Oculta de la Hoja</span>
              <LeafSymbol size={16} color="#A0A0C0"/>
            </div>

            <p style={{ color: 'rgba(255,107,0,0.6)', fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              Sistema POS — Jutsu Comercial
            </p>
          </div>

          {/* ── Chakra status ── */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 6,
              backgroundColor: connected ? 'rgba(34,197,94,0.08)' : 'rgba(255,107,0,0.08)',
              border: `1px solid ${connected ? 'rgba(34,197,94,0.35)' : 'rgba(255,107,0,0.35)'}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: connected ? '#22c55e' : '#FF6B00',
                boxShadow: connected ? '0 0 8px #22c55e' : '0 0 8px #FF6B00',
              }}/>
              <span style={{
                color: connected ? '#86efac' : '#FFAA66',
                fontWeight: 700, fontSize: 12, letterSpacing: 1,
              }}>
                {connected ? '忍 Chakra sincronizado' : '術 Invocando chakra...'}
              </span>
            </div>
          </div>

          {/* ── JUTSU BUTTONS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

            {/* KATON — Ventana (Fire Style) */}
            <button
              className="jutsu-btn"
              onClick={() => handleJutsu('/pos', 'katon')}
              style={{
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(160deg,#1A0800 0%,#2D1100 50%,#1A0A00 100%)',
                border: '1px solid rgba(255,107,0,0.45)',
                borderRadius: 10,
                padding: '20px 12px 16px',
                cursor: 'pointer',
                minHeight: 170,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                gap: 10,
                WebkitAppearance: 'none',
              }}
            >
              {/* Fire kanji background */}
              <div style={{
                position: 'absolute', top: 6, right: 8,
                fontSize: 52, color: 'rgba(255,107,0,0.07)',
                fontWeight: 900, lineHeight: 1, fontFamily: 'serif',
                userSelect: 'none',
              }}>火</div>

              {/* Flame effect */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,transparent,#FF6B00,transparent)', opacity: 0.7 }}/>

              {/* Icon with flame ring */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  background: 'radial-gradient(circle,rgba(255,107,0,0.25) 0%,transparent 70%)',
                }}/>
                <div style={{
                  width: 60, height: 60, borderRadius: 12,
                  background: 'linear-gradient(135deg,rgba(255,107,0,0.2),rgba(204,50,0,0.1))',
                  border: '1.5px solid rgba(255,107,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(255,107,0,0.25), inset 0 1px 0 rgba(255,150,0,0.1)',
                  position: 'relative',
                  animation: 'flame-flicker 2.5s ease-in-out infinite',
                }}>
                  <ShoppingCart style={{ width: 28, height: 28, color: '#FF6B00' }}/>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,107,0,0.55)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Katon · 火遁</p>
                <p style={{ color: '#F5EDD8', fontWeight: 900, fontSize: 17, lineHeight: 1 }}>VENTANA</p>
                <p style={{ color: 'rgba(255,107,0,0.6)', fontSize: 10, fontWeight: 600, marginTop: 2 }}>Punto de Venta</p>
              </div>
            </button>

            {/* SUITON — Cocina (Water Style) */}
            <button
              className="jutsu-btn"
              onClick={() => handleJutsu('/kitchen', 'suiton')}
              style={{
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(160deg,#00081A 0%,#000D28 50%,#00081A 100%)',
                border: '1px solid rgba(74,144,217,0.4)',
                borderRadius: 10,
                padding: '20px 12px 16px',
                cursor: 'pointer',
                minHeight: 170,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                gap: 10,
                WebkitAppearance: 'none',
              }}
            >
              {/* Water kanji background */}
              <div style={{
                position: 'absolute', top: 6, right: 8,
                fontSize: 52, color: 'rgba(74,144,217,0.07)',
                fontWeight: 900, lineHeight: 1, fontFamily: 'serif',
                userSelect: 'none',
              }}>水</div>

              {/* Top glow */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,transparent,#4A90D9,transparent)', opacity: 0.6 }}/>

              {/* Ready badge */}
              {readyCount > 0 && (
                <div style={{
                  position: 'absolute', top: -5, right: -5, zIndex: 10,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#CC1A00,#FF3300)',
                  border: '2px solid #070A0F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F5EDD8', fontWeight: 900, fontSize: 12,
                  boxShadow: '0 0 10px rgba(204,26,0,0.7)',
                }}>{readyCount}</div>
              )}

              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  background: 'radial-gradient(circle,rgba(74,144,217,0.2) 0%,transparent 70%)',
                }}/>
                <div style={{
                  width: 60, height: 60, borderRadius: 12,
                  background: 'linear-gradient(135deg,rgba(74,144,217,0.15),rgba(30,80,160,0.1))',
                  border: '1.5px solid rgba(74,144,217,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(74,144,217,0.2)',
                  position: 'relative',
                }}>
                  <ChefHat style={{ width: 28, height: 28, color: '#4A90D9' }}/>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(74,144,217,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Suiton · 水遁</p>
                <p style={{ color: '#F5EDD8', fontWeight: 900, fontSize: 17, lineHeight: 1 }}>COCINA</p>
                <p style={{ color: 'rgba(74,144,217,0.7)', fontSize: 10, fontWeight: 600, marginTop: 2 }}>Display KDS</p>
              </div>
            </button>
          </div>

          {/* ── Pedidos activos — Rasengan alert ── */}
          {activeCount > 0 && (
            <button
              className="jutsu-btn"
              onClick={() => navigate('/pos')}
              style={{
                width: '100%', marginBottom: 14,
                background: 'linear-gradient(90deg,rgba(255,107,0,0.06) 0%,rgba(255,107,0,0.12) 50%,rgba(255,107,0,0.06) 100%)',
                border: '1px solid rgba(255,107,0,0.35)',
                borderRadius: 8, padding: '11px 16px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                WebkitAppearance: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'rgba(255,107,0,0.15)',
                  border: '1px solid rgba(255,107,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(255,107,0,0.2)',
                }}>
                  <Zap style={{ width: 16, height: 16, color: '#FF6B00' }}/>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: '#FF6B00', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                    {activeCount} misión{activeCount !== 1 ? 'es' : ''} activa{activeCount !== 1 ? 's' : ''}
                  </p>
                  <p style={{ color: 'rgba(255,107,0,0.5)', fontSize: 10, marginTop: 1 }}>Rasengan · Ver pedidos</p>
                </div>
              </div>
              <span style={{ color: '#FF6B00', fontSize: 16 }}>→</span>
            </button>
          )}

          {/* ── Footer / Konoha seal ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,107,0,0.2))' }}/>
            <LeafSymbol size={20} color="rgba(255,107,0,0.3)"/>
            <span style={{ color: 'rgba(160,144,112,0.4)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Konoha POS</span>
            <LeafSymbol size={20} color="rgba(255,107,0,0.3)"/>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,107,0,0.2),transparent)' }}/>
          </div>
        </div>
      </div>
    </>
  );
}
