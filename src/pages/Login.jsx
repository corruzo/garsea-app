import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import toast, { Toaster } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  Fingerprint
} from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setOrganizacion } = useAuthStore();
  const { theme } = useThemeStore();

  // Aplicar tema al documento
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    nombreEmpresa: '',
    nombreAdmin: '',
    cedula: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!loginForm.email || !loginForm.password) {
      toast.error('Por favor ingresa tu email y contraseña.');
      setLoading(false);
      return;
    }

    const result = await authService.login(loginForm.email, loginForm.password);

    if (result.success) {
      setUser(result.data.usuario);
      setOrganizacion(result.data.organizacion);
      toast.success('¡Bienvenido a GARSEA!', {
        duration: 2000, // Se cierra después de 2 segundos
      });

      // Navegar al dashboard después de un breve delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerForm.nombreEmpresa || !registerForm.nombreAdmin || !registerForm.cedula ||
      !registerForm.email || !registerForm.telefono || !registerForm.password ||
      !registerForm.confirmPassword) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (registerForm.cedula.length < 7) {
      toast.error('Ingresa una cédula válida');
      return;
    }

    setLoading(true);

    const result = await authService.registrarOrganizacion(registerForm);

    if (result.success) {
      toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
      setIsLogin(true);
      setRegisterForm({
        nombreEmpresa: '',
        nombreAdmin: '',
        cedula: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      toast.error(result.error || 'Error en el registro');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!loginForm.email) {
      toast.error('Ingresa tu email para continuar.');
      return;
    }

    setLoading(true);
    const result = await authService.resetPassword(loginForm.email);

    if (result.success) {
      toast.success('Se ha enviado un enlace de recuperación a tu correo.', {
        duration: 5000
      });
      setIsForgotPassword(false);
    } else {
      toast.error(result.error || 'Error al enviar el correo');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000, // 2 segundos por defecto
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Orbes de fondo animados */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo y Título */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/50 mb-4">
              <span className="text-3xl font-bold text-white">G</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              GARSEA
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Sistema de Gestión de Préstamos
            </p>
          </div>

          {/* Card Principal */}
          <Card className="animate-slide-up shadow-2xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
              <button
                onClick={() => { setIsLogin(true); setIsForgotPassword(false); }}
                className={`
                      flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300
                      ${isLogin
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                    `}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setIsLogin(false); setIsForgotPassword(false); }}
                className={`
                      flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300
                      ${!isLogin
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                    `}
              >
                Registrarse
              </button>
            </div>

            {/* Formularios */}
            {isLogin ? (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-5">
                <Input
                  label="Correo Electrónico"
                  type="email"
                  required
                  icon={<Mail size={20} strokeWidth={2.5} />}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="tu@email.com"
                />

                <Input
                  label="Contraseña"
                  type="password"
                  required
                  icon={<Lock size={20} strokeWidth={2.5} />}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-600 dark:text-gray-400 select-none">Recordarme</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline font-semibold transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                >
                  Ingresar
                </Button>
              </form>
            ) : isForgotPassword ? (
              /* Forgot Password Form */
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recuperar Contraseña</h3>
                  <p className="text-sm text-gray-500">Ingresa tu correo y te enviaremos un enlace.</p>
                </div>

                <Input
                  label="Correo Electrónico"
                  type="email"
                  required
                  icon={<Mail size={20} strokeWidth={2.5} />}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="tu@email.com"
                />

                <div className="space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                  >
                    Enviar Enlace
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors py-2"
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-5">
                <Input
                  label="Nombre de tu Negocio"
                  type="text"
                  required
                  icon={<Building2 size={20} strokeWidth={2.5} />}
                  value={registerForm.nombreEmpresa}
                  onChange={(e) => setRegisterForm({ ...registerForm, nombreEmpresa: e.target.value })}
                  placeholder="Préstamos García"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Tu Cédula"
                    type="text"
                    required
                    icon={<Fingerprint size={20} strokeWidth={2.5} />}
                    value={registerForm.cedula}
                    onChange={(e) => setRegisterForm({ ...registerForm, cedula: e.target.value })}
                    placeholder="V-12345678"
                  />

                  <Input
                    label="Tu Teléfono"
                    type="tel"
                    required
                    icon={<Phone size={20} strokeWidth={2.5} />}
                    value={registerForm.telefono}
                    onChange={(e) => setRegisterForm({ ...registerForm, telefono: e.target.value })}
                    placeholder="0424-1234567"
                  />
                </div>

                <Input
                  label="Tu Nombre Completo"
                  type="text"
                  required
                  icon={<User size={20} strokeWidth={2.5} />}
                  value={registerForm.nombreAdmin}
                  onChange={(e) => setRegisterForm({ ...registerForm, nombreAdmin: e.target.value })}
                  placeholder="Carlos García"
                />

                <Input
                  label="Correo Electrónico"
                  type="email"
                  required
                  icon={<Mail size={20} strokeWidth={2.5} />}
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="tu@email.com"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Contraseña"
                    type="password"
                    required
                    icon={<Lock size={20} strokeWidth={2.5} />}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                  />

                  <Input
                    label="Confirmar"
                    type="password"
                    required
                    icon={<Lock size={20} strokeWidth={2.5} />}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                >
                  Crear Cuenta
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  Al registrarte, aceptas nuestros términos y condiciones
                </p>
              </form>
            )}
          </Card>

          {/* Footer */}
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6 animate-fade-in">
            GARSEA v1.0 - Sistema de Gestión Financiera
          </p>
        </div>
      </div>
    </div >
  );
}
