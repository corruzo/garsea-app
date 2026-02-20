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
  User as UserIcon,
  Bell,
  CircleCheckBig,
  TriangleAlert,
  CircleAlert,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'prestamos', label: 'Préstamos', icon: Banknote, path: '/prestamos' },
  { id: 'cobranza', label: 'Cobranza', icon: Megaphone, path: '/cobranza' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, path: '/reportes' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useThemeStore();
  const { logout, user, organizacion } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const notifRef = useRef(null);

  // Aplicar tema al documento
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Click outside to close notifications
  useEffect(() => {
    function handleClickOutside(event) {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  // Determinar ruta activa
  const currentPath = location.pathname;
  const getActiveIndex = () => {
    return NAV_ITEMS.findIndex(item => currentPath.startsWith(item.path));
  };
  const activeIndex = getActiveIndex();

  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      toast('Presiona de nuevo para cerrar sesión', {
        icon: '⚠️',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      setTimeout(() => setConfirmLogout(false), 3000);
      return;
    }
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Mi Perfil', icon: UserIcon, action: () => { navigate('/configuracion'); setIsMenuOpen(false); } },
    { label: 'Control de Divisas', icon: Globe, action: () => { navigate('/tasas'); setIsMenuOpen(false); } },
    { label: 'Configuración Sistema', icon: Settings, action: () => { navigate('/configuracion'); setIsMenuOpen(false); } },
  ];

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CircleCheckBig className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <TriangleAlert className="w-5 h-5 text-amber-500" />;
      case 'error': return <CircleAlert className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors duration-500">
      <DataPreloader />
      <ConnectionIndicator />

      {/* Header Premium */}
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="group p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-3xl shadow-soft text-slate-900 dark:text-white transition-all hover:scale-110 active:scale-95 pointer-events-auto"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="relative pointer-events-auto" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="group p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-3xl shadow-soft text-slate-900 dark:text-white transition-all hover:scale-110 active:scale-95 relative"
            >
              <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute top-3.5 right-3.5 w-3 h-3 bg-indigo-600 border-2 border-white dark:border-slate-800 rounded-full animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden z-[110]"
                >
                  <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllAsRead();
                        }}
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter"
                      >
                        Marcar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto scrollbar-none">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className={`p-6 border-b border-slate-50 dark:border-slate-800 flex gap-4 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                        >
                          <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-1">{n.title}</p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-2">{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          {!n.read && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2" />}
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin notificaciones nuevas</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile / Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[150] flex justify-start">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col pt-24"
            >
              <div className="px-8 mb-12">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <span className="text-white font-black italic text-xl">G</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">Garsea App</h2>
                </div>
                <div className="h-1 w-12 bg-indigo-500 rounded-full" />
              </div>

              <div className="px-8 mb-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Organización</p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{organizacion?.nombre || 'Default Corp'}</p>
                </div>
              </div>

              <nav className="px-4 space-y-2 flex-1 scrollbar-none overflow-y-auto">
                <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Administración</p>
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-slate-700 dark:text-slate-300 font-bold text-sm group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-soft group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                        <item.icon className="w-5 h-5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                      {item.label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}

                <div className="pt-8 px-4">
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all font-black text-sm ${confirmLogout ? 'bg-rose-500 text-white shadow-lg' : 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 shadow-soft'}`}
                  >
                    <LogOut className="w-5 h-5" />
                    {confirmLogout ? '¿Confirmar Salida?' : 'Cerrar Sesión'}
                  </button>
                </div>
              </nav>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/20 mt-auto border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-500/20">
                    {user?.nombre?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{user?.nombre || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Admin</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Area de Contenido */}
      <main className={`transition-all duration-500 pt-24 pb-32 ${isMenuOpen ? 'scale-95 blur-sm' : ''}`}>
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>

      {/* Dock de Navegación Premium */}
      <nav className="fixed bottom-8 left-0 right-0 z-[120] px-6 pointer-events-none">
        <div className="max-w-xl mx-auto flex items-center justify-center">
          <div className="flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/40 dark:border-white/5 rounded-[2.5rem] p-2 shadow-2xl pointer-events-auto relative">

            {/* Indicador Deslizante */}
            {activeIndex !== -1 && (
              <motion.div
                layoutId="navIndicator"
                className="absolute bg-indigo-600 rounded-3xl z-0"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                style={{
                  width: '64px',
                  height: '64px',
                  left: 8 + (activeIndex * 72)
                }}
              />
            )}

            <div className="flex items-center gap-2 relative z-10">
              {NAV_ITEMS.map((item, i) => {
                const isActive = i === activeIndex;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="relative w-16 h-16 flex flex-col items-center justify-center rounded-3xl transition-all duration-200 active:scale-90 group"
                  >
                    <Icon
                      className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110'}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="navDot"
                        className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
