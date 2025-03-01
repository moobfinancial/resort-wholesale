import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

interface ModelSelectionProps {
  selectedProvider?: string;
  selectedModel?: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  availableModels: ModelInfo[];
  className?: string;
}

export default function ModelSelection({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  availableModels,
  className = ""
}: ModelSelectionProps) {
  const providers = [...new Set((availableModels || []).map(m => m.provider))];
  const models = (availableModels || []).filter(m => m.provider === selectedProvider);

  return (
    <Card className={`p-4 bg-gray-700 ${className}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">LLM Provider</Label>
          <Select
            value={selectedProvider}
            onValueChange={onProviderChange}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={selectedModel}
            onValueChange={onModelChange}
            disabled={!selectedProvider}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    {model.contextWindow && (
                      <span className="text-xs text-gray-400">
                        Context: {model.contextWindow.toLocaleString()} tokens
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
