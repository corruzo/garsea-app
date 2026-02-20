import { useEffect, useState } from 'react';
import { useOfflineStore } from '../stores/offlineStore';
import { WifiOff, CloudSync } from 'lucide-react';

/**
 * Componente que muestra el estado de conexión refinado
 */
export default function ConnectionIndicator() {
    const isOnline = useOfflineStore((state) => state.isOnline);
    const pendingChanges = useOfflineStore((state) => state.pendingChanges);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setShowIndicator(true);
        } else if (pendingChanges.length > 0) {
            setShowIndicator(true);
            const timer = setTimeout(() => {
                if (pendingChanges.length === 0) setShowIndicator(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowIndicator(false);
        }
    }, [isOnline, pendingChanges.length]);

    if (!showIndicator) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hidden lg:block">Sistema Conectado</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm animate-fadeIn ${isOnline
            ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
            : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
            }`}>
            {isOnline ? (
                <>
                    <CloudSync className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando ({pendingChanges.length})</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Modo Local</span>
                </>
            )}
        </div>
    );
}
