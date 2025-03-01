export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples: null | any[];
  category: string;
  fine_tuning: {
    is_allowed_to_fine_tune: boolean;
    state: Record<string, string>;
    language: string;
  };
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
    [key: string]: string | undefined;
  };
  preview_url: string;
  available_for_tiers: string[];
  high_quality_base_model_ids: string[];
}

export interface ElevenLabsResponse {
  voices: ElevenLabsVoice[];
}
