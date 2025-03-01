import { apiClient } from './client';
import { openRouterApi } from './openrouter';
import type { Assistant } from '@/types/schema';

interface CreateAssistantData {
  name: string;
  model: string;
  systemPrompt: string;
  firstMessage: string;
  tools: any[];
  voice?: {
    provider: string;
    voiceId: string;
    settings: {
      speed: number;
      pitch: number;
      stability: number;
    };
  };
}

export const assistantsApi = {
  getAssistants: async () => {
    const response = await apiClient.get<Assistant[]>('/assistants');
    return response;
  },

  getModels: async () => {
    return openRouterApi.getModels();
  },

  createAssistant: async (data: CreateAssistantData) => {
    const response = await apiClient.post<Assistant>('/assistants', data);
    return response;
  },

  deleteAssistant: async (id: string) => {
    const response = await apiClient.delete(`/assistants/${id}`);
    return response;
  },

  testAssistant: async (id: string, message: string) => {
    const response = await apiClient.post(`/assistants/${id}/test`, { message });
    return response;
  }
};