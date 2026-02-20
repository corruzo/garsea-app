import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLoans } from '../hooks/useLoans';
import PrestamoCard from '../components/prestamos/PrestamoCard';
import PrestamoForm from '../components/prestamos/PrestamoForm';
import { storageService } from '../services/storageService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'; // Removed unnecessary icons since ArrowLeftIcon was unused in view

const Prestamos = () => {
  const { organizacion } = useAuthStore();
  const navigate = useNavigate();
  const { loans, loading, createLoan, refreshLoans } = useLoans(organizacion?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateLoan = async (loanData, files) => {
    try {
      const newLoan = await createLoan(loanData);

      if (newLoan && files && files.length > 0) {
        toast.loading('Subiendo fotos de garantía...', { id: 'upload' });

        const uploadPromises = files.map(async (file) => {
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
        refreshLoans(); // Refresh to show everything
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error en el proceso de creación:', error);
      toast.error('Error al procesar el préstamo o las fotos');
    }
  };

  const filteredPrestamos = loans.filter(p => {
    const matchesSearch = p.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente_cedula.includes(searchTerm);
    const matchesStatus = filterStatus === 'todos' || p.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    activos: loans.filter(p => p.estado === 'activo').length,
    atrasados: loans.filter(p => p.estado === 'atrasado').length,
    pagados: loans.filter(p => p.estado === 'pagado').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BanknotesIcon className="w-8 h-8 text-green-500" />
                  Préstamos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loans.length} registrados en total
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 shadow-lg shadow-green-500/20 !bg-green-600 hover:!bg-green-700"
            >
              <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden xs:inline">Nuevo Préstamo</span>
              <span className="xs:hidden">Nuevo</span>
            </Button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar cliente por nombre o C.I..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                className="!py-2"
              />
            </div>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-x-auto no-scrollbar">
              {[
                { id: 'todos', label: 'Todos', icon: BanknotesIcon },
                { id: 'activo', label: 'Activos', icon: ClockIcon },
                { id: 'atrasado', label: 'Atrasados', icon: ExclamationCircleIcon },
                { id: 'pagado', label: 'Pagados', icon: CheckCircleIcon },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all active:scale-95
                                        ${filterStatus === f.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                                    `}
                >
                  <f.icon className="w-4 h-4" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats on Mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-500/10 p-3 rounded-2xl text-center">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Activos</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">{stats.activos}</p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-2xl text-center">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Atrasados</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300">{stats.atrasados}</p>
          </div>
          <div className="bg-green-500/10 p-3 rounded-2xl text-center">
            <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Pagados</p>
            <p className="text-xl font-black text-green-700 dark:text-green-300">{stats.pagados}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando préstamos...</p>
          </div>
        ) : filteredPrestamos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredPrestamos.map((p) => (
              <PrestamoCard
                key={p.id}
                prestamo={p}
                onClick={() => navigate(`/prestamos/${p.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <BanknotesIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {searchTerm ? 'No se encontraron resultados' : 'No hay préstamos registrados'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? 'Prueba con otros términos de búsqueda'
                : 'Comienza creando tu primer contrato de préstamo'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="mt-6"
                variant="outline"
              >
                Crear Préstamo
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Nuevo Préstamo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Préstamo"
      >
        <PrestamoForm
          onSubmit={handleCreateLoan}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Prestamos;
