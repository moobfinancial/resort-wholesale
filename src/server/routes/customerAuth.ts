import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { businessDetailsSchema } from './customers';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Use the same JWT_SECRET as other auth modules
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

// In-memory store for users (replace with database in production)
const users = new Map<string, {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}>();

// Add a test user
users.set('customer@example.com', {
  id: '1',
  email: 'customer@example.com',
  firstName: 'Test',
  lastName: 'Customer',
  password: 'customer123',
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = registerSchema.parse(req.body);

    if (users.has(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    const newUser = {
      id: (users.size + 1).toString(),
      email,
      firstName,
      lastName,
      password, // In production, hash the password
    };

    users.set(email, newUser);

    const token = jwt.sign(
      { 
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = users.get(email);

    if (!user || user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role?: string };
    
    // Additional validation that this is a customer token
    if (decoded.role && decoded.role !== 'customer') {
      return res.status(403).json({ message: 'Not authorized as customer' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email } = updateProfileSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;

    // Find the user's current email
    let currentUserEmail: string | undefined;
    try {
      const user = await prisma.Customer.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      currentUserEmail = user?.email;
    } catch (error) {
      console.error('Error finding user:', error);
      return res.status(404).json({ 
        status: 'error',
        error: 'User not found' 
      });
    }

    // Update the user profile
    try {
      const updatedUser = await prisma.Customer.update({
        where: { id: userId },
        data: {
          contactName: name,
          email: email || currentUserEmail,
          updatedAt: new Date(),
        },
      });

      return res.json({
        status: 'success',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.contactName,
            email: updatedUser.email,
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          status: 'error',
          error: 'Email already in use' 
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(400).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to update profile',
    });
  }
});

// Update business details
router.put('/business-details', verifyToken, async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    const data = businessDetailsSchema.parse(req.body);

    const customer = await prisma.Customer.update({
      where: { id: customerId },
      data: {
        companyName: data.companyName,
        phone: data.phone,
        businessType: data.businessType,
        taxId: data.taxId,
        address: data.address,
      },
    });

    res.json({ 
      status: 'success',
      data: { customer } 
    });
  } catch (error) {
    console.error('Business details update error:', error);
    res.status(400).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to update business details',
    });
  }
});

// Change password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const customerId = (req.user as { id: string }).id;

    // Retrieve the customer with password
    const customer = await prisma.Customer.findUnique({
      where: { id: customerId },
      select: { password: true }
    });

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        error: 'Customer not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: 'error',
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.Customer.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return res.json({
      status: 'success',
      data: {
        message: 'Password updated successfully'
      }
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(400).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to change password'
    });
  }
});

export default router;
