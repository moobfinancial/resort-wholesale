import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../client';

interface InfiniteQueryOptions<T> {
  endpoint: string;
  params?: Record<string, any>;
  pageSize?: number;
  enabled?: boolean;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

interface InfiniteQueryResult<T> {
  data: T[];
  error: Error | null;
  loading: boolean;
  hasNextPage: boolean;
  loadNextPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface ApiResponse<T> {
  data: {
    items: T[];
    totalPages: number;
  };
}

const isApiResponse = <T>(result: any): result is ApiResponse<T> => {
  return (
    result &&
    typeof result === 'object' &&
    'data' in result &&
    typeof result.data === 'object' &&
    'items' in result.data &&
    Array.isArray(result.data.items) &&
    'totalPages' in result.data &&
    typeof result.data.totalPages === 'number'
  );
};

export function useInfiniteQuery<T>({
  endpoint,
  params = {},
  pageSize = 10,
  enabled = true,
  onSuccess,
  onError,
}: InfiniteQueryOptions<T>): InfiniteQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPage = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        ...params,
        page: page.toString(),
        pageSize: pageSize.toString(),
      }).toString();

      const result = await apiClient.get<ApiResponse<T>>(`${endpoint}?${queryParams}`);

      if (result?.data && isApiResponse<T>(result)) {
        return result;
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = useCallback(async () => {
    if (!hasNextPage || loading) return;

    try {
      const result = await fetchPage(currentPage + 1);
      
      if (result) {
        const typedItems = result.data.items as T[];
        setData(prev => [...prev, ...typedItems]);
        setCurrentPage(prev => prev + 1);
        setHasNextPage(currentPage + 1 < result.data.totalPages);
        
        onSuccess?.(typedItems);
      } else {
        throw new Error("Unexpected API response structure");
      }
    } catch (error) {
      // Error already handled in fetchPage
    }
  }, [currentPage, hasNextPage, loading]);

  const refetch = useCallback(async () => {
    setData([]);
    setCurrentPage(1);
    setHasNextPage(true);

    try {
      const result = await fetchPage(1);
      
      if (result) {
        const typedItems = result.data.items as T[];
        setData(typedItems);
        setHasNextPage(1 < result.data.totalPages);
        
        onSuccess?.(typedItems);
      } else {
        throw new Error("Unexpected API response structure");
      }
    } catch (error) {
      // Error already handled in fetchPage
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled, JSON.stringify(params)]);

  return {
    data,
    error,
    loading,
    hasNextPage,
    loadNextPage,
    refetch,
  };
}