import { Navigate, RouteObject } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import { useAdminAuthStore } from '../stores/adminAuth';
import ProductList from '../components/admin/products/ProductList';
import ProductView from '../components/admin/products/ProductView';
import EditProduct from '../components/admin/products/EditProduct';
import NewProduct from '../components/admin/products/NewProduct';
import InventoryList from '../components/admin/inventory/InventoryList';
import StockAdjustment from '../components/admin/inventory/StockAdjustment';
import CollectionManagement from './pages/collections/CollectionManagement';
import CollectionProducts from './pages/collections/CollectionProducts';
import { RouteErrorBoundary } from '../components/ErrorBoundary';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, checkAuth, isHydrated } = useAdminAuthStore();
  
  useEffect(() => {
    // Only check auth if the store has been hydrated from local storage
    if (isHydrated) {
      checkAuth();
    }
  }, [checkAuth, isHydrated]);
  
  if (!isHydrated) {
    // Show loading while waiting for hydration
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to /admin if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isHydrated } = useAdminAuthStore();
  
  if (!isHydrated) {
    // Show loading while waiting for hydration
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy load components with Suspense
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Settings = lazy(() => import('./pages/Settings'));
const CustomerList = lazy(() => import('./pages/customers/CustomerList'));
const CustomerDetails = lazy(() => import('./pages/customers/CustomerDetails'));
const SupplierManagement = lazy(() => import('./pages/suppliers/SupplierManagement'));
const SupplierOrderForm = lazy(() => import('./pages/suppliers/SupplierOrderForm'));

// Wrap lazy-loaded components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  const SuspendedComponent = () => (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
  return <SuspendedComponent />;
};

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: withSuspense(Dashboard),
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
            element: <NewProduct />,
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
            path: 'adjust',
            element: <StockAdjustment />,
          },
          {
            path: 'adjust/:id',
            element: <StockAdjustment />,
          },
        ],
      },
      {
        path: 'orders',
        element: withSuspense(Orders),
      },
      {
        path: 'settings',
        element: withSuspense(Settings),
      },
      {
        path: 'customers',
        children: [
          {
            index: true,
            element: withSuspense(CustomerList),
          },
          {
            path: ':id',
            element: withSuspense(CustomerDetails),
          },
        ],
      },
      {
        path: 'collections',
        children: [
          {
            index: true,
            element: <CollectionManagement />,
          },
          {
            path: ':id/products',
            element: <CollectionProducts />,
          },
        ],
      },
      {
        path: 'suppliers',
        children: [
          {
            index: true,
            element: withSuspense(SupplierManagement),
          },
          {
            path: ':supplierId/orders/new',
            element: withSuspense(SupplierOrderForm),
          },
          {
            path: ':supplierId/orders/:orderId',
            element: withSuspense(SupplierOrderForm),
          },
        ],
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
