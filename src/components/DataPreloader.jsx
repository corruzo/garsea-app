import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useRateStore } from '../stores/rateStore';
import { useNotificationStore } from '../stores/notificationStore';
import { clientService } from '../services/clientService';
import { loanService } from '../services/loanService';
import { cobranzaService } from '../services/cobranzaService';

/**
 * Componente invisible que precarga datos en segundo plano
 * para mejorar el rendimiento de la aplicación y generar alertas
 */
export default function DataPreloader() {
    const { organizacion } = useAuthStore();
    const { fetchTodayRate } = useRateStore();
    const { notifications, addNotification } = useNotificationStore();

    useEffect(() => {
        if (!organizacion?.id) return;

        // Función para precargar datos y generar alertas
        const preloadData = async () => {
            try {
                // Precargar clientes y préstamos en paralelo
                const [clients, loans] = await Promise.all([
                    clientService.getAll(organizacion.id),
                    loanService.getAll(organizacion.id),
                    fetchTodayRate(organizacion.id)
                ]);

                // Generar alertas de cobranza
                if (loans && loans.length > 0) {
                    const alertas = cobranzaService.generarAlertas(loans);

                    alertas.forEach(alerta => {
                        // Evitar duplicados revisando si ya existe una notificación idéntica no leída
                        const exists = notifications.some(n =>
                            n.title === alerta.titulo &&
                            n.message === alerta.mensaje &&
                            !n.read
                        );

                        if (!exists) {
                            addNotification({
                                title: alerta.titulo,
                                message: alerta.mensaje,
                                type: alerta.tipo, // 'warning' | 'error'
                                date: new Date().toISOString()
                            });
                        }
                    });
                }


            } catch (error) {
                console.error('Error precargando datos:', error);
            }
        };

        // Precargar inmediatamente
        preloadData();

        // Recargar datos cada 5 minutos
        const interval = setInterval(preloadData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [organizacion?.id, fetchTodayRate, addNotification]); // Removed notifications to avoid loops

    return null;
}
