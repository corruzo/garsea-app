import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Importación directa para carga "nativa" y veloz
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TasasCambio from './pages/TasasCambio.jsx';
import Clientes from './pages/Clientes.jsx';
import ClienteDetalle from './pages/ClienteDetalle.jsx';
import Prestamos from './pages/Prestamos.jsx';
import PrestamoDetalle from './pages/PrestamoDetalle.jsx';
import NuevoPrestamo from './pages/NuevoPrestamo.jsx';
import Configuracion from './pages/Configuracion.jsx';
import Cobranza from './pages/Cobranza.jsx';
import Reportes from './pages/Reportes.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import PageTransition from './components/PageTransition.jsx';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/authService';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />

        <Route path="/reset-password" element={
          <PageTransition>
            <ResetPassword />
          </PageTransition>
        } />

        {/* Rutas principales */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cobranza"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Cobranza />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Reportes />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasas"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <TasasCambio />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Clientes />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clientes/:cedula"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <ClienteDetalle />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/prestamos"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Prestamos />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/prestamos/nuevo"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <NuevoPrestamo />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/prestamos/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <PrestamoDetalle />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Configuracion />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirecciones y 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { initSession, loading } = useAuthStore();

  useEffect(() => {
    initSession(authService);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
