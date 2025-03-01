import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { VoiceCard } from './VoiceCard';
import { VoiceFilters } from './VoiceFilters';
import { VoiceDetailsModal } from './VoiceDetailsModal';
import { AddVoiceCloneModal } from './AddVoiceCloneModal';
import { elevenlabsService } from '@/services/elevenlabs';
import type { Voice, Provider } from './types';

const allLanguages = [
  "English", "Spanish (Spain)", "Spanish (Mexico)", "French (France)", "French (Canada)",
  "German", "Italian", "Japanese", "Korean", "Portuguese (Brazil)", "Portuguese (Portugal)",
  "Russian", "Chinese (Mandarin)", "Chinese (Cantonese)"
];

const allProviders: Provider[] = [
  { name: "talkai247", status: "Included", description: "Default voice provider" },
  { name: "elevenlabs", status: "Premium", description: "High-quality voice synthesis" },
  { name: "playht", status: "Premium", description: "Realistic voice cloning" },
  { name: "deepgram", status: "Included", description: "Fast and accurate voice models" },
  { name: "custom", status: "Included", description: "Your custom voice clones" }
];

const initialVoices: Voice[] = [];

export function VoiceLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [voices, setVoices] = useState<Voice[]>(initialVoices);
  const [showAddVoiceModal, setShowAddVoiceModal] = useState(false);
  const [showVoiceDetailsModal, setShowVoiceDetailsModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      try {
        setIsLoading(true);
        console.log('Starting to fetch Eleven Labs voices...');
        console.log('API Key available:', !!elevenlabsService.apiKey);
        // Use public methods instead of private ones
        const elevenlabsVoices: any[] = await elevenlabsService.getVoices();
        console.log('Received voices:', elevenlabsVoices);
        
        if (!elevenlabsVoices || elevenlabsVoices.length === 0) {
          console.warn('No voices received from ElevenLabs API');
          return;
        }

        // Create formatted voices directly with proper typing
        const formattedVoices: Voice[] = elevenlabsVoices.map((voice: any) => ({
          id: voice.voice_id || `eleven-${Date.now()}`,
          name: voice.name,
          gender: voice.labels?.gender || 'Unknown',
          nationality: voice.labels?.nationality || 'Unknown',
          language: voice.labels?.language || 'en',
          provider: 'elevenlabs',
          traits: voice.labels ? Object.values(voice.labels).filter(Boolean) as string[] : [],
          preview_url: voice.preview_url || '',
          eleven_labs_id: voice.voice_id
        }));

        console.log('Formatted voices:', formattedVoices);
        setVoices(formattedVoices);
      } catch (error) {
        console.error('Error fetching Eleven Labs voices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElevenLabsVoices();
  }, []);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (voice.nationality ? voice.nationality.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    const matchesLanguage = selectedLanguage === "All Languages" || voice.language === selectedLanguage;
    const matchesProvider = selectedProvider === "All Providers" || voice.provider === selectedProvider;
    
    return matchesSearch && matchesLanguage && matchesProvider;
  });

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setShowVoiceDetailsModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Voice Library</h2>
        <Button onClick={() => setShowAddVoiceModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Voice Clone
        </Button>
      </div>

      <VoiceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        languages={allLanguages}
        providers={allProviders}
        onFilterChange={(language, provider) => {
          setSelectedLanguage(language);
          setSelectedProvider(provider);
        }}
      />

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading voices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredVoices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              onSelect={handleVoiceSelect}
            />
          ))}
        </div>
      )}

      <AddVoiceCloneModal
        isOpen={showAddVoiceModal}
        onClose={() => setShowAddVoiceModal(false)}
        onAddVoice={(voice) => {
          // Ensure the voice has all required properties of the Voice type
          const completeVoice: Voice = {
            id: voice.id || `custom-${Date.now()}`,
            name: voice.name,
            provider: voice.provider || 'custom',
            audioUrl: voice.audioUrl,
            description: voice.description,
            gender: 'Unknown',
            language: 'English',
            traits: [],
            nationality: 'Unknown'
          };
          setVoices([...voices, completeVoice]);
          setShowAddVoiceModal(false);
        }}
      />

      <VoiceDetailsModal
        isOpen={showVoiceDetailsModal}
        onClose={() => setShowVoiceDetailsModal(false)}
        voice={selectedVoice}
        providers={allProviders}
      />
    </div>
  );
}