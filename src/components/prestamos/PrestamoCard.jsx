import React from 'react';
import Card from '../ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useRateStore } from '../../stores/rateStore';
import {
    BanknotesIcon,
    CalendarIcon,
    UserIcon,
    ChevronRightIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const PrestamoCard = ({ prestamo, onClick }) => {
    const { organizacion } = useAuthStore();
    const { getActiveRate } = useRateStore();
    const activeRate = getActiveRate(organizacion?.tasa_referencia_pref);

    const progress = ((prestamo.total_a_pagar - prestamo.saldo_pendiente) / prestamo.total_a_pagar) * 100;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'activo':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
            case 'pagado':
                return 'bg-green-500/10 text-green-600 dark:text-green-400';
            case 'atrasado':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
            case 'incobrable':
                return 'bg-red-500/10 text-red-600 dark:text-red-400';
            default:
                return 'bg-gray-500/10 text-gray-600';
        }
    };

    return (
        <Card onClick={onClick} className="group cursor-pointer animate-fadeIn border-none shadow-lg hover:shadow-xl transition-all" hover>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <BanknotesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors text-sm">
                            {prestamo.clientes?.nombre || 'Cargando...'}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 uppercase tracking-tighter">
                            <UserIcon className="w-3 h-3" />
                            C.I. {prestamo.cliente_cedula}
                        </p>
                    </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${getStatusStyles(prestamo.estado)}`}>
                    {prestamo.estado}
                </span>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Saldo Pendiente</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter tabular-nums leading-none">
                            {prestamo.moneda === 'VES' ? 'Bs' : '$'}{prestamo.saldo_pendiente.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        {activeRate > 0 && (
                            <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1">
                                ≈ {prestamo.moneda === 'VES'
                                    ? `$ ${(prestamo.saldo_pendiente / activeRate).toFixed(2)}`
                                    : `Bs ${(prestamo.saldo_pendiente * activeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Capital</p>
                        <p className="text-sm font-black text-gray-700 dark:text-gray-300 italic tabular-nums leading-none">
                            {prestamo.moneda === 'VES' ? 'Bs' : '$'}{prestamo.monto_capital.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>Progreso de Pago</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ease-out rounded-full ${prestamo.estado === 'atrasado' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-medium">
                            <CalendarIcon className="w-4 h-4" />
                            {prestamo.tipo_pago}
                        </div>
                        {prestamo.tiene_garantia && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                                <ShieldCheckIcon className="w-4 h-4" />
                                Garantía
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-blue-500 font-bold group-hover:translate-x-1 transition-transform">
                        Gestionar
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PrestamoCard;
