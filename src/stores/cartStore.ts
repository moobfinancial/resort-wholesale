import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config';
import { Product, ProductVariant } from '../types/product';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: Product;
  variant?: ProductVariant;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  loadCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      addItem: async (productId: string, quantity: number, variantId?: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/cart/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ productId, quantity, variantId }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add item to cart');
          }

          await get().loadCart();
        } catch (error) {
          console.error('Add to cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item to cart',
            loading: false 
          });
        }
      },

      removeItem: async (itemId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove item from cart');
          }

          await get().loadCart();
        } catch (error) {
          console.error('Remove from cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove item from cart',
            loading: false 
          });
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update cart item');
          }

          await get().loadCart();
        } catch (error) {
          console.error('Update cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update cart item',
            loading: false 
          });
        }
      },

      loadCart: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to load cart');
          }

          const data = await response.json();
          set({ 
            items: data.items || [], 
            loading: false 
          });
        } catch (error) {
          console.error('Load cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load cart',
            loading: false 
          });
        }
      },

      clearCart: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/cart/clear`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to clear cart');
          }

          set({ items: [], loading: false });
        } catch (error) {
          console.error('Clear cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            loading: false 
          });
        }
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant?.price || item.product.price;
          return total + (price * item.quantity);
        }, 0);
      },

      getCartItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
