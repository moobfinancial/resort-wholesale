import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import { PaginatedResponse } from '@/types/schema';

interface QueryOptions<T> {
  endpoint: string;
  params?: Record<string, any>;
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useQuery<T>({
  endpoint,
  params,
  initialData,
  enabled = true,
  onSuccess,
  onError,
}: QueryOptions<T>): QueryResult<T> {
  const [data, setData] = useState<T | null>(initialData || null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = params ? new URLSearchParams(params).toString() : '';
      const url = `${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      const result = await apiClient.get<T>(url);
      
      if (result?.data) {
        setData(result.data);
        onSuccess?.(result.data);
      } else {
        throw new Error('No data returned from API');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, endpoint, JSON.stringify(params)]);

  return {
    data,
    error,
    loading,
    refetch: fetchData,
  };
}

interface PaginatedQueryOptions<T> extends QueryOptions<PaginatedResponse<T>> {
  pageSize?: number;
}

interface PaginatedQueryResult<T> extends QueryResult<PaginatedResponse<T>> {
  page: number;
  setPage: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePaginatedQuery<T>({
  endpoint,
  pageSize = 10,
  ...options
}: PaginatedQueryOptions<T>): PaginatedQueryResult<T> {
  const [page, setPage] = useState(1);

  const query = useQuery<PaginatedResponse<T>>({
    ...options,
    endpoint,
    params: {
      ...options.params,
      page,
      pageSize,
    },
  });

  return {
    ...query,
    page,
    setPage,
    hasNextPage: query.data ? page < query.data.totalPages : false,
    hasPreviousPage: page > 1,
  };
}