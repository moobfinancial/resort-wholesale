import { useState, useEffect } from 'react';
import { ModelInfo } from '@/components/LLM/ModelSelection';

export function useModelList() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchModels() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/models/all');
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (isMounted) {
          setModels(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setModels([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchModels();

    return () => {
      isMounted = false;
    };
  }, []);

  return { models, isLoading, error };
}
