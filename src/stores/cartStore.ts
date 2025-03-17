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
  item: Cart & {
    items: CartItem[];
  };
  updatedItem?: CartItem;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  variant?: {
    id: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string;
  } | null;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  loadCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  
  // Checkout methods
  createStripeCheckoutSession: () => Promise<{ sessionId: string } | null>;
  submitOrder: (paymentMethod: string, notes?: string) => Promise<{ orderId: string } | null>;
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
          const response = await api.post<CartResponse>(
            '/cart/items', 
            { productId, quantity, variantId }
          );

          if (response.status === 'success' && response.data) {
            set({ 
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Failed to add item to cart');
          }
        } catch (error) {
          console.error('Add to cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item to cart',
            loading: false 
          });
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        set({ loading: true, error: null });
        try {
          const response = await api.put<CartResponse>(
            `/cart/items/${itemId}`, 
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
          console.error('Update cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update cart item', 
            loading: false 
          });
        }
      },

      removeItem: async (itemId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.delete<CartResponse>(
            `/cart/items/${itemId}`
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
          console.error('Remove from cart error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove cart item', 
            loading: false 
          });
        }
      },

      loadCart: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get<CartResponse>('/cart');

          if (response.status === 'success' && response.data) {
            set({ 
              items: response.data.item.items,
              loading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Failed to load cart');
          }
        } catch (error) {
          console.error('Load cart error:', error);
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
          const response = await api.delete<CartResponse>('/cart');

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
      
      // Create a Stripe checkout session
      createStripeCheckoutSession: async () => {
        set({ loading: true, error: null });
        try {
          // First create an order record with PENDING status
          const orderResponse = await api.post<{ orderId: string }>(
            'orders', 
            { 
              paymentMethod: 'credit_card',
              paymentStatus: 'PENDING',
              notes: 'Awaiting Stripe payment confirmation'
            }
          );

          if (orderResponse.status === 'success' && orderResponse.data) {
            const orderId = orderResponse.data.orderId;
            
            // Create Stripe checkout session with the order ID in metadata
            const response = await api.post<{ sessionId: string }>(
              'checkout/create-session', 
              {
                orderId // Pass the orderId to include in Stripe session metadata
              }
            );

            if (response.status === 'success' && response.data) {
              set({ loading: false });
              
              // Return session ID for redirect
              return { sessionId: response.data.sessionId };
            } else {
              throw new Error(response.message || 'Failed to create checkout session');
            }
          } else {
            throw new Error(orderResponse.message || 'Failed to create order record');
          }
        } catch (error) {
          console.error('Stripe checkout error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create checkout session',
            loading: false 
          });
          return null;
        }
      },
      
      // Submit an order (non-Stripe payment method)
      submitOrder: async (paymentMethod: string, notes?: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post<{ orderId: string }>(
            'orders', 
            { 
              paymentMethod,
              notes
            }
          );

          if (response.status === 'success' && response.data) {
            // Clear cart after successful order
            await get().clearCart();
            set({ loading: false });
            
            // Return order ID for confirmation
            return { orderId: response.data.orderId };
          } else {
            throw new Error(response.message || 'Failed to submit order');
          }
        } catch (error) {
          console.error('Order submission error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to submit order',
            loading: false 
          });
          return null;
        }
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);
