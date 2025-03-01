import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionOptions {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export const openRouter = {
  async chat(options: CompletionOptions) {
    try {
      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://talkai247.com',
            'X-Title': 'Talkai247'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  },

  async getModels() {
    try {
      const response = await axios.get(`${OPENROUTER_BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      throw error;
    }
  }
};