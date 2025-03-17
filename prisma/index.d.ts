import { PrismaClient } from '@prisma/client'

// This file extends the Prisma Client types
declare global {
  namespace PrismaJson {
    type ProductAttributes = {
      color?: string;
      size?: string;
      material?: string;
      [key: string]: any;
    }
  }
}

declare module '@prisma/client' {
  interface PrismaClient {
    productImage: {
      findMany: (args: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any | null>;
      create: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      updateMany: (args: any) => Promise<any>;
      delete: (args: any) => Promise<any>;
      deleteMany: (args: any) => Promise<any>;
      count: (args: any) => Promise<number>;
    }
  }
}
