import { supabase } from '../lib/supabase';

export const paymentService = {
    async getAll(organizacionId) {
        const { data, error } = await supabase
            .from('pagos')
            .select(`
                *,
                prestamos:prestamo_id (
                    id,
                    cliente_cedula,
                    clientes:cliente_cedula (nombre)
                )
            `)
            .eq('organizacion_id', organizacionId)
            .order('fecha_pago', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getByLoan(prestamoId, organizacionId) {
        const { data, error } = await supabase
            .from('pagos')
            .select('*')
            .eq('prestamo_id', prestamoId)
            .eq('organizacion_id', organizacionId)
            .order('fecha_pago', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(paymentData) {
        // Usamos una RPC o una transacción si es posible para actualizar el saldo del préstamo
        // Pero por simplicidad ahora lo hacemos en dos pasos (o con un trigger en DB si ya existe)

        const { data, error } = await supabase
            .from('pagos')
            .insert([paymentData])
            .select()
            .single();

        if (error) throw error;

        // Actualizar saldo del préstamo
        const { data: loan, error: loanError } = await supabase.rpc('registrar_pago_prestamo', {
            p_prestamo_id: paymentData.prestamo_id,
            p_monto: paymentData.monto_abonado
        });

        if (loanError) {
            console.error('Error al actualizar saldo (RPC no encontrada? intentando manual):', loanError);
            // Si la RPC no existe, lo hacemos manual
            const { data: currentLoan } = await supabase
                .from('prestamos')
                .select('saldo_pendiente')
                .eq('id', paymentData.prestamo_id)
                .single();

            const nuevoSaldo = currentLoan.saldo_pendiente - paymentData.monto_abonado;
            await supabase
                .from('prestamos')
                .update({
                    saldo_pendiente: nuevoSaldo,
                    estado: nuevoSaldo <= 0 ? 'pagado' : 'activo'
                })
                .eq('id', paymentData.prestamo_id);
        }

        return data;
    }
};
