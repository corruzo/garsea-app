import React from 'react';
import { useAuthStore } from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    GlobeAltIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    PresentationChartLineIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

import { useExchangeRates } from '../hooks/useExchangeRates';

export default function TasasCambio() {
    const { organizacion } = useAuthStore();
    const {
        form,
        setForm,
        todayRate,
        history,
        loading,
        scraping,
        handleScrape,
        saveRate,
        updatePersonalizedRate,
        updatePreference
    } = useExchangeRates(organizacion?.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await saveRate();
    };

    const handleUpdatePersonalized = async () => {
        await updatePersonalizedRate();
    };

    const handleUpdatePreference = async (newPref) => {
        await updatePreference(newPref);
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd] dark:bg-gray-950 pb-20 font-sans">
            <div className="max-w-4xl mx-auto pt-4 px-6">
                <div className="flex items-end justify-between mb-12 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Divisas</h1>
                            {!todayRate && (
                                <button
                                    onClick={handleScrape}
                                    disabled={scraping}
                                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center gap-2"
                                >
                                    <ArrowPathIcon className={`w-3 h-3 ${scraping ? 'animate-spin' : ''}`} />
                                    {scraping ? 'Sincronizando...' : 'Sincronizar BCV'}
                                </button>
                            )}
                        </div>
                        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">Control de Cambio Oficial</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Referencia Hoy</p>
                        <p className="text-sm font-black text-indigo-600">
                            {organizacion?.tasa_referencia_pref === 'PERSONALIZADA' ? 'Mi Tasa' : (organizacion?.tasa_referencia_pref || 'USD')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-10">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">USD Oficial</span>
                                <div className="text-3xl font-black tabular-nums tracking-tighter text-gray-900 dark:text-white">
                                    {form.tasa_dolar ? `Bs ${parseFloat(form.tasa_dolar).toFixed(2)}` : '--.--'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">EUR Oficial</span>
                                <div className="text-3xl font-black tabular-nums tracking-tighter text-gray-900 dark:text-white">
                                    {form.tasa_euro ? `Bs ${parseFloat(form.tasa_euro).toFixed(2)}` : '--.--'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm space-y-10">
                            {todayRate && (
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50 w-fit mx-auto shadow-sm">
                                    <CheckBadgeIcon className="w-4 h-4" />
                                    Tasas actualizadas al día de hoy
                                </div>
                            )}

                            <div className="space-y-8">
                                <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Gestión de Referencias</h3>

                                <div className="grid grid-cols-1 gap-10">
                                    {/* Personalized Rate Section */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-widest ml-1">Mi Tasa Cliente (Bs)</label>
                                        <div className="flex items-center gap-3 h-14">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.tasa_personalizada}
                                                onChange={(e) => setForm({ ...form, tasa_personalizada: e.target.value })}
                                                placeholder="Ej: 60.00"
                                                className="flex-1 h-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 text-sm font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Global Save Button */}
                                    <Button
                                        onClick={handleSubmit}
                                        fullWidth
                                        loading={loading}
                                        disabled={!form.tasa_dolar}
                                        className={`!py-5 !rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-none border-none transition-all ${todayRate
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10'
                                            }`}
                                    >
                                        {todayRate ? 'Refrescar Tasas Oficiales' : 'Registrar Tasas de Hoy'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Actividad Reciente</h4>
                            <div className="space-y-4">
                                {history?.slice(0, 5).map((h) => (
                                    <div key={h.id} className="flex items-center justify-between border-b border-gray-50 dark:border-gray-900 pb-4">
                                        <span className="text-[11px] font-bold text-gray-400">{new Date(h.fecha).toLocaleDateString()}</span>
                                        <span className="text-sm font-black tabular-nums text-gray-700 dark:text-gray-300">Bs {h.tasa_dolar.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 lg:border-l lg:border-gray-100 lg:dark:border-gray-900 lg:pl-12">
                        <div className="sticky top-12 space-y-12">
                            <div>
                                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6">Estrategia</h3>
                                <div className="space-y-2">
                                    {[
                                        { id: 'USD', name: 'Dólar BCV', icon: '🇺🇸' },
                                        { id: 'EUR', name: 'Euro BCV', icon: '🇪🇺' },
                                        { id: 'PERSONALIZADA', name: 'Mi Tasa', icon: '💎' }
                                    ].map((pref) => (
                                        <button
                                            key={pref.id}
                                            onClick={() => handleUpdatePreference(pref.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-xs ${organizacion?.tasa_referencia_pref === pref.id
                                                ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="text-sm">{pref.icon}</span>
                                                {pref.name}
                                            </span>
                                            {organizacion?.tasa_referencia_pref === pref.id && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-900/50">
                                <p className="text-[9px] leading-relaxed font-bold text-gray-400 uppercase italic">
                                    Los valores obtenidos del BCV son verificados mediante scrapping en tiempo real y no permiten alteración manual por políticas de cumplimiento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


