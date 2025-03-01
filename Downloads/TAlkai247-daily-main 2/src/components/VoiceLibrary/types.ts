export interface Voice {
  id: string;
  name: string;
  gender: string;
  nationality?: string; // Updated to be optional
  language: string;
  provider: VoiceProvider | string; // Allow string for flexibility
  traits: string[];
  preview_url?: string;
  eleven_labs_id?: string;
  deepgram_id?: string;
  playht_id?: string;
  cartesia_id?: string;
  category?: string;
  available_for_tiers?: string[];
  voice_engine?: string;
  description?: string;
  audioUrl?: string;
};

export interface Provider {
  name: string;
  status: "Included" | "Premium";
  description: string;
}

export type VoiceProvider = "elevenlabs" | "deepgram" | "playht" | "cartesia" | "custom";

// API Response Interfaces
export interface ElevenLabsAPIVoice {
  voice_id: string;
  name: string;
  samples: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  category: string;
  fine_tuning: {
    model_id: string | null;
    is_allowed_to_fine_tune: boolean;
    fine_tuning_requested: boolean;
    finetuning_state: string;
    verification_attempts: number | null;
    verification_failures: number | null;
    verification_attempts_count: number | null;
    slice_ids: string[] | null;
  };
  labels: Record<string, string>;
  description: string | null;
  preview_url: string;
  available_for_tiers: string[];
  settings: null;
  sharing: null;
  high_quality_base_model_ids: string[] | null;
}

export interface DeepgramVoice {
  id: string;
  name: string;
  gender?: string;
  language?: string;
  preview_url?: string;
  model_id?: string;
  description?: string;
}

export interface PlayHTVoice {
  id: string;
  name: string;
  gender: string;
  nationality?: string; // Updated to be optional
  language: string;
  traits: string[]; 
  preview_url?: string;
  playht_id?: string;
  description?: string;
}

export interface CartesiaVoice {
  id: string;
  name: string;
  gender?: string;
  language?: string;
  category?: string;
  description?: string;
}