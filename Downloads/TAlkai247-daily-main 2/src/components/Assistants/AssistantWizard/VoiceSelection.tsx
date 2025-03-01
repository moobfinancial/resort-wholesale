import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Play, PauseCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cartesiaApi } from '@/services/cartesia';
import { elevenlabsService } from '@/services/elevenlabs';
import { playhtApi } from '@/services/playht';
import { deepgramApi } from '@/services/deepgram';
import { Voice, PlayHTVoice, DeepgramVoice, CartesiaVoice } from '@/components/VoiceLibrary/types';

// Add webkitAudioContext to Window interface
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface VoiceSettings {
  speed: number;
  pitch: number;
  stability: number;
  volume: number;
}

interface VoiceSelectionProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function VoiceSelection({ formData, onNext, onBack }: VoiceSelectionProps) {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speed: 1.0,
    pitch: 1.0,
    stability: 0.75,
    volume: formData.voice?.settings?.volume || 75
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [voicesByProvider, setVoicesByProvider] = useState<Record<string, Voice[]>>({});
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [customVoiceProvider, setCustomVoiceProvider] = useState('');
  const { toast } = useToast();

  // Fetch voices from all providers
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const [cartesiaVoices, elevenlabsVoices, playhtVoices, deepgramVoices] = await Promise.all([
          cartesiaApi.getVoices(),
          elevenlabsService.getVoices(),
          playhtApi.getVoices(),
          deepgramApi.getVoices()
        ]);

