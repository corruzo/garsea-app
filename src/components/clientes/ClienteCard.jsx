import React from 'react';
import {
    Phone,
    Mail,
    MapPin,
    PencilLine,
    Trash2,
    ChevronRight,
    UserCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const ClienteCard = ({ cliente, onEdit, onDelete, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            onClick={onClick}
            className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-soft hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
        >
            {/* Background Decorative Element */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50 transition-colors">
                        {cliente.foto_url ? (
                            <img src={cliente.foto_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 italic">
                                {cliente.nombre.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {cliente.nombre}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            C.I. {cliente.cedula}
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(cliente);
                        }}
                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors"
                        title="Editar"
                    >
                        <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(cliente);
                        }}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors"
                        title="Desactivar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-3 mb-8 relative z-10">
                {cliente.telefono && (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium tabular-nums">{cliente.telefono}</span>
                    </div>
                )}
                {cliente.direccion && (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium line-clamp-1">{cliente.direccion}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 relative z-10">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full tracking-[0.15em] border ${cliente.activo
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                    {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>

                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    Expediente
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </motion.div>
    );
};

export default ClienteCard;
