import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

// Define admin user interface
interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

// Standard API response
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: any;
}

class AuthService {
  private readonly JWT_SECRET: jwt.Secret;
  
  constructor() {
    // Get JWT secret from environment variable or use default for development
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    // Warning for default JWT secret in production
    if (process.env.NODE_ENV === 'production' && this.JWT_SECRET === 'your-secret-key') {
      console.warn('⚠️ WARNING: Using default JWT secret in production environment!');
    }
  }

  // Verify a JWT token and return the decoded payload
  async verifyToken(token: string): Promise<{ id: string; email: string; role?: string } | null> {
    try {
      // @ts-ignore - Ignore type checking for this line
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded as { id: string; email: string; role?: string };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Validate if an admin exists with the given ID
  async validateAdmin(userId: string): Promise<boolean> {
    try {
      // Validate that Prisma client is available
      if (!prisma) {
        console.error('Prisma client is not initialized');
        return process.env.NODE_ENV !== 'production'; // Allow in dev for testing
      }
      
      // Check if the Admin model exists in the database schema
      try {
        const admin = await prisma.admin.findUnique({ 
          where: { id: userId },
          select: { id: true }
        });
        return !!admin;
      } catch (error) {
        // If this is a schema-related error (model doesn't exist), log it
        console.error('Admin model access error:', error);
        return process.env.NODE_ENV !== 'production'; // Allow in dev for testing
      }
    } catch (error) {
      console.error('Admin validation error:', error);
      return process.env.NODE_ENV !== 'production'; // Allow in dev for testing
    }
  }

  // Generate a JWT token for an admin user
  generateToken(user: AdminUser, expiresIn: string = '24h'): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || 'ADMIN',
      name: user.name
    };
    
    // @ts-ignore - Ignore type checking for this line
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn });
  }
  
  // Authenticate an admin user with email and password
  async loginAdmin(email: string, password: string): Promise<ApiResponse<{admin: AdminUser; token: string}>> {
    try {
      // Validate that Prisma client is available
      if (!prisma) {
        console.error('Database connection is not available');
        return {
          status: 'error',
          message: 'Database connection error',
          details: 'Prisma client is not initialized'
          // Omit data property instead of setting it to null
        };
      }
      
      // Try to find the admin by email
      try {
        const admin = await prisma.admin.findUnique({ where: { email } });
        
        if (!admin) {
          return {
            status: 'error',
            message: 'Invalid credentials'
            // Omit data property instead of setting it to null
          };
        }
        
        // Check if the password hash field exists
        const passwordHash = admin.passwordHash || (admin as any).password;
        
        if (!passwordHash) {
          return {
            status: 'error',
            message: 'Account is misconfigured',
            details: 'Password hash is missing'
            // Omit data property instead of setting it to null
          };
        }
        
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, passwordHash);
        
        if (!isPasswordValid) {
          return {
            status: 'error',
            message: 'Invalid credentials'
            // Omit data property instead of setting it to null
          };
        }
        
        // Generate token
        const token = this.generateToken({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: (admin as any).role || 'ADMIN'
        });
        
        // Return success response with admin and token
        return {
          status: 'success',
          data: {
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name || 'Admin User',
              role: (admin as any).role || 'ADMIN'
            },
            token
          }
        };
      } catch (dbError: unknown) {
        console.error('Database operation error:', dbError);
        // Check if this is a schema-related error
        if (
          typeof dbError === 'object' && 
          dbError !== null && 
          'message' in dbError && 
          typeof dbError.message === 'string' && 
          dbError.message.includes('does not exist in the current database')
        ) {
          return {
            status: 'error',
            message: 'Database schema error',
            details: 'The Admin model may not exist in the database schema'
            // Omit data property instead of setting it to null
          };
        }
        
        return {
          status: 'error',
          message: 'Database error',
          details: process.env.NODE_ENV !== 'production' && typeof dbError === 'object' && dbError !== null && 'message' in dbError ? 
            dbError.message : 'Unknown database error'
          // Omit data property instead of setting it to null
        };
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      return {
        status: 'error',
        message: 'Authentication failed',
        details: process.env.NODE_ENV !== 'production' && typeof error === 'object' && error !== null && 'message' in error ? 
          (error.message || 'Unknown error') : 'Unknown error'
        // Omit data property instead of setting it to null
      };
    }
  }
  
  // Create a development login token without database check
  createDevLoginToken(): ApiResponse<{admin: AdminUser; token: string}> {
    // Only allow in non-production environments
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'error',
        message: 'Development login not available in production'
        // Omit data property instead of setting it to null
      };
    }
    
    const adminUser: AdminUser = {
      id: '1',
      email: 'admin@resortfresh.com',
      name: 'Development Admin',
      role: 'ADMIN'
    };
    
    const token = this.generateToken(adminUser, '7d');
    
    return {
      status: 'success',
      data: {
        admin: adminUser,
        token
      }
    };
  }
}

// Export a singleton instance
export const authService = new AuthService();
