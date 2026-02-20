import { supabase } from '../lib/supabase';

export const rateService = {
    async getTodayRate(organizacionId) {
        const today = new Date().toISOString().split('T')[0];
        // .maybeSingle() returns null (not an error) when 0 rows are found.
        // .single() causes a 406 with RLS enabled when there's no rate for today.
        const { data, error } = await supabase
            .from('tasas_cambio')
            .select('*')
            .eq('organizacion_id', organizacionId)
            .eq('fecha', today)
            .maybeSingle();

        if (error) throw error;
        return data; // null if no rate registered today
    },

    async getHistory(organizacionId, limit = 30) {
        const { data, error } = await supabase
            .from('tasas_cambio')
            .select('*')
            .eq('organizacion_id', organizacionId)
            .order('fecha', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    async saveRate(rateData) {
        // Usamos upsert para permitir actualizar la tasa si el BCV cambia durante el día
        // La restricción UNIQUE(organizacion_id, fecha) asegura que sigamos teniendo un solo registro por día
        const { data, error } = await supabase
            .from('tasas_cambio')
            .upsert([rateData], { onConflict: 'organizacion_id, fecha' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePersonalizedRate(id, rate) {
        const { data, error } = await supabase
            .from('tasas_cambio')
            .update({ tasa_personalizada: rate })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Scrapes the BCV website. 
     * NOTE: Direct scraping from browser will fail due to CORS.
     * This logic is intended for a server-side proxy or managed environment.
     */
    async scrapeBCV() {
        try {
            // Nota: En producción, esto DEBE ser una Serverless Function o un Proxy.
            // Si falla el scraping (CORS), devolvemos null para que el usuario ingrese la tasa manual.
            const response = await fetch('/bcv-scraping').catch(() => null);

            if (!response || !response.ok) {
                console.warn('Scraping bloqueado o no disponible en este entorno.');
                return null;
            }

            const htmlContent = await response.text();

            if (!htmlContent || htmlContent.length < 500) return null;

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            const parseRate = (id) => {
                const el = doc.getElementById(id);
                if (el) {
                    const val = el.querySelector('strong')?.textContent;
                    if (val) return parseFloat(val.replace(',', '.').trim());
                }
                return null;
            };

            const dolar = parseRate('dolar');
            const euro = parseRate('euro');

            if (!dolar) {
                // Intento por regex si fallan los selectores
                const m = htmlContent.match(/USD.*?([0-9]{2,},[0-9]+)/i);
                if (m) return {
                    dolar: parseFloat(m[1].replace(',', '.')),
                    euro: euro || 0,
                    lastUpdate: new Date().toISOString()
                };
                return null;
            }

            return { dolar, euro: euro || 0, lastUpdate: new Date().toISOString() };
        } catch (error) {
            console.error('Error Silencioso en Scrapping:', error);
            return null;
        }
    }
};
