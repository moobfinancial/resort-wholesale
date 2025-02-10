import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

interface ProductState {
  products: Product[];
  loading: boolean;
  selectedProduct: Product | null;
  loadProducts: (category?: string) => Promise<void>;
  loadProduct: (id: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  checkWishlist: (productId: string) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: true,
  selectedProduct: null,

  loadProducts: async (category?: string) => {
    let query = supabase
      .from('products')
      .select(`
        *,
        price_breaks (
          quantity,
          discount
        )
      `);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    set({ products: data || [], loading: false });
  },

  loadProduct: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        price_breaks (
          quantity,
          discount
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    set({ selectedProduct: data });
  },

  toggleWishlist: async (productId: string) => {
    const isInWishlist = await get().checkWishlist(productId);

    if (isInWishlist) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('product_id', productId);
    } else {
      await supabase
        .from('wishlists')
        .insert({ product_id: productId });
    }
  },

  checkWishlist: async (productId: string) => {
    const { data } = await supabase
      .from('wishlists')
      .select('id')
      .eq('product_id', productId)
      .single();

    return !!data;
  },
}));