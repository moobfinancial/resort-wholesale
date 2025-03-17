import axios from 'axios';

// Create an axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5177') + '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Add request interceptor to include auth token in requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth-token');
    
    // Only include the token if it exists
    if (token) {
      // Set Authorization header with token
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response success:', {
      url: response.config.url,
      status: response.status,
      data: response.data ? (typeof response.data === 'object' ? 'object' : 'non-object') : 'no data'
    });
    return response;
  },
  (error) => {
    // Log details about the error
    console.error('API Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized errors by logging out
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized, handling auth error...');
      
      // Don't clear tokens if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        console.log('Not on login page, clearing auth and redirecting...');
        
        // Clear auth token
        localStorage.removeItem('auth-token');
        
        // Only clear admin-auth storage if it exists
        const adminAuthData = localStorage.getItem('admin-auth');
        if (adminAuthData) {
          localStorage.removeItem('admin-auth');
        }
        
        // Save the current path for redirect after login
        const currentPath = window.location.pathname;
        console.log('Saving current path for redirect:', currentPath);
        sessionStorage.setItem('redirectPath', currentPath);
        
        // Only redirect if we're not already in the process of redirecting
        // This prevents multiple redirects when multiple 401s happen at once
        const redirecting = sessionStorage.getItem('redirecting');
        if (!redirecting) {
          // Set a flag to prevent multiple redirects (clear after 2 seconds)
          sessionStorage.setItem('redirecting', 'true');
          setTimeout(() => {
            sessionStorage.removeItem('redirecting');
          }, 2000);
          
          // Redirect to login page
          window.location.href = '/admin/login';
        }
      } else {
        console.log('Already on login page, no redirect needed');
      }
    }
    
    // Enhance error messages for better debugging
    if (error.response && error.response.data && error.response.data.message) {
      error.message = error.response.data.message;
    }
    
    return Promise.reject(error);
  }
);

// API wrapper with standardized response handling
export const api = {
  // Generic methods that handle standardized API responses
  get(url: string, config = {}): Promise<any> {
    return axiosInstance.get(url, config);
  },

  post(url: string, data: any, config = {}): Promise<any> {
    return axiosInstance.post(url, data, config);
  },

  put(url: string, data: any, config = {}): Promise<any> {
    return axiosInstance.put(url, data, config);
  },

  delete(url: string, config = {}): Promise<any> {
    return axiosInstance.delete(url, config);
  },

  // Specific API endpoints
  suppliers: {
    list(page = 1, limit = 10) {
      return api.get(`/suppliers?page=${page}&limit=${limit}`);
    },
    get(id: string) {
      return api.get(`/suppliers/${id}`);
    },
    create(data: any) {
      return api.post('/suppliers', data);
    },
    update(id: string, data: any) {
      return api.put(`/suppliers/${id}`, data);
    },
    delete(id: string) {
      return api.delete(`/suppliers/${id}`);
    }
  },
  
  customers: {
    list(page = 1, limit = 10) {
      return api.get(`/customers?page=${page}&limit=${limit}`);
    },
    get(id: string) {
      return api.get(`/customers/${id}`);
    },
    create(data: any) {
      return api.post('/customers', data);
    },
    update(id: string, data: any) {
      return api.put(`/customers/${id}`, data);
    },
    delete(id: string) {
      return api.delete(`/customers/${id}`);
    }
  },
  
  auth: {
    login(email: string, password: string) {
      return axiosInstance.post('/admin/auth/login', { email, password });
    },
    logout() {
      return axiosInstance.post('/admin/auth/logout');
    },
    me() {
      return axiosInstance.get('/admin/auth/me');
    }
  },
};

// Also export the axios instance for direct use if needed
export default axiosInstance;
