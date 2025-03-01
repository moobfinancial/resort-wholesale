import { useState } from 'react';
import { apiClient } from '../client';

interface MutationOptions<TData> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

interface MutationResult<TData> {
  mutate: (variables: unknown) => Promise<TData>;
  data: TData | null;
  error: Error | null;
  loading: boolean;
  reset: () => void;
}

export function useMutation<TData = unknown>({
  endpoint,
  method = 'POST',
  onSuccess,
  onError,
  onSettled,
}: MutationOptions<TData>): MutationResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  const mutate = async (variables: unknown): Promise<TData> => {
    try {
      setLoading(true);
      setError(null);

      let result: TData;
      
      switch (method) {
        case 'POST': {
          const response = await apiClient.post<TData>(endpoint, variables);
          if (!response?.data) throw new Error('No data returned from API');
          result = response.data;
          break;
        }
        case 'PUT': {
          const response = await apiClient.put<TData>(endpoint, variables);
          if (!response?.data) throw new Error('No data returned from API');
          result = response.data;
          break;
        }
        case 'DELETE': {
          const response = await apiClient.delete<TData>(endpoint);
          if (!response?.data) throw new Error('No data returned from API');
          result = response.data;
          break;
        }
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
      onSettled?.();
    }
  };

  return {
    mutate,
    data,
    error,
    loading,
    reset,
  };
}