import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assistantRoutes from './routes/assistants.js';
import templateRoutes from './routes/templates.js';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory's .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to be more permissive during development
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin
    if (origin.match(/^http:\/\/localhost(:\d+)?$/)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Cartesia-Version']
};

app.use(cors(corsOptions));

app.use(express.json());

// Check if we have the Deepgram API key
const deepgramApiKey = process.env.VITE_DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
  console.error('VITE_DEEPGRAM_API_KEY environment variable is not set');
  process.exit(1);
}

// Check if we have the Cartesia API key
const cartesiaApiKey = process.env.VITE_CARTESIA_API_KEY;
if (!cartesiaApiKey) {
  console.warn('VITE_CARTESIA_API_KEY environment variable is not set');
}

// Check if we have the OpenRouter API key
const openrouterApiKey = process.env.VITE_OPENROUTER_API_KEY;
if (!openrouterApiKey) {
  console.warn('VITE_OPENROUTER_API_KEY environment variable is not set');
}

// Mount the assistant routes
app.use('/api/assistants', assistantRoutes);
app.use('/api/templates', templateRoutes);

// OpenRouter endpoints
app.get('/api/openrouter/models', async (req, res) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TAlkai247'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API returned ${response.status}`);
    }

    const data = await response.json();
    res.json({ data: data.data });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      error: {
        code: 'OPENROUTER_API_ERROR',
        message: error.message
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    deepgramApiKey: deepgramApiKey ? 'present' : 'missing'
  });
});

