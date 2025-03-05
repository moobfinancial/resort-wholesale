import express from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Get all business customers
router.get('/', requireAdmin, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        businessType: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Format the response to match the expected structure in the frontend
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      companyName: customer.companyName,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      registrationDate: customer.createdAt,
      // Since we can't access orders anymore, set these to defaults
      lastOrderDate: null,
      totalOrders: 0,
      businessType: customer.businessType,
    }));

    res.json({
      status: 'success',
      data: formattedCustomers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// Update customer status
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = z.object({
      status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
    }).parse(req.body);

    await prisma.customer.update({
      where: { id },
      data: { status },
    });

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    console.error('Error updating customer status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Get customer details
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        documents: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ message: 'Failed to fetch customer details' });
  }
});

// Get customer orders
router.get('/:id/orders', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Format orders for frontend
    const formattedOrders = customer.orders.map(order => ({
      id: order.id,
      orderDate: order.createdAt,
      total: order.total,
      status: order.status,
      items: order.items?.length || 0
    }));

    res.json({
      status: 'success',
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch customer orders' 
    });
  }
});

// Get customer activity log
router.get('/:id/activity', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // For now, we'll return a mock activity log
    // In a real application, you would fetch this from a dedicated activity log table
    const mockActivityLog = [
      {
        id: '1',
        action: 'Account Created',
        date: customer.createdAt,
        user: customer.contactName,
        details: 'Customer account was created'
      },
      {
        id: '2',
        action: 'Status Updated',
        date: customer.updatedAt || customer.createdAt,
        user: 'Admin',
        details: `Customer status set to ${customer.status}`
      }
    ];

    res.json({
      status: 'success',
      data: mockActivityLog
    });
  } catch (error) {
    console.error('Error fetching customer activity log:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch customer activity log' 
    });
  }
});

export default router;
