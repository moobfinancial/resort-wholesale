import { create } from 'zustand';
import { frontendProductApi } from '../lib/api';
import { Product, ProductVariant, BulkPricing } from '../types/product';

interface ProductQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

interface ProductState {
  products: Product[];
  categories: { id: string; name: string; description?: string; imageUrl?: string }[];
  featuredProducts: Product[];
  newArrivals: Product[];
  collections: any[];
  currentCollection: any | null;
  collectionProducts: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  productVariants: ProductVariant[];
  bulkPricing: BulkPricing[];
  selectedVariant: ProductVariant | null;
  quantity: number;
  calculatedPrice: number | null;
  loading: boolean;
  variantsLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  
  // Actions
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchNewArrivals: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
  fetchCollectionProducts: (id: string) => Promise<void>;
  fetchProductVariants: (productId: string) => Promise<void>;
  fetchBulkPricing: (productId: string) => Promise<void>;
  fetchPriceForQuantity: (productId: string, quantity: number) => Promise<void>;
  setSelectedVariant: (variant: ProductVariant | null) => void;
  setQuantity: (quantity: number) => void;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  featuredProducts: [],
  newArrivals: [],
  collections: [],
  currentCollection: null,
  collectionProducts: [],
  currentProduct: null,
  relatedProducts: [],
  productVariants: [],
  bulkPricing: [],
  selectedVariant: null,
  quantity: 1,
  calculatedPrice: null,
  loading: false,
  variantsLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  
  fetchProducts: async (params?: ProductQueryParams) => {
    set({ loading: true, error: null });
    try {
      const queryParams = params || {};
      const response = await frontendProductApi.listProducts(queryParams);
      if (response.status === 'success' && response.data) {
        set({ 
          products: response.data.products,
          totalPages: Math.ceil(response.data.total / (queryParams.limit || 12)),
          currentPage: queryParams.page || 1,
          loading: false 
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false,
        products: [] 
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
        categories: [] 
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
          loading: false,
          // Reset variant-related state
          selectedVariant: null,
          quantity: 1,
          calculatedPrice: productRes.data?.price ?? null
        });
        
        // Fetch variants and bulk pricing if we have a product
        if (productRes.data) {
          get().fetchProductVariants(id);
          get().fetchBulkPricing(id);
        }
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
  
  fetchProductVariants: async (productId: string) => {
    set({ variantsLoading: true });
    try {
      const response = await frontendProductApi.getProductVariants(productId);
      if (response.status === 'success') {
        set({ 
          productVariants: response.data,
          variantsLoading: false 
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      set({ 
        variantsLoading: false,
        productVariants: []
      });
    }
  },
  
  fetchBulkPricing: async (productId: string) => {
    try {
      const response = await frontendProductApi.getProductBulkPricing(productId);
      if (response.status === 'success') {
        set({ bulkPricing: response.data });
        
        // Update calculated price based on current quantity
        const currentQuantity = get().quantity;
        get().fetchPriceForQuantity(productId, currentQuantity);
      }
    } catch (error) {
      console.error('Error fetching bulk pricing:', error);
      set({ bulkPricing: [] });
    }
  },
  
  fetchPriceForQuantity: async (productId: string, quantity: number) => {
    try {
      const selectedVariant = get().selectedVariant;
      
      // If we have a selected variant, use its price
      if (selectedVariant) {
        set({ calculatedPrice: selectedVariant.price });
        return;
      }
      
      // Otherwise, calculate price based on quantity using bulk pricing
      const response = await frontendProductApi.getProductPriceForQuantity(productId, quantity);
      if (response.status === 'success') {
        set({ calculatedPrice: response.data });
      }
    } catch (error) {
      console.error('Error fetching price for quantity:', error);
      // Fall back to base product price
      const product = get().currentProduct;
      set({ calculatedPrice: product?.price ?? null });
    }
  },
  
  setSelectedVariant: (variant: ProductVariant | null) => {
    set({ 
      selectedVariant: variant,
      calculatedPrice: variant?.price ?? get().currentProduct?.price ?? null
    });
  },
  
  setQuantity: (quantity: number) => {
    const currentProduct = get().currentProduct;
    set({ quantity });
    
    if (currentProduct && !get().selectedVariant) {
      get().fetchPriceForQuantity(currentProduct.id, quantity);
    }
  },
  
  fetchFeaturedProducts: async () => {
    try {
      console.log('Fetching featured products...');
      const response = await frontendProductApi.getFeaturedProducts();
      console.log('Featured products response:', response);
      if (response.status === 'success' && response.data) {
        // Debug log to check what's coming from the API
        console.log('Featured products before setting state:', response.data);
        set({ featuredProducts: response.data });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch featured products',
        featuredProducts: [] 
      });
    }
  },
  
  fetchNewArrivals: async () => {
    try {
      console.log('Fetching new arrivals...');
      const response = await frontendProductApi.getNewArrivals();
      console.log('New arrivals response:', response);
      if (response.status === 'success' && response.data) {
        // Debug log to check what's coming from the API
        console.log('New arrivals before setting state:', response.data);
        set({ newArrivals: response.data });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch new arrivals:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch new arrivals',
        newArrivals: [] 
      });
    }
  },

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching collections...');
      const response = await frontendProductApi.getCollections();
      console.log('Collections API response:', response);
      
      if (response.status === 'success') {
        let processedCollections;
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          processedCollections = response.data;
        } else if (response.data && response.data.collections && Array.isArray(response.data.collections)) {
          processedCollections = response.data.collections;
        } else if (response.data && Array.isArray(response.data)) {
          processedCollections = response.data;
        } else {
          console.error('Unexpected collections data structure:', response);
          processedCollections = [];
        }
        
        // Map to ensure all collections have proper structure
        const formattedCollections = processedCollections.map((collection: any) => ({
          id: collection.id,
          name: collection.name,
          description: collection.description || '',
          imageUrl: collection.imageUrl,
          productCount: collection.productCount || collection._count?.Product || 0,
          isActive: collection.isActive !== false  // default to true if not specified
        }));
        
        console.log('Processed collections:', formattedCollections);
        set({ collections: formattedCollections, loading: false });
      } else {
        console.error('API error or no data in response:', response);
        set({ 
          error: response.message || 'Failed to fetch collections',
          collections: [],
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch collections',
        collections: [],
        loading: false
      });
    }
  },
  
  fetchCollection: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await frontendProductApi.getCollection(id);
      console.log('Collection response:', response);
      if (response.status === 'success' && response.data) {
        // Handle both direct and nested response formats
        if (response.data.id) {
          set({ currentCollection: response.data, loading: false });
        } else if (response.data.collection && response.data.collection.id) {
          set({ currentCollection: response.data.collection, loading: false });
        } else {
          throw new Error('Invalid collection data format');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch collection',
        loading: false,
        currentCollection: null 
      });
    }
  },
  
  fetchCollectionProducts: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await frontendProductApi.getCollectionProducts(id);
      console.log('Collection products response:', response);
      if (response.status === 'success' && response.data) {
        // Handle both direct array and nested response formats
        if (Array.isArray(response.data)) {
          set({ collectionProducts: response.data, loading: false });
        } else if (response.data.products && Array.isArray(response.data.products)) {
          set({ collectionProducts: response.data.products, loading: false });
        } else {
          throw new Error('Invalid collection products data format');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch collection products:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch collection products',
        loading: false,
        collectionProducts: [] 
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
