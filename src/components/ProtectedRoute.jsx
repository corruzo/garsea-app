import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

export default function ProtectedRoute({ children }) {
  const { user, setUser, setOrganizacion, setLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const result = await authService.getSession();
      
      if (result.success) {
        setUser(result.data.usuario);
        setOrganizacion(result.data.organizacion);
      }
      
      setChecking(false);
      setLoading(false);
    };

    if (!user) {
      checkAuth();
    } else {
      setChecking(false);
    }
  }, [user, setUser, setOrganizacion, setLoading]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
