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
  { id: 'clientes', label: 'Cli', icon: Users, path: '/clientes' },
  { id: 'prestamos', label: 'Pres', icon: Banknote, path: '/prestamos' },
  { id: 'cobranza', label: 'Cob', icon: Megaphone, path: '/cobranza' },
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

      {/* Cabecera Ultra Compacta (56px) */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-14 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate max-w-[100px]">{organizacion?.nombre || 'GARSEA'}</span>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionIndicator />

            <div className="relative" ref={notifRef}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                <Bell className="w-5 h-5 text-slate-400" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[110]">
                    <div className="p-3 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Alertas</span>
                      <button onClick={markAllAsRead} className="text-[9px] font-black text-indigo-600">Limpiar</button>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} onClick={() => markAsRead(n.id)} className="p-3 border-b text-[11px] hover:bg-slate-50">
                            <p className="font-black text-slate-800 dark:text-white">{n.title}</p>
                            <p className="text-slate-400 line-clamp-1">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-[9px] font-black text-slate-300 uppercase">Bandeja vacía</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} ref={userMenuRef} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-[10px]">{user?.nombre?.charAt(0)}</div>
            </button>
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-4 top-14 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-[110]">
                  <button onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                    {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-600" />}
                    Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
                  </button>
                  <button onClick={() => { navigate('/configuracion'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase text-slate-600">
                    <Settings size={14} /> Ajustes
                  </button>
                  <hr className="my-1 border-slate-100 dark:border-slate-800" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase text-red-600 hover:bg-red-50">
                    <LogOut size={14} /> Salir
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Menú Lateral */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-slate-950/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed top-0 left-0 w-72 h-full bg-white dark:bg-slate-900 z-[200] shadow-2xl flex flex-col p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic">G</div>
                  <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">GARSEA</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Administración</p>
                {menuItems.map((item) => (
                  <button key={item.label} onClick={() => { navigate(item.path); setIsMenuOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white"><item.icon size={16} /></div>
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-16 pb-24">
        {children}
      </main>

      {/* Dock Inferior Ultra Compacto (64px) */}
      <nav className="fixed bottom-4 left-0 right-0 z-[120] px-4">
        <div className="max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-1 shadow-lg flex items-center justify-around ring-4 ring-slate-100/50 dark:ring-black/10">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-[2rem] transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 mb-0.5' : 'mb-0'}`} />
                {isActive && (
                  <span className="text-[7px] font-black uppercase tracking-tight">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
