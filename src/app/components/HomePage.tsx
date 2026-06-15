import { useNavigate } from 'react-router';
import { ShoppingCart, ChefHat, Wifi, WifiOff, Zap } from 'lucide-react';
import { useOrders } from './OrderContext';
import { useState } from 'react';
import logo from '../../imports/image-1.png';

export default function HomePage() {
  const navigate = useNavigate();
  const { connected, orders } = useOrders();
  const [logoTaps, setLogoTaps] = useState(0);

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) { navigate('/admin'); setLogoTaps(0); return; }
    setTimeout(() => setLogoTaps(0), 3000);
  };

  const activeCount = orders.filter(o => o.status !== 'delivered').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-blue-500 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Mario clouds background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Clouds estilo Mario */}
        <div className="absolute top-10 left-10 w-24 h-12 bg-white rounded-full opacity-90 shadow-lg"/>
        <div className="absolute top-10 left-16 w-16 h-10 bg-white rounded-full opacity-90"/>
        <div className="absolute top-20 right-20 w-28 h-14 bg-white rounded-full opacity-90 shadow-lg"/>
        <div className="absolute top-20 right-28 w-20 h-12 bg-white rounded-full opacity-90"/>
        <div className="absolute top-40 left-1/3 w-32 h-16 bg-white rounded-full opacity-90 shadow-lg"/>
        <div className="absolute top-40 left-1/2 w-24 h-14 bg-white rounded-full opacity-90"/>

        {/* Ground blocks at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-orange-600 to-orange-700 border-t-4 border-orange-800"/>
        <div className="absolute bottom-24 left-0 right-0 h-2 bg-black opacity-20"/>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-lg z-10">
        {/* Header with logo - Estilo Mario Block */}
        <div className="text-center mb-8 sm:mb-10">
          <div
            onClick={handleLogoTap}
            className="inline-block cursor-pointer select-none mb-5 transform transition-all hover:scale-110 active:scale-95 active:animate-bounce"
          >
            {/* Mario Question Block */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse"/>
              <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-4 sm:p-5 rounded-xl shadow-2xl border-4 border-yellow-600 hover:border-yellow-300 transition-all">
                {/* Shine effect */}
                <div className="absolute top-2 left-2 w-8 h-8 bg-white/40 rounded-full blur-md"/>
                <img
                  src={logo}
                  alt="Don de Chuy"
                  className="home-logo w-20 sm:w-24 h-auto relative z-10 drop-shadow-2xl"
                />
                {/* Question mark corners */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-sm border-2 border-yellow-600"/>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-300 rounded-sm border-2 border-yellow-600"/>
              </div>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
            Don de Chuy
          </h1>
          <div className="inline-flex items-center gap-2 bg-red-500 border-4 border-red-700 rounded-lg px-4 sm:px-5 py-2 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse shadow-lg"/>
            <p className="text-sm sm:text-base text-white tracking-widest uppercase font-black drop-shadow-md">
              SISTEMA POS
            </p>
            <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse shadow-lg"/>
          </div>
        </div>

        {/* Connection status - Estilo Mario Power-Up */}
        <div className="mb-6 sm:mb-8 flex justify-center px-4">
          <div className={`flex items-center gap-3 px-5 sm:px-6 py-3 sm:py-4 rounded-lg border-4 transition-all duration-200 shadow-2xl ${
            connected
              ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-700 shadow-green-500/50'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-500 border-yellow-700 animate-pulse shadow-yellow-500/50'
          }`}>
            {connected ? (
              <>
                <div className="relative animate-bounce">
                  <div className="w-6 sm:w-7 h-6 sm:h-7 bg-white rounded-full border-2 border-green-800 flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full"/>
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-black text-white leading-none drop-shadow-md" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
                    ★ EN LÍNEA ★
                  </p>
                  <p className="text-xs text-white/90 leading-none mt-1 font-bold">1UP Sincronizado</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-6 sm:w-7 h-6 sm:h-7 bg-white rounded-full border-2 border-yellow-800 animate-pulse"/>
                <div>
                  <p className="text-sm sm:text-base font-black text-white leading-none drop-shadow-md" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
                    CONECTANDO...
                  </p>
                  <p className="text-xs text-white/90 leading-none mt-1 font-bold">Cargando nivel</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation cards - Mario Blocks */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6 px-2">
          <button
            onClick={() => navigate('/pos')}
            className="home-button group relative bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-4 border-red-800 hover:border-red-700 rounded-2xl p-6 sm:p-8 transition-all duration-200 active:scale-95 active:animate-bounce shadow-2xl hover:shadow-red-500/50 overflow-hidden min-h-[160px] sm:min-h-[180px]"
          >
            {/* Shine effect */}
            <div className="absolute top-2 left-2 w-12 h-12 bg-white/30 rounded-full blur-lg"/>

            {/* Mario coin sparkle */}
            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full animate-ping"/>

            <div className="relative flex flex-col items-center gap-3 sm:gap-4 text-center">
              <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-xl bg-white flex items-center justify-center transition-all duration-200 shadow-xl border-4 border-gray-200 group-hover:border-yellow-300 group-active:animate-bounce">
                <ShoppingCart className="w-10 sm:w-12 h-10 sm:h-12 text-red-600 group-hover:scale-110 transition-transform drop-shadow-lg" />
              </div>
              <div>
                <p className="font-black text-white text-xl sm:text-2xl mb-1 tracking-tight drop-shadow-md" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.3)' }}>
                  VENTANA
                </p>
                <p className="text-xs sm:text-sm text-red-100 font-bold">Punto de venta</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/kitchen')}
            className="home-button group relative bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border-4 border-blue-800 hover:border-blue-700 rounded-2xl p-6 sm:p-8 transition-all duration-200 active:scale-95 active:animate-bounce shadow-2xl hover:shadow-blue-500/50 overflow-hidden min-h-[160px] sm:min-h-[180px]"
          >
            {/* Ready orders badge */}
            {readyCount > 0 && (
              <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 z-20">
                <div className="relative animate-bounce">
                  <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg animate-pulse"/>
                  <span className="relative flex items-center justify-center bg-gradient-to-br from-emerald-400 to-green-500 text-white text-sm sm:text-base font-black rounded-full w-10 sm:w-12 h-10 sm:h-12 shadow-2xl border-2 border-gray-900 ring-2 ring-emerald-400/50">
                    {readyCount}
                  </span>
                </div>
              </div>
            )}

            {/* Glow effect con colores originales */}
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/0 to-yellow-500/0 group-hover:from-primary/20 group-hover:to-yellow-500/10 rounded-3xl blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"/>

            <div className="relative flex flex-col items-center gap-3 sm:gap-5 text-center">
              <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/25 to-yellow-500/15 group-hover:from-primary/40 group-hover:to-yellow-500/30 flex items-center justify-center transition-all duration-200 shadow-lg border border-primary/30 group-hover:border-primary/50 group-active:animate-bounce">
                <ChefHat className="w-9 sm:w-11 h-9 sm:h-11 text-primary group-hover:text-yellow-300 transition-colors drop-shadow-lg" />
              </div>
              <div>
                <p className="font-bold text-white text-lg sm:text-xl mb-1 tracking-tight">Cocina</p>
                <p className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Display KDS</p>
              </div>
            </div>
          </button>
        </div>

        {/* Active orders banner - Con efecto bounce */}
        {activeCount > 0 && (
          <button
            onClick={() => navigate('/pos')}
            className="w-full mb-5 sm:mb-6 mx-2 bg-gradient-to-r from-primary/20 via-yellow-500/15 to-primary/20 hover:from-primary/30 hover:via-yellow-500/25 hover:to-primary/30 border-2 border-primary/40 hover:border-primary/60 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-primary/20 group backdrop-blur-sm active:animate-bounce"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gradient-to-br from-primary/30 to-yellow-500/20 group-hover:from-primary/50 group-hover:to-yellow-500/40 transition-all shadow-lg border border-primary/30">
                <Zap className="w-5 sm:w-6 h-5 sm:h-6 text-primary group-hover:text-yellow-300 transition-colors"/>
              </div>
              <div className="text-left">
                <p className="text-primary font-bold text-sm sm:text-base leading-tight">
                  {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs sm:text-sm text-primary/70 mt-0.5">Tocar para gestionar</p>
              </div>
            </div>
            <div className="text-primary/70 group-hover:text-primary transition-colors text-lg sm:text-xl">→</div>
          </button>
        )}

        {/* Footer - Minimalista */}
        <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600"/>
            <p className="text-xs text-gray-500 select-none font-medium">
              Don de Chuy POS v2.0
            </p>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600"/>
          </div>
        </div>
      </div>
    </div>
  );
}
