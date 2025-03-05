import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5177') + '/api',
  withCredentials: true, // This is important for sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add a request interceptor to include auth token from localStorage if available
api.interceptors.request.use(
  (config) => {
    // Check if we have a token in localStorage (for non-cookie auth)
    // Try both token locations for compatibility
    const token = localStorage.getItem('admin-auth-storage') 
      ? JSON.parse(localStorage.getItem('admin-auth-storage') || '{}').state?.token
      : localStorage.getItem('admin-token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Optionally redirect to login page or trigger a logout
      console.log('Authentication error: You need to log in');
      
      // If we're not already on the login page, redirect to it
      if (window.location.pathname !== '/admin/login') {
        // Clear any stored tokens
        localStorage.removeItem('admin-token');
        
        // Redirect to login page
        window.location.href = '/admin/login';
      }
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout: The server took too long to respond');
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.log('Network error: Please check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

export default api;
