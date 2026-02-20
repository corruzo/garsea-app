import { useEffect, useState } from 'react';
import { useOfflineStore } from '../stores/offlineStore';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

/**
 * Componente que muestra el estado de conexión
 */
export default function ConnectionIndicator() {
    const isOnline = useOfflineStore((state) => state.isOnline);
    const pendingChanges = useOfflineStore((state) => state.pendingChanges);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        // Mostrar indicador si está offline o hay cambios pendientes
        setShowIndicator(!isOnline || pendingChanges.length > 0);
    }, [isOnline, pendingChanges]);



    if (!showIndicator) {
        return null;
    }

    return (
        <div className="fixed bottom-24 left-4 z-50 pointer-events-none">
            <div className="pointer-events-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-fadeIn">
                {isOnline ? (
                    <>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <WifiIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Sincronizando...
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {pendingChanges.length} cambio{pendingChanges.length !== 1 ? 's' : ''} pendiente{pendingChanges.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                            <SignalSlashIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Modo Offline
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Usando datos guardados
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
