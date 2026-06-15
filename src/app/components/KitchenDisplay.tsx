import { useOrders } from './OrderContext';
import { Clock, CheckCircle, ArrowLeft, Square, CheckSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import logo from '../../imports/image-1.png';

const USER_COLORS: Record<string, { bg: string; border: string }> = {
  'Quedadito1': { bg: 'bg-blue-600',    border: 'border-blue-500' },
  'Quedadito2': { bg: 'bg-purple-600',  border: 'border-purple-500' },
  'WASHO':      { bg: 'bg-orange-500',  border: 'border-orange-400' },
  'WATA':       { bg: 'bg-emerald-600', border: 'border-emerald-500' },
  'elias':      { bg: 'bg-red-600',     border: 'border-red-500' },
  'tias':       { bg: 'bg-pink-600',    border: 'border-pink-500' },
};
const DEFAULT_COLOR = { bg: 'bg-gray-600', border: 'border-gray-500' };

function TimerBadge({ minutes }: { minutes: number }) {
  const cls = minutes < 5 ? 'text-green-300 bg-green-900/60' :
              minutes < 10 ? 'text-yellow-300 bg-yellow-900/60' :
              'text-red-300 bg-red-900/60 animate-pulse';
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${cls}`}>
      <Clock className="w-3 h-3"/>
      {minutes}m
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

  const getTimeElapsed = (orderTime: string) =>
    Math.floor((currentTime.getTime() - new Date(orderTime).getTime()) / 1000 / 60);

  const activeOrders = orders.filter(o => o.status !== 'delivered');

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-white/10 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-white rounded-xl p-1.5">
            <img src={logo} alt="Don de Chuy" className="h-10 w-auto" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Cocina — KDS</h1>
            <p className="text-xs text-white/40">Don de Chuy Business</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary tabular-nums">
            {currentTime.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-white/40 capitalize">
            {currentTime.toLocaleDateString('es-HN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-[#1A1A1A] border-b border-white/5 px-5 py-2.5 flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-400"/>
          <span className="text-white/50">Activos:</span>
          <span className="font-bold text-white">{activeOrders.length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-400"/>
          <span className="text-white/50">Listos:</span>
          <span className="font-bold text-white">{orders.filter(o => o.status === 'ready').length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-white/20"/>
          <span className="text-white/50">Entregados:</span>
          <span className="font-bold text-white">{orders.filter(o => o.status === 'delivered').length}</span>
        </div>
      </div>

      {/* Orders */}
      <div className="flex-1 p-4 overflow-auto">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-72 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-xl font-bold text-white/30">Todo al día</p>
            <p className="text-sm text-white/20">Los nuevos pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map(order => {
              const elapsed = getTimeElapsed(order.timestamp);
              const checkedCount = order.deliveredItems.length;
              const totalItems = order.items.length;
              const allChecked = checkedCount === totalItems;
              const userColor = USER_COLORS[order.sentBy] || DEFAULT_COLOR;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 ${userColor.border} overflow-hidden flex flex-col bg-[#1A1A1A] shadow-xl`}
                >
                  <div className={`${userColor.bg} px-4 py-4`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">Pedido {order.id}</h3>
                        <div className="flex items-center gap-1.5 text-white/70 text-xs">
                          <Clock className="w-3 h-3"/>
                          <span>{new Date(order.timestamp).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <TimerBadge minutes={elapsed}/>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'ready' ? 'bg-white/30 text-white' :
                          order.status === 'preparing' ? 'bg-white/20 text-white' :
                          'bg-black/20 text-white/70'
                        }`}>
                          {order.status === 'pending' ? 'Pendiente' : order.status === 'preparing' ? 'En curso' : '✓ Listo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2.5 rounded-xl">
                      <User className="w-5 h-5 text-white/90"/>
                      <span className="text-xl font-bold text-white tracking-wide">{order.sentBy || 'Ventana'}</span>
                    </div>
                  </div>

                  <div className="flex-1 p-3 space-y-2">
                    {order.items.map(item => {
                      const done = order.deliveredItems.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => markItemReady(order.id, item.id)}
                          className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all text-left active:scale-95 ${
                            done ? 'bg-green-900/30 border border-green-700/40' : 'bg-white/5 hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          {done
                            ? <CheckSquare className="w-5 h-5 text-green-400 shrink-0" />
                            : <Square className="w-5 h-5 text-white/30 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm leading-tight ${done ? 'line-through text-white/30' : 'text-white'}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-white/30">{item.category}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shrink-0">
                            {item.quantity}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 pb-2">
                    <div className="flex justify-between text-xs text-white/25 mb-1">
                      <span>Preparados</span>
                      <span className="font-bold">{checkedCount}/{totalItems}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className={`px-4 py-3 flex items-center justify-center gap-2 text-xs font-bold ${
                    allChecked ? 'bg-green-700 text-white' :
                    checkedCount > 0 ? 'bg-amber-600/70 text-white' :
                    'bg-white/5 text-white/25'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {allChecked ? 'Listo · Esperando entrega en Ventana' :
                     checkedCount > 0 ? `En preparación (${checkedCount}/${totalItems})` :
                     'Pendiente de preparar'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
