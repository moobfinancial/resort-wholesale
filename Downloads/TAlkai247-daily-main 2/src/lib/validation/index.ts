import { z } from 'zod';
import {
  userSchema,
  assistantSchema,
  contactSchema,
  callSchema,
  campaignSchema,
  whisperTemplateSchema,
} from './schemas';

type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
};

export function validateUser(data: unknown): ValidationResult<z.infer<typeof userSchema>> {
  try {
    const validData = userSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateAssistant(data: unknown): ValidationResult<z.infer<typeof assistantSchema>> {
  try {
    const validData = assistantSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateContact(data: unknown): ValidationResult<z.infer<typeof contactSchema>> {
  try {
    const validData = contactSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateCall(data: unknown): ValidationResult<z.infer<typeof callSchema>> {
  try {
    const validData = callSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateCampaign(data: unknown): ValidationResult<z.infer<typeof campaignSchema>> {
  try {
    const validData = campaignSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateWhisperTemplate(data: unknown): ValidationResult<z.infer<typeof whisperTemplateSchema>> {
  try {
    const validData = whisperTemplateSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validatePartial<T extends z.ZodTypeAny & { partial: () => z.ZodTypeAny }>(schema: T, data: unknown): ValidationResult<Partial<z.infer<T>>> {
  try {
    const partialSchema = schema.partial();
    const validData = partialSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}