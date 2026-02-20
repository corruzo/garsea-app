import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { clientService } from '../services/clientService';
import ClienteCard from '../components/clientes/ClienteCard';
import ClienteForm from '../components/clientes/ClienteForm';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import {
  UserPlus,
  Search,
  Filter,
  ArrowLeft,
  Users,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useNotificationStore } from '../stores/notificationStore';

const Clientes = () => {
  const { user, organizacion } = useAuthStore();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [filterActive, setFilterActive] = useState('todos'); // 'todos', 'activos', 'inactivos'

  useEffect(() => {
    if (organizacion?.id) {
      loadClientes();
    }
  }, [organizacion?.id]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll(organizacion.id);
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      setLoading(true);
      if (editingCliente) {
        await clientService.update(editingCliente.cedula, organizacion.id, formData);
        toast.success('Cliente actualizado correctamente');
        addNotification({
          title: 'Cliente Actualizado',
          message: `Los datos de ${formData.nombre} han sido actualizados.`,
          type: 'info'
        });
      } else {
        await clientService.create({
          ...formData,
          organizacion_id: organizacion.id,
          creado_por: user.cedula
        });
        toast.success('Cliente registrado correctamente');
        addNotification({
          title: 'Nuevo Cliente',
          message: `Se ha registrado al cliente ${formData.nombre} exitosamente.`,
          type: 'success'
        });
      }
      setIsModalOpen(false);
      setEditingCliente(null);
      await loadClientes();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      toast.error(error.message || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cliente) => {
    if (window.confirm(`¿Estás seguro de desactivar al cliente ${cliente.nombre}?`)) {
      try {
        setLoading(true);
        await clientService.delete(cliente.cedula, organizacion.id);
        toast.success('Cliente desactivado correctamente');
        addNotification({
          title: 'Cliente Desactivado',
          message: `El cliente ${cliente.nombre} ha sido marcado como inactivo.`,
          type: 'warning'
        });
        await loadClientes();
      } catch (error) {
        console.error('Error desactivando cliente:', error);
        toast.error('Error al desactivar el cliente');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula.includes(searchTerm);
    const matchesFilter = filterActive === 'todos' ||
      (filterActive === 'activos' ? c.activo : !c.activo);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen transition-colors duration-500 pb-32">
      {/* Header Premium */}
      <header className="pt-4 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                  Clientes
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
                  {clientes.length} Gestiones registradas
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingCliente(null);
                setIsModalOpen(true);
              }}
              className="group flex items-center justify-center gap-3 !rounded-2xl !py-4 !px-8 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              <span className="font-black text-sm uppercase tracking-widest">Nuevo Cliente</span>
            </Button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />}
                className="!py-4 !rounded-2xl shadow-soft !bg-white/50 dark:!bg-slate-800/50 backdrop-blur-sm focus-within:!ring-indigo-500 transition-all font-bold placeholder:font-medium"
              />
            </div>
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto scrollbar-none shadow-inner">
              {['todos', 'activos', 'inactivos'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterActive(f)}
                  className={`
                    px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap
                    ${filterActive === f
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                  `}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
              Cargando clientes...
            </p>
          </div>
        ) : filteredClientes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClientes.map((cliente) => (
              <ClienteCard
                key={cliente.cedula}
                cliente={cliente}
                onEdit={(c) => {
                  setEditingCliente(c);
                  setIsModalOpen(true);
                }}
                onDelete={handleDelete}
                onClick={() => navigate(`/clientes/${cliente.cedula}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No se encontraron clientes
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza registrando tu primer cliente'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="mt-6"
                variant="outline"
              >
                Registrar Cliente
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCliente(null);
        }}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <ClienteForm
          onSubmit={handleCreateOrUpdate}
          initialData={editingCliente}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Clientes;
