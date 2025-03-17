import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import { useCustomerAuthStore } from './stores/customerAuth';
import { useAdminAuthStore } from './stores/adminAuth';
import { AuthProvider } from './contexts/AuthContext';

// Create a wrapper component to initialize stores before rendering routes
function App() {
  // Force hydration of persist middleware stores
  useEffect(() => {
    // Initialize stores to ensure they're ready before rendering routes
    const adminAuthStore = useAdminAuthStore.getState();
    
    // For TypeScript safety, check if these stores have a setHydrated method
    if ('setHydrated' in adminAuthStore) {
      (adminAuthStore as any).setHydrated(true);
    }

    // Force hydration of customer auth store as well
    useCustomerAuthStore.getState();
  }, []);

  return (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

// Initialize the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
