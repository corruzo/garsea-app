import { supabase } from '../lib/supabase';
import { useCacheStore } from '../stores/cacheStore';

export const loanService = {
    async getAll(organizacionId, forceRefresh = false) {
        // Intentar obtener del caché primero
        if (!forceRefresh) {
            const cached = useCacheStore.getState().getLoans();
            if (cached && cached.organizacionId === organizacionId) {
                return cached.data;
            }
        }

        // Si no hay caché o está expirado, hacer la petición
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                *,
                clientes:cliente_cedula (nombre)
            `)
            .eq('organizacion_id', organizacionId)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;

        // Guardar en caché
        useCacheStore.getState().setLoans({
            organizacionId,
            data
        });

        return data;
    },

    async getByCliente(cedula, organizacionId) {
        // Intentar obtener del caché primero
        const cached = useCacheStore.getState().getLoans();
        if (cached && cached.organizacionId === organizacionId) {
            const loans = cached.data.filter(l => l.cliente_cedula === cedula);
            if (loans.length > 0) return loans;
        }

        // Si no está en caché, hacer la petición
        const { data, error } = await supabase
            .from('prestamos')
            .select('*')
            .eq('cliente_cedula', cedula)
            .eq('organizacion_id', organizacionId)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id, organizacionId) {
        // Intentar obtener del caché primero
        const cached = useCacheStore.getState().getLoans();
        if (cached && cached.organizacionId === organizacionId) {
            const loan = cached.data.find(l => l.id === id);
            if (loan) {
                // Si está en caché pero necesitamos datos completos del cliente, hacer petición
                const { data, error } = await supabase
                    .from('prestamos')
                    .select(`
                        *,
                        clientes:cliente_cedula (nombre, telefono, email, direccion)
                    `)
                    .eq('id', id)
                    .eq('organizacion_id', organizacionId)
                    .single();

                if (error) throw error;
                return data;
            }
        }

        // Si no está en caché, hacer la petición
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                *,
                clientes:cliente_cedula (nombre, telefono, email, direccion)
            `)
            .eq('id', id)
            .eq('organizacion_id', organizacionId)
            .single();

        if (error) throw error;
        return data;
    },

    async create(loanData) {
        const { data, error } = await supabase
            .from('prestamos')
            .insert([loanData])
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché para forzar recarga
        useCacheStore.getState().invalidateLoans();

        return data;
    },

    async updateStatus(id, organizacionId, status) {
        const { data, error } = await supabase
            .from('prestamos')
            .update({ estado: status, fecha_actualizacion: new Date().toISOString() })
            .eq('id', id)
            .eq('organizacion_id', organizacionId)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché para forzar recarga
        useCacheStore.getState().invalidateLoans();

        return data;
    },

    async updateBalance(id, organizacionId, newBalance) {
        const { data, error } = await supabase
            .from('prestamos')
            .update({
                saldo_pendiente: newBalance,
                estado: newBalance <= 0 ? 'pagado' : 'activo',
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id)
            .eq('organizacion_id', organizacionId)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché para forzar recarga
        useCacheStore.getState().invalidateLoans();

        return data;
    }
};
