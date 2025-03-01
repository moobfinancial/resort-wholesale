import { apiClient } from '../client';
import { WhisperTemplate, PaginatedResponse } from '@/types/schema';

export const whisperTemplatesApi = {
  getTemplates: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: 'BUSINESS' | 'PERSONAL';
    includeSystem?: boolean;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<PaginatedResponse<WhisperTemplate>>(`/whisper-templates?${query}`);
  },

  getTemplate: (id: string) => 
    apiClient.get<WhisperTemplate>(`/whisper-templates/${id}`),

  createTemplate: (data: Omit<WhisperTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<WhisperTemplate>('/whisper-templates', data),

  updateTemplate: (id: string, data: Partial<WhisperTemplate>) =>
    apiClient.put<WhisperTemplate>(`/whisper-templates/${id}`, data),

  deleteTemplate: (id: string) =>
    apiClient.delete<void>(`/whisper-templates/${id}`),

  toggleVisibility: (id: string) =>
    apiClient.post<WhisperTemplate>(`/whisper-templates/${id}/toggle-visibility`, {}),
};