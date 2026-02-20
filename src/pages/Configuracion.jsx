import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  UserIcon,
  BuildingOfficeIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CameraIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function Configuracion() {
  const { user, organizacion, setUser, setOrganizacion } = useAuthStore();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para los formularios
  const [perfilForm, setPerfilForm] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    cedula: user?.cedula || '',
  });

  const [organizacionForm, setOrganizacionForm] = useState({
    nombre: organizacion?.nombre || '',
    identificacion: organizacion?.identificacion || '',
    email: organizacion?.email || '',
    telefono: organizacion?.telefono || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [prestamosConfig, setPrestamosConfig] = useState({
    tasaInteresDefecto: organizacion?.settings?.prestamos?.tasaInteresDefecto || '10',
    tasaMoraDefecto: organizacion?.settings?.prestamos?.tasaMoraDefecto || '5',
    tiposPago: organizacion?.settings?.prestamos?.tiposPago || ['semanal', 'quincenal', 'mensual'],
    requiereGarantia: organizacion?.settings?.prestamos?.requiereGarantia || false,
  });

  const [notificacionesConfig, setNotificacionesConfig] = useState({
    emailPagos: organizacion?.settings?.notificaciones?.emailPagos ?? true,
    recordatoriosPagos: organizacion?.settings?.notificaciones?.recordatoriosPagos ?? true,
    alertasVencidos: organizacion?.settings?.notificaciones?.alertasVencidos ?? true,
    reportesSemanales: organizacion?.settings?.notificaciones?.reportesSemanales ?? false,
  });

  // Tabs de configuración
  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: UserIcon },
    { id: 'organizacion', label: 'Organización', icon: BuildingOfficeIcon },
    { id: 'prestamos', label: 'Préstamos', icon: CurrencyDollarIcon },
    { id: 'notificaciones', label: 'Notificaciones', icon: BellIcon },
    { id: 'apariencia', label: 'Apariencia', icon: PaintBrushIcon },
    { id: 'seguridad', label: 'Seguridad', icon: ShieldCheckIcon },
  ];

  // Actualizar perfil
  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nombre: perfilForm.nombre,
          email: perfilForm.email,
          telefono: perfilForm.telefono,
          cedula: perfilForm.cedula,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Actualizar organización
  const handleUpdateOrganizacion = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('organizaciones')
        .update({
          nombre: organizacionForm.nombre,
          identificacion: organizacionForm.identificacion,
          email: organizacionForm.email,
          telefono: organizacionForm.telefono,
        })
        .eq('id', organizacion.id)
        .select()
        .single();

      if (error) throw error;

      setOrganizacion(data);
      toast.success('Organización actualizada correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la organización');
    } finally {
      setSaving(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Contraseña actualizada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  // Guardar configuración de préstamos en la nube
  const handleSavePrestamosConfig = async () => {
    setSaving(true);
    try {
      const newSettings = {
        ...organizacion.settings,
        prestamos: prestamosConfig
      };

      const { data, error } = await supabase
        .from('organizaciones')
        .update({ settings: newSettings })
        .eq('id', organizacion.id)
        .select()
        .single();

      if (error) throw error;
      setOrganizacion(data);
      toast.success('Configuración de préstamos guardada en la nube');
    } catch (error) {
      console.error('Error saving prestamos config:', error);
      toast.error('Error al guardar en el servidor. Guardando localmente como respaldo...');
      localStorage.setItem('prestamosConfig', JSON.stringify(prestamosConfig));
    } finally {
      setSaving(false);
    }
  };

  // Guardar configuración de notificaciones en la nube
  const handleSaveNotificaciones = async () => {
    setSaving(true);
    try {
      const newSettings = {
        ...organizacion.settings,
        notificaciones: notificacionesConfig
      };

      const { data, error } = await supabase
        .from('organizaciones')
        .update({ settings: newSettings })
        .eq('id', organizacion.id)
        .select()
        .single();

      if (error) throw error;
      setOrganizacion(data);
      toast.success('Preferencias de notificaciones guardadas en la nube');
    } catch (error) {
      console.error('Error saving notificaciones config:', error);
      toast.error('Error al guardar en el servidor');
      localStorage.setItem('notificacionesConfig', JSON.stringify(notificacionesConfig));
    } finally {
      setSaving(false);
    }
  };

  // No necesitamos el useEffect de carga de localStorage ya que viene en el authStore

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-6">
      {/* Header */}
      <div className="pt-4 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configuración
          </h1>
          <p className="text-slate-700 dark:text-slate-300 font-bold">
            Personaliza tu experiencia en GARSEA
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all
                  ${activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4">
        <div className="max-w-4xl mx-auto">
          {/* MI PERFIL */}
          {activeTab === 'perfil' && (
            <div className="space-y-6 animate-slideUp">
              <Card>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-all">
                      <CameraIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {user?.nombre}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg">
                      {user?.rol || 'Administrador'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleUpdatePerfil} className="space-y-4">
                  <Input
                    label="Nombre Completo"
                    icon={<UserIcon className="w-5 h-5" />}
                    value={perfilForm.nombre}
                    onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                    required
                  />

                  <Input
                    label="Correo Electrónico"
                    type="email"
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                    value={perfilForm.email}
                    onChange={(e) => setPerfilForm({ ...perfilForm, email: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Teléfono"
                      type="tel"
                      icon={<PhoneIcon className="w-5 h-5" />}
                      value={perfilForm.telefono}
                      onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })}
                    />

                    <Input
                      label="Cédula"
                      icon={<IdentificationIcon className="w-5 h-5" />}
                      value={perfilForm.cedula}
                      onChange={(e) => setPerfilForm({ ...perfilForm, cedula: e.target.value })}
                    />
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={saving}>
                    Guardar Cambios
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* ORGANIZACIÓN */}
          {activeTab === 'organizacion' && (
            <div className="space-y-6 animate-slideUp">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Información de la Organización
                </h3>

                <form onSubmit={handleUpdateOrganizacion} className="space-y-4">
                  <Input
                    label="Nombre de la Empresa"
                    icon={<BuildingOfficeIcon className="w-5 h-5" />}
                    value={organizacionForm.nombre}
                    onChange={(e) => setOrganizacionForm({ ...organizacionForm, nombre: e.target.value })}
                    required
                  />

                  <Input
                    label="RIF / Identificación"
                    icon={<IdentificationIcon className="w-5 h-5" />}
                    value={organizacionForm.identificacion}
                    onChange={(e) => setOrganizacionForm({ ...organizacionForm, identificacion: e.target.value })}
                  />

                  <Input
                    label="Email de Contacto"
                    type="email"
                    icon={<EnvelopeIcon className="w-5 h-5" />}
                    value={organizacionForm.email}
                    onChange={(e) => setOrganizacionForm({ ...organizacionForm, email: e.target.value })}
                  />

                  <Input
                    label="Teléfono"
                    type="tel"
                    icon={<PhoneIcon className="w-5 h-5" />}
                    value={organizacionForm.telefono}
                    onChange={(e) => setOrganizacionForm({ ...organizacionForm, telefono: e.target.value })}
                  />

                  <Button type="submit" variant="primary" fullWidth loading={saving}>
                    Actualizar Organización
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* PRÉSTAMOS */}
          {activeTab === 'prestamos' && (
            <div className="space-y-6 animate-slideUp">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Configuración de Préstamos
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Tasa de Interés por Defecto (%)"
                      type="number"
                      value={prestamosConfig.tasaInteresDefecto}
                      onChange={(e) => setPrestamosConfig({ ...prestamosConfig, tasaInteresDefecto: e.target.value })}
                    />

                    <Input
                      label="Tasa de Mora por Defecto (%)"
                      type="number"
                      value={prestamosConfig.tasaMoraDefecto}
                      onChange={(e) => setPrestamosConfig({ ...prestamosConfig, tasaMoraDefecto: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3">
                      Tipos de Pago Disponibles
                    </label>
                    <div className="space-y-2">
                      {['semanal', 'quincenal', 'mensual'].map((tipo) => (
                        <label key={tipo} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={prestamosConfig.tiposPago.includes(tipo)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPrestamosConfig({
                                  ...prestamosConfig,
                                  tiposPago: [...prestamosConfig.tiposPago, tipo]
                                });
                              } else {
                                setPrestamosConfig({
                                  ...prestamosConfig,
                                  tiposPago: prestamosConfig.tiposPago.filter(t => t !== tipo)
                                });
                              }
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-white font-medium capitalize">
                            {tipo}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-gray-900 dark:text-white font-medium">
                      Requerir garantía por defecto
                    </span>
                    <input
                      type="checkbox"
                      checked={prestamosConfig.requiereGarantia}
                      onChange={(e) => setPrestamosConfig({ ...prestamosConfig, requiereGarantia: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <Button onClick={handleSavePrestamosConfig} variant="primary" fullWidth>
                    Guardar Configuración
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* NOTIFICACIONES */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6 animate-slideUp">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Preferencias de Notificaciones
                </h3>

                <div className="space-y-3">
                  {[
                    { key: 'emailPagos', label: 'Notificar por email cuando se registre un pago', icon: CheckCircleIcon },
                    { key: 'recordatoriosPagos', label: 'Enviar recordatorios de pagos pendientes', icon: BellIcon },
                    { key: 'alertasVencidos', label: 'Alertas de pagos vencidos', icon: BellIcon },
                    { key: 'reportesSemanales', label: 'Reportes semanales por email', icon: EnvelopeIcon },
                  ].map((notif) => (
                    <label
                      key={notif.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <notif.icon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {notif.label}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificacionesConfig[notif.key]}
                        onChange={(e) => setNotificacionesConfig({ ...notificacionesConfig, [notif.key]: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>

                <Button onClick={handleSaveNotificaciones} variant="primary" fullWidth className="mt-4">
                  Guardar Preferencias
                </Button>
              </Card>
            </div>
          )}

          {/* APARIENCIA */}
          {activeTab === 'apariencia' && (
            <div className="space-y-6 animate-slideUp">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Personalización de Apariencia
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Tema
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Modo {theme === 'dark' ? 'oscuro' : 'claro'} activado
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 <strong>Tip:</strong> El tema se guarda automáticamente y se aplicará en todos tus dispositivos.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* SEGURIDAD */}
          {activeTab === 'seguridad' && (
            <div className="space-y-6 animate-slideUp">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Cambiar Contraseña
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="Nueva Contraseña"
                    type="password"
                    icon={<KeyIcon className="w-5 h-5" />}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />

                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    icon={<KeyIcon className="w-5 h-5" />}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Repite la contraseña"
                    required
                  />

                  <Button type="submit" variant="primary" fullWidth loading={saving}>
                    Cambiar Contraseña
                  </Button>
                </form>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Sesión Actual
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Sesión Activa</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dispositivo actual</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">ACTIVA</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
