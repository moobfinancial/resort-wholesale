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
    // Transform response to ensure it follows our standard format if not already
    if (response.data && !response.data.status) {
      // If response.data doesn't have a status property, wrap it in our standard format
      response.data = {
        status: 'success',
        data: response.data
      };
    }
    return response;
  },
  (error) => {
    // Check if we have a response with data
    if (error.response && error.response.data) {
      // If the error response doesn't follow our standard format, format it
      if (!error.response.data.status) {
        error.response.data = {
          status: 'error',
          message: error.response.data.message || error.message || 'Unknown error occurred',
          details: error.response.data
        };
      }
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error: You need to log in');
      
      // If we're not already on the login page, redirect to it
      if (window.location.pathname !== '/admin/login') {
        // Clear any stored tokens
        localStorage.removeItem('admin-token');
        
        // Redirect to login page
        window.location.href = '/admin/login';
      }
    } 
    // Don't redirect for other errors, let the components handle them
    else {
      console.error('API error:', error.response?.data?.message || error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
