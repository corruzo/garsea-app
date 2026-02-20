import React from 'react';
import {
    Phone,
    PencilLine,
    Trash2,
    ChevronRight,
    User
} from 'lucide-react';
import Card from '../ui/Card';

const ClienteCard = ({ cliente, onEdit, onDelete, onClick }) => {
    return (
        <Card
            onClick={onClick}
            hover
            className="group relative !p-6 animate-fadeIn"
        >
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        {cliente.foto_url ? (
                            <img src={cliente.foto_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <User className="w-6 h-6 text-indigo-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors">
                            {cliente.nombre}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            C.I. {cliente.cedula}
                        </p>
                    </div>
                </div>

                <div className={`text-[9px] font-black px-2 py-0.5 rounded-lg tracking-wider border ${cliente.activo
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800'
                    }`}>
                    {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {cliente.telefono && (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold tabular-nums">{cliente.telefono}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(cliente); }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                        title="Editar"
                    >
                        <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(cliente); }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                        title="Borrar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    Expediente
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </Card>
    );
};

export default ClienteCard;
