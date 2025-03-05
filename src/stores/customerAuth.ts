import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config';

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

interface CustomerAuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: CustomerUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<CustomerUser>) => Promise<void>;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,

      login: async (email: string, password: string) => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiUrl}/api/customers/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          set({
            token: data.data.token,
            isAuthenticated: true,
            user: data.data.user,
          });

          // Redirect to dashboard after successful login
          window.location.href = '/customer/dashboard';
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      register: async (data) => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiUrl}/api/customers/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
          }

          const responseData = await response.json();
          set({
            token: responseData.data.token,
            isAuthenticated: true,
            user: responseData.data.user,
          });

          // Redirect to dashboard after successful registration
          window.location.href = '/customer/dashboard';
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      updateProfile: async (data) => {
        try {
          const state = useCustomerAuthStore.getState();
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiUrl}/api/customer/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`,
            },
            credentials: 'include',
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
          }

          const responseData = await response.json();
          set((state) => ({
            user: { ...state.user, ...responseData.data.user },
          }));
        } catch (error) {
          console.error('Profile update error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          isAuthenticated: false,
          user: null,
        });
        window.location.href = '/';
      },
    }),
    {
      name: 'customer-auth-storage',
    }
  )
);
