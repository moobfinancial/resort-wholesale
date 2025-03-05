import { create } from 'zustand';
import { api } from '../lib/api';
import type { Product } from '../types/product';

interface AnalysisResult {
  category: string;
  description: string;
  suggestedTags: string[];
}

interface ProductState {
  products: Product[];
  loading: boolean;
  selectedProduct: Product | null;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  error: string | null;
  createProduct: (formData: FormData) => Promise<Product>;
  updateProduct: (id: string, formData: FormData) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  fetchProducts: (params?: { category?: string; page?: number; limit?: number }) => Promise<void>;
  getProduct: (id: string) => Promise<Product>;
  analyzeImage: (imageFile: File) => Promise<AnalysisResult>;
  uploadImage: (productId: string, imageFile: File) => Promise<{ imageUrl: string }>;
  setSelectedProduct: (product: Product | null) => void;
  clearAnalysisResult: () => void;
  setError: (error: string | null) => void;
  adjustStock: (productId: string, quantity: number, type: 'add' | 'subtract') => Promise<void>;
  updateMinimumStock: (productId: string, minStock: number) => Promise<void>;
  getLowStockProducts: () => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  selectedProduct: null,
  isAnalyzing: false,
  analysisResult: null,
  error: null,

  createProduct: async (formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.create(formData);
      set(state => ({
        products: [...state.products, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create product', loading: false });
      throw error;
    }
  },

  updateProduct: async (id: string, formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.update(id, formData);
      set(state => ({
        products: state.products.map(p => p.id === id ? response.data : p),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update product', loading: false });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.products.delete(id);
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete product', loading: false });
      throw error;
    }
  },

  fetchProducts: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.list(params);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch products', loading: false });
      throw error;
    }
  },

  getProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.get(id);
      set({ selectedProduct: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get product', loading: false });
      throw error;
    }
  },

  analyzeImage: async (imageFile: File) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await api.products.analyzeImage(imageFile);
      set({ 
        analysisResult: response.data,
        isAnalyzing: false 
      });
      return response.data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to analyze image',
        isAnalyzing: false 
      });
      throw error;
    }
  },

  uploadImage: async (productId: string, imageFile: File) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.uploadImage(productId, imageFile);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to upload image', loading: false });
      throw error;
    }
  },

  setSelectedProduct: (product: Product | null) => set({ selectedProduct: product }),
  clearAnalysisResult: () => set({ analysisResult: null }),
  setError: (error: string | null) => set({ error }),

  adjustStock: async (productId: string, quantity: number, type: 'add' | 'subtract') => {
    set({ loading: true, error: null });
    try {
      const product = await get().getProduct(productId);
      const newStock = type === 'add' ? product.stock + quantity : product.stock - quantity;
      
      if (newStock < 0) {
        throw new Error('Stock cannot be negative');
      }

      const response = await api.products.adjustStock(productId, newStock);
      
      // Update the products list with the new stock value
      set(state => ({
        products: state.products.map(p => 
          p.id === productId ? response.data : p
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to adjust stock',
        loading: false 
      });
      throw error;
    }
  },

  updateMinimumStock: async (productId: string, minStock: number) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('minOrder', minStock.toString());
      
      await get().updateProduct(productId, formData);
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update minimum stock',
        loading: false 
      });
      throw error;
    }
  },

  getLowStockProducts: () => {
    const { products } = get();
    return products.filter(product => product.stock <= (product.minOrder || 0));
  },
}));