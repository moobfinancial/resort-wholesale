import { create } from 'zustand';
import { api } from '../lib/api';

interface Profile {
  id: string;
  full_name: string | null;
  is_wholesale: boolean;
  business_name: string | null;
  tax_id: string | null;
  is_verified: boolean;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, isWholesale: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { token, user } = await api.auth.login(email, password);
      
      // Store the token in localStorage
      localStorage.setItem('authToken', token);
      
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, isWholesale: boolean) => {
    // TODO: Implement signup functionality
    throw new Error('Signup not implemented');
  },

  signOut: async () => {
    try {
      await api.auth.logout();
      localStorage.removeItem('authToken');
      set({ user: null, profile: null });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if the API call fails
      localStorage.removeItem('authToken');
      set({ user: null, profile: null });
    }
  },

  loadProfile: async () => {
    // TODO: Implement profile loading
    return;
  },
}));