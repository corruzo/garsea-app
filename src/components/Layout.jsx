import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import DataPreloader from './DataPreloader';
import ConnectionIndicator from './ConnectionIndicator';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Megaphone,
  BarChart3,
  Menu,
  LogOut,
  Settings,
  Globe,
  Bell,
  ChevronRight,
  X,
  User as UserIcon,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'prestamos', label: 'Préstamos', icon: Banknote, path: '/prestamos' },
  { id: 'cobranza', label: 'Cobros', icon: Megaphone, path: '/cobranza' },
  { id: 'reportes', label: 'Análisis', icon: BarChart3, path: '/reportes' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { logout, user, organizacion } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
        setConfirmLogout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen, isUserMenuOpen]);

  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    await logout();
    navigate('/login');
    toast.success('Sesión finalizada');
  };

  const menuItems = [
    { label: 'Control de Divisas', icon: Globe, path: '/tasas' },
    { label: 'Ajustes del Sistema', icon: Settings, path: '/configuracion' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-500">
      <DataPreloader />

      {/* Cabecera Ultradelgada y Elegante */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{organizacion?.nombre || 'Gestión'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionIndicator />

            {/* Notificaciones Refinadas */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
              >
                <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden z-[110]"
                  >
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alertas</span>
                      <button onClick={markAllAsRead} className="text-[10px] font-black text-indigo-600 hover:underline px-2 py-1">Limpiar</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 border-b border-slate-50 dark:border-slate-800 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                            <div className="flex-1">
                              <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight mb-1">{n.title}</p>
                              <p className="text-xs font-bold text-slate-400 line-clamp-2">{n.message}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1" />}
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Bandeja vacía</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menú de Usuario Compacto */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:ring-4 ring-indigo-500/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                  {user?.nombre?.charAt(0) || 'U'}
                </div>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-xl overflow-hidden z-[110]"
                  >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl mb-3 shadow-lg">{user?.nombre?.charAt(0)}</div>
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate w-full px-2">{user?.nombre}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cedula: {user?.cedula}</p>
                    </div>
                    <div className="p-3 space-y-1">
                      <button onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 transition-all">
                        <div className="flex items-center gap-3">
                          {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-600" />}
                          Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
                        </div>
                      </button>
                      <button onClick={() => { navigate('/configuracion'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 transition-all">
                        <Settings size={18} />
                        Ajustes
                      </button>
                      <hr className="my-2 border-slate-100 dark:border-slate-800" />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-xs font-black ${confirmLogout ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                      >
                        <LogOut size={18} />
                        {confirmLogout ? 'CONFIRMAR SALIDA' : 'CERRAR SESIÓN'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Menú Lateral Moderno */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-slate-950/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 w-80 h-full bg-white dark:bg-slate-900 z-[200] shadow-2xl flex flex-col p-6">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black italic text-xl">G</div>
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-widest">GARSEA</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-2 flex-1">
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Módulos Administrativos</p>
                {menuItems.map((item) => (
                  <button key={item.label} onClick={() => { navigate(item.path); setIsMenuOpen(false); }} className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><item.icon size={20} /></div>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-center text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Garsea App v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-32">
        {children}
      </main>

      {/* Dock Inferior - Ultradelgado y Flotante */}
      <nav className="fixed bottom-8 left-0 right-0 z-[120] px-6">
        <div className="max-w-xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-2 border-white dark:border-slate-800 rounded-[3rem] p-2 shadow-xl flex items-center justify-around relative ring-8 ring-slate-100/50 dark:ring-black/10">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-[2.5rem] transition-all duration-500 overflow-hidden ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110 mb-0.5' : 'mb-0'}`} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[8px] font-black uppercase tracking-tight leading-none"
                  >
                    {item.label}
                  </motion.span>
                )}
                {/* Indicador de Pulsación */}
                {!isActive && (
                  <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/10 opacity-0 hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
