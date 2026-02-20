import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { paymentService } from '../services/paymentService';
import { analyticsService } from '../services/analyticsService';
import { useRateStore } from '../stores/rateStore';
import { cobranzaService } from '../services/cobranzaService';
import DataPreloader from '../components/DataPreloader';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ExclamationCircleIcon,
    GlobeAltIcon,
    ChartPieIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

export default function Reportes() {
    const { organizacion } = useAuthStore();
    const { todayRate, getActiveRate } = useRateStore();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        proyeccion: [],
        evolucion: [],
        distribucion: [],
        tendencias: [],
        topClientes: [],
        metricasCobranza: null
    });

    const [monedaView, setMonedaView] = useState('USD'); // 'USD' o 'VES'

    useEffect(() => {
        if (organizacion?.id) {
            loadData();
        }
    }, [organizacion?.id, todayRate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clients, loans, payments] = await Promise.all([
                clientService.getAll(organizacion.id),
                loanService.getAll(organizacion.id),
                paymentService.getAll(organizacion.id)
            ]);

            // Obtener tasa actual (USD por defecto)
            const tasaActual = getActiveRate(organizacion.tasa_referencia_pref || 'USD') || 1;

            const proyeccion = analyticsService.calcularProyeccionIngresos(loans);
            const evolucion = analyticsService.calcularEvolucionCartera(loans, payments, tasaActual);
            const distribucion = analyticsService.calcularDistribucionPorMonto(loans, tasaActual);
            const tendencias = analyticsService.analizarTendenciasPagos(payments, tasaActual);
            const topClientes = analyticsService.identificarClientesMasRentables(clients, loans, payments);
            const metricasCobranza = cobranzaService.calcularMetricas(loans);

            setData({
                proyeccion,
                evolucion,
                distribucion,
                tendencias,
                topClientes,
                metricasCobranza,
                tasaHoy: tasaActual
            });
        } catch (error) {
            console.error('Error cargando reportes:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const DARK_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Generando Reportes...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] dark:bg-gray-950 pb-24 font-sans transition-colors duration-300">
            <DataPreloader />

            {/* Header */}
            <header className="pt-4 pb-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end justify-between border-b border-gray-100 dark:border-gray-900 pb-8 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter flex items-center gap-3">
                            <span className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                                <ChartBarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </span>
                            Analíticas
                        </h1>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 ml-1">
                            Visión general del rendimiento de tu negocio
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-900 p-1.5 rounded-[1.5rem] flex items-center">
                        <button
                            onClick={() => setMonedaView('USD')}
                            className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${monedaView === 'USD'
                                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            USD ($)
                        </button>
                        <button
                            onClick={() => setMonedaView('VES')}
                            className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${monedaView === 'VES'
                                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            VES (Bs)
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                    <CurrencyDollarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-wider">
                                    +12% vs mes
                                </span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ingresos Proyectados</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1 italic tracking-tighter">
                                {monedaView === 'USD' ? '$' : 'Bs'}
                                {monedaView === 'USD'
                                    ? (data.proyeccion[0]?.ingresoUSD || 0).toLocaleString()
                                    : (data.proyeccion[0]?.ingresoVES || 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cartera Activa</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1 italic tracking-tighter">
                            {monedaView === 'USD' ? '$' : 'Bs'}
                            {monedaView === 'USD'
                                ? (data.metricasCobranza?.montoTotal || 0).toLocaleString()
                                : ((data.metricasCobranza?.montoTotal || 0) * 40).toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total en Mora</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1 italic tracking-tighter">
                            {monedaView === 'USD' ? '$' : 'Bs'}
                            {monedaView === 'USD'
                                ? ((data.metricasCobranza?.montoEnMora || 0) + (data.metricasCobranza?.montoVencido || 0)).toLocaleString()
                                : (((data.metricasCobranza?.montoEnMora || 0) + (data.metricasCobranza?.montoVencido || 0)) * 40).toLocaleString()}
                        </h3>
                        <p className={`text-[10px] font-black uppercase tracking-wider mt-2 ${(data.metricasCobranza?.tasaMorosidad || 0) > 15 ? 'text-red-500' : 'text-green-500'}`}>
                            Tasa de Mora: {(data.metricasCobranza?.tasaMorosidad || 0).toFixed(1)}%
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <UserGroupIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Clientes Activos</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1 italic tracking-tighter">
                            {data.topClientes.length}
                        </h3>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Proyección de Ingresos */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest flex items-center gap-2">
                            <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
                            Proyección de Ingresos
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.proyeccion}>
                                    <defs>
                                        <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="mes"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        itemStyle={{ color: '#4b5563', fontSize: '12px', fontWeight: 600 }}
                                        formatter={(value) => [`${monedaView === 'USD' ? '$' : 'Bs'} ${value.toLocaleString()}`, 'Ingreso']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={monedaView === 'USD' ? 'ingresoUSD' : 'ingresoVES'}
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorIngreso)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribución de Pagos */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest flex items-center gap-2">
                            <BanknotesIcon className="w-4 h-4 text-emerald-500" />
                            Tendencia de Recaudación
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.tendencias}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="mes"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    />
                                    <Bar
                                        dataKey={monedaView === 'USD' ? 'totalUSD' : 'totalVES'}
                                        name="Total Recaudado"
                                        fill="#10b981"
                                        radius={[8, 8, 0, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Distribución por Monto */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-1">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest flex items-center gap-2">
                            <ChartPieIcon className="w-4 h-4 text-orange-500" />
                            Distribución por Monto
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.distribucion}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="cantidad"
                                        stroke="none"
                                    >
                                        {data.distribucion.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '10px', fontFamily: 'sans-serif', fontWeight: 600, paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Clientes */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4 text-yellow-500" />
                            Top 5 Clientes Más Rentables
                        </h3>
                        <div className="overflow-x-auto">
                            <div className="min-w-full inline-block align-middle">
                                <div className="border rounded-3xl overflow-hidden border-gray-100 dark:border-gray-800">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Prestado</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagado</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">ROI</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                            {data.topClientes.slice(0, 5).map((cliente, idx) => (
                                                <tr key={cliente.cedula} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-600'
                                                                }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{cliente.nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                                                                style={{ width: `${Math.min(cliente.score, 100)}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        ${cliente.totalPrestado?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                                                        ${cliente.totalPagado?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className="text-xs font-black bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                            +{cliente.rentabilidad.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
