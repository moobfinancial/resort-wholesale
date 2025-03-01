// Database Schema Types

// User
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'admin' | 'user';
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    defaultTransparencyLevel: 'none' | 'partial' | 'full';
    defaultAssistant?: string;
    recordingEnabled: boolean;
    webSearchEnabled: boolean;
    preferredVoice: 'male' | 'female';
  };
}

// Assistant
export interface Assistant {
  id: string;
  userId: string;
  name: string;
  modes: ('web' | 'voice')[];
  firstMessage: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: AssistantTool[];
  voice: {
    provider: string;
    voiceId: string;
    settings: {
      speed: number;
      pitch: number;
      stability: number;
      volume: number;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantTool {
  id: string;
  type: 'calendar' | 'scraping' | 'sms' | 'email';
  config: Record<string, any>;
  isEnabled: boolean;
  name: string;
}

// Contact
export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  type: 'business' | 'personal';
  transparencyLevel: 'none' | 'partial' | 'full';
  subcategory?: string;
  customSubcategory?: string;
  campaignId?: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
}

// Call/Conversation
export interface Call {
  id: string;
  userId: string;
  contactId: string;
  assistantId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
  recording?: {
    url: string;
    duration: number;
  };
  transcript: CallTranscript[];
  goals: CallGoal[];
  metrics: {
    averageSentiment: number;
    sentimentTimeline: SentimentPoint[];
    whisperEffectiveness: number;
    goalCompletion: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallTranscript {
  id: string;
  timestamp: Date;
  speaker: 'ai' | 'user';
  message: string;
  sentiment?: number;
}

export interface CallGoal {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
  aiPrompt: string;
  resources: {
    urls: string[];
    files: string[];
  };
}

export interface SentimentPoint {
  timestamp: Date;
  value: number;
  trigger?: string;
}

// Whisper Template
export interface WhisperTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'business' | 'personal';
  systemPrompt: string;
  editablePrompt: string;
  isSystem: boolean;
  isHidden: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Campaign
export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  contacts: string[]; // Contact IDs
  goals: CampaignGoal[];
  metrics: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    averageSentiment: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignGoal {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
}

// Resource
export interface Resource {
  id: string;
  userId: string;
  title: string;
  type: 'documentation' | 'guide' | 'tutorial' | 'whitepaper' | 'video';
  url: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Common Types
export type TransparencyLevel = 'Full Disclosure' | 'Partial Disclosure' | 'No Disclosure';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query Parameters
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Assistant Where Input
export type AssistantWhereInput = {
  userId?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'default' | 'insensitive' };
    systemPrompt?: { contains: string; mode: 'default' | 'insensitive' };
  }>; 
};
