import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  userSchema,
  assistantSchema,
  contactSchema,
  callSchema,
  campaignSchema,
  whisperTemplateSchema,
} from './schemas';

type ValidationSchema = z.ZodType<any, any>;

export function validateRequest(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validData = await schema.parseAsync(req.body);
      req.body = validData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        });
      } else {
        next(error);
      }
    }
  };
}

export const validateUser = validateRequest(userSchema);
export const validateAssistant = validateRequest(assistantSchema);
export const validateContact = validateRequest(contactSchema);
export const validateCall = validateRequest(callSchema);
export const validateCampaign = validateRequest(campaignSchema);
export const validateWhisperTemplate = validateRequest(whisperTemplateSchema);

export function validateQuery(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validData = await schema.parseAsync(req.query);
      req.query = validData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
      } else {
        next(error);
      }
    }
  };
}

// Common query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});