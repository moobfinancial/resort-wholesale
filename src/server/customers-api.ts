import express from 'express';
import cors from 'cors';
import { prisma } from '../lib/prisma';

// Create a dedicated Express app for Customer API
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// GET /customers - List customers with pagination
app.get('/customers', async (req, res) => {
  try {
    console.log('GET /customers endpoint called');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Count total customers
    const totalCustomers = await prisma.customer.count();
    
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
    
    // Return in the standardized format
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
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /customers/:id - Get a specific customer
app.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        contactName: true,
        companyName: true,
        phone: true,
        businessType: true,
        status: true,
        createdAt: true,
        address: true
      }
    });
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    // Return in the standardized format
    res.json({
      status: 'success',
      data: {
        item: customer
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /health - Health check
app.get('/health', (_req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'success',
    data: {
      message: 'Customer API is healthy',
      timestamp: new Date().toISOString()
    }
  });
});

// Start the server
const PORT = 3340;
app.listen(PORT, () => {
  console.log(`Customer API server running at http://localhost:${PORT}`);
  console.log(`
Available endpoints:
  - GET /health
  - GET /customers
  - GET /customers/:id
  `);
});
