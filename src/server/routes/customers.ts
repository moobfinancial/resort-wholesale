import express from 'express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const businessDetailsSchema = z.object({
  companyName: z.string().min(1),
  phone: z.string().min(1),
  businessType: z.string().min(1),
  taxId: z.string().min(1),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Routes
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if email already exists
    const existingCustomer = await prisma.Customer.findUnique({
      where: { email: data.email },
    });

    if (existingCustomer) {
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create customer with basic info
    const customer = await prisma.Customer.create({
      data: {
        id: uuidv4(),
        contactName: data.name,
        email: data.email,
        password: hashedPassword,
        companyName: '',
        phone: '',
        businessType: '',
        taxId: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: customer.id,
        name: customer.contactName,
        email: customer.email,
        status: customer.status,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const customer = await prisma.Customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify password hash
    const validPassword = await bcrypt.compare(password, customer.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: customer.id,
        name: customer.contactName,
        email: customer.email,
        status: customer.status,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

// Update business details
router.put('/business-details', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.id;
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

    res.json({ customer });
  } catch (error) {
    console.error('Business details update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update business details',
    });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    
    const customer = await prisma.Customer.findUnique({
      where: { id: customerId },
      include: {
        documents: true,
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
      });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    
    const orders = await prisma.Order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    });
  }
});

router.get('/documents', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    
    const documents = await prisma.CustomerDocument.findMany({
      where: { customerId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ documents });
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch documents',
    });
  }
});

router.put('/password', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    const { oldPassword, newPassword } = req.body;

    const customer = await prisma.Customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Verify old password hash
    const validPassword = await bcrypt.compare(oldPassword, customer.password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid old password',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update customer password
    await prisma.Customer.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update password',
    });
  }
});

export default router;
