import axios from 'axios';
import type { Voice } from '@/components/VoiceLibrary/types';

const PROXY_URL = 'http://localhost:3000/api';

interface DeepgramVoice {
  model_id: string;
  name: string;
  language: string;
  gender: string;
  description?: string;
  preview_url?: string;
  avatar_url?: string;
}

export const deepgramApi = {
  /**
   * Fetch available voices from Deepgram
   */
  async getVoices(): Promise<Voice[]> {
    try {
      const response = await axios.get(`${PROXY_URL}/deepgram/voices`);
      const voices: DeepgramVoice[] = response.data;

      // Map Deepgram voices to our Voice interface
      return voices.map(voice => ({
        id: voice.model_id,
        name: voice.name,
        gender: voice.gender,
        language: voice.language,
        provider: 'deepgram',
        traits: voice.description ? [voice.description] : [],
        preview_url: voice.preview_url,
        deepgram_id: voice.model_id,
        nationality: '',
      }));
    } catch (error) {
      console.error('Error fetching Deepgram voices:', error);
      throw error;
    }
  },

  /**
   * Generate speech from text using Deepgram
   */
  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      console.log('Generating speech with Deepgram:', { text, voiceId });
      const response = await axios.post(
        `${PROXY_URL}/deepgram/speech`,
        {
          text,
          voice: voiceId,
        },
        {
          responseType: 'arraybuffer',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  /**
   * Preview a voice sample
   */
  async previewVoice(voiceId: string): Promise<ArrayBuffer> {
    try {
      const voices = await this.getVoices();
      const voice = voices.find(v => v.deepgram_id === voiceId);
      
      if (!voice?.preview_url) {
        throw new Error('No preview URL available for this voice');
      }

      const response = await axios.get(voice.preview_url, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('Error previewing voice:', error);
      throw error;
    }
  },
};

export type { DeepgramVoice };
