import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRateStore } from '../stores/rateStore';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { paymentService } from '../services/paymentService';
import Card from '../components/ui/Card';
import {
  Users,
  Banknote,
  DollarSign,
  Globe,
  TrendingUp,
  History,
  Activity,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export default function Dashboard() {
  const { user, organizacion } = useAuthStore();
  const { fetchTodayRate, getActiveRate } = useRateStore();
  const navigate = useNavigate();

  const [data, setData] = useState({
    clientsCount: 0,
    loansCount: 0,
    totalUSD: 0,
    totalVES: 0,
    recentActivity: [],
    loading: true
  });

  const loadDashboardData = useCallback(async () => {
    if (!organizacion?.id) return;

    try {
      const [clients, loans, payments] = await Promise.all([
        clientService.getAll(organizacion.id),
        loanService.getAll(organizacion.id),
        paymentService.getAll(organizacion.id),
        fetchTodayRate(organizacion.id)
      ]);

      const totalUSD = loans
        .filter(l => l.moneda === 'USD' && l.estado !== 'pagado')
        .reduce((sum, l) => sum + l.monto_capital, 0);

      const totalVES = loans
        .filter(l => (l.moneda === 'VES' || l.moneda === 'BS') && l.estado !== 'pagado')
        .reduce((sum, l) => sum + l.monto_capital, 0);

      const mixedActivity = [
        ...loans.slice(0, 5).map(l => ({
          type: 'loan',
          text: `${l.clientes?.nombre?.split(' ')[0] || 'Cliente'}`,
          time: new Date(l.fecha_creacion).toLocaleDateString(),
          amount: `${l.moneda === 'USD' ? '$' : 'Bs'} ${l.monto_capital.toLocaleString()}`,
          icon: Banknote,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
          rawDate: new Date(l.fecha_creacion)
        })),
        ...payments.slice(0, 5).map(p => ({
          type: 'payment',
          text: `${p.prestamos?.clientes?.nombre?.split(' ')[0] || 'Cliente'}`,
          time: new Date(p.fecha_pago).toLocaleDateString(),
          amount: `+${p.moneda_pago === 'USD' ? '$' : 'Bs'} ${p.monto_abonado.toLocaleString()}`,
          icon: DollarSign,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          rawDate: new Date(p.fecha_pago)
        }))
      ].sort((a, b) => b.rawDate - a.rawDate).slice(0, 4);

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
  }, [organizacion?.id, fetchTodayRate, getActiveRate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeRate = getActiveRate(organizacion?.tasa_referencia_pref);

  const quickActions = useMemo(() => [
    { label: 'Cliente', icon: Users, path: '/clientes', color: 'bg-indigo-600' },
    { label: 'Préstamo', icon: Banknote, path: '/prestamos', color: 'bg-blue-600' },
    { label: 'Tasas', icon: Globe, path: '/tasas', color: 'bg-slate-700' },
  ], []);

  if (data.loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen pb-20 animate-fadeIn bg-slate-100 dark:bg-slate-950">
      {/* Header Compacto */}
      <header className="px-6 py-6 md:py-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Hola, <span className="text-indigo-600">{user?.nombre?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-[9px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
              {organizacion?.nombre || 'GARSEA'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 space-y-6 md:space-y-10">
        {/* Cartera Principal - Altura Reducida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card
            className="md:col-span-2 bg-indigo-600 text-white !from-indigo-600 !to-indigo-700 relative overflow-hidden shadow-lg shadow-indigo-600/20"
            padding="sm"
          >
            <div className="relative z-10 p-2 md:p-4 space-y-6">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Cartera Global</span>
                <TrendingUp className="w-5 h-5 opacity-40" />
              </div>

              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter">
                  ${data.totalUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h3>
                <ArrowUpRight className="w-5 h-5 text-indigo-300" />
              </div>

              <div className="flex gap-8 pt-4 border-t border-white/20">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Contratos</p>
                  <p className="text-xl font-black tabular-nums">{data.loansCount}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Clientes</p>
                  <p className="text-xl font-black tabular-nums">{data.clientsCount}</p>
                </div>
              </div>
            </div>
            {/* Decoración discreta */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          </Card>

          <Card className="p-5 flex flex-col justify-between" padding="none">
            <div className="p-4 space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cartera Bs</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                Bs {data.totalVES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasa BCV</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">Bs {activeRate.toFixed(2)}</span>
            </div>
          </Card>
        </div>

        {/* Acciones Rápidas - Tamaño Compacto */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-600 transition-all shadow-sm active:scale-95"
            >
              <div className={`p-3 ${action.color} rounded-xl text-white shadow-md`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Actividad Reciente - Lista Compacta */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              ACTIVIDAD RECIENTE
            </h2>
            <button onClick={() => navigate('/prestamos')} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Ver Todo</button>
          </div>

          <Card className="!p-0 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 ${activity.bgColor} rounded-xl`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{activity.text}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{activity.time}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black tabular-nums ${activity.type === 'payment' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {activity.amount}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
