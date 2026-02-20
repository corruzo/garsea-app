import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  // Si aún está cargando la sesión inicial, no redirigir
  if (loading) return null;

  // Si no hay usuario después de cargar, mandar al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, permitir acceso
  return children;
}
