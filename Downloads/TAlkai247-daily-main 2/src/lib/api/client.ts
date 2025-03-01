const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiError {
  code: string;
  message: string;
  details?: any;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.json();
    throw error;
  }
  return response.json();
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    return handleResponse<T>(response);
  } catch (error) {
    throw {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: error
      }
    };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: { params?: Record<string, any> } & RequestInit) => {
    const url = new URL(API_BASE_URL + endpoint);
    if (options?.params) {
      Object.keys(options.params).forEach(key => {
        if (options.params && key in options.params) {
          url.searchParams.append(key, options.params[key]);
        }
      });
    }
    return fetchApi<T>(url.toString(), options);
  },
    
  post: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: <T>(endpoint: string, data: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};