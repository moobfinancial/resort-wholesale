import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { VoiceCard } from './VoiceCard';
import { VoiceFilters } from './VoiceFilters';
import { VoiceDetailsModal } from './VoiceDetailsModal';
import { AddVoiceCloneModal } from './AddVoiceCloneModal';
import { useToast } from "@/components/ui/use-toast";
import { elevenlabsService } from '@/services/elevenlabs'; 
import { deepgramApi } from '@/services/deepgram';
import { playhtApi } from '@/services/playht';
import { cartesiaApi } from '@/services/cartesia';
import type { 
  Voice, 
  Provider, 
  DeepgramVoice, 
  PlayHTVoice, 
  CartesiaVoice 
} from './types';
import type { ElevenLabsVoice as ElevenLabsAPIVoice } from '@/types/elevenlabs'; 

const allLanguages = [
  "English", "Spanish (Spain)", "Spanish (Mexico)", "French (France)", "French (Canada)",
  "German", "Italian", "Japanese", "Korean", "Portuguese (Brazil)", "Portuguese (Portugal)",
  "Russian", "Chinese (Mandarin)", "Chinese (Cantonese)"
];

const allProviders: Provider[] = [
  { name: "elevenlabs", status: "Premium", description: "High-quality voice synthesis" },
  { name: "deepgram", status: "Included", description: "Fast and accurate voice models" },
  { name: "playht", status: "Premium", description: "Realistic voice cloning" },
  { name: "cartesia", status: "Included", description: "Natural-sounding voices" },
  { name: "custom", status: "Included", description: "Your custom voice clones" }
];

export default function VoiceLibraryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [showAddVoiceModal, setShowAddVoiceModal] = useState(false);
  const [showVoiceDetailsModal, setShowVoiceDetailsModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true);
        // Use public methods instead of private ones
        const elevenlabsVoices: ElevenLabsAPIVoice[] = await elevenlabsService.getVoices();
        
        if (!elevenlabsVoices || elevenlabsVoices.length === 0) {
          console.warn('No voices received from ElevenLabs API');
          return;
        }

        // Create formatted voices directly with proper typing
        const formattedElevenlabsVoices: Voice[] = elevenlabsVoices.map((voice: ElevenLabsAPIVoice) => ({
          id: voice.voice_id || `elevenlabs-${Date.now()}`,
          name: voice.name,
          gender: voice.labels?.gender || 'Unknown',
          nationality: voice.labels?.nationality || 'Unknown',
          language: voice.labels?.language || 'en',
          provider: 'elevenlabs',
          traits: voice.labels ? Object.values(voice.labels).filter(Boolean) as string[] : [],
          preview_url: voice.preview_url || '',
          elevenlabs_id: voice.voice_id
        }));

        // Fetch Deepgram voices
        let formattedDeepgramVoices: Voice[] = [];
        try {
          const deepgramVoices: DeepgramVoice[] = await deepgramApi.getVoices();
          formattedDeepgramVoices = deepgramVoices.map(voice => ({
            id: voice.id || `deepgram-${Date.now()}`,
            name: voice.name,
            gender: voice.gender || 'Unknown',
            nationality: 'Unknown',
            language: voice.language || 'en',
            provider: 'deepgram',
            traits: voice.description ? [voice.description] : [],
            deepgram_id: voice.id
          }));
        } catch (error) {
          console.error('Error fetching Deepgram voices:', error);
          toast({
            title: "Warning",
            description: "Failed to fetch Deepgram voices. Other voices will still be available.",
            variant: "default",
          });
        }

        // Fetch PlayHT voices
        let formattedPlayhtVoices: Voice[] = [];
        try {
          const playhtVoices: PlayHTVoice[] = await playhtApi.getVoices();
          formattedPlayhtVoices = playhtVoices.map(voice => ({
            id: voice.id || `playht-${Date.now()}`,
            name: voice.name,
            gender: voice.gender || 'Unknown',
            nationality: 'Unknown',
            language: voice.language || 'en',
            provider: 'playht',
            traits: Array.isArray(voice.traits) ? voice.traits : (voice.description ? [voice.description] : []),
            playht_id: voice.id
          }));
        } catch (error) {
          console.error('Error fetching PlayHT voices:', error);
          toast({
            title: "Warning",
            description: "Failed to fetch PlayHT voices. Other voices will still be available.",
            variant: "default",
          });
        }

        // Fetch Cartesia voices
        let formattedCartesiaVoices: Voice[] = [];
        try {
          const cartesiaVoices: CartesiaVoice[] = await cartesiaApi.getVoices();
          formattedCartesiaVoices = cartesiaVoices.map(voice => ({
            id: voice.id || `cartesia-${Date.now()}`,
            name: voice.name,
            gender: voice.gender || 'Unknown',
            nationality: 'Unknown',
            language: voice.language || 'en',
            provider: 'cartesia',
            traits: voice.description ? [voice.description] : [],
            cartesia_id: voice.id,
            category: voice.category || 'General'
          }));
        } catch (error) {
          console.error('Error fetching Cartesia voices:', error);
          toast({
            title: "Warning",
            description: "Failed to fetch Cartesia voices. Other voices will still be available.",
            variant: "default",
          });
        }

        // Combine all voices
        setVoices([
          ...formattedElevenlabsVoices,
          ...formattedDeepgramVoices,
          ...formattedPlayhtVoices,
          ...formattedCartesiaVoices
        ]);
        
        console.log('All voices:', [
          ...formattedElevenlabsVoices,
          ...formattedDeepgramVoices,
          ...formattedPlayhtVoices,
          ...formattedCartesiaVoices
        ]);
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch voices. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const filteredVoices = voices.filter((voice) => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (voice.nationality ? voice.nationality.toLowerCase().includes(searchQuery.toLowerCase()) : false);
    const matchesLanguage = selectedLanguage === "All Languages" || voice.language === selectedLanguage;
    const matchesProvider = selectedProvider === "All Providers" || voice.provider === selectedProvider;
    return matchesSearch && matchesLanguage && matchesProvider;
  });

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice({
      id: voice.id,
      name: voice.name,
      gender: voice.gender,
      nationality: voice.nationality,
      language: voice.language,
      provider: voice.provider,
      traits: voice.traits,
      preview_url: voice.preview_url
    });
    setShowVoiceDetailsModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Voice Library</h2>
        <Button
          onClick={() => setShowAddVoiceModal(true)}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Voice
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
          <p className="text-gray-400">Loading voices...</p>
        </div>
      ) : filteredVoices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No voices found matching your criteria.</p>
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
        onAddVoice={(newVoice) => {
          // Handle adding the new voice
          const voiceWithId = {
            ...newVoice,
            id: `custom-${Date.now()}`,
            provider: 'custom',
            traits: ['Custom'],
            nationality: 'Custom',
            gender: 'Other',
            language: 'English'
          };
          setVoices(prev => [...prev, voiceWithId]);
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