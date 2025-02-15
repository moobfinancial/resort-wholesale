import { useState } from 'react';
import { API_BASE_URL } from '../config';

interface ProductAnalysis {
  category: string;
  description: string;
  suggestedTags: string[];
}

export function useImageAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageDataUrl: string): Promise<ProductAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert base64 image to blob for upload
      const base64Data = imageDataUrl.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

      // Create form data for the image
      const formData = new FormData();
      formData.append('image', blob, 'product_image.jpg');

      // Send to backend for analysis
      const response = await fetch(`${API_BASE_URL}/admin/inventory/analyze-image`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let the browser set it with the boundary
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to analyze image: ${response.status}`);
      }

      const analysis = await response.json();
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
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
}
