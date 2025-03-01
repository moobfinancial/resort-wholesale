import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from 'lucide-react';
import type { Provider } from './types';

interface VoiceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  languages: string[];
  providers: Provider[];
  onFilterChange?: (language: string, provider: string) => void;
}

export function VoiceFilters({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedProvider,
  onProviderChange,
  languages,
  providers,
  onFilterChange
}: VoiceFiltersProps) {
  const handleLanguageChange = (value: string) => {
    onLanguageChange(value);
    if (onFilterChange) {
      onFilterChange(value, selectedProvider);
    }
  };

  const handleProviderChange = (value: string) => {
    onProviderChange(value);
    if (onFilterChange) {
      onFilterChange(selectedLanguage, value);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4 space-y-4">
        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search voices..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Language</Label>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Languages">All Languages</SelectItem>
              {languages.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Provider</Label>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Providers">All Providers</SelectItem>
              {providers.map(provider => (
                <SelectItem key={provider.name} value={provider.name}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}