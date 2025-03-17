import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_BASE_URL } from '../config';
import { useCartStore } from './cartStore';
import { useGuestCartStore } from './guestCartStore';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  status?: string;
  phone?: string;
  businessType?: string;
  taxId?: string;
  companyName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  creditLimit?: number;
  creditApproved?: boolean;
}

interface CustomerAuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: CustomerUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<CustomerUser>) => Promise<{ status: string; message: string }>;
  updateBusinessInfo: (data: {
    companyName?: string;
    businessType?: string; 
    taxId?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  }) => void;
}

// Create the store with stronger typing and safer initialization for React 18
export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      user: null,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || 'Login failed');
          }

          // Handle different response formats
          let userData;
          let tokenData;

          if (responseData.status === 'success' && responseData.data) {
            // New standardized format
            userData = responseData.data.user;
            tokenData = responseData.data.token;
          } else if (responseData.token && responseData.user) {
            // Legacy format - direct properties
            userData = responseData.user;
            tokenData = responseData.token;
          } else {
            throw new Error('Invalid response format');
          }
          
          if (!userData) {
            throw new Error('Invalid user data received');
          }
          
          // Use a consistent way to handle the name
          const displayName = userData.fullName || 
                             (userData.firstName && userData.lastName) ? 
                             `${userData.firstName} ${userData.lastName}` : 
                             userData.contactName || 
                             userData.email.split('@')[0];
          
          set({
            token: tokenData,
            isAuthenticated: true,
            user: {
              id: userData.id,
              name: displayName,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              contactName: userData.contactName,
              status: userData.status,
              phone: userData.phone || '',
              businessType: userData.businessType || '',
            },
          });

          console.log('Login successful:', userData);
          
          // Transfer guest cart items to user cart if any exist
          // Disable automatic transfer to avoid validation errors
          // The Cart component will handle this transfer when needed
          console.log('Login successful - cart transfer will be handled by Cart component');
          
          // No redirect - let the component handle it
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      register: async (data) => {
        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
          });

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || 'Registration failed');
          }

          // Handle different response formats
          let userData;
          let tokenData;

          if (responseData.status === 'success' && responseData.data) {
            // New standardized format
            userData = responseData.data.user;
            tokenData = responseData.data.token;
          } else if (responseData.token && responseData.user) {
            // Legacy format - direct properties
            userData = responseData.user;
            tokenData = responseData.token;
          } else {
            throw new Error('Invalid response format');
          }
          
          if (!userData) {
            throw new Error('Invalid user data received');
          }

          // Use a consistent way to handle the name
          const displayName = userData.fullName || 
                             (userData.firstName && userData.lastName) ? 
                             `${userData.firstName} ${userData.lastName}` : 
                             userData.contactName || 
                             userData.email.split('@')[0];
          
          set({
            token: tokenData,
            isAuthenticated: true,
            user: {
              id: userData.id,
              name: displayName,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              contactName: userData.contactName,
              status: userData.status,
            },
          });

          console.log('Registration successful:', userData);
          
          // Transfer guest cart items to user cart if any exist
          // Disable automatic transfer to avoid validation errors
          // The Cart component will handle this transfer when needed
          console.log('Registration successful - cart transfer will be handled by Cart component');
          
          // No redirect - let the component handle it
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      updateProfile: async (data) => {
        // Validate user is logged in
        if (!get().isAuthenticated || !get().user) {
          return {
            status: 'error',
            message: 'You must be logged in to update your profile',
          };
        }

        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
          });

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || 'Profile update failed');
          }

          // Handle different response formats
          let userData;

          if (responseData.status === 'success' && responseData.data && responseData.data.user) {
            // New standardized format
            userData = responseData.data.user;
          } else if (responseData.user) {
            // Legacy format - direct properties
            userData = responseData.user;
          } else {
            throw new Error('Invalid response format');
          }
          
          if (!userData) {
            throw new Error('Invalid user data received');
          }

          // Use a consistent way to handle the name
          const displayName = userData.fullName || 
                             (userData.firstName && userData.lastName) ? 
                             `${userData.firstName} ${userData.lastName}` : 
                             userData.contactName || 
                             userData.email.split('@')[0];
          
          // Update user state with new information
          set(state => ({
            user: {
              ...state.user as CustomerUser,
              ...userData,
              name: displayName
            }
          }));
          
          return {
            status: 'success',
            message: 'Profile updated successfully',
          };
        } catch (error) {
          console.error('Profile update error:', error);
          return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Profile update failed',
          };
        }
      },

      updateBusinessInfo: (data) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            ...data,
          },
        });
      },

      logout: () => {
        // Call the logout API endpoint to clear the cookie
        fetch(`${API_BASE_URL}/customer/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(console.error);
        
        // Reset the local state
        set({
          token: null,
          isAuthenticated: false,
          user: null,
        });

        // Redirect to home page after logout
        window.location.href = '/';
      },
    }),
    {
      name: 'customer-auth-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true // This helps with SSR and React 18 compatibility
    }
  )
);
