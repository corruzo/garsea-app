import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import {
    UserIcon,
    IdentificationIcon,
    PhoneIcon,
    MapPinIcon,
    EnvelopeIcon,
    CalendarIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckCircleIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';

/* ─── Tiny field wrapper with floating label style ─── */
const Field = ({ label, required, disabled, icon: Icon, children, hint }) => (
    <div className="group relative">
        <label className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] mb-2 transition-colors
            ${disabled ? 'text-gray-300 dark:text-gray-600' : 'text-slate-600 dark:text-slate-300 group-focus-within:text-indigo-500'}`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
            {required && <span className="text-rose-500">*</span>}
        </label>
        {children}
        {hint && <p className="mt-1.5 text-[10px] text-gray-400 font-medium pl-1">{hint}</p>}
    </div>
);

const inputCls = (disabled) =>
    `w-full px-4 py-3.5 rounded-2xl text-sm font-semibold outline-none transition-all duration-200 border-2
     bg-white dark:bg-gray-900
     placeholder:text-gray-300 dark:placeholder:text-gray-700
     text-gray-900 dark:text-white
     ${disabled
        ? 'border-gray-100 dark:border-gray-800 text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-900/50'
        : 'border-gray-150 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]'
    }`;

/* ─── Divider ───────────────────────────────────────── */
const Section = ({ label }) => (
    <div className="flex items-center gap-3 pt-1">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-gray-700 whitespace-nowrap">{label}</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
);

/* ─── Main Component ──────────────────────────────── */
const ClienteForm = ({ onSubmit, initialData, loading }) => {
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        cedula: '',
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        fecha_nacimiento: '',
        notas: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                cedula: initialData.cedula || '',
                nombre: initialData.nombre || '',
                telefono: initialData.telefono || '',
                email: initialData.email || '',
                direccion: initialData.direccion || '',
                fecha_nacimiento: initialData.fecha_nacimiento || '',
                notas: initialData.notas || ''
            });
        }
    }, [initialData]);

    const set = (name) => (e) => setFormData(prev => ({ ...prev, [name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Identidad ───────────────────────────────── */}
            <Section label="Identidad" />

            <Field label="Cédula / Identificación" required icon={IdentificationIcon}
                hint={isEditing ? null : 'Este campo no se puede modificar después del registro'}
                disabled={loading || isEditing}>
                <div className="relative">
                    <input
                        type="text"
                        name="cedula"
                        value={formData.cedula}
                        onChange={set('cedula')}
                        placeholder="Ej: 12345678"
                        required
                        disabled={loading || isEditing}
                        className={inputCls(loading || isEditing)}
                    />
                    {isEditing && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <LockClosedIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        </div>
                    )}
                </div>
            </Field>

            <Field label="Nombre Completo" required icon={UserIcon} disabled={loading}>
                <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={set('nombre')}
                    placeholder="Ej: Juan Carlos Pérez"
                    required
                    disabled={loading}
                    className={inputCls(loading)}
                />
            </Field>

            {/* ── Contacto ────────────────────────────────── */}
            <Section label="Contacto" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Teléfono" icon={PhoneIcon} disabled={loading}>
                    <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={set('telefono')}
                        placeholder="0414-1234567"
                        disabled={loading}
                        className={inputCls(loading)}
                    />
                </Field>

                <Field label="Email" icon={EnvelopeIcon} disabled={loading}>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={set('email')}
                        placeholder="juan@gmail.com"
                        disabled={loading}
                        className={inputCls(loading)}
                    />
                </Field>
            </div>

            <Field label="Dirección" icon={MapPinIcon} disabled={loading}>
                <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={set('direccion')}
                    placeholder="Urb. La Florida, Av. Principal..."
                    disabled={loading}
                    className={inputCls(loading)}
                />
            </Field>

            {/* ── Datos adicionales ───────────────────────── */}
            <Section label="Datos Adicionales" />

            <Field label="Fecha de Nacimiento" icon={CalendarIcon} disabled={loading}>
                <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={set('fecha_nacimiento')}
                    disabled={loading}
                    className={inputCls(loading)}
                />
            </Field>

            <Field label="Notas / Observaciones" icon={ChatBubbleBottomCenterTextIcon} disabled={loading}>
                <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={set('notas')}
                    placeholder="Información adicional relevante del cliente..."
                    disabled={loading}
                    rows={3}
                    className={`${inputCls(loading)} resize-none`}
                />
            </Field>

            {/* ── CTA ─────────────────────────────────────── */}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className={`
                        w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl
                        text-sm font-black uppercase tracking-widest
                        transition-all duration-200 active:scale-[0.98]
                        ${loading
                            ? 'bg-indigo-400 cursor-not-allowed text-white/70'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40'
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-5 h-5" />
                            {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ClienteForm;
