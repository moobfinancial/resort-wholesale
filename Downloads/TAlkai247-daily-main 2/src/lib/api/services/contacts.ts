import { apiClient } from '../client';
import { Contact, PaginatedResponse } from '@/types/schema';

export const contactsApi = {
  getContacts: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<PaginatedResponse<Contact>>(`/contacts?${query}`);
  },

  getContact: (id: string) => 
    apiClient.get<Contact>(`/contacts/${id}`),

  createContact: (data: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Contact>('/contacts', data),

  updateContact: (id: string, data: Partial<Contact>) =>
    apiClient.put<Contact>(`/contacts/${id}`, data),

  deleteContact: (id: string) =>
    apiClient.delete<void>(`/contacts/${id}`),

  bulkDelete: (contactIds: string[]) =>
    apiClient.post<void>('/contacts/bulk', { 
      operation: 'delete',
      contactIds 
    }),

  bulkUpdate: (contactIds: string[], data: Partial<Contact>) =>
    apiClient.post<void>('/contacts/bulk', {
      operation: 'update',
      contactIds,
      data
    }),

  assignToCampaign: (contactIds: string[], campaignId: string) =>
    apiClient.post<void>('/contacts/bulk', {
      operation: 'assignCampaign',
      contactIds,
      data: { campaignId }
    }),
};