import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerDashboard from '../pages/customer/Dashboard';
import CustomerProfile from '../pages/customer/Profile';
import CustomerOrders from '../pages/customer/Orders';
import CustomerDocuments from '../pages/customer/Documents';
import { useCustomerAuthStore } from '../stores/customerAuth';

const CustomerRoutes: React.FC = () => {
  const { isAuthenticated } = useCustomerAuthStore();

  if (!isAuthenticated) {
    // Instead of redirecting to /login, we'll show a message or placeholder
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please Sign In</h2>
          <p className="mt-2 text-gray-600">You need to sign in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<CustomerDashboard />} />
      <Route path="/profile" element={<CustomerProfile />} />
      <Route path="/orders" element={<CustomerOrders />} />
      <Route path="/documents" element={<CustomerDocuments />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default CustomerRoutes;
