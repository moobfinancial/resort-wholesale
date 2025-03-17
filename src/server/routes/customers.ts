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
    
    // Check if email already exists using raw query to avoid schema validation
    const existingCustomers = await prisma.$queryRaw`
      SELECT id, email FROM "Customer" WHERE email = ${data.email}
    `;

    if (existingCustomers && Array.isArray(existingCustomers) && existingCustomers.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create customer with basic info using raw query to avoid schema validation
    const customerId = uuidv4();
    const now = new Date();
    
    await prisma.$executeRaw`
      INSERT INTO "Customer" (
        id, 
        email, 
        password, 
        "contactName", 
        "companyName", 
        phone, 
        "businessType", 
        "taxId", 
        address, 
        status, 
        "createdAt", 
        "updatedAt"
      ) VALUES (
        ${customerId},
        ${data.email},
        ${hashedPassword},
        ${data.name},
        '',
        '',
        '',
        '',
        '{"street":"","city":"","state":"","zipCode":"","country":""}',
        'PENDING',
        ${now},
        ${now}
      )
    `;
    
    // Get the created customer
    const customers = await prisma.$queryRaw`
      SELECT id, email, "contactName", status FROM "Customer" 
      WHERE id = ${customerId}
    `;
    
    const customer = Array.isArray(customers) ? customers[0] : null;
    
    if (!customer) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create customer',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      status: 'success',
      data: {
        token,
        customer: {
          id: customer.id,
          contactName: customer.contactName,
          email: customer.email,
          status: customer.status,
          phone: '',
          businessType: '',
        },
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

    // Use a raw query to bypass Prisma schema validation
    const customers = await prisma.$queryRaw`
      SELECT id, email, password, "contactName", "companyName", status, 
             "businessType", "taxId", phone, address, "createdAt", "updatedAt"
      FROM "Customer"
      WHERE email = ${email}
    `;
    
    const customer = Array.isArray(customers) ? customers[0] : null;
    
    if (!customer) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Verify password hash
    const validPassword = await bcrypt.compare(password, customer.password);
    if (!validPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        role: 'customer',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return token and customer data
    res.json({
      status: 'success',
      data: {
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          contactName: customer.contactName,
          companyName: customer.companyName,
          businessType: customer.businessType,
          taxId: customer.taxId,
          phone: customer.phone,
          address: customer.address,
          status: customer.status,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input data',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
    });
  }
});

// Update business details
router.put('/business-details', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.id;
    const data = businessDetailsSchema.parse(req.body);

    const customer = await prisma.customer.update({
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
      data: {
        item: customer,
      },
    });
  } catch (error) {
    console.error('Business details update error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update business details',
    });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        CustomerDocuments: true,
        orders: {
          include: {
            OrderItems: {
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
        status: 'error',
        message: 'Customer not found',
      });
    }

    res.json({
      status: 'success',
      data: {
        item: customer,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch profile',
    });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        OrderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      status: 'success',
      data: {
        items: orders,
        total: orders.length,
        page: 1,
        limit: orders.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch orders',
    });
  }
});

router.get('/documents', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    
    const documents = await prisma.customerDocument.findMany({
      where: { customerId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      status: 'success',
      data: {
        items: documents,
        total: documents.length,
        page: 1,
        limit: documents.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch documents',
    });
  }
});

router.put('/password', async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;
    const { oldPassword, newPassword } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Verify old password hash
    const validPassword = await bcrypt.compare(oldPassword, customer.password);
    if (!validPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid old password',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update customer password
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update password',
    });
  }
});

// Get all customers with pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('GET /customers route called with query:', req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    console.log('Pagination params:', { page, limit, skip });

    // Count total customers
    try {
      const totalCustomers = await prisma.customer.count();
      console.log('Total customers:', totalCustomers);
    
      // Get customers with pagination
      const customers = await prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          contactName: true,
          companyName: true,
          phone: true,
          businessType: true,
          status: true,
          createdAt: true
        }
      });
      
      console.log(`Retrieved ${customers.length} customers`);

      // Format response according to the standardized format
      res.json({
        status: 'success',
        data: {
          items: customers,
          total: totalCustomers,
          page,
          limit,
          totalPages: Math.ceil(totalCustomers / limit)
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch customers'
    });
  }
});

// Get all customers with pagination (no authentication for testing)
router.get('/test', async (req, res) => {
  try {
    console.log('GET /customers/test route called with query:', req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    console.log('Pagination params:', { page, limit, skip });

    // Count total customers
    try {
      const totalCustomers = await prisma.customer.count();
      console.log('Total customers:', totalCustomers);
    
      // Get customers with pagination
      const customers = await prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          contactName: true,
          companyName: true,
          phone: true,
          businessType: true,
          status: true,
          createdAt: true
        }
      });
      
      console.log(`Retrieved ${customers.length} customers`);

      // Format response according to the standardized format
      res.json({
        status: 'success',
        data: {
          items: customers,
          total: totalCustomers,
          page,
          limit,
          totalPages: Math.ceil(totalCustomers / limit)
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch customers'
    });
  }
});

// Simple diagnostic test endpoint
router.get('/ping', async (req, res) => {
  try {
    console.log('GET /customers/ping route called');
    
    // Return a simple response without any database queries
    res.json({
      status: 'success',
      data: {
        message: 'Customer API is responding correctly',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in ping endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in ping endpoint'
    });
  }
});

// Diagnostic route - no authentication
router.get('/diagnostic', async (req, res) => {
  try {
    console.log('Diagnostic route called');
    
    // Return a hardcoded response without any database queries
    // This tests if basic routing and response functionality works
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      requestInfo: {
        path: req.path,
        method: req.method,
        query: req.query,
        headers: {
          host: req.headers.host,
          userAgent: req.headers['user-agent']
        }
      }
    };
    
    console.log('Diagnostic data:', diagnosticData);
    
    // Use the standardized response format
    return res.json({
      status: 'success',
      data: diagnosticData
    });
  } catch (error) {
    console.error('Diagnostic route error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
