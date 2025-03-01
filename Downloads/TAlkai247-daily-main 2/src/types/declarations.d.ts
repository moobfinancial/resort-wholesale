declare module '@/lib/prisma' {
  import { PrismaClient } from '@prisma/client';
  export const prisma: PrismaClient;
}

declare module '@/lib/validation' {
  import { Call, Campaign, Contact, User } from '@/types/schema';
  
  export function validateCall(call: Partial<Call>): boolean;
  export function validateCampaign(campaign: Partial<Campaign>): boolean;
  export function validateContact(contact: Partial<Contact>): boolean;
  export function validateUser(user: Partial<User>): boolean;
}

// Extend Express Request to include user property
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      [key: string]: any;
    };
  }
}
