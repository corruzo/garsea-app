import { supabase } from '../lib/supabase';

export const storageService = {
    async uploadGuaranteePhoto(file, organizacionId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${organizacionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `garantias/${fileName}`;

            const { error } = await supabase.storage
                .from('guarantees')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('guarantees')
                .getPublicUrl(filePath);

            return {
                url: publicUrl,
                path: filePath,
                name: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error uploading guarantee photo:', error);
            throw error;
        }
    },

    async uploadPaymentReceipt(file, organizacionId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${organizacionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `comprobantes/${fileName}`;

            const { error } = await supabase.storage
                .from('guarantees')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('guarantees')
                .getPublicUrl(filePath);

            return {
                url: publicUrl,
                path: filePath,
                name: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error uploading payment receipt:', error);
            throw error;
        }
    },

    async registerDocument(docData) {
        const { data, error } = await supabase
            .from('documentos')
            .insert([docData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getDocumentsByLoan(prestamoId, organizacionId) {
        const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('entidad_id', prestamoId)
            .eq('organizacion_id', organizacionId)
            .eq('tipo_entidad', 'prestamo')
            .order('fecha_subida', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getDocumentsByPago(pagoId, organizacionId) {
        const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('entidad_id', pagoId)
            .eq('organizacion_id', organizacionId)
            .eq('tipo_entidad', 'pago')
            .order('fecha_subida', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
