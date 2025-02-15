import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface CustomerAuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: CustomerUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
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
          const response = await fetch('/api/customer/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
          }

          const data = await response.json();
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

      register: async (firstName: string, lastName: string, email: string, password: string) => {
        try {
          const response = await fetch('/api/customer/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName, email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
          }

          const data = await response.json();
          set({
            token: data.token,
            isAuthenticated: true,
            user: data.user,
          });
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      updateProfile: async (data: Partial<CustomerUser>) => {
        const state = useCustomerAuthStore.getState();
        if (!state.token) {
          throw new Error('Not authenticated');
        }

        try {
          const response = await fetch('/api/customer/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Profile update failed');
          }

          const updatedUser = await response.json();
          set((state) => ({
            user: { ...state.user, ...updatedUser } as CustomerUser,
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
      },
    }),
    {
      name: 'customer-auth-storage',
    }
  )
);
