import axios from 'axios';

const CARTESIA_API_KEY = import.meta.env.VITE_CARTESIA_API_KEY;

interface CartesiaVoice {
  id: string;
  name: string;
  language: string;
  gender: string;
  nationality: string;
  provider: string;
  traits: string[];
  cartesia_id: string;
  sample_url: string | null;
}

export const cartesiaApi = {
  /**
   * Fetch available voices from Cartesia API
   */
  async getVoices(): Promise<CartesiaVoice[]> {
    try {
      console.log('Fetching Cartesia voices from frontend...');
      const response = await axios.get('/api/cartesia/voices');
      console.log('Cartesia voices raw response:', response);
      
      if (!response.data) {
        console.warn('No data in response');
        return [];
      }

      if (!response.data.voices || !Array.isArray(response.data.voices)) {
        console.warn('No voices array in response:', response.data);
        return [];
      }

      console.log('Found', response.data.voices.length, 'Cartesia voices');
      console.log('Sample voice data:', response.data.voices[0]);

      // Map the response data to our voice interface
      const voices = await Promise.all(response.data.voices.map(async (voice: any) => {
        try {
          // Basic validation
          if (!voice || !voice.id) {
            console.warn('Invalid voice data:', voice);
            return null;
          }

          return {
            id: voice.id,
            name: voice.name || 'Unknown Voice',
            language: voice.language || 'English',
            gender: voice.gender || 'Not specified',
            nationality: voice.accent || 'Not specified',
            provider: 'Cartesia',
            traits: [
              voice.style ? `Style: ${voice.style}` : '',
              voice.age ? `Age: ${voice.age}` : '',
              voice.texture ? `Texture: ${voice.texture}` : '',
              voice.tempo ? `Tempo: ${voice.tempo}` : '',
              voice.loudness ? `Loudness: ${voice.loudness}` : '',
            ].filter(Boolean),
            cartesia_id: voice.id,
            sample_url: voice.sample || null
          };
        } catch (error) {
          console.warn(`Failed to process voice:`, error);
          return null;
        }
      }));

      // Filter out any null values from failed processing
      return voices.filter((voice): voice is CartesiaVoice => voice !== null);
    } catch (error) {
      console.error('Error fetching Cartesia voices:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  },

  /**
   * Generate speech from text using Cartesia API
   */
  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      console.log('Generating speech from text...');
      const response = await axios.post(
        '/api/cartesia/text-to-speech',
        {
          text,
          voice_id: voiceId,
          output_format: 'mp3',
        },
        {
          headers: {
            'Authorization': `Bearer ${CARTESIA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      console.log('Speech generation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  },

  /**
   * Preview a voice sample
   */
  async previewVoice(voiceId: string, previewUrl?: string): Promise<ArrayBuffer> {
    try {
      console.log('Previewing voice...');
      // If we have a preview URL, use that first
      if (previewUrl) {
        try {
          console.log('Fetching preview URL...');
          const response = await axios.get(previewUrl, {
            responseType: 'arraybuffer'
          });
          console.log('Preview URL response:', response.data);
          return response.data;
        } catch (error) {
          console.warn('Failed to fetch preview URL, falling back to text-to-speech:', error);
        }
      }

      // Fall back to generating speech if preview URL fails or is not available
      console.log('Falling back to generating speech...');
      return this.generateSpeech('Hello! This is a preview of how I sound.', voiceId);
    } catch (error) {
      console.error('Error generating voice preview:', error);
      throw error;
    }
  },
};

export type { CartesiaVoice };
