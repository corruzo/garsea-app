import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { clientService } from '../services/clientService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ClienteForm from '../components/clientes/ClienteForm';
import {
    ArrowLeftIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CalendarIcon,
    BanknotesIcon,
    UserCircleIcon,
    ClockIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ClienteDetalle = () => {
    const { cedula } = useParams();
    const navigate = useNavigate();
    const { organizacion } = useAuthStore();
    const [cliente, setCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (organizacion?.id && cedula) {
            loadCliente();
        }
    }, [organizacion?.id, cedula]);

    const loadCliente = async () => {
        try {
            setLoading(true);
            const data = await clientService.getByCedula(cedula, organizacion.id);
            setCliente(data);
        } catch (error) {
            console.error('Error cargando detalle del cliente:', error);
            toast.error('No se pudo encontrar el cliente');
            navigate('/clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (formData) => {
        try {
            setLoading(true);
            await clientService.update(cedula, organizacion.id, formData);
            toast.success('Cliente actualizado correctamente');
            setIsEditModalOpen(false);
            await loadCliente();
        } catch (error) {
            console.error('Error actualizando cliente:', error);
            toast.error('Error al actualizar el cliente');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Buscando cliente...</p>
                </div>
            </div>
        );
    }

    if (!cliente) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors duration-200">
            {/* Header / Safe Area */}
            <div className="pt-8 pb-32 bg-blue-600 dark:bg-blue-700 relative">
                <div className="max-w-4xl mx-auto px-4">

                    <div className="flex flex-col md:flex-row md:items-center gap-6 text-white">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white/20 backdrop-blur-xl border-4 border-white/30 flex items-center justify-center text-4xl sm:text-5xl font-bold shadow-2xl">
                            {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">
                                {cliente.nombre}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold">
                                    C.I. {cliente.cedula}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${cliente.activo
                                    ? 'bg-green-400/20 text-green-100'
                                    : 'bg-red-400/20 text-red-100'
                                    }`}>
                                    {cliente.activo ? '● ACTIVO' : '● INACTIVO'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Decorative element or just subtle gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
            </div>

            {/* Informacion Principal */}
            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tarjeta de Contacto */}
                    <Card className="md:col-span-2 shadow-xl border-none">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <UserCircleIcon className="w-6 h-6 text-blue-500" />
                                Información de Contacto
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="!p-2 -mr-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <PencilSquareIcon className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono</p>
                                <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <PhoneIcon className="w-5 h-5 text-blue-500" />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {cliente.telefono || 'No registrado'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
                                <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {cliente.email || 'No registrado'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección</p>
                                <div className="flex items-start gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <MapPinIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {cliente.direccion || 'Sin dirección registrada'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registrado el</p>
                                <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <CalendarIcon className="w-5 h-5 text-purple-500" />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {new Date(cliente.fecha_registro).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Resumen de Préstamos (Placeholder) */}
                    <div className="space-y-6">
                        <Card className="shadow-xl border-none !bg-gradient-to-br !from-gray-900 !to-blue-900 text-white">
                            <h3 className="text-lg font-bold mb-4 opacity-80">Saldo Pendiente</h3>
                            <div className="text-4xl font-black mb-2">$0.00</div>
                            <p className="text-sm opacity-60">0 préstamos activos</p>

                            <Button
                                variant="primary"
                                fullWidth
                                className="mt-6 !bg-white !text-blue-900 hover:!bg-blue-50"
                                onClick={() => navigate('/prestamos')}
                            >
                                <BanknotesIcon className="w-5 h-5" />
                                Nuevo Préstamo
                            </Button>
                        </Card>

                        <Card className="shadow-xl border-none">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notas</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                {cliente.notas || 'No hay notas sobre este cliente.'}
                            </p>
                        </Card>
                    </div>
                </div>

                {/* Seccion de Historial / Prestamos (Placeholder) */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 px-2">
                        <ClockIcon className="w-7 h-7 text-blue-500" />
                        Historial de Préstamos
                    </h2>

                    <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent shadow-none">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <BanknotesIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aún no hay préstamos</h4>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                            Este cliente no tiene historial crediticio registrado en GARSEA.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6"
                            onClick={() => navigate('/prestamos')}
                        >
                            Crear primer préstamo
                        </Button>
                    </Card>
                </div>
            </div>
            {/* Modal de Edición */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Información del Cliente"
            >
                <ClienteForm
                    onSubmit={handleUpdate}
                    initialData={cliente}
                    loading={loading}
                />
            </Modal>
        </div >
    );
};

export default ClienteDetalle;
