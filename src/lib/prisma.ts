import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a new PrismaClient instance with better logging
const createPrismaClient = () => {
  return new PrismaClient({
    log: ["error", "warn"],
    errorFormat: "pretty",
  });
};

// Create Prisma client with better error handling
export const prisma = global.prisma || createPrismaClient();

// Initialize connection with retry mechanism
async function connectWithRetry(retries = 5, delay = 2000) {
  let currentTry = 0;

  while (currentTry < retries) {
    try {
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1 as result`;
      console.log("Successfully connected to the database");
      return true;
    } catch (error) {
      currentTry++;
      console.error(
        `Database connection attempt ${currentTry}/${retries} failed:`,
        error
      );

      if (currentTry >= retries) {
        console.error(
          "All database connection attempts failed. Please check your database configuration."
        );
        // Let the application continue but with warnings
        return false;
      }

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Wait for initial database connection when the module is loaded
export const prismaConnected = connectWithRetry().catch((err) => {
  console.error("Failed to establish database connection:", err);
  return false;
});

// Export a function to check if Prisma is connected
export const isPrismaConnected = async () => {
  try {
    await prisma.$queryRaw`SELECT 1 as result`;
    return true;
  } catch (error) {
    console.error("Prisma connection check failed:", error);
    return false;
  }
};

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
