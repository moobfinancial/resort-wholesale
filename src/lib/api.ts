import { API_BASE_URL } from '../config';
import type { Product } from '../types/product';

// Adding ProductVariant and BulkPricing interfaces
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrl?: string;
}

export interface BulkPricing {
  id: string;
  productId: string;
  minQuantity: number;
  price: number;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

interface Headers {
  [key: string]: string;
}

const defaultHeaders: Headers = {
  'Content-Type': 'application/json',
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  // Ensure we have a slash between API_BASE_URL and endpoint
  const url = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}`
    : `${API_BASE_URL}/${endpoint}`;
    
  const isFormData = options.body instanceof FormData;
  
  const headers: Headers = {
    ...(!isFormData ? defaultHeaders : {}),
    ...(options.headers as Headers || {}),
  };

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

interface AnalysisResult {
  name: string;
  category: string;
  description: string;
  suggestedTags: string[];
}

interface ImageUploadResult {
  imageUrl: string;
}

export const api = {
  request: request,
  
  // HTTP method wrappers
  get: <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },
  
  post: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: { ...defaultHeaders, ...(options.headers || {}) },
      body: JSON.stringify(data)
    });
  },
  
  put: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: { ...defaultHeaders, ...(options.headers || {}) },
      body: JSON.stringify(data)
    });
  },
  
  delete: <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
  
  uploadFormData: (endpoint: string, options: { method?: string; body: FormData }) => {
    return request(endpoint, {
      method: options.method || 'POST',
      body: options.body,
    });
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      api.post('admin/auth/login', { email, password }),
    
    logout: () =>
      api.post('admin/auth/logout', {}),
  },

  // Product endpoints
  products: {
    create: (formData: FormData): Promise<ApiResponse<Product>> => {
      return api.uploadFormData('admin/inventory/products', {
        body: formData,
      }) as Promise<ApiResponse<Product>>;
    },

    update: (id: string, formData: FormData): Promise<ApiResponse<Product>> => {
      return api.uploadFormData(`admin/inventory/products/${id}`, {
        method: 'PUT',
        body: formData,
      }) as Promise<ApiResponse<Product>>;
    },

    delete: (id: string): Promise<ApiResponse<void>> =>
      api.delete(`admin/inventory/products/${id}`),

    list: (params?: { category?: string; page?: number; limit?: number }): Promise<ApiResponse<{ products: Product[] }>> => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      return api.get<{ products: Product[] }>(`admin/inventory/products?${searchParams.toString()}`);
    },

    get: (id: string): Promise<ApiResponse<Product>> =>
      api.get<Product>(`admin/inventory/products/${id}`),

    analyzeImage: (imageFile: File): Promise<ApiResponse<AnalysisResult>> => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return api.uploadFormData('admin/inventory/products/analyze-image', {
        body: formData,
      }) as Promise<ApiResponse<AnalysisResult>>;
    },

    uploadImage: (productId: string, imageFile: File): Promise<ApiResponse<ImageUploadResult>> => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return api.uploadFormData(`admin/inventory/products/${productId}/images`, {
        body: formData,
      }) as Promise<ApiResponse<ImageUploadResult>>;
    },

    adjustStock: (productId: string, stock: number): Promise<ApiResponse<Product>> =>
      api.put<Product>(`admin/inventory/products/${productId}/stock`, { stock }),

    updateMinimumStock: (productId: string, minOrder: number): Promise<ApiResponse<Product>> =>
      api.put<Product>(`admin/inventory/products/${productId}/min-stock`, { minOrder })
  },

  // Inventory endpoints
  inventory: {
    getLowStockReport: (threshold?: number): Promise<ApiResponse<any>> => {
      const queryParam = threshold ? `?threshold=${threshold}` : '';
      return api.get<any>(`admin/inventory-reports/low-stock${queryParam}`);
    },
    
    getInventoryValuation: (): Promise<ApiResponse<any>> => {
      return api.get<any>('admin/inventory-reports/valuation');
    },
    
    getInventoryTurnover: (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
      let queryParams = '';
      if (startDate) {
        queryParams = `?startDate=${startDate}`;
        if (endDate) {
          queryParams += `&endDate=${endDate}`;
        }
      } else if (endDate) {
        queryParams = `?endDate=${endDate}`;
      }
      
      return api.get<any>(`admin/inventory-reports/turnover${queryParams}`);
    },
    
    updateStock: (productId: string, quantity: number): Promise<ApiResponse<any>> => {
      return api.put<any>(`admin/inventory/${productId}`, { stock: quantity });
    },
    
    updateVariantStock: (variantId: string, quantity: number): Promise<ApiResponse<any>> => {
      return api.put<any>(`admin/inventory/variants/${variantId}`, { stock: quantity });
    }
  },
  
  // Product variant endpoints
  variants: {
    getVariants: (productId: string): Promise<ApiResponse<ProductVariant[]>> => {
      return api.get<ProductVariant[]>(`products/${productId}/variants`);
    },
    
    getVariant: (variantId: string): Promise<ApiResponse<ProductVariant>> => {
      return api.get<ProductVariant>(`variants/${variantId}`);
    },
    
    createVariant: (productId: string, variantData: Omit<ProductVariant, 'id'>): Promise<ApiResponse<ProductVariant>> => {
      return api.post<ProductVariant>(`products/${productId}/variants`, variantData);
    },
    
    updateVariant: (variantId: string, variantData: Partial<ProductVariant>): Promise<ApiResponse<ProductVariant>> => {
      return api.put<ProductVariant>(`variants/${variantId}`, variantData);
    },
    
    deleteVariant: (variantId: string): Promise<ApiResponse<void>> => {
      return api.delete<void>(`variants/${variantId}`);
    }
  },
  
  // Bulk pricing endpoints
  bulkPricing: {
    getBulkPricing: (productId: string): Promise<ApiResponse<BulkPricing[]>> => {
      return api.get<BulkPricing[]>(`products/${productId}/bulk-pricing`);
    },
    
    createTier: (productId: string, tierData: Omit<BulkPricing, 'id'>): Promise<ApiResponse<BulkPricing>> => {
      return api.post<BulkPricing>(`products/${productId}/bulk-pricing/tier`, tierData);
    },
    
    updateTier: (tierId: string, tierData: Partial<BulkPricing>): Promise<ApiResponse<BulkPricing>> => {
      return api.put<BulkPricing>(`bulk-pricing/tier/${tierId}`, tierData);
    },
    
    deleteTier: (tierId: string): Promise<ApiResponse<void>> => {
      return api.delete<void>(`bulk-pricing/tier/${tierId}`);
    },
    
    calculatePrice: (productId: string, quantity: number): Promise<ApiResponse<{ price: number }>> => {
      return api.get<{ price: number }>(`products/${productId}/calculate-price?quantity=${quantity}`);
    }
  }
};

// Helper function to ensure image URLs are properly formatted
const formatImageUrl = (product: any): any => {
  if (!product) return product;
  
  // Create a copy of the product to avoid mutating the original
  const formattedProduct = { ...product };
  
  // Log product details for debugging
  console.log('Formatting image URL for product:', {
    id: formattedProduct.id,
    name: formattedProduct.name,
    originalImageUrl: formattedProduct.imageUrl
  });
  
  // Check if the imageUrl exists
  if (formattedProduct.imageUrl) {
    // Normalize null strings
    if (formattedProduct.imageUrl === 'null' || formattedProduct.imageUrl === 'undefined') {
      formattedProduct.imageUrl = null;
    } 
    
    // If imageUrl already has a proper path format, leave it as is
    else if (formattedProduct.imageUrl.startsWith('http') || 
             formattedProduct.imageUrl.startsWith('https://')) {
      // URL is already properly formatted, do nothing
      console.log('URL already properly formatted:', formattedProduct.imageUrl);
    } 
    // Handle paths with /uploads/ prefix (from backend)
    else if (formattedProduct.imageUrl.includes('/uploads/products/')) {
      // Make sure the URL is absolute
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5177';
      if (!formattedProduct.imageUrl.startsWith('http')) {
        formattedProduct.imageUrl = `${apiBaseUrl}${formattedProduct.imageUrl}`;
      }
      console.log('Formatted upload URL:', formattedProduct.imageUrl);
    }
    // Handle relative image paths that don't have a leading slash
    else if (formattedProduct.imageUrl.startsWith('images/') || 
             formattedProduct.imageUrl.startsWith('uploads/')) {
      console.log('Adding leading slash to relative path:', formattedProduct.imageUrl);
      formattedProduct.imageUrl = `/${formattedProduct.imageUrl}`;
    }
    // If it's just a filename, add the proper path
    else if (!formattedProduct.imageUrl.includes('/')) {
      // Check if it's a known product image name
      const knownImages = [
        'beach-hat.jpg', 
        'flower-sandals.jpg', 
        'jamaica-art.jpg', 
        'jamaican-basket.jpg', 
        'shell-necklace.jpg', 
        'souviner.jpg'
      ];
      
      console.log('Adding product path to filename:', formattedProduct.imageUrl);
      formattedProduct.imageUrl = `/images/products/${formattedProduct.imageUrl}`;
    }
  }
  
  // If imageUrl is empty, null, undefined, or invalid after processing, set a default product image
  if (!formattedProduct.imageUrl || formattedProduct.imageUrl === 'null') {
    console.log('Setting placeholder image for product:', formattedProduct.id || 'unknown product');
    formattedProduct.imageUrl = '/images/products/placeholder.svg';
  }
  
  console.log('Final formatted image URL:', formattedProduct.imageUrl);
  return formattedProduct;
};

// Helper function to format collection image URLs
const formatCollectionImageUrl = (collection: any): any => {
  if (!collection) return collection;
  
  // Create a copy of the collection to avoid mutating the original
  const formattedCollection = { ...collection };
  
  // Check if the imageUrl exists
  if (formattedCollection.imageUrl) {
    // If imageUrl already has a proper path format, leave it as is
    if (formattedCollection.imageUrl.startsWith('http') || 
        formattedCollection.imageUrl.startsWith('https://')) {
      // URL is already properly formatted, do nothing
    } 
    // Handle paths with /uploads/ prefix (from backend)
    else if (formattedCollection.imageUrl.includes('/uploads/collections/')) {
      // Make sure the URL is absolute
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5177';
      if (!formattedCollection.imageUrl.startsWith('http')) {
        formattedCollection.imageUrl = `${apiBaseUrl}${formattedCollection.imageUrl}`;
      }
    }
    // Handle relative image paths that don't have a leading slash
    else if (formattedCollection.imageUrl.startsWith('images/') || 
             formattedCollection.imageUrl.startsWith('uploads/')) {
      formattedCollection.imageUrl = `/${formattedCollection.imageUrl}`;
    }
    // If it's just a filename, add the proper path
    else if (!formattedCollection.imageUrl.includes('/')) {
      formattedCollection.imageUrl = `/images/categories/${formattedCollection.imageUrl}`;
    }
  }
  
  // If imageUrl is empty, null, or undefined after processing, set a default image
  if (!formattedCollection.imageUrl || formattedCollection.imageUrl === 'null') {
    formattedCollection.imageUrl = '/images/categories/placeholder.jpg';
  }

  console.log('Formatted collection image URL:', formattedCollection.imageUrl);
  
  return formattedCollection;
};

// Product API for frontend
export const frontendProductApi = {
  listProducts: async (params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params.category) {
      queryParams.append('category', params.category);
    }
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }

    const response = await request<{ products: Product[]; total: number; hasMore: boolean }>(`products?${queryParams.toString()}`);
    
    // Format image URLs for all products
    const formattedProducts = response.data.products.map(formatImageUrl);
    
    return {
      status: 'success',
      data: {
        ...response.data,
        products: formattedProducts
      }
    };
  },

  getProduct: async (id: string) => {
    try {
      const response = await request<Product>(`products/${id}`);
      return {
        status: 'success',
        data: formatImageUrl(response.data)
      };
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return {
        status: 'error',
        data: null as any,
        message: error instanceof Error ? error.message : 'Failed to fetch product'
      };
    }
  },

  getRelatedProducts: async (id: string) => {
    try {
      const response = await request<any[]>(`products/${id}/related`);
      return {
        status: 'success',
        data: response.data.map(formatImageUrl)
      };
    } catch (error) {
      console.error(`Error fetching related products for ${id}:`, error);
      // Return empty array instead of throwing to prevent UI errors
      return {
        status: 'success',
        data: []
      };
    }
  },

  getCategories: async () => {
    const response = await request<any[]>('products/categories');
    return {
      status: 'success',
      data: response.data
    };
  },

  getFeaturedProducts: async () => {
    try {
      const response = await request<any[]>('products/featured');
      return {
        status: 'success',
        data: response.data.map(formatImageUrl)
      };
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Return empty array instead of throwing to prevent UI errors
      return {
        status: 'success',
        data: []
      };
    }
  },

  getNewArrivals: async () => {
    try {
      const response = await request<any[]>('products/new-arrivals');
      return {
        status: 'success',
        data: response.data.map(formatImageUrl)
      };
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      // Return empty array instead of throwing to prevent UI errors
      return {
        status: 'success',
        data: []
      };
    }
  },

  getCollections: async () => {
    try {
      // Use the collections/active endpoint for frontend display
      const response = await request<any>('collections/active');
      console.log('Raw collections response:', response);
      
      // Format the collection image URLs
      const formattedCollections = Array.isArray(response.data) 
        ? response.data.map(formatCollectionImageUrl)
        : [];
        
      return {
        status: 'success',
        data: formattedCollections
      };
    } catch (error) {
      console.error('Error fetching collections:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch collections',
        data: []
      };
    }
  },
  
  getCollection: async (id: string) => {
    try {
      const response = await request<any>(`collections/${id}`);
      
      if (response.status === 'success' && response.data) {
        return {
          status: 'success',
          data: formatCollectionImageUrl(response.data)
        };
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching collection ${id}:`, error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch collection',
        data: null
      };
    }
  },
  
  getCollectionProducts: async (collectionId: string) => {
    try {
      const response = await request<any>(`collections/${collectionId}/products`);
      console.log('Collection products response:', response);
      
      return response;
    } catch (error) {
      console.error(`Error fetching products for collection ${collectionId}:`, error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch collection products',
        data: []
      };
    }
  },

  getProductVariants: async (productId: string) => {
    try {
      try {
        const response = await request<{ variants: ProductVariant[] }>(`products/${productId}/variants`);
        return {
          status: 'success',
          data: response.data.variants || []
        };
      } catch (error) {
        console.error(`Error fetching product variants for ${productId}:`, error);
        return {
          status: 'success', // Return success with empty array for better UX
          data: []
        };
      }
    } catch (error) {
      console.error(`Error in getProductVariants for product ${productId}:`, error);
      return {
        status: 'success',
        data: []
      };
    }
  },

  getProductBulkPricing: async (productId: string) => {
    try {
      const response = await request<BulkPricing[]>(`products/${productId}/bulk-pricing`);
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching bulk pricing for ${productId}:`, error);
      return {
        status: 'success', // Return success with empty array for better UX
        data: []
      };
    }
  },

  getProductPriceForQuantity: async (productId: string, quantity: number) => {
    try {
      try {
        const response = await request<{ price: number }>(`products/${productId}/price?quantity=${quantity}`);
        return {
          status: 'success',
          data: response.data.price || 0
        };
      } catch (error) {
        console.error(`Error fetching price for product ${productId} and quantity ${quantity}:`, error);
        
        // Attempt to get the base product price as fallback
        try {
          const productResponse = await request<{ product: { price: number } }>(`products/${productId}`);
          return {
            status: 'success',
            data: productResponse.data.product.price || 0
          };
        } catch (innerError) {
          console.error(`Failed to get base price for product ${productId}:`, innerError);
          return {
            status: 'success',
            data: 0
          };
        }
      }
    } catch (error) {
      console.error(`Error in getProductPriceForQuantity for product ${productId}:`, error);
      return {
        status: 'success',
        data: 0
      };
    }
  },
};
