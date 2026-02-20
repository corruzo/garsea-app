import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { clientService } from '../../services/clientService';
import { useRateStore } from '../../stores/rateStore';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useCapital } from '../../hooks/useCapital';
import { toast } from 'react-hot-toast';
import {
    UserIcon,
    BanknotesIcon,
    CalendarIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ScaleIcon,
    ShieldCheckIcon,
    PhotoIcon,
    ArrowPathIcon,
    QuestionMarkCircleIcon,
    ClockIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const PrestamoForm = ({ onSubmit, loading }) => {
    const { organizacion, user } = useAuthStore();
    const [clients, setClients] = useState([]);
    const [searchClient, setSearchClient] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [currency, setCurrency] = useState('USD');
    const { saldo: capitalDisponible, loading: loadingCapital } = useCapital(organizacion?.id);
    const hasEnoughCapital = parseFloat(formData.monto_capital) > 0 ? (capitalDisponible[currency] >= parseFloat(formData.monto_capital)) : true;

    // Estado para fotos de garantía
    const fileInputRef = React.useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);

    // Fecha fin por defecto: 1 mes después
    const defaultEndDate = () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        monto_capital: '',
        porcentaje_interes: '10',
        tipo_pago: 'semanal',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: defaultEndDate(),
        tiene_garantia: false,
        descripcion_garantia: '',
    });

    const [calculations, setCalculations] = useState({
        total_interes: 0,
        total_a_pagar: 0,
        monto_cuota: 0,
        num_cuotas: 0,
        semanas_totales: 0
    });

    useEffect(() => {
        if (organizacion?.id) {
            loadClients();
        }
    }, [organizacion?.id]);

    useEffect(() => {
        calculateLoan();
    }, [formData, currency]);

    const loadClients = async () => {
        try {
            const data = await clientService.getAll(organizacion.id);
            setClients(data);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    };

    const { todayRate, fetchTodayRate, getActiveRate } = useRateStore();

    useEffect(() => {
        if (organizacion?.id) {
            fetchTodayRate(organizacion.id);
        }
    }, [organizacion?.id, fetchTodayRate]);

    const calculateLoan = () => {
        const capital = parseFloat(formData.monto_capital) || 0;
        const interesPercent = parseFloat(formData.porcentaje_interes) || 0;
        const start = new Date(formData.fecha_inicio);
        const end = new Date(formData.fecha_fin);

        // Calcular Diferencia en días
        const diffTime = Math.max(0, end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const semanasTotales = Math.ceil(diffDays / 7);

        const totalInteres = capital * (interesPercent / 100);
        const totalPagar = capital + totalInteres;

        let numCuotas = 0;
        if (formData.tipo_pago === 'semanal') {
            numCuotas = Math.ceil(diffDays / 7);
        } else if (formData.tipo_pago === 'quincenal') {
            numCuotas = Math.ceil(diffDays / 15);
        } else if (formData.tipo_pago === 'mensual') {
            numCuotas = Math.ceil(diffDays / 30);
        }

        const montoCuota = numCuotas > 0 ? totalPagar / numCuotas : 0;

        setCalculations({
            total_interes: totalInteres,
            total_a_pagar: totalPagar,
            monto_cuota: montoCuota,
            num_cuotas: numCuotas,
            semanas_totales: semanasTotales
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setSelectedFiles(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePhoto = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(photoPreviews[index]);
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedClient) return;

        if (!hasEnoughCapital) {
            toast.error(`No tienes suficiente capital en ${currency} para este préstamo.`);
            return;
        }

        onSubmit({
            cliente_cedula: selectedClient.cedula,
            monto_capital: parseFloat(formData.monto_capital),
            porcentaje_interes: parseFloat(formData.porcentaje_interes),
            tipo_pago: formData.tipo_pago,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            duracion_semanas: calculations.semanas_totales,
            total_a_pagar: calculations.total_a_pagar,
            saldo_pendiente: calculations.total_a_pagar,
            moneda: currency,
            estado: 'activo',
            tiene_garantia: formData.tiene_garantia,
            descripcion_garantia: formData.descripcion_garantia,
            creado_por: user?.cedula || 'SISTEMA'
        }, selectedFiles);
    };

    const currencySymbol = currency === 'USD' ? '$' : 'Bs';

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Seleccionar Cliente */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 text-blue-500">
                    <UserIcon className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-70">
                        Responsable del Préstamo
                    </h3>
                </div>
                {!selectedClient ? (
                    <div className="space-y-2">
                        <Input
                            placeholder="Nombre completo o Cédula..."
                            value={searchClient}
                            onChange={(e) => setSearchClient(e.target.value)}
                            icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                        />
                        <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                            {searchClient && clients.filter(c =>
                                c.nombre.toLowerCase().includes(searchClient.toLowerCase()) ||
                                c.cedula.includes(searchClient)
                            ).slice(0, 3).map(client => (
                                <div
                                    key={client.cedula}
                                    onClick={() => setSelectedClient(client)}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-transparent hover:border-blue-200 transition-all animate-fadeIn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">
                                            {client.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{client.nombre}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">C.I. {client.cedula}</p>
                                        </div>
                                    </div>
                                    <CheckCircleIcon className="w-6 h-6 text-blue-500 opacity-0 group-hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-5 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 animate-slideUp">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/20">
                                {selectedClient.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-black text-xl leading-none mb-1 italic">{selectedClient.nombre}</p>
                                <p className="text-xs font-bold opacity-70 tracking-[0.2em] uppercase">C.I. {selectedClient.cedula}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedClient(null)}
                            className="bg-white/10 hover:bg-white/20 p-3 rounded-xl backdrop-blur-sm text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Cambiar
                        </button>
                    </div>
                )}
            </div>

            {/* 2. Divisa */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1 text-emerald-500">
                    <BanknotesIcon className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-70">
                        Unidad Monetaria
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {['USD', 'VES'].map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setCurrency(m)}
                            className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-1 ${currency === m
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'
                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-400 opacity-50 hover:opacity-100'
                                }`}
                        >
                            <span className="text-2xl font-black italic">{m === 'USD' ? '$' : 'Bs'}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{m === 'USD' ? 'Dólares' : 'Bolívares'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Definición de Tiempos (Automatización) */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1 text-amber-500">
                    <ClockIcon className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-70">
                        Vigencia y Frecuencia
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Input
                            label="Día que se entrega el dinero"
                            type="date"
                            required
                            value={formData.fecha_inicio}
                            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-400 font-bold px-1 uppercase tracking-tighter">
                            Fecha de desembolso inicial.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Input
                            label="Día final para pagar la deuda"
                            type="date"
                            required
                            min={formData.fecha_inicio}
                            value={formData.fecha_fin}
                            onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                        />
                        <p className="text-[10px] text-blue-500 font-black px-1 uppercase tracking-tighter">
                            * El sistema calculará la duración basada en este día.
                        </p>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                        <label className="block text-sm font-black text-gray-700 dark:text-gray-300 ml-1">
                            ¿Cada cuánto tiempo pagará el cliente?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'semanal', label: 'Cada Semana' },
                                { id: 'quincenal', label: 'Cada 15 días' },
                                { id: 'mensual', label: 'Cada Mes' }
                            ].map((plan) => (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tipo_pago: plan.id })}
                                    className={`px-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.tipo_pago === plan.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                        : 'border-gray-100 dark:border-gray-800 text-gray-400'
                                        }`}
                                >
                                    {plan.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Capital e Interés */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1 text-slate-500">
                    <ScaleIcon className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-70">
                        Cuentas y Márgenes
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Input
                            label={`¿Cuánto dinero se está prestando? (${currencySymbol})`}
                            type="number"
                            required
                            value={formData.monto_capital}
                            onChange={(e) => setFormData({ ...formData, monto_capital: e.target.value })}
                            placeholder="0.00"
                        />
                        {parseFloat(formData.monto_capital) > 0 && todayRate && (() => {
                            const rate = getActiveRate(organizacion?.tasa_referencia_pref) || 1;
                            return (
                                <div className="space-y-1">
                                    <p className="px-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 animate-fadeIn">
                                        ≈ {currency === 'USD'
                                            ? `Bs ${(parseFloat(formData.monto_capital) * rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                            : `$ ${(parseFloat(formData.monto_capital) / rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} {currency === 'USD' ? 'Referencia' : 'USD'}
                                    </p>
                                    {!hasEnoughCapital && !loadingCapital && (
                                        <p className="px-2 text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse bg-red-50 dark:bg-red-900/20 p-1 rounded-lg">
                                            ⚠️ Capital insuficiente (Disponible: {currencySymbol}{capitalDisponible[currency].toLocaleString()})
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    <Input
                        label="Porcentaje de beneficio (%)"
                        type="number"
                        required
                        value={formData.porcentaje_interes}
                        onChange={(e) => setFormData({ ...formData, porcentaje_interes: e.target.value })}
                        placeholder="10"
                    />
                </div>
            </div>

            {/* 5. Garantía */}
            <div className="p-1">
                <label className="flex items-center gap-4 cursor-pointer p-6 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-900/30">
                    <input
                        type="checkbox"
                        checked={formData.tiene_garantia}
                        onChange={(e) => setFormData({ ...formData, tiene_garantia: e.target.checked })}
                        className="w-8 h-8 rounded-xl border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                        <span className="font-black text-indigo-900 dark:text-indigo-100 block italic leading-none mb-1">REGISTRAR GARANTÍA</span>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Activar si el cliente deja un bien de valor</span>
                    </div>
                </label>

                {formData.tiene_garantia && (
                    <div className="mt-4 space-y-4 animate-slideDown">
                        <textarea
                            className="w-full px-6 py-5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] text-base focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] shadow-sm font-medium"
                            placeholder="Ej: Laptop HP Serial 12345, incluye cargador..."
                            value={formData.descripcion_garantia}
                            onChange={(e) => setFormData({ ...formData, descripcion_garantia: e.target.value })}
                        />

                        {/* Previsualización de Fotos */}
                        {photoPreviews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-2">
                                {photoPreviews.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-3 p-5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] hover:border-indigo-500 transition-all group"
                        >
                            <PhotoIcon className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-indigo-600">
                                {selectedFiles.length > 0 ? `Añadir más (${selectedFiles.length} seleccionadas)` : 'Adjuntar Fotos del Bien'}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* 6. Desglose Automático (La Inteligencia) */}
            <div className="pt-6">
                <div className="bg-gray-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Plan de Cuotas</p>
                                <h4 className="text-sm font-bold text-gray-400 italic">Basado en el plazo seleccionado</h4>
                            </div>
                            <div className="bg-blue-600 px-4 py-2 rounded-full text-[10px] font-black italic">
                                {calculations.num_cuotas} PAGOS EN TOTAL
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Monto por cada Cuota</p>
                                <p className="text-5xl font-black italic tracking-tighter">
                                    {currencySymbol}{calculations.monto_cuota.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                                {todayRate && (
                                    <p className="text-[10px] font-black text-blue-500 mt-2 uppercase tracking-tighter">
                                        ≈ {currency === 'USD' ? 'Bs' : '$'}
                                        {(currency === 'USD'
                                            ? calculations.monto_cuota * (getActiveRate(organizacion?.tasa_referencia_pref))
                                            : calculations.monto_cuota / (getActiveRate(organizacion?.tasa_referencia_pref))
                                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })} al cambio ({organizacion?.tasa_referencia_pref || 'USD'})
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Beneficio</p>
                                    <p className="text-xl font-black text-emerald-400">+{currencySymbol}{calculations.total_interes.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Duración</p>
                                    <p className="text-xl font-black text-blue-400">{calculations.semanas_totales} SEMANAS</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase opacity-50">Cierre de Deuda</p>
                                    <p className="text-xs font-black">{new Date(formData.fecha_fin + 'T12:00:00').toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <BanknotesIcon className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase opacity-50">Total a Retornar</p>
                                    <p className="text-xs font-black">{currencySymbol}{calculations.total_a_pagar.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20 text-[11px] font-medium leading-relaxed italic text-gray-400">
                            <strong>Nota del Sistema:</strong> El préstamo de {currencySymbol}{formData.monto_capital || '0'} se dividirá en {calculations.num_cuotas} cuotas de {currencySymbol}{calculations.monto_cuota.toFixed(2)} cada una, finalizando el {new Date(formData.fecha_fin + 'T12:00:00').toLocaleDateString()}.
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-1">
                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    className="shadow-2xl shadow-blue-600/30 !py-6 text-xl font-black italic tracking-widest transform transition-all active:scale-95"
                    disabled={!selectedClient || !formData.monto_capital || new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)}
                >
                    REGISTRAR OPERACIÓN
                </Button>
            </div>

            <div className="h-28 sm:hidden" />
        </form>
    );
};

export default PrestamoForm;
