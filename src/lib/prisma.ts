import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with better error handling
export const prisma = global.prisma || 
  new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });

// Initialize connection with retry mechanism
async function connectWithRetry(retries = 5, delay = 2000) {
  let currentTry = 0;
  
  while (currentTry < retries) {
    try {
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1 as result`;
      console.log('Successfully connected to the database');
      return true;
    } catch (error) {
      currentTry++;
      console.error(`Database connection attempt ${currentTry}/${retries} failed:`, error);
      
      if (currentTry >= retries) {
        console.error('All database connection attempts failed. Please check your database configuration.');
        // Let the application continue but with warnings
        return false;
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Call the connection function but don't wait for it
connectWithRetry().catch(err => {
  console.error('Failed to establish database connection:', err);
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
