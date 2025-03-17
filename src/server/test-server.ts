import express from 'express';
import cors from 'cors';
import { prisma } from '../lib/prisma';

// Create a minimal Express app
const app = express();

// Add minimal middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (_req, res) => {
  console.log('Health check requested');
  res.send('OK');
});

// Test database connection
app.get('/db-test', async (_req, res) => {
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Database query result:', result);
    res.json({ status: 'success', data: { dbConnection: 'OK', result } });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Test customer endpoint
app.get('/customers-test', async (_req, res) => {
  try {
    console.log('Fetching first 5 customers...');
    const customers = await prisma.customer.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        companyName: true
      }
    });
    console.log(`Retrieved ${customers.length} customers`);
    res.json({
      status: 'success',
      data: {
        items: customers,
        total: customers.length
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
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Available endpoints:
  - GET /health
  - GET /db-test
  - GET /customers-test`);
});
