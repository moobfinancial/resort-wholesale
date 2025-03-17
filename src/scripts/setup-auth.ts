import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Initialize Prisma client with database connection
const prisma = new PrismaClient();

/**
 * Setup admin user and basic database configuration for authentication
 */
async function setupAuth() {
  // Verify database connection
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Check if Admin model exists in the schema
    try {
      // This will throw an error if the model doesn't exist
      await prisma.admin.count();
      console.log('✅ Admin model exists in schema');
    } catch (error) {
      console.error('❌ Admin model not found in schema. Please ensure your Prisma schema is up to date:');
      console.log('Run: npx prisma db push');
      return;
    }

    // Create default admin user if none exists
    const adminCount = await prisma.admin.count();
    
    if (adminCount === 0) {
      console.log('Creating default admin user...');
      
      // Default admin credentials - CHANGE IN PRODUCTION
      const email = 'admin@resortfresh.com';
      const password = 'admin123'; // Should be changed immediately after first login
      const name = 'Admin User';
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create admin user
      await prisma.admin.create({
        data: {
          id: uuidv4(),
          email,
          name,
          passwordHash,
          role: 'ADMIN', // Add role field if your schema has it
        },
      });
      
      console.log('✅ Default admin user created successfully!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('⚠️ IMPORTANT: Change this password after your first login!');
    } else {
      console.log(`✅ ${adminCount} admin users already exist in the database`);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    // Provide helpful debugging information based on common errors
    if ((error as Error).message?.includes('ECONNREFUSED')) {
      console.log('\n🔍 Troubleshooting Steps:');
      console.log('1. Ensure PostgreSQL is running: brew services start postgresql');
      console.log('2. Check if database exists: createdb resort_fresh');
      console.log('3. Verify your DATABASE_URL in .env file has correct credentials');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAuth().catch(e => {
  console.error('Setup failed:', e);
  process.exit(1);
});
