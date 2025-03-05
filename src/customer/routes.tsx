import React from 'react';
import CustomerDashboard from '../pages/customer/Dashboard';
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
      // Add more customer routes here
    ],
  },
];
