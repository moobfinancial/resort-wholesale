import { useState, useCallback } from 'react';
import { usePaginatedQuery } from '@/lib/api/hooks/useQuery';
import { useMutation } from '@/lib/api/hooks/useMutation';
import type { Call } from '@/types/schema';

export function useCalls(params?: {
  page?: number;
  pageSize?: number;
  contactId?: string;
  assistantId?: string;
  status?: string;
}) {
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  const {
    data,
    error,
    loading,
    page,
    setPage,
    hasNextPage,
    hasPreviousPage,
    refetch,
  } = usePaginatedQuery<Call>({
    endpoint: '/calls',
    params,
  });

  const startCallMutation = useMutation<Call>({
    endpoint: '/calls/start',
    onSuccess: (call) => {
      setActiveCall(call);
      refetch();
    },
  });

  const endCallMutation = useMutation<Call>({
    endpoint: `/calls/${activeCall?.id}/end`,
    onSuccess: () => {
      setActiveCall(null);
      refetch();
    },
  });

  const updateGoalsMutation = useMutation<Call>({
    endpoint: `/calls/${activeCall?.id}/goals`,
    onSuccess: (call) => {
      setActiveCall(call);
    },
  });

  const addNoteMutation = useMutation<Call>({
    endpoint: `/calls/${activeCall?.id}/notes`,
    onSuccess: (call) => {
      setActiveCall(call);
    },
  });

  const startCall = useCallback(async (data: {
    contactId: string;
    assistantId: string;
    goals?: any[];
  }) => {
    if (activeCall) {
      throw new Error('A call is already in progress');
    }
    return startCallMutation.mutate(data);
  }, [activeCall, startCallMutation]);

  const endCall = useCallback(async (data: {
    duration: number;
    metrics: any;
    transcript: any[];
    recording?: any;
  }) => {
    if (!activeCall) {
      throw new Error('No active call to end');
    }
    return endCallMutation.mutate(data);
  }, [activeCall, endCallMutation]);

  return {
    calls: data?.items || [],
    totalCalls: data?.total || 0,
    activeCall,
    loading,
    error,
    page,
    setPage,
    hasNextPage,
    hasPreviousPage,
    startCall,
    endCall,
    updateGoals: updateGoalsMutation.mutate,
    addNote: addNoteMutation.mutate,
    isStarting: startCallMutation.loading,
    isEnding: endCallMutation.loading,
    isUpdatingGoals: updateGoalsMutation.loading,
    isAddingNote: addNoteMutation.loading,
    refetch,
  };
}