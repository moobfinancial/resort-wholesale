import { apiClient } from '../client';
import { Campaign, PaginatedResponse } from '@/types/schema';

export const campaignsApi = {
  getCampaigns: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<PaginatedResponse<Campaign>>(`/campaigns?${query}`);
  },

  getCampaign: (id: string) => 
    apiClient.get<Campaign>(`/campaigns/${id}`),

  createCampaign: (data: Omit<Campaign, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Campaign>('/campaigns', data),

  updateCampaign: (id: string, data: Partial<Campaign>) =>
    apiClient.put<Campaign>(`/campaigns/${id}`, data),

  deleteCampaign: (id: string) =>
    apiClient.delete<void>(`/campaigns/${id}`),

  addContacts: (id: string, contactIds: string[]) =>
    apiClient.post<Campaign>(`/campaigns/${id}/contacts`, { contactIds }),

  removeContacts: (id: string, contactIds: string[]) =>
    apiClient.delete<Campaign>(`/campaigns/${id}/contacts`, { 
      body: JSON.stringify({ contactIds }) 
    }),
};