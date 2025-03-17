import express from 'express';
import cors from 'cors';
import { prisma } from '../lib/prisma';

// Create minimal Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true
}));

// Add basic middleware
app.use(express.json());

// Basic health check endpoint
app.get('/health', (_req, res) => {
  console.log('Health check requested');
  try {
    res.json({
      status: 'success',
      data: {
        message: 'API is healthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// Add customer list endpoint
app.get('/customers', async (req, res) => {
  try {
    console.log('Customers endpoint called');
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
      }
    });
    
    console.log(`Retrieved ${customers.length} customers`);
    
    // Return in the standard format
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

// Start the server
const PORT = 3335;
app.listen(PORT, () => {
  console.log(`Minimal server running at http://localhost:${PORT}`);
});
