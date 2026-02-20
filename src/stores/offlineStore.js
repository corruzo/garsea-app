import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para manejar el estado de conexión y modo offline
 */
export const useOfflineStore = create(
    persist(
        (set, get) => ({
            isOnline: navigator.onLine,
            lastSync: null,
            pendingChanges: [],

            // Actualizar estado de conexión
            setOnline: (status) => set({ isOnline: status }),

            // Agregar cambio pendiente para sincronizar cuando haya conexión
            addPendingChange: (change) =>
                set((state) => ({
                    pendingChanges: [...state.pendingChanges, { ...change, timestamp: Date.now() }],
                })),

            // Remover cambio pendiente después de sincronizar
            removePendingChange: (id) =>
                set((state) => ({
                    pendingChanges: state.pendingChanges.filter((c) => c.id !== id),
                })),

            // Limpiar todos los cambios pendientes
            clearPendingChanges: () => set({ pendingChanges: [] }),

            // Actualizar timestamp de última sincronización
            updateLastSync: () => set({ lastSync: Date.now() }),

            // Obtener número de cambios pendientes
            getPendingCount: () => get().pendingChanges.length,
        }),
        {
            name: 'garsea-offline',
            partialize: (state) => ({
                lastSync: state.lastSync,
                pendingChanges: state.pendingChanges,
            }),
        }
    )
);

// Listener para detectar cambios en la conexión
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useOfflineStore.getState().setOnline(true);

    });

    window.addEventListener('offline', () => {
        useOfflineStore.getState().setOnline(false);

    });
}
