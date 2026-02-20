import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
    persist(
        (set, get) => ({
            notifications: [
                {
                    id: 'welcome',
                    title: 'Bienvenido a Garsea App',
                    message: 'El sistema de gestión financiera está listo para operar.',
                    type: 'info', // info, success, warning, error
                    date: new Date().toISOString(),
                    read: false
                }
            ],

            addNotification: (notification) => {
                const newNotification = {
                    id: Math.random().toString(36).substring(7),
                    date: new Date().toISOString(),
                    read: false,
                    ...notification
                };
                set((state) => ({
                    notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
                }));
            },

            markAsRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                }));
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true }))
                }));
            },

            clearAll: () => {
                set({ notifications: [] });
            }
        }),
        {
            name: 'garsea-notifications'
        }
    )
);
