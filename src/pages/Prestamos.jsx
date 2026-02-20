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
  Plus,
  Search,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../components/ui/EmptyState';

const Prestamos = () => {
  const { organizacion, user } = useAuthStore();
  const navigate = useNavigate();
  const { loans, loading, createLoan, refreshLoans } = useLoans(organizacion?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateLoan = async (loanData, files) => {
    try {
      const newLoan = await createLoan(loanData);
      if (newLoan && files && files.length > 0) {
        toast.loading('Subiendo fotos...', { id: 'upload' });
        const uploadPromises = files.map(async (file) => {
          const uploadResult = await storageService.uploadGuaranteePhoto(file, organizacion.id);
          await storageService.registerDocument({
            organizacion_id: organizacion.id, tipo_entidad: 'prestamo', entidad_id: newLoan.id, tipo_documento: 'garantia',
            nombre_archivo: uploadResult.name, url_archivo: uploadResult.url, tamaño_bytes: uploadResult.size,
            mime_type: uploadResult.type, subido_por: user?.cedula || 'SISTEMA'
          });
        });
        await Promise.all(uploadPromises);
        toast.success('Préstamo creado', { id: 'upload' });
        refreshLoans();
      }
      setIsModalOpen(false);
    } catch (error) { toast.error('Error al procesar'); }
  };

  const filteredPrestamos = loans.filter(p => {
    const matchesSearch = p.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || p.cliente_cedula.includes(searchTerm);
    const matchesStatus = filterStatus === 'todos' || p.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    activos: loans.filter(p => p.estado === 'activo').length,
    atrasados: loans.filter(p => p.estado === 'atrasado').length,
    pagados: loans.filter(p => p.estado === 'pagado').length,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20 animate-fadeIn transition-colors">
      <header className="px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">Gestión Préstamos</h1>
                <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 truncate">
                  Contratos vigentes
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              icon={<Plus size={18} />}
              className="!rounded-full md:!rounded-[1.25rem] px-3 md:px-6 flex-shrink-0"
            >
              <span className="hidden md:inline">NUEVO PRÉSTAMO</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por cliente o C.I..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={18} className="text-slate-400" />}
                className="!mb-0"
              />
            </div>
            <div className="md:col-span-2 flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
              {[
                { id: 'todos', label: 'Todos', icon: Banknote },
                { id: 'activo', label: 'Activos', icon: Clock },
                { id: 'atrasado', label: 'Atrasos', icon: AlertCircle },
                { id: 'pagado', label: 'Pagados', icon: CheckCircle },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === f.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <f.icon className="w-4 h-4" />
                  <span className="hidden lg:block">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Resumen de Estados Equilibrado */}
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ACTIVOS', count: stats.activos, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'ATRASOS', count: stats.atrasados, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'PAGADOS', count: stats.pagados, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
        ].map((s) => (
          <div key={s.label} className={`${s.bg} p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${s.color} opacity-80 mb-1`}>{s.label}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>

      <main className="max-w-5xl mx-auto px-6 py-4">
        {loading && loans.length === 0 ? (
          <div className="text-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" /></div>
        ) : filteredPrestamos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrestamos.map((p) => (
              <PrestamoCard key={p.id} prestamo={p} onClick={() => navigate(`/prestamos/${p.id}`)} />
            ))}
          </div>
        ) : (
          <EmptyState
            onClear={() => { setSearchTerm(''); setFilterStatus('todos'); }}
            description="No hay préstamos que coincidan con el estado o cliente seleccionado."
          />
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Préstamo">
        <PrestamoForm onSubmit={handleCreateLoan} loading={loading} />
      </Modal>
    </div>
  );
};

export default Prestamos;
