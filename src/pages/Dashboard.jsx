import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRateStore } from '../stores/rateStore';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { paymentService } from '../services/paymentService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Users,
  Banknote,
  DollarSign,
  Clock,
  Plus,
  Settings,
  Globe,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export default function Dashboard() {
  const { user, organizacion, logout } = useAuthStore();
  const { todayRate, fetchTodayRate, getActiveRate } = useRateStore();
  const navigate = useNavigate();

  const [data, setData] = useState({
    clientsCount: 0,
    loansCount: 0,
    totalUSD: 0,
    totalVES: 0,
    recentActivity: [],
    loading: true
  });

  useEffect(() => {
    if (organizacion?.id) {
      loadDashboardData();
      fetchTodayRate(organizacion.id);
    }
  }, [organizacion?.id]);

  const loadDashboardData = async () => {
    try {
      const [clients, loans, payments] = await Promise.all([
        clientService.getAll(organizacion.id),
        loanService.getAll(organizacion.id),
        paymentService.getAll(organizacion.id)
      ]);

      // Calculate Loan Stats
      const totalUSD = loans
        .filter(l => l.moneda === 'USD' && l.estado !== 'pagado')
        .reduce((sum, l) => sum + l.monto_capital, 0);

      const totalVES = loans
        .filter(l => (l.moneda === 'VES' || l.moneda === 'BS') && l.estado !== 'pagado')
        .reduce((sum, l) => sum + l.monto_capital, 0);

      // Mix Activity
      const mixedActivity = [
        ...loans.slice(0, 5).map(l => ({
          type: 'loan',
          text: `Nuevo préstamo para ${l.clientes?.nombre || 'Cliente'}`,
          time: new Date(l.fecha_creacion).toLocaleDateString(),
          amount: `${l.moneda === 'USD' ? '$' : 'Bs'} ${l.monto_capital}`,
          icon: Banknote,
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-500/10',
          rawDate: new Date(l.fecha_creacion)
        })),
        ...payments.slice(0, 5).map(p => ({
          type: 'payment',
          text: `Pago de ${p.prestamos?.clientes?.nombre || 'Cliente'}`,
          time: new Date(p.fecha_pago).toLocaleDateString(),
          amount: `+${p.moneda_pago === 'USD' ? '$' : 'Bs'} ${p.monto_abonado}`,
          icon: DollarSign,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          rawDate: new Date(p.fecha_pago)
        }))
      ].sort((a, b) => b.rawDate - a.rawDate).slice(0, 6);

      const activeRateValue = getActiveRate(organizacion?.tasa_referencia_pref) || 1;

      setData({
        clientsCount: clients.length,
        loansCount: loans.filter(l => l.estado === 'activo').length,
        totalUSD: totalUSD + (totalVES / activeRateValue),
        totalVES: totalVES + (totalUSD * activeRateValue),
        recentActivity: mixedActivity,
        loading: false
      });
    } catch (error) {
      console.error('Error loadDashboardData:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const activeRate = getActiveRate(organizacion?.tasa_referencia_pref);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const quickActions = useMemo(() => [
    {
      label: 'Nuevo Cliente',
      icon: Plus,
      action: () => navigate('/clientes'),
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      label: 'Nuevo Préstamo',
      icon: Banknote,
      action: () => navigate('/prestamos'),
      bgColor: 'bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400'
    },
    {
      label: 'Divisas BCV',
      icon: Globe,
      action: () => navigate('/tasas'),
      bgColor: 'bg-sky-500/10',
      iconColor: 'text-sky-600 dark:text-sky-400'
    },
    {
      label: 'Ajustes',
      icon: Settings,
      action: () => navigate('/configuracion'),
      bgColor: 'bg-slate-500/10',
      iconColor: 'text-slate-600 dark:text-slate-400'
    },
  ], [navigate]);
  if (data.loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen pb-32 transition-colors duration-500 animate-fadeIn">
      {/* Header */}
      <header className="pt-4 pb-10 px-6">
        <div className="max-w-4xl mx-auto flex items-end justify-between border-b border-gray-100 dark:border-gray-900 pb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
              Hola, <span className="text-indigo-600">{user?.nombre?.split(' ')[0] || 'Gestor'}</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {organizacion?.nombre || 'Consola Administrativa'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {/* Statistics Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Main Portfolio Tile (Spans more) */}
          <Card className="md:col-span-2 !bg-gray-900 dark:!bg-indigo-950/20 !border-none !p-10 text-white relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-6">Cartera Activa en Divisas</p>
                <div className="flex items-baseline gap-4 mb-2">
                  <h3 className="text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-sm">
                    ${data.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Activa</span>
                  </div>
                </div>
                <p className="text-indigo-300/60 font-medium text-xs">Total de capital prestado en circulación USD</p>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Préstamos</p>
                  <p className="text-xl font-black italic">{data.loansCount}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Base Clientes</p>
                  <p className="text-xl font-black italic">{data.clientsCount}</p>
                </div>
              </div>
            </div>
            {/* Aesthetic element */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors" />
          </Card>

          {/* Local Currency Tile */}
          <Card className="!p-10 border-gray-100 dark:border-gray-900 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 font-sans">Cartera Bolívares</p>
              <h3 className="text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter truncate">
                Bs {data.totalVES.toLocaleString()}
              </h3>
              <div className="mt-2 inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full shadow-soft">
                <p className="text-[10px] font-bold text-indigo-500">
                  ≈ ${activeRate > 0 ? (data.totalVES / activeRate).toFixed(2) : '0.00'} USD
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/20">
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Referencia</p>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 italic">
                  Tasa: Bs {activeRate.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Commands */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 ml-1">Comandos Rápidos</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="group flex flex-col items-start p-6 glass backdrop-blur-lg shadow-soft bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-700 rounded-[2.5rem] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-95 focus:ring-2 focus:ring-indigo-400"
              >
                <div className={`p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110 shadow-soft ${action.bgColor}`}>
                  <action.icon className={`w-8 h-8 ${action.iconColor}`} />
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                  {action.label}
                </span>
                <span className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Iniciar ahora</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Operations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 ml-1">Operaciones Recientes</h2>
            <button onClick={() => navigate('/prestamos')} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest">Ver Historial</button>
          </div>

          <Card className="!p-0 !border-none overflow-hidden bg-white dark:bg-gray-900 shadow-sm rounded-[3rem]">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-7 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/50 transition-colors group rounded-2xl"
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl transition-all group-hover:rotate-6 shadow-soft ${activity.bgColor}`}>
                      <activity.icon className={`w-6 h-6 ${activity.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                        {activity.text}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                        <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Confirmado
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-black italic tabular-nums tracking-tighter ${activity.type === 'payment' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                      {activity.amount}
                    </p>
                  </div>
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No hay actividad reciente aún</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
