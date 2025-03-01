import { apiClient } from '../client';
import { Call, PaginatedResponse } from '@/types/schema';

export const callsApi = {
  getCalls: (params?: {
    page?: number;
    pageSize?: number;
    contactId?: string;
    assistantId?: string;
    status?: string;
  }) => apiClient.get<PaginatedResponse<Call>>('/calls', { params }),

  getCall: (id: string) => 
    apiClient.get<Call>(`/calls/${id}`),

  startCall: (data: {
    contactId: string;
    assistantId: string;
    goals?: any[];
  }) => apiClient.post<Call>('/calls/start', data),

  endCall: (id: string, data: {
    duration: number;
    metrics: any;
    transcript: any[];
    recording?: any;
  }) => apiClient.post<Call>(`/calls/${id}/end`, data),

  updateGoals: (id: string, goals: any[]) =>
    apiClient.put<Call>(`/calls/${id}/goals`, { goals }),

  addNote: (id: string, note: string) =>
    apiClient.post<Call>(`/calls/${id}/notes`, { note }),
};