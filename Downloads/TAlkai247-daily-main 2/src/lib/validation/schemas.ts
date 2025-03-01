import { z } from 'zod';

// Base schemas
const timestampFields = {
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
};

// User schema
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  company: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  phoneNumber: z.string().optional(),
  settings: z.object({
    defaultTransparencyLevel: z.enum(['FULL', 'PARTIAL', 'NONE']),
    defaultAssistant: z.string().optional(),
    recordingEnabled: z.boolean(),
    webSearchEnabled: z.boolean(),
    preferredVoice: z.enum(['male', 'female']),
  }),
  ...timestampFields,
});

// Assistant schema
export const assistantSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  modes: z.array(z.enum(['web', 'voice'])),
  firstMessage: z.string(),
  systemPrompt: z.string(),
  provider: z.string(),
  model: z.string(),
  tools: z.array(z.object({
    id: z.string(),
    type: z.enum(['calendar', 'scraping', 'sms', 'email']),
    config: z.record(z.any()),
    isEnabled: z.boolean(),
  })),
  voice: z.object({
    provider: z.string(),
    voiceId: z.string(),
    settings: z.object({
      speed: z.number().min(0.5).max(2),
      pitch: z.number().min(0.5).max(2),
      stability: z.number().min(0).max(1),
    }),
  }),
  isActive: z.boolean().default(true),
  ...timestampFields,
});

// Contact schema
export const contactSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  type: z.enum(['PERSONAL', 'BUSINESS']),
  transparencyLevel: z.enum(['FULL', 'PARTIAL', 'NONE']),
  subcategory: z.string().optional(),
  customSubcategory: z.string().optional(),
  campaignId: z.string().optional(),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  lastContactedAt: z.date().optional(),
  ...timestampFields,
});

// Call schema
export const callSchema = z.object({
  userId: z.string(),
  contactId: z.string(),
  assistantId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  recording: z.object({
    url: z.string(),
    duration: z.number(),
  }).optional(),
  transcript: z.array(z.object({
    id: z.string(),
    timestamp: z.date(),
    speaker: z.enum(['ai', 'user']),
    message: z.string(),
    sentiment: z.number().optional(),
  })),
  goals: z.array(z.object({
    id: z.string(),
    title: z.string(),
    progress: z.number(),
    completed: z.boolean(),
    aiPrompt: z.string(),
    resources: z.object({
      urls: z.array(z.string()),
      files: z.array(z.string()),
    }),
  })),
  metrics: z.object({
    averageSentiment: z.number(),
    sentimentTimeline: z.array(z.object({
      timestamp: z.date(),
      value: z.number(),
      trigger: z.string().optional(),
    })),
    whisperEffectiveness: z.number(),
    goalCompletion: z.number(),
  }),
  notes: z.string().optional(),
  ...timestampFields,
});

// Campaign schema
export const campaignSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  contacts: z.array(z.string()),
  goals: z.array(z.object({
    id: z.string(),
    title: z.string(),
    target: z.number(),
    progress: z.number(),
    completed: z.boolean(),
  })),
  metrics: z.object({
    totalCalls: z.number(),
    successfulCalls: z.number(),
    failedCalls: z.number(),
    averageDuration: z.number(),
    averageSentiment: z.number(),
  }),
  ...timestampFields,
});

// Whisper template schema
export const whisperTemplateSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  type: z.enum(['BUSINESS', 'PERSONAL']),
  systemPrompt: z.string(),
  editablePrompt: z.string(),
  isSystem: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  tags: z.array(z.string()),
  ...timestampFields,
});