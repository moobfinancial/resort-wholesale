import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

interface Provider {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: Model[];
  providers: Provider[];
  selectedModel: string;
  selectedProvider: string;
  searchTerm: string;
  onSearch: (term: string) => void;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}

export function ModelSelector({
  models = [],
  providers = [],
  selectedModel = '',
  selectedProvider = 'all',
  searchTerm = '',
  onSearch,
  onProviderChange,
  onModelChange,
}: ModelSelectorProps) {
  // Ensure models is an array
  const modelArray = Array.isArray(models) ? models : [];
  
  const filteredModels = modelArray.filter(model => {
    const matchesSearch = !searchTerm || 
                         model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesProvider = selectedProvider === 'all' || 
                           model.id.toLowerCase().includes(selectedProvider.toLowerCase());
    return matchesSearch && matchesProvider;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search models..."
          className="pl-10 bg-gray-700 text-white border-gray-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select value={selectedProvider} onValueChange={onProviderChange}>
            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
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
      </div>

      {selectedModel && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Selected Model Details</h4>
          {(() => {
            const model = modelArray.find(m => m.id === selectedModel);
            if (!model) return null;
            return (
              <div className="space-y-2 text-sm">
                {model.description && (
                  <p className="text-gray-300">{model.description}</p>
                )}
                <div className="flex justify-between text-gray-400">
                  {model.context_length && (
                    <span>Context Length: {model.context_length.toLocaleString()} tokens</span>
                  )}
                  {model.pricing && (
                    <span>
                      Price: ${model.pricing.prompt.toFixed(4)}/1K prompt, 
                      ${model.pricing.completion.toFixed(4)}/1K completion
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}