// Endpoint to generate speech
app.post('/api/deepgram/speech', async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    if (!text || !voice) {
      return res.status(400).json({ error: 'Missing required parameters: text and voice' });
    }

    console.log('Generating speech:', { text, voice });
    
    try {
      const response = await fetch('https://api.deepgram.com/v1/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          model_id: voice
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Deepgram API error response:', errorText);
        throw new Error(`Deepgram API error: ${response.status} ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('Got Deepgram response');

      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } catch (deepgramError) {
      console.error('Deepgram API error:', deepgramError);
      res.status(500).json({ 
        error: 'Deepgram API error',
        details: deepgramError.message,
        apiKey: deepgramApiKey ? 'present' : 'missing'
      });
    }
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get voices
app.get('/api/deepgram/voices', async (req, res) => {
  try {
    console.log('Fetching Deepgram voices...');
    console.log('Using Deepgram API Key:', deepgramApiKey ? `${deepgramApiKey.slice(0, 4)}...` : 'missing');
    
    const response = await fetch('https://api.deepgram.com/v1/models', {
      headers: {
        'Authorization': `Token ${deepgramApiKey}`
      }
    });
    
    console.log('Deepgram API Response Status:', response.status);
    console.log('Deepgram API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API Error Response:', errorText);
      throw new Error(`Failed to fetch voices: ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log('Deepgram API Response Data:', JSON.stringify(data, null, 2));
    
    const voices = data.tts?.map(voice => ({
      model_id: voice.canonical_name,
      name: voice.name,
      language: voice.language,
      gender: voice.metadata?.tags?.includes('masculine') ? 'male' : 'female',
      description: `${voice.metadata?.accent || ''} accent`,
      preview_url: voice.metadata?.sample || '',
      provider: 'Deepgram'
    })) || [];

    console.log(`Found ${voices.length} Deepgram voices`);
    res.json(voices);
  } catch (error) {
    console.error('Error fetching Deepgram voices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cartesia endpoints
app.get('/api/cartesia/voices', async (req, res) => {
  try {
    console.log('Received request for Cartesia voices');
    
    if (!cartesiaApiKey) {
      console.error('Cartesia API key is missing');
      throw new Error('Cartesia API key is not configured');
    }
    console.log('Cartesia API Key is configured:', cartesiaApiKey);

    console.log('Making request to Cartesia API...');
    const response = await fetch('https://api.cartesia.ai/voices', {
      method: 'GET',
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Accept': 'application/json',
        'Cartesia-Version': '2024-06-10',
        'User-Agent': 'TalkAI247/1.0'
      }
    });

    console.log('Cartesia API Response Status:', response.status);
    const responseText = await response.text();
    console.log('Cartesia API Raw Response:', responseText);

    if (!response.ok) {
      console.error('Cartesia API Error Response:', responseText);
      throw new Error(`Failed to fetch voices: ${response.status}. ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      console.log('Cartesia API Parsed Data:', JSON.stringify(data, null, 2));
      // The Cartesia API returns an array directly, not wrapped in a voices property
      res.json({ voices: Array.isArray(data) ? data : [] });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Failed to parse Cartesia API response');
    }
  } catch (error) {
    console.error('Error fetching Cartesia voices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      details: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/cartesia/voice/:voiceId', async (req, res) => {
  try {
    if (!cartesiaApiKey) {
      throw new Error('Cartesia API key is not configured');
    }

    const voiceId = req.params.voiceId;
    console.log('Fetching voice metadata for:', voiceId);

    // First get the voice details
    const voiceResponse = await fetch(`https://api.cartesia.ai/voices/${voiceId}`, {
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Accept': 'application/json',
        'Cartesia-Version': '2024-06-10'
      }
    });

    console.log('Voice Response Status:', voiceResponse.status);
    if (!voiceResponse.ok) {
      const errorText = await voiceResponse.text();
      console.error('Cartesia API Error Response:', errorText);
      throw new Error(`Failed to fetch voice details: ${voiceResponse.status}. ${errorText}`);
    }

    const voice = await voiceResponse.json();
    res.json({
      id: voice.id,
      name: voice.name,
      description: voice.description,
      language: voice.language
    });
  } catch (error) {
    console.error('Error fetching voice metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voice metadata',
      details: error.message,
      voiceId: req.params.voiceId
    });
  }
});

app.post('/api/cartesia/text-to-speech', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text || !voiceId) {
      return res.status(400).json({ error: 'Missing required parameters: text and voiceId' });
    }

    console.log('Generating Cartesia speech:', { text, voiceId });
    
    const response = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Content-Type': 'application/json',
        'Cartesia-Version': '2024-06-10'
      },
      body: JSON.stringify({
        modelId: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: voiceId
        },
        outputFormat: {
          container: 'mp3',
          sampleRate: 44100,
          encoding: 'mp3'
        }
      })
    });

    console.log('Cartesia TTS Response Status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cartesia API Error Response:', errorText);
      throw new Error(`Cartesia API error: ${response.status}. ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error generating Cartesia speech:', error);
    res.status(500).json({ 
      error: 'Failed to generate Cartesia speech',
      details: error.message,
      apiKey: cartesiaApiKey ? 'present' : 'missing'
    });
  }
});

// Get voice sample
app.get('/api/cartesia/voice-sample/:voiceId', async (req, res) => {
  try {
    if (!cartesiaApiKey) {
      throw new Error('Cartesia API key is not configured');
    }

    const voiceId = req.params.voiceId;
    console.log('Fetching voice sample for:', voiceId);

    // First get the voice details
    const voiceResponse = await fetch(`https://api.cartesia.ai/voices/${voiceId}`, {
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Accept': 'application/json',
        'Cartesia-Version': '2024-06-10'
      }
    });

    console.log('Voice Response Status:', voiceResponse.status);
    if (!voiceResponse.ok) {
      const errorText = await voiceResponse.text();
      console.error('Cartesia API Error Response:', errorText);
      throw new Error(`Failed to fetch voice details: ${voiceResponse.status}. ${errorText}`);
    }

    const voice = await voiceResponse.json();
    console.log('Voice:', voice);

    // Get the voice's audio
    const audioResponse = await fetch(`https://api.cartesia.ai/voices/${voiceId}/audio`, {
      headers: {
        'X-API-Key': cartesiaApiKey,
        'Accept': 'audio/mpeg',
        'Cartesia-Version': '2024-06-10'
      }
    });

    console.log('Audio Response Status:', audioResponse.status);
    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('Cartesia API Error Response:', errorText);
      throw new Error(`Failed to fetch voice audio: ${audioResponse.status}. ${errorText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error fetching voice sample:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voice sample',
      details: error.message,
      voiceId: req.params.voiceId
    });
  }
});

app.get('/api/playht/voices', async (req, res) => {
  try {
    // Log environment variables (safely)
    console.log('PlayHT API Configuration:', {
      apiKeyPresent: !!process.env.VITE_PLAYHT_API_KEY,
      apiKeyLength: process.env.VITE_PLAYHT_API_KEY?.length,
      userIdPresent: !!process.env.VITE_PLAYHT_USER_ID,
      userIdLength: process.env.VITE_PLAYHT_USER_ID?.length
    });

    const headers = {
      'accept': 'application/json',
      'AUTHORIZATION': process.env.VITE_PLAYHT_API_KEY,
      'X-USER-ID': process.env.VITE_PLAYHT_USER_ID
    };

    console.log('Request headers:', headers);

    const response = await fetch('https://api.play.ht/api/v2/voices', {
      method: 'GET',
      headers: headers
    });
    
    console.log('PlayHT API Response Status:', response.status);
    console.log('PlayHT API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PlayHT API Error Response:', errorText);
      throw new Error(`Failed to fetch voices: ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log('PlayHT API Response Data:', JSON.stringify(data, null, 2));

    // Send the voices array directly
    const voices = Array.isArray(data) ? data : [];
    console.log(`Found ${voices.length} voices`);
    res.json(voices);
  } catch (error) {
    console.error('Error fetching PlayHT voices:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/playht/speech', async (req, res) => {
  try {
    const { text, voice, quality, output_format } = req.body;
    
    // Create conversion request
    const response = await fetch('https://api.play.ht/api/v2/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_PLAYHT_API_KEY}`,
        'X-User-ID': process.env.VITE_PLAYHT_USER_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice,
        quality,
        output_format
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate speech: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Get the audio data
    const audioResponse = await fetch(data.audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Set appropriate headers
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', audioBuffer.byteLength);
    
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error generating speech with PlayHT:', error);
    res.status(500).json({ error: error.message });
  }
});

// PlayHT preview endpoint
app.get('/api/playht/preview', async (req, res) => {
  try {
    const previewUrl = req.query.url;
    if (!previewUrl) {
      throw new Error('Preview URL is required');
    }

    console.log('Fetching preview from URL:', previewUrl);

    const response = await fetch(previewUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch preview: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Set appropriate content type based on the URL
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error fetching voice preview:', error);
    res.status(500).json({ error: error.message });
  }
});

// OpenRouter proxy endpoints
app.get('/api/openrouter/models', async (req, res) => {
  try {
    console.log('Fetching OpenRouter models');
    
    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/models/all', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://talkai247.com',
        'X-Title': 'Talkai247'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/openrouter/chat', async (req, res) => {
  try {
    console.log('Proxying OpenRouter chat request');
    
    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://talkai247.com',
        'X-Title': 'Talkai247'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error response:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in OpenRouter chat request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server with proper error handling
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Environment variables loaded:', {
    deepgramApiKey: deepgramApiKey ? 'present' : 'missing'
  });
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please ensure no other server is running.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});
