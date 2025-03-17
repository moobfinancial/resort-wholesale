import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// GET /customers - List customers with pagination (no auth required)
router.get('/', async (req, res) => {
  try {
    console.log('GET /customers endpoint called (simplified)');
    
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

// GET /customers/:id - Get a specific customer (no auth required)
router.get('/:id', async (req, res) => {
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

// Testing route - completely accessible
router.get('/test', async (_req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        message: 'Customer test route works without auth'
      }
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test route failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
