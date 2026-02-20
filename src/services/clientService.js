import { supabase } from '../lib/supabase';
import { useCacheStore } from '../stores/cacheStore';

export const clientService = {
    async getAll(organizacionId, forceRefresh = false) {
        // Intentar obtener del caché primero
        if (!forceRefresh) {
            const cached = useCacheStore.getState().getClients();
            if (cached && cached.organizacionId === organizacionId) {
                return cached.data;
            }
        }

        // Si no hay caché o está expirado, hacer la petición
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('organizacion_id', organizacionId)
            .order('nombre', { ascending: true });

        if (error) throw error;

        // Guardar en caché
        useCacheStore.getState().setClients({
            organizacionId,
            data
        });

        return data;
    },

    async getByCedula(cedula, organizacionId) {
        // Intentar obtener del caché primero
        const cached = useCacheStore.getState().getClients();
        if (cached && cached.organizacionId === organizacionId) {
            const client = cached.data.find(c => c.cedula === cedula);
            if (client) return client;
        }

        // Si no está en caché, hacer la petición
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('cedula', cedula)
            .eq('organizacion_id', organizacionId)
            .single();

        if (error) throw error;
        return data;
    },

    async create(clientData) {
        const { data, error } = await supabase
            .from('clientes')
            .insert([clientData])
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché para forzar recarga
        useCacheStore.getState().invalidateClients();

        return data;
    },

    async update(cedula, organizacionId, clientData) {
        const { data, error } = await supabase
            .from('clientes')
            .update({ ...clientData, fecha_actualizacion: new Date().toISOString() })
            .eq('cedula', cedula)
            .eq('organizacion_id', organizacionId)
            .select()
            .single();

        if (error) throw error;

        // Invalidar caché para forzar recarga
        useCacheStore.getState().invalidateClients();

        return data;
    },

    async delete(cedula, organizacionId) {
        const { error } = await supabase
            .from('clientes')
            .update({ activo: false, fecha_actualizacion: new Date().toISOString() })
            .eq('cedula', cedula)
            .eq('organizacion_id', organizacionId);

        if (error) throw error;

        // Invalidar caché para forzar recarga
        useCacheStore.getState().invalidateClients();

        return true;
    },

    async search(query, organizacionId) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('organizacion_id', organizacionId)
            .or(`nombre.ilike.%${query}%,cedula.ilike.%${query}%`)
            .order('nombre', { ascending: true });

        if (error) throw error;
        return data;
    }
};
