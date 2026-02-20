import React from 'react';
import Card from '../ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useRateStore } from '../../stores/rateStore';
import {
    Banknote,
    ChevronRight,
    ShieldCheck,
    History
} from 'lucide-react';

const PrestamoCard = ({ prestamo, onClick }) => {
    const { organizacion } = useAuthStore();
    const { getActiveRate } = useRateStore();
    const activeRate = getActiveRate(organizacion?.tasa_referencia_pref);

    const progress = ((prestamo.total_a_pagar - prestamo.saldo_pendiente) / prestamo.total_a_pagar) * 100;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'activo':
                return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20';
            case 'pagado':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20';
            case 'atrasado':
                return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20';
            default:
                return 'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800';
        }
    };

    return (
        <Card onClick={onClick} hover className="!p-6 animate-fadeIn transition-all group">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Banknote className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors">
                            {prestamo.clientes?.nombre || 'Cargando...'}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {prestamo.tipo_pago}
                        </p>
                    </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border ${getStatusStyles(prestamo.estado)}`}>
                    {prestamo.estado}
                </span>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-end p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Pendiente</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none">
                            {prestamo.moneda === 'VES' ? 'Bs' : '$'} {prestamo.saldo_pendiente.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Total</p>
                        <p className="text-sm font-black text-slate-500 tabular-nums leading-none">
                            {prestamo.moneda === 'VES' ? 'Bs' : '$'} {prestamo.total_a_pagar.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Progress Bar Refinada */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">
                        <span>Progreso de Pago</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 rounded-full ${prestamo.estado === 'atrasado' ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <History className="w-3.5 h-3.5" />
                            Acto
                        </div>
                        {prestamo.tiene_garantia && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Garantía
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        Gestionar
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PrestamoCard;
