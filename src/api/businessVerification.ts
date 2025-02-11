import { VerificationStatus } from '../components/business/BusinessVerification';

export interface VerificationResponse {
  status: VerificationStatus;
  message: string;
  files?: Array<{
    filename: string;
    size: number;
    mimetype: string;
  }>;
}

export async function submitVerification(files: File[]): Promise<VerificationResponse> {
  try {
    console.log('Submitting files:', files);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    const response = await fetch('/api/business-verification', {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    let responseData;
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse response as JSON:', error);
      throw new Error('Server response was not valid JSON');
    }

    if (!response.ok) {
      throw new Error(responseData.message || `Server error: ${response.status}`);
    }

    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format');
    }

    // Validate response shape
    if (!responseData.status || !responseData.message) {
      throw new Error('Invalid response structure');
    }

    return responseData as VerificationResponse;
  } catch (error) {
    console.error('Verification submission error:', error);
    throw error instanceof Error ? error : new Error('Failed to submit verification');
  }
}

export async function checkVerificationStatus(): Promise<VerificationResponse> {
  try {
    const response = await fetch('/api/business-verification/status');
    console.log('Status check response:', response.status);

    let responseData;
    const responseText = await response.text();
    console.log('Raw status response:', responseText);

    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse status response as JSON:', error);
      throw new Error('Server response was not valid JSON');
    }

    if (!response.ok) {
      throw new Error(responseData.message || `Server error: ${response.status}`);
    }

    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format');
    }

    // Validate response shape
    if (!responseData.status || !responseData.message) {
      throw new Error('Invalid response structure');
    }

    return responseData as VerificationResponse;
  } catch (error) {
    console.error('Status check error:', error);
    throw error instanceof Error ? error : new Error('Failed to check verification status');
  }
}
