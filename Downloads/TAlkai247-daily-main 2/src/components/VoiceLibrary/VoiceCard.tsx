import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, PauseCircle, Copy } from 'lucide-react';
import { elevenlabsService } from '@/services/elevenlabs';
import { deepgramApi } from '@/services/deepgram';
import { playhtApi } from '@/services/playht';
import { cartesiaApi } from '@/services/cartesia';
import type { Voice as VoiceType } from './types';
import { toast } from '@/components/ui/use-toast';

interface VoiceCardProps {
  voice: VoiceType;
  onSelect: (voice: VoiceType) => void;
}

export function VoiceCard({ voice, onSelect }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    try {
      if (isPlaying && audioElement) {
        audioElement.pause();
        setIsPlaying(false);
        return;
      }

      toast({
        title: "Loading preview...",
        description: `Fetching voice sample from ${voice.provider}`,
      });

      let audioData: ArrayBuffer;
      
      switch (voice.provider) {
        case "ElevenLabs":
          audioData = await elevenlabsService.previewVoice(voice.eleven_labs_id!, voice.preview_url);
          break;
        case "Deepgram":
          audioData = await deepgramApi.previewVoice(voice.deepgram_id!);
          break;
        case "Playht":
          audioData = await playhtApi.previewVoice(voice.playht_id!);
          break;
        case "Cartesia":
          audioData = await cartesiaApi.previewVoice(voice.cartesia_id!, voice.preview_url);
          break;
        default:
          throw new Error(`Unsupported provider: ${voice.provider}`);
      }

      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      
      if (audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
      }
      
      setAudioElement(audio);
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing preview:', error);
      toast({
        title: "Error",
        description: "Failed to play voice preview. Please try again later.",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-white">{voice.name}</h3>
            <span className="text-sm text-gray-400">{voice.nationality}</span>
          </div>
          <Badge variant={voice.provider === "Cartesia" ? "secondary" : "destructive"}>
            {voice.provider}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-400">{voice.gender} • {voice.language}</p>
          {voice.category && (
            <p className="text-xs text-gray-500">Category: {voice.category}</p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">
              ID: {voice.cartesia_id || voice.eleven_labs_id || voice.deepgram_id || voice.playht_id || 'N/A'}
            </p>
            {(voice.cartesia_id || voice.eleven_labs_id || voice.deepgram_id || voice.playht_id) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  const id = voice.cartesia_id || voice.eleven_labs_id || voice.deepgram_id || voice.playht_id;
                  navigator.clipboard.writeText(id!);
                  toast({
                    title: "Copied!",
                    description: "Voice ID copied to clipboard",
                  });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
          {voice.available_for_tiers && voice.available_for_tiers.length > 0 && (
            <p className="text-xs text-gray-500">
              Available for: {voice.available_for_tiers.join(', ')}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {voice.traits.map((trait, index) => (
              <Badge key={index} variant="outline" className="bg-gray-700">
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-24"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview();
            }}
            disabled={voice.provider === "Cartesia"}
            title={voice.provider === "Cartesia" ? "Preview not available for Cartesia voices" : ""}
          >
            {isPlaying ? (
              <><PauseCircle className="w-4 h-4 mr-2" /> Pause</>
            ) : (
              <><PlayCircle className="w-4 h-4 mr-2" /> Play</>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            className="w-24"
            onClick={() => onSelect(voice)}
          >
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}