import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '../../stores/customerAuth';
import { useAdminAuthStore } from '../../stores/adminAuth';

export function RequireCustomerAuth() {
  const { isAuthenticated } = useCustomerAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RequireAdminAuth() {
  const { isAuthenticated } = useAdminAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
