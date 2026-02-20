import { supabase } from '../lib/supabase';

export const capitalService = {
    /**
     * Obtiene el saldo actual de capital (liquidez)
     * Suma todos los movimientos de la organización
     */
    async getSaldo(organizacionId) {
        const { data, error } = await supabase
            .from('capital_movimientos')
            .select('monto, moneda')
            .eq('organizacion_id', organizacionId);

        if (error) throw error;

        // Agrupar por moneda
        const saldos = data.reduce((acc, mov) => {
            acc[mov.moneda] = (acc[mov.moneda] || 0) + Number(mov.monto);
            return acc;
        }, { USD: 0, VES: 0 });

        return saldos;
    },

    /**
     * Obtiene el historial de movimientos de capital
     */
    async getMovimientos(organizacionId, limit = 50) {
        const { data, error } = await supabase
            .from('capital_movimientos')
            .select('*')
            .eq('organizacion_id', organizacionId)
            .order('fecha_registro', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    /**
     * Registra un nuevo movimiento manual (Aporte o Retiro)
     */
    async registrarMovimiento({ organizacionId, monto, moneda, tipo, notas }) {
        // Si es retiro, el monto debe ser negativo para que la suma funcione
        const montoFinal = tipo === 'retiro' ? -Math.abs(monto) : Math.abs(monto);

        const { data, error } = await supabase
            .from('capital_movimientos')
            .insert([{
                organizacion_id: organizacionId,
                monto: montoFinal,
                moneda,
                tipo,
                notas
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
