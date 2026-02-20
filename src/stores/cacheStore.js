import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de caché global para mejorar el rendimiento
 * Almacena datos que no cambian frecuentemente para evitar recargas innecesarias
 */
export const useCacheStore = create(
    persist(
        (set, get) => ({
            // Caché de clientes
            clients: null,
            clientsTimestamp: null,
            clientsCacheDuration: 5 * 60 * 1000, // 5 minutos

            // Caché de préstamos
            loans: null,
            loansTimestamp: null,
            loansCacheDuration: 3 * 60 * 1000, // 3 minutos

            // Caché de tasas
            rates: null,
            ratesTimestamp: null,
            ratesCacheDuration: 30 * 60 * 1000, // 30 minutos

            // Métodos para clientes
            setClients: (clients) =>
                set({
                    clients,
                    clientsTimestamp: Date.now(),
                }),

            getClients: () => {
                const { clients, clientsTimestamp, clientsCacheDuration } = get();
                const isExpired = !clientsTimestamp || Date.now() - clientsTimestamp > clientsCacheDuration;
                return isExpired ? null : clients;
            },

            invalidateClients: () =>
                set({
                    clients: null,
                    clientsTimestamp: null,
                }),

            // Métodos para préstamos
            setLoans: (loans) =>
                set({
                    loans,
                    loansTimestamp: Date.now(),
                }),

            getLoans: () => {
                const { loans, loansTimestamp, loansCacheDuration } = get();
                const isExpired = !loansTimestamp || Date.now() - loansTimestamp > loansCacheDuration;
                return isExpired ? null : loans;
            },

            invalidateLoans: () =>
                set({
                    loans: null,
                    loansTimestamp: null,
                }),

            // Métodos para tasas
            setRates: (rates) =>
                set({
                    rates,
                    ratesTimestamp: Date.now(),
                }),

            getRates: () => {
                const { rates, ratesTimestamp, ratesCacheDuration } = get();
                const isExpired = !ratesTimestamp || Date.now() - ratesTimestamp > ratesCacheDuration;
                return isExpired ? null : rates;
            },

            invalidateRates: () =>
                set({
                    rates: null,
                    ratesTimestamp: null,
                }),

            // Limpiar todo el caché
            clearCache: () =>
                set({
                    clients: null,
                    clientsTimestamp: null,
                    loans: null,
                    loansTimestamp: null,
                    rates: null,
                    ratesTimestamp: null,
                }),
        }),
        {
            name: 'garsea-cache',
            partialize: (state) => ({
                clients: state.clients,
                clientsTimestamp: state.clientsTimestamp,
                loans: state.loans,
                loansTimestamp: state.loansTimestamp,
                rates: state.rates,
                ratesTimestamp: state.ratesTimestamp,
            }),
        }
    )
);
