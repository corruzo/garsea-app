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
  Fingerprint,
  ChevronLeft
} from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setOrganizacion } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    nombreEmpresa: '', nombreAdmin: '', cedula: '', email: '', telefono: '', password: '', confirmPassword: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await authService.login(loginForm.email, loginForm.password);
    if (result.success) {
      setUser(result.data.usuario);
      setOrganizacion(result.data.organizacion);
      toast.success('¡Bienvenido!');
      setTimeout(() => navigate('/dashboard'), 200);
    } else {
      toast.error(result.error || 'Correo o clave incorrectos');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    const result = await authService.registrarOrganizacion(registerForm);
    if (result.success) {
      toast.success('Cuenta creada. Ya puede entrar.');
      setIsLogin(true);
    } else {
      toast.error(result.error || 'Error al crear cuenta');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn transition-colors duration-500">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Refinado */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <span className="text-2xl font-black text-white italic">G</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            GARSEA
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Gestión Financiera
          </p>
        </div>

        {/* Card Principal */}
        <Card className="!p-8 border-none shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
          {!isForgotPassword && (
            <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${isLogin ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                ENTRAR
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                REGISTRO
              </button>
            </div>
          )}

          {isForgotPassword ? (
            <form className="space-y-6 animate-slideUp">
              <div className="text-center space-y-2 mb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Recuperar Acceso</h3>
                <p className="text-xs font-bold text-slate-400 px-4">Enviaremos un enlace de restauración a su correo electrónico.</p>
              </div>
              <Input
                label="Correo Electrónico"
                type="email"
                required
                icon={<Mail size={18} />}
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="ejemplo@correo.com"
              />
              <Button fullWidth loading={loading}>ENVIAR ENLACE</Button>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase"
              >
                <ChevronLeft size={14} /> Volver atrás
              </button>
            </form>
          ) : isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6 animate-fadeIn">
              <Input
                label="Usuario / Correo"
                type="email"
                required
                icon={<Mail size={18} />}
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="tu@correo.com"
              />
              <Input
                label="Contraseña"
                type="password"
                required
                icon={<Lock size={18} />}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs font-black text-indigo-600 hover:underline uppercase"
                >
                  ¿Olvidó su clave?
                </button>
              </div>
              <Button type="submit" fullWidth loading={loading} className="py-4">ACCEDER AL PANEL</Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5 animate-fadeIn">
              <Input
                label="Nombre del Negocio"
                required
                icon={<Building2 size={18} />}
                value={registerForm.nombreEmpresa}
                onChange={(e) => setRegisterForm({ ...registerForm, nombreEmpresa: e.target.value })}
                placeholder="Ej: Préstamos García"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula"
                  required
                  icon={<Fingerprint size={18} />}
                  value={registerForm.cedula}
                  onChange={(e) => setRegisterForm({ ...registerForm, cedula: e.target.value })}
                  placeholder="V-12345678"
                />
                <Input
                  label="Teléfono"
                  required
                  icon={<Phone size={18} />}
                  value={registerForm.telefono}
                  onChange={(e) => setRegisterForm({ ...registerForm, telefono: e.target.value })}
                  placeholder="0412-1234567"
                />
              </div>
              <Input
                label="Su Nombre Completo"
                required
                icon={<User size={18} />}
                value={registerForm.nombreAdmin}
                onChange={(e) => setRegisterForm({ ...registerForm, nombreAdmin: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
              <Input
                label="Correo Electrónico"
                type="email"
                required
                icon={<Mail size={18} />}
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Clave Nueva"
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="••••••••"
                />
                <Input
                  label="Repita Clave"
                  type="password"
                  required
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" fullWidth loading={loading}>CREAR CUENTA</Button>
            </form>
          )}
        </Card>

        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
          GARSEA FINTECH SOLUTIONS v1.2
        </p>
      </div>
    </div>
  );
}
