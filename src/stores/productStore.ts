import { create } from 'zustand';
import { api } from '../lib/api';
import type { Product } from '../types/product';

// Define the standard API response types
interface StandardResponse<T> {
  status: 'success' | 'error'; 
  data: T;
  message?: string;
}

interface ProductsResponse {
  products?: Product[];
  items?: Product[];
  [key: string]: any;
}

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
      console.log('Creating product with FormData...');
      const response = await api.products.create(formData);
      console.log('Product creation response:', response);
      
      let productData: Product;
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        if ('status' in response.data && (response.data.status as string) === 'success') {
          // New standardized format
          const standardResponse = response.data as unknown as StandardResponse<Product | { item: Product }>;
          
          if ('item' in standardResponse.data) {
            // Item is nested in data
            productData = standardResponse.data.item;
          } else {
            // Direct product in data field
            productData = standardResponse.data as Product;
          }
        } else {
          // Legacy format - direct data
          productData = response.data as Product;
        }
        
        // Ensure all required fields are present
        if (!productData.id || !productData.name || !productData.category) {
          throw new Error('Invalid product data received from server');
        }
        
        set(state => ({
          products: [...state.products, productData],
          loading: false
        }));
        
        return productData;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create product', 
        loading: false 
      });
      throw error;
    }
  },

  updateProduct: async (id: string, formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.update(id, formData);
      
      let productData: Product;
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object' && 
          'status' in response.data && (response.data.status as string) === 'success') {
        // New standardized format
        const standardResponse = response.data as unknown as StandardResponse<Product>;
        productData = standardResponse.data;
      } else {
        // Legacy format - direct data
        productData = response.data;
      }
      
      set(state => ({
        products: state.products.map(p => p.id === id ? productData : p),
        loading: false
      }));
      
      return productData;
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
      console.log('Products response:', response);
      
      let productData: Product[] = [];
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object' && 
          'status' in response.data && (response.data.status as string) === 'success') {
        // New standardized format
        const standardResponse = response.data as unknown as StandardResponse<ProductsResponse | Product[]>;
        
        if (Array.isArray(standardResponse.data)) {
          // Direct array in data field
          productData = standardResponse.data;
        } else if (standardResponse.data && typeof standardResponse.data === 'object') {
          // Products in nested field
          const productsData = standardResponse.data as ProductsResponse;
          
          if (productsData.products && Array.isArray(productsData.products)) {
            productData = productsData.products;
          } else if (productsData.items && Array.isArray(productsData.items)) {
            productData = productsData.items;
          }
        }
      } else if (response.data && typeof response.data === 'object') {
        // Legacy format possibilities
        const legacyData = response.data as any;
        if (legacyData.products && Array.isArray(legacyData.products)) {
          productData = legacyData.products;
        } else if (legacyData.items && Array.isArray(legacyData.items)) {
          productData = legacyData.items;
        } else if (Array.isArray(legacyData)) {
          productData = legacyData;
        }
      }
      
      set({ products: productData, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch products', loading: false });
      throw error;
    }
  },

  getProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.products.get(id);
      
      let productData: Product;
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object' && 
          'status' in response.data && (response.data.status as string) === 'success') {
        // New standardized format
        const standardResponse = response.data as unknown as StandardResponse<{item: Product} | Product>;
        
        if (standardResponse.data && typeof standardResponse.data === 'object' && 'item' in standardResponse.data) {
          productData = standardResponse.data.item;
        } else {
          productData = standardResponse.data as Product;
        }
      } else {
        // Legacy format - direct data
        productData = response.data;
      }
      
      set({ selectedProduct: productData, loading: false });
      return productData;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch product', loading: false });
      throw error;
    }
  },

  analyzeImage: async (imageFile: File) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await api.products.analyzeImage(imageFile);
      
      let analysisResultData: AnalysisResult;
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object' && 
          'status' in response.data && (response.data.status as string) === 'success') {
        // New standardized format
        const standardResponse = response.data as unknown as StandardResponse<AnalysisResult>;
        analysisResultData = standardResponse.data;
      } else {
        // Legacy format - direct data
        analysisResultData = response.data;
      }
      
      set({ 
        analysisResult: analysisResultData,
        isAnalyzing: false 
      });
      return analysisResultData;
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
      
      let imageUrlData: { imageUrl: string };
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object' && 
          'status' in response.data && (response.data.status as string) === 'success') {
        // New standardized format
        const standardResponse = response.data as unknown as StandardResponse<{ imageUrl: string }>;
        imageUrlData = standardResponse.data;
      } else {
        // Legacy format - direct data
        imageUrlData = response.data;
      }
      
      set({ loading: false });
      return imageUrlData;
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
      const product = get().products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const currentStock = product.stock || 0;
      const newStock = type === 'add' 
        ? currentStock + quantity 
        : Math.max(0, currentStock - quantity);

      const response = await api.products.adjustStock(productId, newStock);
      
      let productData: Product;
      
      // Handle different response formats
      if (response.data && typeof response.data === 'object' && 
          'status' in response.data && (response.data.status as string) === 'success') {
        // New standardized format
        const standardResponse = response.data as unknown as StandardResponse<Product>;
        productData = standardResponse.data;
      } else {
        // Legacy format - direct data
        productData = response.data;
      }
      
      // Update the products list with the new stock value
      set(state => ({
        products: state.products.map(p => 
          p.id === productId ? productData : p
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to adjust stock', loading: false });
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