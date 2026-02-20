import { differenceInDays, addDays, parseISO, isBefore, isAfter } from 'date-fns';

/**
 * Servicio para análisis de cobranza y estados de préstamos
 */

export const cobranzaService = {
    /**
     * Calcula el estado de cobranza de un préstamo
     */
    getEstadoCobranza(prestamo) {
        if (prestamo.estado === 'pagado') {
            return {
                estado: 'pagado',
                label: 'Pagado',
                color: 'green',
                prioridad: 0,
                diasVencido: 0
            };
        }

        const hoy = new Date();
        const fechaProximoPago = this.calcularProximaFechaPago(prestamo);

        if (!fechaProximoPago) {
            return {
                estado: 'sin_cuotas',
                label: 'Sin cuotas programadas',
                color: 'gray',
                prioridad: 0,
                diasVencido: 0
            };
        }

        const diasHastaVencimiento = differenceInDays(fechaProximoPago, hoy);

        // Vencido (más de 0 días de retraso)
        if (diasHastaVencimiento < 0) {
            const diasVencido = Math.abs(diasHastaVencimiento);

            // En mora (más de 7 días vencido)
            if (diasVencido > 7) {
                return {
                    estado: 'en_mora',
                    label: 'En Mora',
                    color: 'red',
                    prioridad: 4,
                    diasVencido,
                    fechaVencimiento: fechaProximoPago
                };
            }

            // Vencido (1-7 días)
            return {
                estado: 'vencido',
                label: 'Vencido',
                color: 'orange',
                prioridad: 3,
                diasVencido,
                fechaVencimiento: fechaProximoPago
            };
        }

        // Por vencer (próximos 3 días)
        if (diasHastaVencimiento <= 3) {
            return {
                estado: 'por_vencer',
                label: 'Por Vencer',
                color: 'yellow',
                prioridad: 2,
                diasVencido: 0,
                diasRestantes: diasHastaVencimiento,
                fechaVencimiento: fechaProximoPago
            };
        }

        // Al día
        return {
            estado: 'al_dia',
            label: 'Al Día',
            color: 'blue',
            prioridad: 1,
            diasVencido: 0,
            diasRestantes: diasHastaVencimiento,
            fechaVencimiento: fechaProximoPago
        };
    },

    /**
     * Calcula la próxima fecha de pago según el tipo de pago
     */
    calcularProximaFechaPago(prestamo) {
        if (!prestamo.fecha_inicio) return null;

        const fechaInicio = parseISO(prestamo.fecha_inicio);
        const hoy = new Date();
        let diasPorPeriodo;

        switch (prestamo.tipo_pago) {
            case 'semanal':
                diasPorPeriodo = 7;
                break;
            case 'quincenal':
                diasPorPeriodo = 15;
                break;
            case 'mensual':
                diasPorPeriodo = 30;
                break;
            default:
                diasPorPeriodo = 7;
        }

        // Calcular cuántos períodos han pasado
        const diasTranscurridos = differenceInDays(hoy, fechaInicio);
        const periodosTranscurridos = Math.floor(diasTranscurridos / diasPorPeriodo);

        // Próxima fecha de pago
        const proximaFecha = addDays(fechaInicio, (periodosTranscurridos + 1) * diasPorPeriodo);

        // Si ya pasó la fecha fin, no hay próximo pago
        if (prestamo.fecha_fin && isAfter(proximaFecha, parseISO(prestamo.fecha_fin))) {
            return parseISO(prestamo.fecha_fin);
        }

        return proximaFecha;
    },

    /**
     * Obtiene todos los préstamos que requieren atención
     */
    getPrestamosQueRequierenAtencion(prestamos) {
        return prestamos
            .map(p => ({
                ...p,
                estadoCobranza: this.getEstadoCobranza(p)
            }))
            .filter(p => ['por_vencer', 'vencido', 'en_mora'].includes(p.estadoCobranza.estado))
            .sort((a, b) => b.estadoCobranza.prioridad - a.estadoCobranza.prioridad);
    },

    /**
     * Calcula métricas de cobranza
     */
    calcularMetricas(prestamos) {
        const prestamosActivos = prestamos.filter(p => p.estado === 'activo');

        const metricas = {
            total: prestamosActivos.length,
            alDia: 0,
            porVencer: 0,
            vencidos: 0,
            enMora: 0,
            tasaMorosidad: 0,
            montoEnMora: 0,
            montoVencido: 0,
            montoTotal: 0
        };

        prestamosActivos.forEach(prestamo => {
            const estado = this.getEstadoCobranza(prestamo);
            metricas.montoTotal += prestamo.saldo_pendiente || 0;

            switch (estado.estado) {
                case 'al_dia':
                    metricas.alDia++;
                    break;
                case 'por_vencer':
                    metricas.porVencer++;
                    break;
                case 'vencido':
                    metricas.vencidos++;
                    metricas.montoVencido += prestamo.saldo_pendiente || 0;
                    break;
                case 'en_mora':
                    metricas.enMora++;
                    metricas.montoEnMora += prestamo.saldo_pendiente || 0;
                    break;
            }
        });

        // Calcular tasa de morosidad
        if (metricas.total > 0) {
            metricas.tasaMorosidad = ((metricas.vencidos + metricas.enMora) / metricas.total) * 100;
        }

        return metricas;
    },

    /**
     * Genera alertas de cobranza
     */
    generarAlertas(prestamos) {
        const alertas = [];
        const hoy = new Date();

        prestamos.forEach(prestamo => {
            const estado = this.getEstadoCobranza(prestamo);

            if (estado.estado === 'por_vencer') {
                alertas.push({
                    tipo: 'warning',
                    prioridad: 'media',
                    titulo: `Pago próximo a vencer`,
                    mensaje: `El préstamo de ${prestamo.clientes?.nombre || 'Cliente'} vence en ${estado.diasRestantes} día(s)`,
                    prestamoId: prestamo.id,
                    prestamo: prestamo,
                    fecha: hoy,
                    accion: 'recordar_pago'
                });
            }

            if (estado.estado === 'vencido') {
                alertas.push({
                    tipo: 'error',
                    prioridad: 'alta',
                    titulo: `Pago vencido`,
                    mensaje: `El préstamo de ${prestamo.clientes?.nombre || 'Cliente'} tiene ${estado.diasVencido} día(s) de retraso`,
                    prestamoId: prestamo.id,
                    prestamo: prestamo,
                    fecha: hoy,
                    accion: 'contactar_cliente'
                });
            }

            if (estado.estado === 'en_mora') {
                alertas.push({
                    tipo: 'error',
                    prioridad: 'critica',
                    titulo: `Préstamo en mora`,
                    mensaje: `El préstamo de ${prestamo.clientes?.nombre || 'Cliente'} está en mora con ${estado.diasVencido} día(s) de retraso`,
                    prestamoId: prestamo.id,
                    prestamo: prestamo,
                    fecha: hoy,
                    accion: 'gestion_cobranza'
                });
            }
        });

        return alertas.sort((a, b) => {
            const prioridades = { critica: 3, alta: 2, media: 1, baja: 0 };
            return prioridades[b.prioridad] - prioridades[a.prioridad];
        });
    }
};
