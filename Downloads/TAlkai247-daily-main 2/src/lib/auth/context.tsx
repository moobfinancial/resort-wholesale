import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from './types';

export class AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setUser: (user: AuthUser | null) => void;
  setError: (error: string | null) => void;

  constructor() {
    this.user = null;
    this.loading = false;
    this.error = null;
    this.login = async () => {};
    this.register = async () => {};
    this.logout = () => {};
    this.updateUser = () => {};
    this.setUser = () => {};
    this.setError = () => {};
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            throw new Error('Login failed');
        }
        const data: AuthResponse = await response.json();
        auth.setUser(data.user);
        localStorage.setItem('token', data.token);
    } catch (err) {
        auth.setError((err as Error).message);
        throw err;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
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
        auth.setUser(responseData.user);
        localStorage.setItem('token', responseData.token);
    } catch (err) {
        auth.setError((err as Error).message);
        throw err;
    }
  };

  return (
    <AuthContext.Provider value={{...auth, login, register, setUser: auth.setUser, setError: auth.setError}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}