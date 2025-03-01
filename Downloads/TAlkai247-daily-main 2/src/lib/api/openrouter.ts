import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

function sanitizeModel(model: any): Model {
  return {
    id: String(model.id || ''),
    name: String(model.name || ''),
    description: String(model.description || ''),
    context_length: Number.isInteger(model.context_length) ? model.context_length : 4096,
    pricing: {
      prompt: typeof model.pricing?.prompt === 'number' ? model.pricing.prompt : 0,
      completion: typeof model.pricing?.completion === 'number' ? model.pricing.completion : 0
    }
  };
}

function sanitizeResponse(response: any): any {
  if (Array.isArray(response)) {
    return response.map(item => sanitizeResponse(item));
  }
  
  if (response === null || response === undefined) {
    return response;
  }

  if (typeof response === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(response)) {
      sanitized[key] = sanitizeResponse(value);
    }
    return sanitized;
  }

  // Convert all other types to strings or numbers
  return typeof response === 'number' ? response : String(response);
}

export const openRouterApi = {
  async chat(options: CompletionOptions): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(
        `${API_URL}/openrouter/chat`,
        {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1000,
        }
      );

      return {
        success: true,
        data: sanitizeResponse(response.data)
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPENROUTER_API_ERROR',
          message: 'Failed to complete chat request',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  },

  async getModels(): Promise<ApiResponse<Model[]>> {
    try {
      const response = await axios.get(`${API_URL}/openrouter/models`);

      if (!Array.isArray(response.data?.data)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Invalid response format from OpenRouter API'
          }
        };
      }

      return {
        success: true,
        data: response.data.data.map(sanitizeModel)
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      return {
        success: false,
        error: {
          code: 'OPENROUTER_API_ERROR',
          message: 'Failed to fetch models',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
};