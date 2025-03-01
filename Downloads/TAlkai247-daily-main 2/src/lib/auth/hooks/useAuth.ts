import { useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.data);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const data = await response.json();
      setUser(data.data);
      localStorage.setItem('token', data.token);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const responseData: AuthResponse = await response.json();
      localStorage.setItem('token', responseData.token);
      setUser(responseData.user);
      return responseData;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    setUser,
    setError,
  };
}