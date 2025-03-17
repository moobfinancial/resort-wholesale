import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminState {
  isAuthenticated: boolean;
  admin: {
    id: string;
    email: string;
    name: string;
  } | null;
  token: string | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setHydrated: (state: boolean) => void;
}

export const useAdminAuthStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      admin: null,
      token: null,
      isHydrated: false,

      setHydrated: (state: boolean) => set({ isHydrated: state }),

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`/api/admin/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
  
          const data = await response.json();
          
          if (!response.ok || data.status === 'error') {
            throw new Error(data.message || 'Invalid credentials');
          }
          
          if (data.status === 'success' && data.data) {
            // Store the token in localStorage for axios to use
            if (data.data.token) {
              localStorage.setItem('auth-token', data.data.token);
            }
            
            set({ 
              isAuthenticated: true, 
              admin: data.data.admin || null,
              token: data.data.token || null
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error("Login error:", error);
          throw error;
        }
      },

      logout: async () => {
        try {
          const response = await fetch('/api/admin/logout', {
            method: 'POST',
            credentials: 'include',
          });

          const data = await response.json();
          
          if (!response.ok || data.status === 'error') {
            throw new Error(data.message || 'Logout failed');
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear the token and state regardless of logout success
          localStorage.removeItem('auth-token');
          set({ isAuthenticated: false, admin: null, token: null });
        }
      },

      checkAuth: async () => {
        try {
          const response = await fetch(`/api/admin/me`, {
            credentials: 'include',
          });

          const data = await response.json();
          
          if (!response.ok || data.status === 'error') {
            throw new Error(data.message || 'Authentication check failed');
          }
          
          if (data.status === 'success' && data.data) {
            // Update token if it's in the response
            if (data.data.token) {
              localStorage.setItem('auth-token', data.data.token);
            }
            
            set({ 
              isAuthenticated: true, 
              admin: data.data.admin || null,
              token: data.data.token || localStorage.getItem('auth-token')
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error("Auth check error:", error);
          localStorage.removeItem('auth-token');
          set({ isAuthenticated: false, admin: null, token: null });
        }
      },
    }),
    {
      name: 'admin-auth', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        admin: state.admin,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          
          // Ensure the token is also in localStorage for axios
          if (state.token) {
            localStorage.setItem('auth-token', state.token);
          }
        }
      },
    }
  )
);
