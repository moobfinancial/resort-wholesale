import { create } from 'zustand';
import { frontendProductApi } from '../lib/api';
import { Product, Category } from '../types/product';

interface ProductQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  featuredProducts: Product[];
  newArrivals: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  
  // Actions
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchNewArrivals: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  featuredProducts: [],
  newArrivals: [],
  currentProduct: null,
  relatedProducts: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  
  fetchProducts: async (params?: ProductQueryParams) => {
    set({ loading: true, error: null });
    try {
      const response = await frontendProductApi.listProducts(params);
      if (response.status === 'success' && response.data) {
        set({ 
          products: response.data.products,
          totalPages: Math.ceil(response.data.total / (params?.limit || 12)),
          currentPage: params?.page || 1,
          loading: false 
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false,
        products: [] // Reset products on error
      });
    }
  },
  
  fetchCategories: async () => {
    try {
      const response = await frontendProductApi.getCategories();
      if (response.status === 'success' && response.data) {
        set({ categories: response.data });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        categories: [] // Reset categories on error
      });
    }
  },
  
  fetchProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const [productRes, relatedRes] = await Promise.all([
        frontendProductApi.getProduct(id),
        frontendProductApi.getRelatedProducts(id)
      ]);
      if (productRes.status === 'success' && relatedRes.status === 'success') {
        set({ 
          currentProduct: productRes.data,
          relatedProducts: relatedRes.data,
          loading: false 
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        loading: false,
        currentProduct: null,
        relatedProducts: []
      });
    }
  },
  
  fetchFeaturedProducts: async () => {
    try {
      const response = await frontendProductApi.getFeaturedProducts();
      if (response.status === 'success' && response.data) {
        set({ featuredProducts: response.data });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch featured products',
        featuredProducts: [] // Reset featured products on error
      });
    }
  },
  
  fetchNewArrivals: async () => {
    try {
      const response = await frontendProductApi.getNewArrivals();
      if (response.status === 'success' && response.data) {
        set({ newArrivals: response.data });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch new arrivals',
        newArrivals: [] // Reset new arrivals on error
      });
    }
  },
  
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    const state = get();
    state.fetchProducts({ page, limit: 12 });
  },
  
  clearError: () => set({ error: null })
}));
