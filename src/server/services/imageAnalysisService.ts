import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { promises as fs } from 'fs';

// Configure the Vertex AI client
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const modelName = 'gemini-1.5-flash-001';

// Initialize Vertex AI
const vertexAI = new PredictionServiceClient({ project, location });

// Load the model
// @ts-ignore - Ignore type checking for this line
const model = vertexAI.getGenerativeModel({
  model: modelName,
  generation_config: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 1,
    topK: 32,
  },
  safety_settings: [{
    category: 'HARM_CATEGORY_DEROGATORY',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_TOXICITY',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_VIOLENCE',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_SEXUAL',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_MEDICAL',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }, {
    category: 'HARM_CATEGORY_DANGEROUS',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }],
});

export interface AnalysisResult {
  category: string;
  description: string;
  suggestedTags: string[];
}

export const analyzeImage = async (imagePath: string): Promise<AnalysisResult> => {
  try {
    // Read and encode the image
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    const prompt = `You are a product analysis assistant. Please analyze this product image and provide:
1. A suggested category (single word or short phrase)
2. A brief but detailed product description (2-3 sentences)
3. Relevant tags for search and categorization (5-8 tags)

Format your response as a valid JSON object with these fields:
{
  "category": "string",
  "description": "string",
  "suggestedTags": ["string"]
}`;

    // Create the content array with the image and the text prompt
    const content = {
      parts: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        },
        { text: prompt }
      ]
    };

    // Send content to Gemini
    const streamingResp = await model.generateContentStream(content);
    let fullText = '';

    // Process the response stream
    for await (const chunk of streamingResp.stream) {
      if (chunk.candidates && chunk.candidates[0].content.parts) {
        const chunkText = chunk.candidates[0].content.parts[0].text || '';
        fullText += chunkText;
      }
    }

    // Parse the response
    try {
      return JSON.parse(fullText);
    } catch {
      // If JSON parsing fails, try to extract information using regex
      const category = fullText.match(/category["\s:]+([^"\n,}]+)/i)?.[1]?.trim() || '';
      const description = fullText.match(/description["\s:]+([^"\n,}]+)/i)?.[1]?.trim() || '';
      const tags = fullText.match(/suggestedTags["\s:]+\[(.*?)\]/i)?.[1]?.split(',').map(t => t.trim()) || [];
      
      return {
        category,
        description,
        suggestedTags: tags
      };
    }
  } catch (error) {
    console.error('Failed to analyze image:', error);
    throw error;
  }
};
