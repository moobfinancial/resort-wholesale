import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,
      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();
          
          // Also store token in localStorage for compatibility with API interceptor
          localStorage.setItem('admin-token', data.token);
          
          set({
            token: data.token,
            isAuthenticated: true,
            user: data.user,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      logout: () => {
        // Clear token from localStorage
        localStorage.removeItem('admin-token');
        
        set({
          token: null,
          isAuthenticated: false,
          user: null,
        });
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
