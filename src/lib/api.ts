import { API_BASE_URL } from '../config';
import type { Product } from '../types/product';

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
  const url = `${API_BASE_URL}${endpoint}`;
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
  async request(endpoint: string, options: RequestInit = {}) {
    return request(endpoint, options);
  },

  async uploadFormData(endpoint: string, options: { method?: string; body: FormData }) {
    return request(endpoint, {
      method: options.method || 'POST',
      body: options.body,
    });
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      api.request('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    logout: () =>
      api.request('/admin/auth/logout', {
        method: 'POST',
      }),
  },

  // Product endpoints
  products: {
    create: (formData: FormData): Promise<ApiResponse<Product>> => 
      api.uploadFormData('/admin/inventory/products', { body: formData }),

    update: (id: string, formData: FormData): Promise<ApiResponse<Product>> =>
      api.uploadFormData(`/admin/inventory/products/${id}`, {
        method: 'PUT',
        body: formData
      }),

    delete: (id: string): Promise<ApiResponse<void>> =>
      api.request(`/admin/inventory/products/${id}`, { method: 'DELETE' }),

    list: (params?: { category?: string; page?: number; limit?: number }): Promise<ApiResponse<{ products: Product[] }>> => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      return api.request(`/admin/inventory/products?${searchParams.toString()}`);
    },

    get: (id: string): Promise<ApiResponse<Product>> =>
      api.request(`/admin/inventory/products/${id}`),

    analyzeImage: (imageFile: File): Promise<ApiResponse<AnalysisResult>> => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return api.uploadFormData('/admin/inventory/products/analyze', { body: formData });
    },

    uploadImage: (productId: string, imageFile: File): Promise<ApiResponse<ImageUploadResult>> => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return api.uploadFormData(`/admin/inventory/products/${productId}/image`, { body: formData });
    },

    adjustStock: (productId: string, stock: number): Promise<ApiResponse<Product>> =>
      api.request(`/admin/inventory/products/${productId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ stock })
      }),

    updateMinimumStock: (productId: string, minOrder: number): Promise<ApiResponse<Product>> =>
      api.request(`/admin/inventory/products/${productId}/min-stock`, {
        method: 'PUT',
        body: JSON.stringify({ minOrder })
      })
  },
};
