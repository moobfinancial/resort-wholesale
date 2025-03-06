import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  creditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  creditLimit?: number;
  availableCredit?: number;
  contactName?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  taxId?: string;
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
          const response = await fetch(`${API_BASE_URL}/customers/login`, {
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
            token: data.token,
            isAuthenticated: true,
            user: data.user,
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
          const response = await fetch(`${API_BASE_URL}/customers/register`, {
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
            token: responseData.token,
            isAuthenticated: true,
            user: responseData.user,
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
          const response = await fetch(`${API_BASE_URL}/customer/auth/profile`, {
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
