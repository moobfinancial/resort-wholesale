import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

export const googleCloudConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
  // Using the latest Gemini model
  geminiModel: 'gemini-1.5-flash'
};
