// API configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? (process.env.VITE_API_URL || 'http://localhost:5177') + '/api'
  : 'http://localhost:5177/api';