        setVoicesByProvider({
          Cartesia: (cartesiaVoices as CartesiaVoice[]).map(voice => ({
            ...voice,
            provider: 'cartesia',
            traits: []
          } as Voice)),
          ElevenLabs: (elevenlabsVoices as Voice[]),
          PlayHT: (playhtVoices as PlayHTVoice[]).map(voice => ({
            ...voice,
            provider: 'playht',
            traits: Array.isArray((voice as PlayHTVoice).traits) ? (voice as PlayHTVoice).traits : []
          } as Voice)),
          Deepgram: (deepgramVoices as DeepgramVoice[]).map(voice => ({
            ...voice,
            provider: 'deepgram',
            traits: []
          } as Voice))
        });
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch available voices",
          variant: "destructive"
        });
      }
    };

    fetchVoices();
  }, []);

  const playVoiceSample = async () => {
    if (!selectedVoice || isPlaying) return;

    setIsPlaying(true);
    try {
      let audioBuffer: ArrayBuffer;
      
      switch (selectedVoice.provider.toLowerCase()) {
        case 'cartesia':
          audioBuffer = await cartesiaApi.previewVoice(selectedVoice.id, selectedVoice.preview_url);
          break;
        case 'elevenlabs':
          audioBuffer = await elevenlabsService.previewVoice(selectedVoice.id, selectedVoice.preview_url);
          break;
        case 'playht':
          audioBuffer = await playhtApi.previewVoice(selectedVoice.id);
          break;
        case 'deepgram':
          audioBuffer = await deepgramApi.previewVoice(selectedVoice.id);
          break;
        default:
          throw new Error('Unsupported provider');
      }

      // Create an audio context and play the buffer
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createBufferSource();
      const audioData = await audioContext.decodeAudioData(audioBuffer);
      source.buffer = audioData;
      source.connect(audioContext.destination);
      source.start(0);

      source.onended = () => {
        setIsPlaying(false);
      };

      toast({
        title: "Playing",
        description: `Playing sample for ${selectedVoice.name}`,
      });
    } catch (error) {
      console.error('Error playing sample:', error);
      toast({
        title: "Error",
        description: "Failed to play voice sample",
        variant: "destructive"
      });
      setIsPlaying(false);
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    console.log('Selected voice:', voice);
    setSelectedVoice(voice);
    setCustomVoiceId('');
    setCustomVoiceProvider('');
  };

  const handleVoiceSettings = (setting: keyof VoiceSettings, value: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleCustomVoiceSubmit = async () => {
    if (!customVoiceId || !customVoiceProvider) {
      toast({
        title: "Error",
        description: "Please enter both voice ID and provider",
        variant: "destructive"
      });
      return;
    }

    try {
      let voice: Voice | null = null;
      
      // Fetch voice details based on provider
      switch (customVoiceProvider.toLowerCase()) {
        case 'cartesia': {
          // Fallback to find the voice in the existing voices
          const voices = await cartesiaApi.getVoices();
          voice = voices.find(v => v.id === customVoiceId) || null;
          if (voice) {
            voice = {
              ...voice,
              provider: 'cartesia',
              traits: []
            } as Voice;
          }
          break;
        }
        case 'elevenlabs':
          voice = await elevenlabsService.getVoices().then(voices => 
            voices.find(v => v.id === customVoiceId) || null
          );
          break;
        case 'playht': {
          const voices = await playhtApi.getVoices();
          voice = voices.find(v => v.id === customVoiceId) || null;
          if (voice) {
            voice = {
              ...voice,
              provider: 'playht',
              traits: Array.isArray((voice as PlayHTVoice).traits) ? (voice as PlayHTVoice).traits : []
            } as Voice;
          }
          break;
        }
        case 'deepgram': {
          const voices = await deepgramApi.getVoices();
          voice = voices.find(v => v.id === customVoiceId) || null;
          if (voice) {
            voice = {
              ...voice,
              provider: 'deepgram',
              traits: []
            } as Voice;
          }
          break;
        }
        default:
          throw new Error('Unsupported provider');
      }

      if (voice) {
        setSelectedVoice(voice);
        toast({
          title: "Success",
          description: `Found voice: ${voice.name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find voice with provided ID",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    if (selectedVoice || customVoiceId) {
      const provider = selectedVoice ? selectedVoice.provider : customVoiceProvider;
      
      // Normalize provider name - handle both cases
      const normalizedProvider = provider.toLowerCase() === 'playht' || provider === 'Playht' ? 'PlayHT' :
                               provider.toLowerCase() === 'elevenlabs' || provider === 'elevenlabs' ? 'ElevenLabs' :
                               provider.toLowerCase() === 'deepgram' ? 'Deepgram' :
                               provider.toLowerCase() === 'cartesia' ? 'Cartesia' : provider;

      console.log('Selected voice provider:', provider);
      console.log('Normalized provider:', normalizedProvider);
      
      onNext({
        voice: {
          provider: normalizedProvider,
          voiceId: selectedVoice ? selectedVoice.id : customVoiceId,
          settings: voiceSettings
        }
      });
    } else {
      // If no voice is selected, pass null to disable voice
      onNext({ voice: null });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Voice Selection</h2>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Voices</TabsTrigger>
          <TabsTrigger value="custom">Custom Voice ID</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(voicesByProvider).map(([provider, voices]) => (
              <div key={provider} className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{provider}</h3>
                {voices.map((voice) => (
                  <Card
                    key={voice.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedVoice?.id === voice.id
                        ? 'bg-teal-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => handleVoiceSelect(voice)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{voice.name}</h4>
                        <span className="text-sm text-gray-400">{voice.language}</span>
                      </div>
                      <Badge variant="secondary">{voice.gender}</Badge>
                    </div>
                    {voice.traits && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {voice.traits.map((trait) => (
                          <Badge key={`${voice.id}-${trait}`} variant="outline">{trait}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-white">Provider</Label>
              <Input
                value={customVoiceProvider}
                onChange={(e) => setCustomVoiceProvider(e.target.value)}
                placeholder="Enter provider name (e.g., ElevenLabs, PlayHT)"
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label className="text-white">Voice ID</Label>
              <Input
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                placeholder="Enter voice ID"
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <Button onClick={handleCustomVoiceSubmit}>
              Verify Voice ID
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {selectedVoice && (
        <div className="space-y-4">
          <Card className="p-4 bg-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Voice Settings</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between">
                  <Label className="text-white">Speed</Label>
                  <span className="text-sm text-gray-400">{voiceSettings.speed}x</span>
                </div>
                <Slider
                  value={[voiceSettings.speed]}
                  min={0.25}
                  max={4.0}
                  step={0.25}
                  onValueChange={([value]) => handleVoiceSettings('speed', value)}
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label className="text-white">Pitch</Label>
                  <span className="text-sm text-gray-400">{voiceSettings.pitch}x</span>
                </div>
                <Slider
                  value={[voiceSettings.pitch]}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onValueChange={([value]) => handleVoiceSettings('pitch', value)}
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label className="text-white">Stability</Label>
                  <span className="text-sm text-gray-400">
                    {(voiceSettings.stability * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[voiceSettings.stability]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => handleVoiceSettings('stability', value)}
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label className="text-white">Volume</Label>
                  <span className="text-sm text-gray-400">{voiceSettings.volume}%</span>
                </div>
                <Slider
                  value={[voiceSettings.volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => handleVoiceSettings('volume', value)}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={playVoiceSample}
              disabled={isPlaying}
            >
              {isPlaying ? <PauseCircle className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!selectedVoice && !customVoiceId}>
          Next
        </Button>
      </div>
    </div>
  );
}
