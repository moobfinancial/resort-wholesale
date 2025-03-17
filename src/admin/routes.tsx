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
import CreditApplicationList from '../pages/admin/CreditApplicationList';
import CreditApplicationDetail from '../pages/admin/CreditApplicationDetail';
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

// Define suspense-wrapped components
const SuspenseCustomerList = () => (
  <Suspense fallback={<LoadingFallback />}>
    <CustomerList />
  </Suspense>
);

const SuspenseCustomerDetails = () => (
  <Suspense fallback={<LoadingFallback />}>
    <CustomerDetails />
  </Suspense>
);

const SuspenseSupplierManagement = () => (
  <Suspense fallback={<LoadingFallback />}>
    <SupplierManagement />
  </Suspense>
);

const SuspenseSupplierOrderForm = () => (
  <Suspense fallback={<LoadingFallback />}>
    <SupplierOrderForm />
  </Suspense>
);

const SuspenseDashboard = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Dashboard />
  </Suspense>
);

const SuspenseOrders = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Orders />
  </Suspense>
);

const SuspenseSettings = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Settings />
  </Suspense>
);

const SuspenseNewProduct = () => (
  <Suspense fallback={<LoadingFallback />}>
    <NewProduct />
  </Suspense>
);

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
        element: <SuspenseDashboard />,
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
            element: <SuspenseNewProduct />,
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
        path: 'credit/applications',
        children: [
          {
            index: true,
            element: <CreditApplicationList />,
          },
          {
            path: ':id',
            element: <CreditApplicationDetail />,
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
        element: <SuspenseOrders />,
      },
      {
        path: 'settings',
        element: <SuspenseSettings />,
      },
      {
        path: 'customers',
        children: [
          {
            index: true,
            element: <SuspenseCustomerList />,
          },
          {
            path: ':id',
            element: <SuspenseCustomerDetails />,
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
            element: <SuspenseSupplierManagement />,
          },
          {
            path: ':supplierId/orders/new',
            element: <SuspenseSupplierOrderForm />,
          },
          {
            path: ':supplierId/orders/:orderId',
            element: <SuspenseSupplierOrderForm />,
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
