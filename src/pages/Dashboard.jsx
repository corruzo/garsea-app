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
          text: `Nuevo préstamo: ${l.clientes?.nombre || 'Cliente'}`,
          time: new Date(l.fecha_creacion).toLocaleDateString(),
          amount: `${l.moneda === 'USD' ? '$' : 'Bs'} ${l.monto_capital.toLocaleString()}`,
          icon: Banknote,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
          rawDate: new Date(l.fecha_creacion)
        })),
        ...payments.slice(0, 5).map(p => ({
          type: 'payment',
          text: `Pago: ${p.prestamos?.clientes?.nombre || 'Cliente'}`,
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
    { label: 'Nuevo Cliente', icon: Users, path: '/clientes', color: 'bg-indigo-600' },
    { label: 'Préstamos', icon: Banknote, path: '/prestamos', color: 'bg-blue-600' },
    { label: 'Tasas BCV', icon: Globe, path: '/tasas', color: 'bg-slate-700' },
  ], []);

  if (data.loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen pb-20 animate-fadeIn bg-slate-100 dark:bg-slate-950">
      {/* Header - Contraste Extremo */}
      <header className="px-8 py-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Hola, <span className="text-indigo-600">{user?.nombre?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-sm font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.3em]">
              {organizacion?.nombre || 'CruzGarcia INC'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Sistema Conectado</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 space-y-12">
        {/* Cartera Principal - Diseño Indigo Impactante */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card
            className="lg:col-span-2 bg-indigo-600 text-white p-10 relative overflow-hidden ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-600/10"
            padding="none"
          >
            <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-100/80 block">Cartera Total Activa</span>
                  <div className="h-1 w-12 bg-indigo-300 rounded-full" />
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-6xl lg:text-7xl font-black tabular-nums tracking-tighter leading-none">
                    ${data.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <ArrowUpRight className="w-8 h-8 text-indigo-300 animate-bounce" />
                </div>
                <p className="text-lg font-bold text-indigo-50/70 tracking-tight">Consolidado en Divisas (USD)</p>
              </div>

              <div className="flex gap-12 pt-10 border-t border-white/20">
                <div className="group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 group-hover:text-white transition-colors">Contratos</p>
                  <p className="text-3xl font-black italic tabular-nums">{data.loansCount}</p>
                </div>
                <div className="group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 group-hover:text-white transition-colors">Clientes</p>
                  <p className="text-3xl font-black italic tabular-nums">{data.clientsCount}</p>
                </div>
              </div>
            </div>
            {/* Decoración abstracta */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          </Card>

          <Card className="p-10 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cartera Bs</span>
              </div>
              <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none italic">
                Bs {data.totalVES.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 mt-10">
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-3 tracking-widest border-b border-indigo-100 dark:border-indigo-900 pb-2">Referencia BCV</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">Bs {activeRate.toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-400 mb-1">/ 1.00$</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Acciones Rápidas - Botones Flotantes Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="group relative flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-indigo-600 dark:hover:border-indigo-500 shadow-sm transition-all active:scale-95"
            >
              <div className="flex items-center gap-6">
                <div className={`p-5 ${action.color} rounded-2xl shadow-lg ring-4 ring-slate-100 dark:ring-slate-800 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{action.label}</span>
              </div>
              <Plus className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 group-hover:rotate-90 transition-all" />
            </button>
          ))}
        </div>

        {/* Movimientos Recientes - Tabla Refinada */}
        <div className="space-y-8 pb-10">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xs font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
              <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
              Actividad Reciente
            </h2>
            <button
              onClick={() => navigate('/prestamos')}
              className="px-6 py-2 bg-slate-900 dark:bg-slate-100 rounded-full text-[10px] font-black text-white dark:text-slate-900 uppercase tracking-[0.2em] hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-lg"
            >
              VISTAZO TOTAL
            </button>
          </div>

          <Card className="!p-0 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-[2.5rem]">
            <div className="divide-y-2 divide-slate-100 dark:divide-slate-800/60">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-10 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={`p-5 ${activity.bgColor} rounded-2xl ring-4 ring-slate-100/50 dark:ring-slate-800/10 group-hover:scale-105 transition-transform`}>
                      <activity.icon className={`w-7 h-7 ${activity.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">{activity.text}</p>
                      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{activity.time}</p>
                    </div>
                  </div>
                  <p className={`text-2xl font-black tabular-nums tracking-tighter ${activity.type === 'payment' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {activity.amount}
                  </p>
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <div className="py-24 text-center">
                  <History className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Sin movimientos registrados</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
