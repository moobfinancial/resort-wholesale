import axios from 'axios';
import type { ElevenLabsResponse } from '@/types/elevenlabs';
import type { Voice } from '@/components/VoiceLibrary/types';

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

class ElevenLabsService {
  apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('No ElevenLabs API key found in environment variables');
    }
  }

  private get headers() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private mapToVoice(voice: any): Voice {
    return {
      id: voice.voice_id,
      name: voice.name,
      provider: 'elevenlabs',
      language: voice.labels?.language || 'en',
      gender: voice.labels?.gender || 'unknown',
      nationality: voice.labels?.accent || 'Unknown',
      traits: Object.entries(voice.labels || {})
        .filter(([key]) => !['language', 'gender', 'accent'].includes(key))
        .map(([key, value]) => `${key}: ${value}`),
      preview_url: voice.preview_url
    };
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await axios.get<ElevenLabsResponse>(
        `${ELEVEN_LABS_API_URL}/voices`,
        { headers: this.headers }
      );
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  async getVoice(voiceId: string): Promise<Voice | null> {
    try {
      const voices = await this.getAllVoices();
      const voice = voices.find(v => v.voice_id === voiceId);
      return voice ? this.mapToVoice(voice) : null;
    } catch (error) {
      console.error('Error fetching ElevenLabs voice:', error);
      throw error;
    }
  }

  private async getAllVoices(): Promise<any[]> {
    try {
      console.log('Making request to ElevenLabs API...');
      console.log('API URL:', `${ELEVEN_LABS_API_URL}/voices`);
      
      const response = await axios.get<ElevenLabsResponse>(`${ELEVEN_LABS_API_URL}/voices`, {
        headers: this.headers,
      });

      if (!response.data.voices) {
        console.warn('No voices found in response:', response.data);
        return [];
      }

      console.log('Total voices received:', response.data.voices.length);
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      throw error;
    }
  }

  async previewVoice(voiceId: string, previewUrl?: string): Promise<ArrayBuffer> {
    try {
      // If we have a preview URL, use that first
      if (previewUrl) {
        try {
          const response = await axios.get(previewUrl, {
            responseType: 'arraybuffer'
          });
          return response.data;
        } catch (error) {
          console.warn('Failed to fetch preview URL, falling back to text-to-speech:', error);
        }
      }

      // Fall back to generating speech if preview URL fails or is not available
      const response = await axios.post(
        `${ELEVEN_LABS_API_URL}/text-to-speech/${voiceId}`,
        {
          text: "Hello! This is a preview of how I sound.",
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: this.headers,
          responseType: 'arraybuffer'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating voice preview:', error);
      throw error;
    }
  }

  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      const response = await axios.post(
        `${ELEVEN_LABS_API_URL}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: this.headers,
          responseType: 'arraybuffer'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }
}

export const elevenlabsService = new ElevenLabsService();
