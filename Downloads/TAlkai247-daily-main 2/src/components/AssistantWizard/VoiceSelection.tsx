import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Play, Volume2, PauseCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cartesiaApi } from '@/services/cartesia';
import { elevenlabsService } from '@/services/elevenlabs'; 
import { playhtApi } from '@/services/playht';
import { deepgramApi } from '@/services/deepgram';
import { Voice } from '@/components/VoiceLibrary/types';

interface VoiceSelectionProps {
  formData: {
    name: string;
    firstMessage: string;
    systemPrompt: string;
    tools: Array<{
      type: string;
      name: string;
      config: Record<string, string | number | boolean>;
    }>;
    template: any;
    voiceProvider: string;
    voiceId: string;
    volume: number;
    provider: string;
    model: string;
  };
  onNext: (data: {
    voiceProvider: string;
    voiceId: string;
    volume: number;
  }) => void;
  onBack: () => void;
}

export default function VoiceSelection({ formData, onNext, onBack }: VoiceSelectionProps) {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [volume, setVolume] = useState<number>(formData.volume || 75);
  const [voicesByProvider, setVoicesByProvider] = useState<Record<string, Voice[]>>({});
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [customVoiceProvider, setCustomVoiceProvider] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
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
          Cartesia: cartesiaVoices.slice(0, 10),
          ElevenLabs: elevenlabsVoices.slice(0, 10),
          PlayHT: playhtVoices.slice(0, 10),
          Deepgram: deepgramVoices.slice(0, 10)
        });
      } catch (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch voices. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchVoices();
  }, []);

  // Stop current audio if any
  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingVoiceId(null);
    }
  };

  const playVoiceSample = async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If this voice is already playing, stop it
    if (playingVoiceId === voice.id) {
      stopCurrentAudio();
      return;
    }

    // Stop any currently playing audio
    stopCurrentAudio();

    setPlayingVoiceId(voice.id);
    try {
      let sampleUrl: string | null = null;

      // Get the sample URL based on provider
      switch (voice.provider.toLowerCase()) {
        case 'elevenlabs':
          sampleUrl = voice.preview_url || null;
          if (!sampleUrl) {
            throw new Error('No sample available for this ElevenLabs voice');
          }
          break;

        case 'playht':
          // PlayHT might have samples in different fields
          sampleUrl = voice.preview_url || 
                     (voice.audioUrl) || 
                     null;
          if (!sampleUrl) {
            throw new Error('No sample available for this PlayHT voice');
          }
          break;

        case 'deepgram':
          sampleUrl = voice.preview_url || null;
          if (!sampleUrl) {
            throw new Error('No sample available for this Deepgram voice');
          }
          break;

        case 'cartesia':
          throw new Error('Voice samples not available for Cartesia voices');

        default:
          throw new Error('Unsupported voice provider');
      }

      if (sampleUrl) {
        console.log('Playing sample from URL:', sampleUrl);
        const audio = new Audio(sampleUrl);
        audio.volume = volume / 100;
        
        // Store the audio element
        setCurrentAudio(audio);
        
        // Wait for audio to load before playing
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve;
          audio.onerror = () => reject(new Error('Failed to load audio sample'));
          audio.load();
        });

        await audio.play();
        
        audio.onended = () => {
          console.log('Audio playback ended');
          setPlayingVoiceId(null);
          setCurrentAudio(null);
        };
        
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setPlayingVoiceId(null);
          setCurrentAudio(null);
          toast({
            title: "Error",
            description: "Failed to play voice sample",
            variant: "destructive"
          });
        };
      }
    } catch (error) {
      console.error('Voice sample playback error:', error);
      setPlayingVoiceId(null);
      setCurrentAudio(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to play voice sample",
        variant: "destructive"
      });
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    console.log('Selected voice:', voice);
    setSelectedVoice(voice);
    setCustomVoiceId('');
    setCustomVoiceProvider('');
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
      
      switch (customVoiceProvider) {
        case 'elevenlabs':
          // For ElevenLabs, we need to find the voice in the list
          voice = voicesByProvider.elevenlabs?.find(v => v.id === customVoiceId) || null;
          if (!voice) {
            throw new Error('Voice not found in ElevenLabs voices');
          }
          break;
            
        case 'cartesia':
          // For Cartesia, we need to find the voice in the list
          voice = voicesByProvider.cartesia?.find(v => v.id === customVoiceId) || null;
          if (!voice) {
            throw new Error('Voice not found in Cartesia voices');
          }
          break;
            
        case 'playht':
          // For PlayHT, we need to find the voice in the list
          voice = voicesByProvider.playht?.find(v => v.id === customVoiceId) || null;
          if (!voice) {
            throw new Error('Voice not found in PlayHT voices');
          }
          break;
            
        case 'deepgram':
          // For Deepgram, we need to find the voice in the list
          voice = voicesByProvider.deepgram?.find(v => v.id === customVoiceId) || null;
          if (!voice) {
            throw new Error('Voice not found in Deepgram voices');
          }
          break;
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
    if (!selectedVoice) {
      toast({
        title: "Error",
        description: "Please select a voice before continuing",
        variant: "destructive"
      });
      return;
    }

    onNext({
      ...formData,
      voiceProvider: selectedVoice.provider,
      voiceId: selectedVoice.id,
      volume: volume,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Voices</TabsTrigger>
          <TabsTrigger value="custom">Custom Voice ID</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Provider Selection */}
          <div className="flex gap-2 flex-wrap">
            {Object.keys(voicesByProvider).map((provider) => (
              <Button
                key={provider}
                variant={selectedProvider === provider ? "default" : "outline"}
                onClick={() => setSelectedProvider(provider)}
                className="min-w-[120px]"
              >
                {provider}
              </Button>
            ))}
          </div>

          {/* Voice Cards for Selected Provider */}
          {selectedProvider && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voicesByProvider[selectedProvider]?.map(voice => (
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
                        <h3 className="text-lg font-semibold text-white">{voice.name}</h3>
                        <span className="text-sm text-gray-400">{voice.language}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{voice.gender}</Badge>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => playVoiceSample(voice, e)}
                          className="h-8 px-2"
                        >
                          {playingVoiceId === voice.id ? (
                            <><PauseCircle className="w-4 h-4" /></>
                          ) : (
                            <><Play className="w-4 h-4" /></>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {voice.traits?.map((trait) => (
                        <Badge key={`${voice.id}-${trait}`} variant="outline">{trait}</Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Show message if no provider selected */}
          {!selectedProvider && (
            <div className="text-center py-8 text-gray-400">
              Select a provider to view available voices
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-white">Voice Provider</Label>
              <Input
                placeholder="e.g., ElevenLabs, Cartesia, PlayHT"
                value={customVoiceProvider}
                onChange={(e) => setCustomVoiceProvider(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label className="text-white">Voice ID</Label>
              <Input
                placeholder="Enter voice ID"
                value={customVoiceId}
                onChange={(e) => setCustomVoiceId(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <Button onClick={handleCustomVoiceSubmit}>
              Look Up Voice
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {selectedVoice && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-white">Volume</Label>
              <span className="text-gray-400">{volume}%</span>
            </div>
            <div className="flex items-center gap-4">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}