import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CartProduct {
  id: string;
  name: string;
  retail_price: number;
  wholesale_price: number;
  images: string[];
  min_wholesale_qty: number;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  loadCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: true,

  addItem: async (productId: string, quantity: number) => {
    const { error } = await supabase
      .from('cart_items')
      .insert({ product_id: productId, quantity });

    if (error) throw error;
    await get().loadCart();
  },

  removeItem: async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    await get().loadCart();
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) throw error;
    await get().loadCart();
  },

  loadCart: async () => {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        product:products (
          id,
          name,
          retail_price,
          wholesale_price,
          images,
          min_wholesale_qty
        )
      `);

    if (error) throw error;
    set({ items: data || [], loading: false });
  },

  clearCart: async () => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .neq('id', '');

    if (error) throw error;
    set({ items: [] });
  },
}));