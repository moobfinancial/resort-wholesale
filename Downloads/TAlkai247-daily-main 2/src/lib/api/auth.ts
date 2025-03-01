import { apiClient } from './client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response;
  },

  signup: async (data: SignupData) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response;
  },

  me: async () => {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout', {});
    return response;
  },
};