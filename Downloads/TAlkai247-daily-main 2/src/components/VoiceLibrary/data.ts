import type { Voice, Provider } from './types';

export const allTags = [
  "Friendly", "Professional", "Warm", "Energetic", "Soft", "Deep", 
  "Clear", "Authentic", "Storyteller", "Passionate", "Expressive", 
  "Polite", "Authoritative"
];

export const allLanguages = [
  "English", "Spanish (Spain)", "Spanish (Mexico)", "French (France)", 
  "French (Canada)", "German", "Italian", "Japanese", "Korean", 
  "Portuguese (Brazil)", "Portuguese (Portugal)", "Russian", 
  "Chinese (Mandarin)", "Chinese (Cantonese)"
];

export const allProviders: Provider[] = [
  { name: "elevenlabs", status: "Premium", description: "High-quality voice synthesis" },
  { name: "deepgram", status: "Included", description: "Fast and accurate voice models" },
  { name: "playht", status: "Premium", description: "Realistic voice cloning" },
  { name: "cartesia", status: "Included", description: "Natural-sounding voices" },
  { name: "custom", status: "Included", description: "Your custom voice clones" }
];

export const initialVoices: Voice[] = [
  { 
    id: "emma-1", 
    name: "Emma", 
    gender: "Female", 
    nationality: "British", 
    language: "English", 
    provider: "elevenlabs", 
    traits: ["Friendly", "Professional"] 
  },
  { 
    id: "james-1", 
    name: "James", 
    gender: "Male", 
    nationality: "American", 
    language: "English", 
    provider: "deepgram", 
    traits: ["Deep", "Authoritative"] 
  },
  { 
    id: "sophia-1", 
    name: "Sophia", 
    gender: "Female", 
    nationality: "Australian", 
    language: "English", 
    provider: "playht", 
    traits: ["Cheerful", "Energetic"] 
  }
];