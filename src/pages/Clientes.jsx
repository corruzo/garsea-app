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
  Users,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Clientes = () => {
  const { user, organizacion } = useAuthStore();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [filterActive, setFilterActive] = useState('activos');

  useEffect(() => {
    if (organizacion?.id) loadClientes();
  }, [organizacion?.id]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll(organizacion.id);
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      setLoading(true);
      if (editingCliente) {
        await clientService.update(editingCliente.cedula, organizacion.id, formData);
        toast.success('Cliente actualizado');
      } else {
        await clientService.create({ ...formData, organizacion_id: organizacion.id, creado_por: user.cedula });
        toast.success('Cliente registrado');
      }
      setIsModalOpen(false);
      setEditingCliente(null);
      await loadClientes();
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cliente) => {
    if (window.confirm(`¿Desea desactivar a ${cliente.nombre}?`)) {
      try {
        setLoading(true);
        await clientService.delete(cliente.cedula, organizacion.id);
        toast.success('Cliente desactivado');
        await loadClientes();
      } catch (error) {
        toast.error('No se pudo desactivar');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.cedula.includes(searchTerm);
    const matchesFilter = filterActive === 'todos' || (filterActive === 'activos' ? c.activo : !c.activo);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20 animate-fadeIn transition-colors">
      <header className="px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <ChevronLeft className="w-6 h-6 text-slate-400" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Directorio Clientes</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                  {clientes.length} Registros totales
                </p>
              </div>
            </div>
            <Button
              onClick={() => { setEditingCliente(null); setIsModalOpen(true); }}
              size="md"
              icon={<UserPlus size={18} />}
            >
              NUEVO CLIENTE
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={18} className="text-slate-400" />}
                className="!mb-0"
              />
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {['todos', 'activos', 'inactivos'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterActive(f)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filterActive === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {f === 'todos' ? 'Ver Todos' : f === 'activos' ? 'Activos' : 'Inactivos'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-4">
        {loading && clientes.length === 0 ? (
          <div className="text-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" /></div>
        ) : filteredClientes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClientes.map((cliente) => (
              <ClienteCard
                key={cliente.cedula}
                cliente={cliente}
                onEdit={(c) => { setEditingCliente(c); setIsModalOpen(true); }}
                onDelete={handleDelete}
                onClick={() => navigate(`/clientes/${cliente.cedula}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Sin resultados</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">No se encontraron clientes para esta búsqueda.</p>
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCliente(null); }}
        title={editingCliente ? 'Actualizar Cliente' : 'Registrar Cliente'}
      >
        <ClienteForm onSubmit={handleCreateOrUpdate} initialData={editingCliente} loading={loading} />
      </Modal>
    </div>
  );
};

export default Clientes;
