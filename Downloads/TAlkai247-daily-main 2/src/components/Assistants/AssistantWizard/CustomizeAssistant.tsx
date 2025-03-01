import React from 'react';
import ModelSelection from '@/components/LLM/ModelSelection';
import { useModelList } from '@/hooks/useModelList';
import { toast } from '@/components/ui/use-toast';

interface CustomizeAssistantProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CustomizeAssistant({ formData, onNext, onBack }: CustomizeAssistantProps) {
  const [name, setName] = React.useState(formData.name || '');
  const [firstMessage, setFirstMessage] = React.useState(formData.firstMessage || '');
  const [systemPrompt, setSystemPrompt] = React.useState(formData.systemPrompt || '');
  const [provider, setProvider] = React.useState(formData.provider || '');
  const [model, setModel] = React.useState(formData.model || '');
  
  const { models } = useModelList();

  const handleNext = () => {
    if (!name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your assistant",
        variant: "destructive"
      });
      return;
    }

    if (!provider || !model) {
      toast({
        title: "Error",
        description: "Please select both a provider and a model",
        variant: "destructive"
      });
      return;
    }

    // Normalize provider name
    const normalizedProvider = provider.toLowerCase() === 'anthropic' ? 'Anthropic' :
                             provider.toLowerCase() === 'openai' ? 'OpenAI' :
                             provider.toLowerCase() === 'google' ? 'Google' :
                             provider.charAt(0).toUpperCase() + provider.slice(1);

    onNext({
      ...formData, // Preserve existing data
      name: name.trim(),
      firstMessage: firstMessage?.trim() || '',
      systemPrompt: systemPrompt?.trim() || '',
      provider: normalizedProvider,
      model: model
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white mb-2">Assistant Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
          placeholder="Enter assistant name"
        />
      </div>

      <ModelSelection
        selectedProvider={provider}
        selectedModel={model}
        onProviderChange={setProvider}
        onModelChange={setModel}
        availableModels={models || []}
        className="mt-4"
      />

      <div>
        <label className="block text-white mb-2">First Message</label>
        <textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 h-32"
          placeholder="Enter the first message your assistant will say"
        />
      </div>

      <div>
        <label className="block text-white mb-2">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 h-48"
          placeholder="Enter the system prompt that defines your assistant's behavior"
        />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          disabled={!name || !provider || !model}
        >
          Next
        </button>
      </div>
    </div>
  );
}