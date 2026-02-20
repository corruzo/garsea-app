import React from 'react';
import { useAuthStore } from '../stores/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    Globe,
    RefreshCw,
    CheckCircle,
    TrendingUp,
    History,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useExchangeRates } from '../hooks/useExchangeRates';

export default function TasasCambio() {
    const { organizacion } = useAuthStore();
    const navigate = useNavigate();
    const {
        form,
        setForm,
        todayRate,
        history,
        loading,
        scraping,
        handleScrape,
        saveRate,
        updatePreference
    } = useExchangeRates(organizacion?.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await saveRate();
    };

    const handleUpdatePreference = async (newPref) => {
        await updatePreference(newPref);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32 animate-fadeIn transition-colors">
            <header className="px-6 py-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                        >
                            <ChevronLeft className="w-6 h-6 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Control Divisas</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización BCV en tiempo real</p>
                        </div>
                    </div>

                    {!todayRate && (
                        <Button
                            onClick={handleScrape}
                            disabled={scraping}
                            variant="primary"
                            size="md"
                            icon={<RefreshCw size={18} className={scraping ? 'animate-spin' : ''} />}
                        >
                            {scraping ? 'SINCRONIZANDO...' : 'BUSCAR EN BCV'}
                        </Button>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 space-y-8">
                {/* Tasas Actuales - Tamaño Equilibrado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { label: 'Dólar Oficial (USD)', value: form.tasa_dolar },
                        { label: 'Euro Oficial (EUR)', value: form.tasa_euro }
                    ].map((rate) => (
                        <Card key={rate.label} className="!p-8 bg-white dark:bg-slate-900 shadow-sm border-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">{rate.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                    {rate.value ? `Bs ${parseFloat(rate.value).toFixed(2)}` : '--.--'}
                                </span>
                                <TrendingUp className="w-6 h-6 text-indigo-500 opacity-30" />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Estrategia y Referencia */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <Card className="!p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Referencia del Sistema</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1">Cómo se calcularán los préstamos hoy.</p>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { id: 'USD', name: 'Dólar BCV', icon: '🇺🇸' },
                                            { id: 'EUR', name: 'Euro BCV', icon: '🇪🇺' },
                                            { id: 'PERSONALIZADA', name: 'Mi Tasa Propia', icon: '💎' }
                                        ].map((pref) => (
                                            <button
                                                key={pref.id}
                                                onClick={() => handleUpdatePreference(pref.id)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${organizacion?.tasa_referencia_pref === pref.id
                                                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/10'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{pref.icon}</span>
                                                    <span className="text-sm font-black uppercase tracking-wider">{pref.name}</span>
                                                </div>
                                                {organizacion?.tasa_referencia_pref === pref.id && <CheckCircle size={18} className="text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ajuste Manual (Bs)</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={form.tasa_personalizada}
                                            onChange={(e) => setForm({ ...form, tasa_personalizada: e.target.value })}
                                            placeholder="60.00"
                                            className="!mb-0"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        fullWidth
                                        loading={loading}
                                        disabled={!form.tasa_dolar}
                                        className="py-4"
                                    >
                                        GUARDAR CAMBIOS
                                    </Button>
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic text-center">
                                        Los valores BCV no pueden alterarse manualmente por cumplimiento legal.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-12">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <History size={14} /> HISTORIAL RECIENTE
                            </h2>
                            <Card className="!p-0 overflow-hidden shadow-sm">
                                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {history?.slice(0, 5).map((h) => (
                                        <div key={h.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                            <span className="text-xs font-bold text-slate-500">{new Date(h.fecha).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                            <span className="text-base font-black tabular-nums text-slate-900 dark:text-white">Bs {h.tasa_dolar.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
