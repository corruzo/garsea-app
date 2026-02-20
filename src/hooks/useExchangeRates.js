import { useState, useEffect, useCallback } from 'react';
import { useRateStore } from '../stores/rateStore';
import { rateService } from '../services/rateService';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-hot-toast';
import { useNotificationStore } from '../stores/notificationStore';

export const useExchangeRates = (organizacionId) => {
    const { todayRate, history, fetchTodayRate, fetchHistory } = useRateStore();
    const { addNotification } = useNotificationStore();
    const { organizacion, setOrganizacion } = useAuthStore();

    const [scraping, setScraping] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        tasa_dolar: '',
        tasa_euro: '',
        tasa_personalizada: ''
    });

    // Load initial data
    useEffect(() => {
        if (organizacionId) {
            fetchTodayRate(organizacionId);
            fetchHistory(organizacionId);
        }
    }, [organizacionId, fetchTodayRate, fetchHistory]);

    // Update form when todayRate changes
    useEffect(() => {
        if (todayRate) {
            setForm(prev => ({
                ...prev,
                tasa_dolar: todayRate.tasa_dolar.toString(),
                tasa_euro: todayRate.tasa_euro?.toString() || '',
                tasa_personalizada: todayRate.tasa_personalizada?.toString() || ''
            }));
        }
    }, [todayRate]);

    // Auto-scrape if no data
    useEffect(() => {
        if (organizacionId && !todayRate && !scraping && !form.tasa_dolar) {
            handleScrape();
        }
    }, [organizacionId, todayRate]);

    const handleScrape = async () => {
        setScraping(true);
        try {
            const data = await rateService.scrapeBCV();
            if (data) {
                setForm(prev => ({
                    ...prev,
                    tasa_dolar: data.dolar.toString(),
                    tasa_euro: data.euro.toString()
                }));
                toast.success('Datos extraídos del BCV');
            } else {
                toast.error('No se pudieron obtener datos automáticos');
            }
        } catch (error) {
            toast.error('Error al conectar con el BCV');
        } finally {
            setScraping(false);
        }
    };

    const saveRate = async () => {
        setLoading(true);
        try {
            await rateService.saveRate({
                organizacion_id: organizacionId,
                tasa_dolar: parseFloat(form.tasa_dolar),
                tasa_euro: parseFloat(form.tasa_euro),
                tasa_personalizada: form.tasa_personalizada ? parseFloat(form.tasa_personalizada) : null,
                fecha: new Date().toISOString().split('T')[0]
            });
            toast.success('Tasa diaria registrada y bloqueada');

            addNotification({
                title: todayRate ? 'Tasas Oficiales Refrescadas' : 'Tasas Oficiales Registradas',
                message: `Dólar: Bs ${form.tasa_dolar} | Euro: Bs ${form.tasa_euro || 'N/A'}.`,
                type: 'success'
            });

            await fetchTodayRate(organizacionId);
            await fetchHistory(organizacionId);
        } catch (error) {
            toast.error(error.message || 'Error al guardar la tasa');
        } finally {
            setLoading(false);
        }
    };

    const updatePersonalizedRate = async () => {
        if (!todayRate) return;
        setLoading(true);
        try {
            await rateService.updatePersonalizedRate(
                todayRate.id,
                form.tasa_personalizada ? parseFloat(form.tasa_personalizada) : null
            );
            toast.success('Tasa personalizada actualizada');

            addNotification({
                title: 'Tasa Personalizada Actualizada',
                message: `Nueva tasa del cliente establecida en Bs ${form.tasa_personalizada}.`,
                type: 'info'
            });

            await fetchTodayRate(organizacionId);
        } catch (error) {
            toast.error('Error al actualizar tasa personalizada');
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = async (newPref) => {
        try {
            const { supabase } = await import('../lib/supabase');

            const { error } = await supabase
                .from('organizaciones')
                .update({ tasa_referencia_pref: newPref })
                .eq('id', organizacionId);

            if (error) {
                if (error.code === 'PGRST204') {
                    throw new Error('Falta la columna "tasa_referencia_pref" en la base de datos.');
                }
                throw error;
            }

            setOrganizacion({ ...organizacion, tasa_referencia_pref: newPref });
            toast.success(`Referencia cambiada a: ${newPref === 'PERSONALIZADA' ? 'Mi Tasa' : newPref}`);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error al actualizar preferencia');
        }
    };

    return {
        form,
        setForm,
        todayRate,
        history,
        loading,
        scraping,
        organizacion,
        handleScrape,
        saveRate,
        updatePersonalizedRate,
        updatePreference
    };
};
