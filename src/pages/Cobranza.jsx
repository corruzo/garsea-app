import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCobranza } from '../hooks/useCobranza';
import { useNavigate } from 'react-router-dom';
import {
    ExclamationTriangleIcon,
    PhoneIcon,
    MagnifyingGlassIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Cobranza() {
    const { organizacion } = useAuthStore();
    const navigate = useNavigate();

    const {
        loans: filteredPrestamos,
        alertas,
        metricas,
        loading,
        filterState,
        setFilterState,
        searchTerm,
        setSearchTerm
    } = useCobranza(organizacion?.id);

    const handleContactar = (telefono, nombre) => {
        if (!telefono) return;
        const mensaje = `Hola ${nombre}, le escribimos de ${organizacion?.nombre || 'Garsea'} para recordarle su pago pendiente.`;
        const url = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'al_dia': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'por_vencer': return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'vencido': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            case 'en_mora': return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'pagado': return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Cargando Cobranza...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd] dark:bg-gray-950 pb-24 font-sans transition-colors duration-300">

            {/* Header */}
            <header className="pt-4 pb-10 px-6">
                <div className="max-w-4xl mx-auto border-b border-gray-100 dark:border-gray-900 pb-8">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter flex items-center gap-3">
                        <span className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                        </span>
                        Gestión de Cobranza
                    </h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Gestiona vencimientos, moras y seguimiento de pagos
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/20 hover:shadow-lg transition-shadow">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">En Mora (+7)</p>
                        <p className="text-3xl font-black text-red-600 dark:text-red-400 italic tracking-tighter">{metricas?.enMora || 0}</p>
                    </div>
                    <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border border-orange-100 dark:border-orange-900/20 hover:shadow-lg transition-shadow">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Vencidos</p>
                        <p className="text-3xl font-black text-orange-600 dark:text-orange-400 italic tracking-tighter">{metricas?.vencidos || 0}</p>
                    </div>
                    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-[2rem] border border-yellow-100 dark:border-yellow-900/20 hover:shadow-lg transition-shadow">
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-2">Por Vencer</p>
                        <p className="text-3xl font-black text-yellow-600 dark:text-yellow-500 italic tracking-tighter">{metricas?.porVencer || 0}</p>
                    </div>
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 hover:shadow-lg transition-shadow">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Al Día</p>
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400 italic tracking-tighter">{metricas?.alDia || 0}</p>
                    </div>
                </div>

                {/* Alertas Automáticas */}
                {alertas.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 ml-1">Alertas Prioritarias</h2>
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                                {alertas.length} Pendientes
                            </span>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {alertas.map((alerta, idx) => (
                                    <div key={idx} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-3 h-3 rounded-full ${alerta.prioridad === 'critica' ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/40' :
                                                alerta.prioridad === 'alta' ? 'bg-orange-500' : 'bg-yellow-500'
                                                }`} />
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight mb-1">{alerta.titulo}</p>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{alerta.mensaje}</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wide">
                                                    Cliente: {alerta.prestamo?.clientes?.nombre}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/prestamos/${alerta.prestamo.id}`)}
                                            className="text-[10px] font-black px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-600 dark:text-gray-400 rounded-xl transition-all uppercase tracking-widest"
                                        >
                                            Gestionar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros y Búsqueda */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-white dark:bg-gray-900 p-2 pr-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto p-1 no-scrollbar">
                        {['todos', 'en_mora', 'vencido', 'por_vencer', 'al_dia'].map(state => (
                            <button
                                key={state}
                                onClick={() => setFilterState(state)}
                                className={`whitespace-nowrap px-6 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${filterState === state
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600'
                                    }`}
                            >
                                {state.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-6 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>

                {/* Lista de Préstamos */}
                <div className="space-y-4">
                    {filteredPrestamos.map(prestamo => (
                        <div key={prestamo.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 group">

                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${prestamo.cobranza.prioridad >= 3 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                    prestamo.cobranza.prioridad === 2 ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                    }`}>
                                    <BanknotesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight mb-1">
                                        {prestamo.clientes?.nombre}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(prestamo.cobranza.estado)}`}>
                                            {prestamo.cobranza.label}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400">
                                            {prestamo.tipo_pago}
                                        </span>
                                    </div>
                                    {prestamo.cobranza.diasVencido > 0 && (
                                        <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-wide">
                                            {prestamo.cobranza.diasVencido} días de atraso
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end bg-gray-50 dark:bg-gray-800/50 p-4 md:p-0 rounded-2xl md:bg-transparent">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pendiente</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                                        {prestamo.moneda === 'USD' ? '$' : 'Bs'} {prestamo.saldo_pendiente.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right border-l border-gray-200 dark:border-gray-700 pl-6">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Vence</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {prestamo.cobranza.fechaVencimiento ? format(prestamo.cobranza.fechaVencimiento, 'dd MMM', { locale: es }).toUpperCase() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleContactar(prestamo.clientes?.telefono, prestamo.clientes?.nombre)}
                                    className="p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-2xl transition-all"
                                    title="Contactar WhatsApp"
                                >
                                    <PhoneIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigate(`/prestamos/${prestamo.id}`)}
                                    className="flex-1 md:flex-none px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Registrar Pago
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredPrestamos.length === 0 && (
                        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No se encontraron préstamos</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
