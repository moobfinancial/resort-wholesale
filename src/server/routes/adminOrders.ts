import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all orders with pagination and filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Parse filters
    const status = req.query.status as string;
    const paymentMethod = req.query.paymentMethod as string;
    const paymentStatus = req.query.paymentStatus as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
        { customer: { profile: { lastName: { contains: search, mode: 'insensitive' } } } }
      ];
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    // Count total orders matching filters
    const totalOrders = await prisma.order.count({ where });
    
    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        OrderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    // Format orders for response
    const formattedOrders = orders.map(order => {
      // Extract customer data safely
      return {
        ...order,
        customerId: order.customerId,
        // Add any additional formatting needed
      };
    });
    
    // Return formatted response
    return res.json({
      status: 'success',
      data: {
        items: formattedOrders,
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : undefined,
    });
  }
});

// Get order by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        OrderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }
    
    return res.json({
      status: 'success',
      data: {
        item: order,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      details: error instanceof Error ? error.message : undefined,
    });
  }
});

// Update order status
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value',
      });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    
    return res.json({
      status: 'success',
      data: {
        item: updatedOrder,
      },
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      details: error instanceof Error ? error.message : undefined,
    });
  }
});

// Update payment status
router.put('/:id/payment-status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    // Validate payment status
    const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment status value',
      });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });
    
    return res.json({
      status: 'success',
      data: {
        item: updatedOrder,
      },
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update payment status',
      details: error instanceof Error ? error.message : undefined,
    });
  }
});

export default router;
