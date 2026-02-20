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
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-32 animate-fadeIn transition-colors">
            <header className="pt-6 pb-8 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90">
                            <ChevronLeft className="w-5 h-5 text-slate-900 dark:text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Analítica</h1>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{monedaView}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center">
                        {['USD', 'VES'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMonedaView(m)}
                                className={`px-4 md:px-8 py-1.5 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${monedaView === m
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 space-y-6">
                {/* KPIs Compactos */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Ingresos', value: monedaView === 'USD' ? data.proyeccion[0]?.ingresoUSD : data.proyeccion[0]?.ingresoVES, icon: TrendingUp, color: 'text-indigo-600', prefix: monedaView === 'USD' ? '$' : 'Bs' },
                        { label: 'Activo', value: data.metricasCobranza?.montoTotal * (monedaView === 'USD' ? 1 : data.tasaHoy), icon: Banknote, color: 'text-blue-600', prefix: monedaView === 'USD' ? '$' : 'Bs' },
                        { label: 'Atraso', value: (data.metricasCobranza?.montoEnMora + data.metricasCobranza?.montoVencido) * (monedaView === 'USD' ? 1 : data.tasaHoy), icon: AlertCircle, color: 'text-red-600', prefix: monedaView === 'USD' ? '$' : 'Bs' },
                        { label: 'Eficiencia', value: 100 - (data.metricasCobranza?.tasaMorosidad || 0), icon: BarChart3, color: 'text-emerald-600', suffix: '%' }
                    ].map((kpi, idx) => (
                        <Card key={idx} className="!p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" padding="none">
                            <div className="flex items-center gap-3 mb-2">
                                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{kpi.label}</span>
                            </div>
                            <h3 className="text-sm md:text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                {kpi.prefix}{kpi.value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}{kpi.suffix}
                            </h3>
                        </Card>
                    ))}
                </div>

                {/* Gráficos Redimensionados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="!p-6 bg-white dark:bg-slate-900 shadow-sm min-h-[300px]" padding="none">
                        <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-600" />
                            Pronóstico
                        </h3>
                        <div className="h-48 md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.proyeccion}>
                                    <defs>
                                        <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', shadow: 'sm', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey={monedaView === 'USD' ? 'ingresoUSD' : 'ingresoVES'} stroke="#6366f1" strokeWidth={3} fill="url(#colorIngreso)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="!p-6 bg-white dark:bg-slate-900 shadow-sm min-h-[300px]" padding="none">
                        <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            Volumen
                        </h3>
                        <div className="h-48 md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.tendencias}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                                    <YAxis hide />
                                    <Bar dataKey={monedaView === 'USD' ? 'totalUSD' : 'totalVES'} fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                    <Card className="!p-6 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center" padding="none">
                        <span className="text-[9px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Diversificación</span>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.distribucion} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="cantidad" stroke="none">
                                        {data.distribucion.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="!p-6 bg-white dark:bg-slate-900 shadow-sm lg:col-span-2" padding="none">
                        <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            Ranking Confianza
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.topClientes.slice(0, 3).map((cliente, idx) => (
                                        <tr key={cliente.cedula} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-black text-slate-100 group-hover:text-indigo-600">0{idx + 1}</span>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white text-[11px] uppercase truncate">{cliente.nombre}</p>
                                                        <p className="text-[8px] font-black text-slate-400">V-{cliente.cedula}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400">+{cliente.rentabilidad.toFixed(0)}%</span>
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
