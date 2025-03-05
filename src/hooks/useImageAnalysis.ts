import { useState } from 'react';
import { API_BASE_URL } from '../config';

export interface ImageAnalysisResult {
  name?: string;
  sku?: string;
  category: string;
  description: string;
  suggestedTags: string[];
  imageUrl?: string;
}

export const useImageAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeImage = async (imageDataUrl: string): Promise<ImageAnalysisResult> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting image analysis...');
      
      // Convert data URL to Blob
      const fetchResponse = await fetch(imageDataUrl);
      const blob = await fetchResponse.blob();
      
      // Create FormData object
      const formData = new FormData();
      formData.append('image', blob, 'product_image.jpg');

      // Send to backend for analysis
      const endpoint = `${API_BASE_URL}/admin/inventory/analyze-image`;
      console.log('Sending request to endpoint:', endpoint);
      
      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Response status:', apiResponse.status);
      
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Server response:', errorText);
        throw new Error(apiResponse.statusText || 'Failed to analyze image');
      }

      const result = await apiResponse.json();
      console.log('Analysis result:', result);
      
      if (result.status === 'error') {
        throw new Error(result.message || 'Analysis failed');
      }
      
      // Map the server response to our expected format
      const mappedResult = {
        name: result.data.productName,
        sku: result.data.sku,
        category: result.data.category,
        description: result.data.description,
        suggestedTags: result.data.tags || [],
        imageUrl: result.data.imageUrl
      };
      
      console.log('Mapped analysis result:', mappedResult);
      return mappedResult;
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyzeImage,
    isLoading,
    error,
  };
};

export default useImageAnalysis;
