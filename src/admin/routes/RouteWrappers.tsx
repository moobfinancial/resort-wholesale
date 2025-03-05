import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../../stores/adminAuth';

// Protected route wrapper
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAdminAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to /admin if already authenticated)
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAdminAuthStore(state => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
