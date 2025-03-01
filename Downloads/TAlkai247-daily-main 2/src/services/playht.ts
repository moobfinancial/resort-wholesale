import axios from 'axios';
// const API_URL = 'https://api.play.ht/api/v2';

interface PlayHTVoice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: string;
  voiceEngine: string;
  preview_url?: string;
  description?: string;
  samples?: string[];
  provider: string; // Add the provider field to the interface
  nationality?: string; // Add nationality property
  traits: string[]; // Make traits non-optional
}

export const playhtApi = {
  /**
   * Fetch available voices from PlayHT API
   */
  async getVoices(): Promise<PlayHTVoice[]> {
    try {
      console.log('Fetching PlayHT voices...');
      const response = await axios.get('/api/playht/voices');
      console.log('PlayHT API Response:', response);

      // The response.data is already an array of voices
      const voices = Array.isArray(response.data) ? response.data : [];
      console.log(`Processing ${voices.length} voices`);

      return voices.map((voice: any, index: number) => {
        console.log(`Processing voice ${index + 1}/${voices.length}:`, voice);
        
        // Get preview URL from various possible fields
        const preview_url = voice.preview_url || 
                          voice.previewUrl || 
                          voice.sample || // Some voices use 'sample' field
                          (Array.isArray(voice.samples) && voice.samples[0]) ||
                          '';

        // Get samples array, ensuring it's always an array
        const samples = Array.isArray(voice.samples) ? voice.samples : 
                       voice.sample ? [voice.sample] : // If there's a single sample, make it an array
                       [];

        const mappedVoice = {
          id: voice.id || `unknown-${index}`,
          name: voice.name || 'Unknown Voice',
          language: voice.language || voice.accent ? `English (${voice.accent})` : 'English',
          languageCode: voice.languageCode || 'en-US',
          gender: voice.gender || 'unknown',
          voiceEngine: voice.voiceEngine || 'Standard',
          preview_url,
          description: voice.description || '',
          samples,
          provider: 'PlayHT', // Add the provider field
          nationality: voice.nationality || 'Unknown',
          traits: Array.isArray(voice.traits) ? voice.traits : (voice.description ? [voice.description] : [])
        };

        console.log(`Mapped voice ${index + 1}:`, mappedVoice);
        return mappedVoice;
      });
    } catch (error) {
      console.error('Error fetching PlayHT voices:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  },

  /**
   * Generate speech from text using PlayHT API
   */
  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      console.log('Generating speech with PlayHT:', { text, voiceId });
      
      const response = await axios.post('/api/playht/speech', {
        text,
        voice: voiceId,
        quality: 'premium',
        output_format: 'mp3'
      }, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('Error generating speech with PlayHT:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  },

  /**
   * Preview a voice sample
   */
  async previewVoice(voiceId: string): Promise<ArrayBuffer> {
    try {
      console.log('Previewing PlayHT voice:', voiceId);
      
      // Get the voice details including samples
      const voices = await this.getVoices();
      const voice = voices.find(v => v.id === voiceId);
      
      if (!voice) {
        throw new Error('Voice not found');
      }

      // Use preview_url or first sample
      const previewUrl = voice.preview_url || (voice.samples && voice.samples[0]);
      
      if (!previewUrl) {
        console.error('Voice details:', voice);
        throw new Error('No preview URL or samples available for this voice');
      }

      console.log('Using preview URL:', previewUrl);
      
      // Fetch the audio data through our proxy
      const response = await axios.get(`/api/playht/preview?url=${encodeURIComponent(previewUrl)}`, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('Error previewing PlayHT voice:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  }
};

export type { PlayHTVoice };
