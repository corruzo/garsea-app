import { parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, format, differenceInDays } from 'date-fns';

/**
 * Servicio para análisis y métricas avanzadas
 */

export const analyticsService = {
    /**
     * Calcula la rentabilidad de cada préstamo
     */
    calcularRentabilidadPorPrestamo(prestamos, pagos) {
        return prestamos.map(prestamo => {
            const pagosPrestamo = pagos.filter(p => p.prestamo_id === prestamo.id);
            const totalPagado = pagosPrestamo.reduce((sum, p) => sum + (p.monto_abonado || 0), 0);
            const capitalPrestado = prestamo.monto_capital || 0;
            const interesEsperado = prestamo.total_interes || 0;
            const interesRecibido = totalPagado - Math.min(totalPagado, capitalPrestado);

            const rentabilidad = capitalPrestado > 0 ? (interesRecibido / capitalPrestado) * 100 : 0;
            const progreso = prestamo.total_a_pagar > 0
                ? ((prestamo.total_a_pagar - prestamo.saldo_pendiente) / prestamo.total_a_pagar) * 100
                : 0;

            return {
                prestamoId: prestamo.id,
                clienteNombre: prestamo.clientes?.nombre || 'Desconocido',
                capitalPrestado,
                totalPagado,
                saldoPendiente: prestamo.saldo_pendiente || 0,
                interesEsperado,
                interesRecibido,
                rentabilidad,
                progreso,
                estado: prestamo.estado,
                moneda: prestamo.moneda
            };
        });
    },

    /**
     * Calcula proyección de ingresos
     */
    calcularProyeccionIngresos(prestamos, mesesProyeccion = 6) {
        const hoy = new Date();
        const proyeccion = [];

        for (let i = 0; i < mesesProyeccion; i++) {
            const mesInicio = startOfMonth(new Date(hoy.getFullYear(), hoy.getMonth() + i, 1));
            const mesFin = endOfMonth(mesInicio);

            let ingresoProyectadoUSD = 0;
            let ingresoProyectadoVES = 0;

            prestamos.filter(p => p.estado === 'activo').forEach(prestamo => {
                const fechaInicio = parseISO(prestamo.fecha_inicio);
                const fechaFin = parseISO(prestamo.fecha_fin);

                // Si el préstamo está activo en este mes
                if (fechaInicio <= mesFin && fechaFin >= mesInicio) {
                    const montoCuota = prestamo.monto_cuota || 0;
                    let cuotasEnMes = 0;

                    switch (prestamo.tipo_pago) {
                        case 'semanal':
                            cuotasEnMes = 4;
                            break;
                        case 'quincenal':
                            cuotasEnMes = 2;
                            break;
                        case 'mensual':
                            cuotasEnMes = 1;
                            break;
                    }

                    const ingresoMes = montoCuota * cuotasEnMes;

                    if (prestamo.moneda === 'USD') {
                        ingresoProyectadoUSD += ingresoMes;
                    } else {
                        ingresoProyectadoVES += ingresoMes;
                    }
                }
            });

            proyeccion.push({
                mes: format(mesInicio, 'MMM yyyy'),
                mesNumero: mesInicio.getMonth() + 1,
                año: mesInicio.getFullYear(),
                ingresoUSD: ingresoProyectadoUSD,
                ingresoVES: ingresoProyectadoVES,
                fecha: mesInicio
            });
        }

        return proyeccion;
    },

    /**
     * Identifica clientes más rentables
     */
    identificarClientesMasRentables(clientes, prestamos, pagos, limite = 10) {
        const clientesConMetricas = clientes.map(cliente => {
            const prestamosCliente = prestamos.filter(p => p.cliente_cedula === cliente.cedula);
            const pagosCliente = pagos.filter(p =>
                prestamosCliente.some(pr => pr.id === p.prestamo_id)
            );

            const totalPrestado = prestamosCliente.reduce((sum, p) => sum + (p.monto_capital || 0), 0);
            const totalPagado = pagosCliente.reduce((sum, p) => sum + (p.monto_abonado || 0), 0);
            const totalInteres = prestamosCliente.reduce((sum, p) => sum + (p.total_interes || 0), 0);
            const saldoPendiente = prestamosCliente.reduce((sum, p) => sum + (p.saldo_pendiente || 0), 0);

            const rentabilidad = totalPrestado > 0 ? ((totalPagado - totalPrestado) / totalPrestado) * 100 : 0;
            const tasaPago = totalPrestado > 0 ? (totalPagado / (totalPrestado + totalInteres)) * 100 : 0;

            return {
                cedula: cliente.cedula,
                nombre: cliente.nombre,
                totalPrestamos: prestamosCliente.length,
                totalPrestado,
                totalPagado,
                totalInteres,
                saldoPendiente,
                rentabilidad,
                tasaPago,
                score: rentabilidad * 0.6 + tasaPago * 0.4 // Score ponderado
            };
        });

        return clientesConMetricas
            .sort((a, b) => b.score - a.score)
            .slice(0, limite);
    },

    /**
     * Analiza tendencias de pagos
     */
    analizarTendenciasPagos(pagos, tasaDolar = 1, meses = 6) {
        const hoy = new Date();
        const mesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - meses, 1);

        const mesesIntervalo = eachMonthOfInterval({
            start: mesesAtras,
            end: hoy
        });

        return mesesIntervalo.map(mes => {
            const mesInicio = startOfMonth(mes);
            const mesFin = endOfMonth(mes);

            const pagosDelMes = pagos.filter(p => {
                const fechaPago = parseISO(p.fecha_pago);
                return fechaPago >= mesInicio && fechaPago <= mesFin;
            });

            const totalPagosUSD = pagosDelMes
                .filter(p => p.moneda_pago === 'USD')
                .reduce((sum, p) => sum + (p.monto_abonado || 0), 0);

            const totalPagosVES = pagosDelMes
                .filter(p => p.moneda_pago === 'VES' || p.moneda_pago === 'BS')
                .reduce((sum, p) => sum + (p.monto_abonado || 0), 0);

            return {
                mes: format(mes, 'MMM yyyy'),
                mesNumero: mes.getMonth() + 1,
                año: mes.getFullYear(),
                cantidadPagos: pagosDelMes.length,
                totalUSD: totalPagosUSD,
                totalVES: totalPagosVES,
                totalCombinadoUSD: totalPagosUSD + (totalPagosVES / tasaDolar),
                totalCombinadoVES: totalPagosVES + (totalPagosUSD * tasaDolar)
            };
        });
    },

    /**
     * Calcula evolución de cartera
     */
    calcularEvolucionCartera(prestamos, pagos, tasaDolar = 1, meses = 12) {
        const hoy = new Date();
        const mesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - meses, 1);

        const mesesIntervalo = eachMonthOfInterval({
            start: mesesAtras,
            end: hoy
        });

        return mesesIntervalo.map(mes => {
            const mesFin = endOfMonth(mes);

            const prestamosActivos = prestamos.filter(p => {
                const fechaInicio = parseISO(p.fecha_inicio);
                const fechaFin = p.fecha_fin ? parseISO(p.fecha_fin) : new Date(2099, 11, 31);
                return fechaInicio <= mesFin && fechaFin >= mesFin;
            });

            const carteraUSD = prestamosActivos
                .filter(p => p.moneda === 'USD')
                .reduce((sum, p) => sum + (p.monto_capital || 0), 0);

            const carteraVES = prestamosActivos
                .filter(p => p.moneda === 'VES' || p.moneda === 'BS')
                .reduce((sum, p) => sum + (p.monto_capital || 0), 0);

            return {
                mes: format(mes, 'MMM yyyy'),
                carteraUSD,
                carteraVES,
                carteraTotalUSD: carteraUSD + (carteraVES / tasaDolar)
            };
        });
    },

    /**
     * Calcula distribución de préstamos por monto
     */
    calcularDistribucionPorMonto(prestamos, tasaDolar = 1) {
        const rangos = [
            { min: 0, max: 100, label: '$0 - $100' },
            { min: 100, max: 500, label: '$100 - $500' },
            { min: 500, max: 1000, label: '$500 - $1,000' },
            { min: 1000, max: 5000, label: '$1,000 - $5,000' },
            { min: 5000, max: Infinity, label: '$5,000+' }
        ];

        return rangos.map(rango => {
            const prestamosEnRango = prestamos.filter(p => {
                const monto = p.moneda === 'USD' ? p.monto_capital : p.monto_capital / tasaDolar;
                return monto >= rango.min && monto < rango.max;
            });

            return {
                rango: rango.label,
                cantidad: prestamosEnRango.length,
                montoTotal: prestamosEnRango.reduce((sum, p) => sum + (p.monto_capital || 0), 0)
            };
        });
    },

    /**
     * Calcula flujo de caja proyectado
     */
    calcularFlujoCajaProyectado(prestamos, tasaDolar = 1, gastos = [], meses = 6) {
        const proyeccionIngresos = this.calcularProyeccionIngresos(prestamos, meses);

        return proyeccionIngresos.map(mes => {
            const gastosDelMes = gastos
                .filter(g => {
                    const fechaGasto = parseISO(g.fecha);
                    return fechaGasto.getMonth() === mes.mesNumero - 1 && fechaGasto.getFullYear() === mes.año;
                })
                .reduce((sum, g) => sum + (g.monto || 0), 0);

            const ingresoTotalUSD = mes.ingresoUSD + (mes.ingresoVES / tasaDolar);
            const flujoNetoUSD = ingresoTotalUSD - gastosDelMes;

            return {
                ...mes,
                gastos: gastosDelMes,
                flujoNetoUSD
            };
        });
    }
};
