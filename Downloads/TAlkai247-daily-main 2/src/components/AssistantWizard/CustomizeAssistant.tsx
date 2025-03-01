import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { openRouterApi } from '@/lib/api/openrouter';
import ModelSelectionCard from '@/components/LLM/ModelSelectionCard';
import type { Model } from '@/lib/api/openrouter';

interface CustomizeAssistantProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CustomizeAssistant({ formData, onNext, onBack }: CustomizeAssistantProps) {
  const [name, setName] = useState(formData.name || '');
  const [firstMessage, setFirstMessage] = useState(formData.firstMessage || '');
  const [systemPrompt, setSystemPrompt] = useState(formData.systemPrompt || '');
  const [selectedModel, setSelectedModel] = useState(formData.model || '');
  const [selectedProvider, setSelectedProvider] = useState(formData.provider || '');
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await openRouterApi.getModels();
        if (response.success && Array.isArray(response.data)) {
          setModels(response.data);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch models');
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleNext = () => {
    onNext({
      name,
      firstMessage,
      systemPrompt,
      model: selectedModel,
      provider: selectedProvider
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-white">Assistant Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 text-white border-gray-600"
          placeholder="Enter assistant name"
        />
      </div>

      <ModelSelectionCard
        models={models}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={setSelectedProvider}
        onModelChange={setSelectedModel}
        loading={loading}
        error={error}
      />

      <div>
        <Label className="text-white">First Message</Label>
        <Textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          className="bg-gray-700 text-white border-gray-600 min-h-[100px]"
          placeholder="Enter the first message your assistant will say"
        />
      </div>

      <div>
        <Label className="text-white">System Prompt</Label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="bg-gray-700 text-white border-gray-600 min-h-[100px]"
          placeholder="Enter the system prompt that defines your assistant's behavior"
        />
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!name || !selectedProvider || !selectedModel}
        >
          Next
        </Button>
      </div>
    </div>
  );
}