import React from 'react';
import { Search, XCircle } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
    icon: Icon = Search,
    title = "Sin resultados",
    description = "Intenta ajustar tus filtros para encontrar lo que buscas.",
    onClear,
    actionLabel = "Limpiar Filtros"
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                {title}
            </h3>
            <p className="text-sm font-bold text-slate-400 text-center max-w-xs mb-8 leading-relaxed">
                {description}
            </p>
            {onClear && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onClear}
                    icon={<XCircle size={14} />}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
