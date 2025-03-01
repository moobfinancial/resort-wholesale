import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Model } from '@/lib/api/openrouter';

interface ModelSelectionCardProps {
  models: Model[];
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
}

export default function ModelSelectionCard({
  models,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false,
  loading = false,
  error = null
}: ModelSelectionCardProps) {
  const getProviderFromModelId = (modelId: string) => {
    const [provider] = modelId.split('/');
    return provider;
  };

  const getModelsByProvider = () => {
    const modelsByProvider: Record<string, Model[]> = {};
    models.forEach(model => {
      const provider = getProviderFromModelId(model.id);
      if (!modelsByProvider[provider]) {
        modelsByProvider[provider] = [];
      }
      modelsByProvider[provider].push(model);
    });
    return modelsByProvider;
  };

  const modelsByProvider = getModelsByProvider();
  const selectedProviderModels = modelsByProvider[selectedProvider] || [];

  return (
    <Card className="p-4 bg-gray-700 space-y-4">
      <div>
        <Label className="text-white mb-2">Provider</Label>
        <Select
          value={selectedProvider}
          onValueChange={onProviderChange}
          disabled={disabled || loading}
        >
          <SelectTrigger className="bg-gray-700 text-white border-gray-600">
            <SelectValue placeholder="Select provider">
              {selectedProvider ? selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1) : 'Select provider'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.keys(modelsByProvider).map((provider) => (
              <SelectItem key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white mb-2">Model</Label>
        <Select
          value={selectedModel}
          onValueChange={onModelChange}
          disabled={disabled || loading || !selectedProvider}
        >
          <SelectTrigger className="bg-gray-700 text-white border-gray-600">
            <SelectValue placeholder="Select model">
              {selectedModel ? selectedProviderModels.find(m => m.id === selectedModel)?.name || selectedModel : 'Select model'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {selectedProviderModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    {model.context_length && (
                      <span className="text-xs text-gray-400">
                        Context: {model.context_length.toLocaleString()} tokens
                      </span>
                    )}
                    {model.pricing && (
                      <span className="text-xs text-gray-400">
                        ${model.pricing.prompt.toFixed(4)}/1K tokens
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Loading models...</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </Card>
  );
}
