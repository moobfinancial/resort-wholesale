import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '../../stores/customerAuth';
import { useAdminAuthStore } from '../../stores/adminAuth';

// Create a proper function component with a React.memo wrapper
const RequireCustomerAuth = React.memo(function RequireCustomerAuthComponent() {
  // Move hooks to the top level of the function component
  const location = useLocation();
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
});

// Create a proper function component with a React.memo wrapper
const RequireAdminAuth = React.memo(function RequireAdminAuthComponent() {
  // Move hooks to the top level of the function component
  const location = useLocation();
  const isAuthenticated = useAdminAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
});

export { RequireCustomerAuth, RequireAdminAuth };
