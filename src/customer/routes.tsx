import React from 'react';
import CustomerDashboard from '../pages/customer/Dashboard';
import CreditApplication from '../pages/customer/CreditApplication';
import { RequireCustomerAuth } from '../components/auth/RequireAuth';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const customerRoutes = [
  {
    path: '/customer',
    element: <RequireCustomerAuth />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ErrorBoundary>
            <CustomerDashboard />
          </ErrorBoundary>
        ),
      },
      {
        path: 'credit/apply',
        element: (
          <ErrorBoundary>
            <CreditApplication />
          </ErrorBoundary>
        ),
      },
    ],
  },
];
