import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useRateStore } from '../stores/rateStore';
import { useNotificationStore } from '../stores/notificationStore';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { storageService } from '../services/storageService';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    ArrowLeftIcon,
    UserIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    BanknotesIcon,
    CalendarIcon,
    ScaleIcon,
    DocumentTextIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const NuevoPrestamo = () => {
    const navigate = useNavigate();
    const { user, organizacion } = useAuthStore();
    const { todayRate, fetchTodayRate, getActiveRate } = useRateStore();
    const { addNotification } = useNotificationStore();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchClient, setSearchClient] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);

    // Estado para fotos de garantía
    const fileInputRef = React.useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);

    useEffect(() => {
        if (organizacion?.id) {
            fetchTodayRate(organizacion.id);
        }
    }, [organizacion?.id, fetchTodayRate]);

    const activeRate = getActiveRate(organizacion?.tasa_referencia_pref);

    const [formData, setFormData] = useState({
        monto_capital: '',
        porcentaje_interes: '10',
        tipo_pago: 'semanal',
        duracion_semanas: '4',
        tiene_garantia: false,
        descripcion_garantia: '',
        fecha_inicio: new Date().toISOString().split('T')[0]
    });

    const [calculations, setCalculations] = useState({
        total_interes: 0,
        total_a_pagar: 0,
        monto_cuota: 0,
        fecha_fin: ''
    });

    useEffect(() => {
        if (organizacion?.id) {
            loadClients();
        }
    }, [organizacion?.id]);

    useEffect(() => {
        calculateLoan();
    }, [formData]);

    const loadClients = async () => {
        try {
            const data = await clientService.getAll(organizacion.id);
            setClients(data);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    };

    const calculateLoan = () => {
        const capital = parseFloat(formData.monto_capital) || 0;
        const interesPercent = parseFloat(formData.porcentaje_interes) || 0;
        const semanas = parseInt(formData.duracion_semanas) || 0;

        const totalInteres = capital * (interesPercent / 100);
        const totalPagar = capital + totalInteres;

        let numCuotas = semanas;
        if (formData.tipo_pago === 'quincenal') numCuotas = Math.ceil(semanas / 2);
        if (formData.tipo_pago === 'mensual') numCuotas = Math.ceil(semanas / 4);

        const montoCuota = numCuotas > 0 ? totalPagar / numCuotas : 0;

        // Calcular fecha fin
        const start = new Date(formData.fecha_inicio);
        const end = new Date(start);
        end.setDate(start.getDate() + (semanas * 7));

        setCalculations({
            total_interes: totalInteres,
            total_a_pagar: totalPagar,
            monto_cuota: montoCuota,
            fecha_fin: end.toISOString().split('T')[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClient) {
            toast.error('Por favor selecciona un cliente');
            return;
        }

        try {
            setLoading(true);
            const loanData = {
                organizacion_id: organizacion.id,
                cliente_cedula: selectedClient.cedula,
                monto_capital: parseFloat(formData.monto_capital),
                porcentaje_interes: parseFloat(formData.porcentaje_interes),
                tipo_pago: formData.tipo_pago,
                fecha_inicio: formData.fecha_inicio,
                fecha_fin: calculations.fecha_fin,
                duracion_semanas: parseInt(formData.duracion_semanas),
                total_a_pagar: calculations.total_a_pagar,
                saldo_pendiente: calculations.total_a_pagar,
                estado: 'activo',
                tiene_garantia: formData.tiene_garantia,
                descripcion_garantia: formData.descripcion_garantia,
                creado_por: user?.cedula || 'SISTEMA'
            };

            const newLoan = await loanService.create(loanData);

            if (newLoan && selectedFiles.length > 0) {
                toast.loading('Subiendo fotos de garantía...', { id: 'upload' });

                const uploadPromises = selectedFiles.map(async (file) => {
                    const uploadResult = await storageService.uploadGuaranteePhoto(file, organizacion.id);

                    await storageService.registerDocument({
                        organizacion_id: organizacion.id,
                        tipo_entidad: 'prestamo',
                        entidad_id: newLoan.id,
                        tipo_documento: 'garantia',
                        nombre_archivo: uploadResult.name,
                        url_archivo: uploadResult.url,
                        tamaño_bytes: uploadResult.size,
                        mime_type: uploadResult.type,
                        subido_por: user?.cedula || 'SISTEMA'
                    });
                });

                await Promise.all(uploadPromises);
                toast.success('Fotos subidas correctamente', { id: 'upload' });
            }

            toast.success('Préstamo creado con éxito');

            addNotification({
                title: 'Nuevo Préstamo Registrado',
                message: `Se ha registrado un préstamo de ${loanData.monto_capital.toLocaleString()} ${loanData.moneda || 'USD'} para ${selectedClient.nombre}.`,
                type: 'success'
            });

            navigate('/prestamos');
        } catch (error) {
            console.error('Error creando préstamo:', error);
            toast.error('Error al crear el préstamo');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.nombre.toLowerCase().includes(searchClient.toLowerCase()) ||
        c.cedula.includes(searchClient)
    ).slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-200">
            {/* Header / Safe Area */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-4 pb-4 px-4 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Préstamo</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Paso 1: Seleccionar Cliente */}
                    <Card className="shadow-xl">
                        <div className="flex items-center gap-2 mb-6 text-blue-600 dark:text-blue-400">
                            <UserIcon className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Seleccionar Cliente</h2>
                        </div>

                        {!selectedClient ? (
                            <div className="space-y-4">
                                <Input
                                    placeholder="Buscar por nombre o C.I..."
                                    value={searchClient}
                                    onChange={(e) => setSearchClient(e.target.value)}
                                    icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                                />
                                <div className="space-y-2">
                                    {searchClient && filteredClients.map(client => (
                                        <div
                                            key={client.cedula}
                                            onClick={() => setSelectedClient(client)}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 font-bold">
                                                    {client.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{client.nombre}</p>
                                                    <p className="text-xs text-gray-500">C.I. {client.cedula}</p>
                                                </div>
                                            </div>
                                            <CheckCircleIcon className="w-6 h-6 text-gray-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                                        {selectedClient.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-blue-900 dark:text-blue-100">{selectedClient.nombre}</p>
                                        <p className="text-sm font-bold text-blue-600/70">C.I. {selectedClient.cedula}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedClient(null)}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                >
                                    Cambiar
                                </button>
                            </div>
                        )}
                    </Card>

                    {/* Paso 2: Detalles del Préstamo */}
                    <Card className="shadow-xl">
                        <div className="flex items-center gap-2 mb-6 text-green-600 dark:text-green-400">
                            <BanknotesIcon className="w-6 h-6" />
                            <h2 className="text-lg font-bold">Condiciones del Crédito</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Input
                                    label="Monto Capital ($)"
                                    type="number"
                                    required
                                    value={formData.monto_capital}
                                    onChange={(e) => setFormData({ ...formData, monto_capital: e.target.value })}
                                    placeholder="Ej: 1000"
                                />
                                {parseFloat(formData.monto_capital) > 0 && todayRate && (
                                    <p className="px-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 animate-fadeIn">
                                        ≈ Bs {(parseFloat(formData.monto_capital) * activeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })} Referencia
                                    </p>
                                )}
                            </div>
                            <Input
                                label="Interés (%)"
                                type="number"
                                required
                                value={formData.porcentaje_interes}
                                onChange={(e) => setFormData({ ...formData, porcentaje_interes: e.target.value })}
                            />

                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Frecuencia de Pago</label>
                                <select
                                    value={formData.tipo_pago}
                                    onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="semanal">Semanal</option>
                                    <option value="quincenal">Quincenal</option>
                                    <option value="mensual">Mensual</option>
                                </select>
                            </div>

                            <Input
                                label="Duración (Semanas)"
                                type="number"
                                required
                                value={formData.duracion_semanas}
                                onChange={(e) => setFormData({ ...formData, duracion_semanas: e.target.value })}
                            />

                            <Input
                                label="Fecha de Inicio"
                                type="date"
                                required
                                value={formData.fecha_inicio}
                                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                            />
                        </div>
                    </Card>

                    {/* Paso 3: Garantía (Opcional) */}
                    <Card className="shadow-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.tiene_garantia}
                                onChange={(e) => setFormData({ ...formData, tiene_garantia: e.target.checked })}
                                className="w-6 h-6 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">Este préstamo requiere garantía</p>
                                <p className="text-xs text-gray-500">Activa esta casilla si el cliente entrega algún respaldo</p>
                            </div>
                        </label>

                        {formData.tiene_garantia && (
                            <div className="mt-4 animate-slideDown space-y-4">
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    placeholder="Describe la garantía (ej: Título de vehículo, Factura de laptop...)"
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
                                                    onClick={() => {
                                                        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                                                        setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        setSelectedFiles(prev => [...prev, ...files]);
                                        const newPreviews = files.map(file => URL.createObjectURL(file));
                                        setPhotoPreviews(prev => [...prev, ...newPreviews]);
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-3 p-5 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] hover:border-blue-500 transition-all group"
                                >
                                    <PhotoIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-600">
                                        {selectedFiles.length > 0 ? `Añadir más (${selectedFiles.length} seleccionadas)` : 'Adjuntar Fotos del Bien'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </Card>

                    {/* Resumen Final */}
                    <Card className="shadow-2xl !bg-blue-600 text-white border-none p-8 sticky bottom-4 z-20">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Monto de la Cuota</p>
                                <p className="text-4xl font-black">${calculations.monto_cuota.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Total a Pagar</p>
                                <p className="text-2xl font-black">${calculations.total_a_pagar.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4 text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                Fin: {new Date(calculations.fecha_fin).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <ScaleIcon className="w-4 h-4" />
                                Interés: ${calculations.total_interes.toFixed(2)}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            className="mt-8 !bg-white !text-blue-600 hover:!bg-blue-50 !py-5 shadow-2xl active:scale-95"
                            loading={loading}
                        >
                            Confirmar y Crear Préstamo
                        </Button>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default NuevoPrestamo;
