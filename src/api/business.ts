import { BusinessFormData } from '../hooks/useBusinessForm';

export async function updateBusinessProfile(data: BusinessFormData): Promise<Response> {
  const response = await fetch('/api/business-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update business information');
  }

  return response;
}
