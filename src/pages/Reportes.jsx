import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { paymentService } from '../services/paymentService';
import { analyticsService } from '../services/analyticsService';
import { useRateStore } from '../stores/rateStore';
import { cobranzaService } from '../services/cobranzaService';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    AlertCircle,
    Globe,
    PieChart as PieIcon,
    Banknote,
    BarChart3,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';

export default function Reportes() {
    const { organizacion } = useAuthStore();
    const { fetchTodayRate, getActiveRate } = useRateStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const hasLoadedInit = useRef(false);

    const [data, setData] = useState({
        proyeccion: [],
        distribucion: [],
        tendencias: [],
        topClientes: [],
        metricasCobranza: null,
        tasaHoy: 1
    });

    const [monedaView, setMonedaView] = useState('USD');

    const loadData = useCallback(async () => {
        if (!organizacion?.id || hasLoadedInit.current) return;

        try {
            setLoading(true);
            hasLoadedInit.current = true;

            const [clients, loans, payments] = await Promise.all([
                clientService.getAll(organizacion.id),
                loanService.getAll(organizacion.id),
                paymentService.getAll(organizacion.id),
                fetchTodayRate(organizacion.id)
            ]);

            const tasaActual = getActiveRate(organizacion.tasa_referencia_pref || 'USD') || 1;

            const proyeccion = analyticsService.calcularProyeccionIngresos(loans);
            const distribucion = analyticsService.calcularDistribucionPorMonto(loans, tasaActual);
            const tendencias = analyticsService.analizarTendenciasPagos(payments, tasaActual);
            const topClientes = analyticsService.identificarClientesMasRentables(clients, loans, payments);
            const metricasCobranza = cobranzaService.calcularMetricas(loans);

            setData({
                proyeccion,
                distribucion,
                tendencias,
                topClientes,
                metricasCobranza,
                tasaHoy: tasaActual
            });
        } catch (error) {
            console.error('Error cargando reportes:', error);
            hasLoadedInit.current = false;
        } finally {
            setLoading(false);
        }
    }, [organizacion?.id, fetchTodayRate, getActiveRate]);

    useEffect(() => {
        loadData();
        return () => { hasLoadedInit.current = false; };
    }, [loadData]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950">
                <div className="w-16 h-16 border-8 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-8" />
                <p className="text-slate-800 dark:text-slate-200 font-black uppercase text-sm tracking-[0.3em] animate-pulse text-center">
                    Analizando Datos Financieros
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-32 animate-fadeIn transition-colors">
            <header className="pt-10 pb-16 px-8">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-600 transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Analítica de Cartera</h1>
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-1">Estadísticas y Rendimiento</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center">
                            {['USD', 'VES'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMonedaView(m)}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${monedaView === m
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                >
                                    {m === 'USD' ? 'Dólares' : 'Bolívares'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-8 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Ingresos Futuros', value: monedaView === 'USD' ? data.proyeccion[0]?.ingresoUSD : data.proyeccion[0]?.ingresoVES, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', prefix: monedaView === 'USD' ? '$' : 'Bs' },
                        { label: 'Cartera Activa', value: data.metricasCobranza?.montoTotal * (monedaView === 'USD' ? 1 : data.tasaHoy), icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50', prefix: monedaView === 'USD' ? '$' : 'Bs' },
                        { label: 'En Atraso', value: (data.metricasCobranza?.montoEnMora + data.metricasCobranza?.montoVencido) * (monedaView === 'USD' ? 1 : data.tasaHoy), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', prefix: monedaView === 'USD' ? '$' : 'Bs' },
                        { label: 'Eficiencia', value: 100 - (data.metricasCobranza?.tasaMorosidad || 0), icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50', suffix: '%' }
                    ].map((kpi, idx) => (
                        <Card key={idx} className="!p-8 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className={`p-4 w-fit rounded-2xl ${kpi.bg} dark:bg-slate-800 mb-6`}>
                                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                {kpi.prefix && kpi.prefix} {kpi.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {kpi.suffix && kpi.suffix}
                            </h3>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="!p-10 bg-white dark:bg-slate-900 shadow-sm border-2 border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Globe className="w-5 h-5 text-indigo-600" />
                            Pronóstico Recaudación
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.proyeccion}>
                                    <defs>
                                        <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', shadow: 'lg', fontWeight: 900 }} />
                                    <Area type="monotone" dataKey={monedaView === 'USD' ? 'ingresoUSD' : 'ingresoVES'} stroke="#6366f1" strokeWidth={4} fill="url(#colorIngreso)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="!p-10 bg-white dark:bg-slate-900 shadow-sm border-2 border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Banknote className="w-5 h-5 text-emerald-600" />
                            Volumen Mensual
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.tendencias}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', shadow: 'lg' }} />
                                    <Bar dataKey={monedaView === 'USD' ? 'totalUSD' : 'totalVES'} fill="#10b981" radius={[8, 8, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    <Card className="!p-10 bg-white dark:bg-slate-900 shadow-sm border-2 border-slate-100 dark:border-slate-800 text-center">
                        <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-10">Diversificación</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.distribucion} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={10} dataKey="cantidad" stroke="none">
                                        {data.distribucion.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '15px' }} />
                                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="!p-10 bg-white dark:bg-slate-900 shadow-sm border-2 border-slate-100 dark:border-slate-800 lg:col-span-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Ranking de Confianza
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-slate-50 dark:border-slate-800">
                                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                        <th className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntaje</th>
                                        <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-800">
                                    {data.topClientes.slice(0, 5).map((cliente, idx) => (
                                        <tr key={cliente.cedula} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                            <td className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl font-black text-slate-200 group-hover:text-indigo-600 transition-colors">0{idx + 1}</span>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-sm uppercase">{cliente.nombre}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">V-{cliente.cedula}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="w-32 bg-slate-100 dark:bg-slate-800 h-2 rounded-full mx-auto overflow-hidden">
                                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(cliente.score, 100)}%` }} />
                                                </div>
                                            </td>
                                            <td className="py-6 text-right">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">+{cliente.rentabilidad.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
