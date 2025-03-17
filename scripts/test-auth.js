// Script to test authentication directly using Prisma
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma client instance
const prisma = new PrismaClient();

// Get JWT_SECRET from environment variable or use default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Function to create a test admin if none exists or reset password if it does
async function createOrUpdateAdmin() {
  try {
    // Generate a password hash
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('Generated password hash for "password123":', passwordHash);
    
    // Look for existing admin
    const existingAdmin = await prisma.admin.findFirst();
    
    if (existingAdmin) {
      console.log('Found existing admin, updating password:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name
      });
      
      // Update existing admin's password
      const updatedAdmin = await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { passwordHash }
      });
      
      console.log('Updated admin password:', {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name
      });
    } else {
      console.log('No admin users found, creating test admin...');
      
      // Create a new admin user
      const admin = await prisma.admin.create({
        data: {
          email: 'admin@resortfresh.com',
          passwordHash,
          name: 'Test Admin'
        }
      });
      
      console.log('Created test admin:', {
        id: admin.id,
        email: admin.email,
        name: admin.name
      });
    }
  } catch (error) {
    console.error('Error managing admin users:', error);
  }
}

// Function to test login with credentials
async function testLogin(email, password) {
  try {
    console.log(`Testing login for ${email}...`);
    
    // Get admin from database
    const admin = await prisma.admin.findUnique({
      where: { email }
    });
    
    if (!admin) {
      console.error('Admin not found');
      return null;
    }
    
    console.log('Found admin:', {
      id: admin.id,
      email: admin.email,
      name: admin.name
    });
    
    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    
    if (!passwordMatch) {
      console.error('Password does not match');
      return null;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id,
        email: admin.email,
        role: 'ADMIN',
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log('Login successful, generated token:', token);
    
    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Main function
async function main() {
  try {
    // Create or update admin with known password
    await createOrUpdateAdmin();
    
    // Test login with correct credentials
    const loginResult = await testLogin('admin@resortfresh.com', 'password123');
    
    if (loginResult) {
      console.log('Login test successful!');
    } else {
      console.error('Login test failed');
    }
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Close Prisma client connection
    await prisma.$disconnect();
  }
}

// Run main function
main();
