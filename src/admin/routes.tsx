import { Navigate, RouteObject } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import { useAuthStore } from './stores/auth';
import ProductList from '../components/admin/products/ProductList';
import ProductForm from '../components/admin/products/ProductForm';
import ProductView from '../components/admin/products/ProductView';
import EditProduct from '../components/admin/products/EditProduct';
import InventoryList from '../components/admin/inventory/InventoryList';
import StockAdjustment from '../components/admin/inventory/StockAdjustment';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to /admin if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        async lazy() {
          const { default: Dashboard } = await import('./pages/Dashboard');
          return { Component: Dashboard };
        },
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: <ProductList />,
          },
          {
            path: 'new',
            element: <ProductForm />,
          },
          {
            path: ':id',
            element: <ProductView />,
          },
          {
            path: ':id/edit',
            element: <EditProduct />,
          },
        ],
      },
      {
        path: 'inventory',
        children: [
          {
            index: true,
            element: <InventoryList />,
          },
          {
            path: 'adjust/:id',
            element: <StockAdjustment />,
          },
        ],
      },
      {
        path: 'customers',
        async lazy() {
          const { default: Customers } = await import('./pages/Customers');
          return { Component: Customers };
        },
      },
      {
        path: 'orders',
        async lazy() {
          const { default: Orders } = await import('./pages/Orders');
          return { Component: Orders };
        },
      },
      {
        path: 'settings',
        async lazy() {
          const { default: Settings } = await import('./pages/Settings');
          return { Component: Settings };
        },
      },
    ],
  },
  {
    path: '/admin/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
];
