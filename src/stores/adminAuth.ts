import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminState {
  isAuthenticated: boolean;
  admin: {
    id: string;
    email: string;
    name: string;
  } | null;
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
      isHydrated: false,

      setHydrated: (state: boolean) => set({ isHydrated: state }),

      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/admin/auth/login', {
            method: 'POST',
            credentials: 'include', // Important for cookies
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
  
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(errorData.message || 'Login failed');
          }
  
          const admin = await response.json();
          set({ isAuthenticated: true, admin });
        } catch (error) {
          console.error("Login error:", error);
          throw error;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/admin/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ isAuthenticated: false, admin: null });
        }
      },

      checkAuth: async () => {
        try {
          const response = await fetch('/api/admin/auth/me', {
            credentials: 'include',
          });

          if (!response.ok) {
            set({ isAuthenticated: false, admin: null });
            return;
          }

          const admin = await response.json();
          set({ isAuthenticated: true, admin });
        } catch (error) {
          console.error("Auth check error:", error);
          set({ isAuthenticated: false, admin: null });
        }
      },
    }),
    {
      name: 'admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        admin: state.admin,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
