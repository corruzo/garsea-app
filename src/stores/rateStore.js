import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rateService } from '../services/rateService';
import { useOfflineStore } from './offlineStore';

export const useRateStore = create(
    persist(
        (set, get) => ({
            todayRate: null,
            lastFetchedRate: null,
            history: [],
            loading: false,
            error: null,

            fetchTodayRate: async (organizacionId) => {
                if (!organizacionId) return;

                const isOnline = useOfflineStore.getState().isOnline;

                // Si estamos offline, usar la última tasa guardada
                if (!isOnline) {
                    const lastRate = get().lastFetchedRate;
                    if (lastRate) {

                        set({ todayRate: lastRate });
                        return;
                    }
                }

                set({ loading: true, error: null });
                try {
                    const rate = await rateService.getTodayRate(organizacionId);
                    set({
                        todayRate: rate,
                        lastFetchedRate: rate, // Guardar para uso offline
                        loading: false
                    });
                } catch (error) {
                    // Si falla la petición, usar la última tasa guardada
                    const lastRate = get().lastFetchedRate;
                    if (lastRate) {

                        set({ todayRate: lastRate, loading: false });
                    } else {
                        set({ error: error.message, loading: false });
                    }
                }
            },

            fetchHistory: async (organizacionId) => {
                if (!organizacionId) return;
                try {
                    const data = await rateService.getHistory(organizacionId);
                    set({ history: data });
                } catch (error) {
                    console.error('Error fetching history:', error);
                }
            },

            setTodayRate: (rate) => set({ todayRate: rate, lastFetchedRate: rate }),

            // Helper para obtener la tasa activa según preferencia
            getActiveRate: (pref = 'USD') => {
                const rate = get().todayRate;
                if (!rate) return 0;

                switch (pref) {
                    case 'EUR':
                        return rate.tasa_euro || rate.tasa_dolar;
                    case 'PERSONALIZADA':
                        return rate.tasa_personalizada || rate.tasa_dolar;
                    case 'USD':
                    default:
                        return rate.tasa_dolar;
                }
            },

            // Helper para convertir montos
            convertToVES: (amountUSD, pref = 'USD') => {
                const currentTasa = get().getActiveRate(pref);
                return amountUSD * currentTasa;
            },

            convertToUSD: (amountVES, pref = 'USD') => {
                const currentTasa = get().getActiveRate(pref);
                return currentTasa > 0 ? amountVES / currentTasa : 0;
            }
        }),
        {
            name: 'garsea-rates',
            partialize: (state) => ({
                lastFetchedRate: state.lastFetchedRate,
            }),
        }
    )
);
