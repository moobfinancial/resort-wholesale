import create from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

// API Response types
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: string;
}

interface CartResponse {
  item: GuestCart & {
    items: GuestCartItem[];
  };
  updatedItem?: GuestCartItem;
}

export interface GuestCartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    imageUrl?: string; // Added to match CartItem
    sku?: string; // Added to match CartItem
  };
  variant?: {
    id: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string;
    attributes?: Record<string, string>; // Added to match CartItem
  } | null;
}

export interface GuestCart {
  id: string;
  items: GuestCartItem[];
}

interface GuestCartState {
  cartId: string | null;
  items: GuestCartItem[];
  loading: boolean;
  error: string | null;
  
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  loadCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      loading: false,
      error: null,

      addItem: async (productId: string, quantity: number, variantId?: string) => {
        set({ loading: true, error: null });
        try {
          const cartId = get().cartId;
          let response;
          
          if (cartId) {
            // If we have a cartId, use it in the endpoint
            response = await api.post<CartResponse>(
              `guest-cart/${cartId}/items`, 
              { productId, quantity, variantId }
            );
          } else {
            // If no cartId, first get a cart, then add the item
            const cartResponse = await api.get<CartResponse>('guest-cart');
            
            if (cartResponse.status === 'success' && cartResponse.data) {
              const newCartId = cartResponse.data.item.id;
              
              // Now add the item to the new cart
              response = await api.post<CartResponse>(
                `guest-cart/${newCartId}/items`, 
                { productId, quantity, variantId }
              );
            } else {
              throw new Error(cartResponse.message || 'Failed to create guest cart');
            }
          }

          if (response && response.status === 'success' && response.data) {
            set({ 
              cartId: response.data.item.id,
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else if (response) {
            throw new Error(response.message || 'Failed to add item to cart');
          } else {
            throw new Error('Failed to add item to cart');
          }
        } catch (error) {
          console.error('Add to guest cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item to cart',
            loading: false 
          });
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        set({ loading: true, error: null });
        try {
          const cartId = get().cartId;
          if (!cartId) {
            throw new Error('No cart found');
          }
          
          const response = await api.put<CartResponse>(
            `guest-cart/${cartId}/items/${itemId}`, 
            { quantity }
          );

          if (response.status === 'success' && response.data) {
            set({ 
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Failed to update cart item');
          }
        } catch (error) {
          console.error('Update guest cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update cart item', 
            loading: false 
          });
        }
      },

      removeItem: async (itemId: string) => {
        set({ loading: true, error: null });
        try {
          const cartId = get().cartId;
          if (!cartId) {
            throw new Error('No cart found');
          }
          
          const response = await api.delete<CartResponse>(
            `guest-cart/${cartId}/items/${itemId}`
          );

          if (response.status === 'success' && response.data) {
            set({ 
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Failed to remove cart item');
          }
        } catch (error) {
          console.error('Remove from guest cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove cart item', 
            loading: false 
          });
        }
      },

      loadCart: async () => {
        set({ loading: true, error: null });
        try {
          const cartId = get().cartId;
          const endpoint = cartId ? `guest-cart/${cartId}` : 'guest-cart';
          
          const response = await api.get<CartResponse>(endpoint);

          if (response.status === 'success' && response.data) {
            set({ 
              cartId: response.data.item.id,
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Failed to load cart');
          }
        } catch (error) {
          console.error('Load guest cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load cart', 
            loading: false,
            items: [] 
          });
        }
      },

      clearCart: async () => {
        set({ loading: true, error: null });
        try {
          const cartId = get().cartId;
          if (!cartId) {
            // If no cart exists, just reset the state
            set({ 
              items: [],
              loading: false,
              error: null
            });
            return;
          }
          
          const response = await api.delete<CartResponse>(`guest-cart/${cartId}`);

          if (response.status === 'success' && response.data) {
            set({ 
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Failed to clear cart');
          }
        } catch (error) {
          console.error('Clear guest cart error:', error);
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
      }
    }),
    {
      name: 'guest-cart-storage',
    }
  )
);
