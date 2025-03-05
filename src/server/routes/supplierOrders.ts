import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const router = Router();

// Get all orders for a supplier
router.get('/:supplierId/orders', requireAdmin, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const orders = await prisma.supplierOrder.findMany({
      where: { supplierId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ error: 'Failed to fetch supplier orders' });
  }
});

// Get a specific order
router.get('/:supplierId/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { supplierId, orderId } = req.params;
    const order = await prisma.supplierOrder.findUnique({
      where: { 
        id: orderId,
        supplierId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching supplier order:', error);
    res.status(500).json({ error: 'Failed to fetch supplier order' });
  }
});

// Create a new order
router.post('/:supplierId/orders', requireAdmin, async (req, res) => {
  try {
    const { supplierId } = req.params;
    const data = req.body;

    // Create the order with items
    const order = await prisma.supplierOrder.create({
      data: {
        orderNumber: `SO-${Date.now()}`, // Generate a unique order number
        supplierId,
        status: data.status || 'PENDING',
        totalAmount: new Prisma.Decimal(data.totalAmount || 0),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        deliveredDate: data.deliveredDate ? new Date(data.deliveredDate) : null,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
            totalPrice: new Prisma.Decimal(item.totalPrice || 0),
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error creating supplier order:', error);
    res.status(500).json({ 
      error: 'Failed to create supplier order',
      details: error.message 
    });
  }
});

// Update an order
router.put('/:supplierId/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = req.body;

    // First, delete existing items
    await prisma.supplierOrderItem.deleteMany({
      where: { supplierOrderId: orderId },
    });

    // Update the order and create new items
    const order = await prisma.supplierOrder.update({
      where: { id: orderId },
      data: {
        status: data.status,
        totalAmount: new Prisma.Decimal(data.totalAmount || 0),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        deliveredDate: data.deliveredDate ? new Date(data.deliveredDate) : null,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
            totalPrice: new Prisma.Decimal(item.totalPrice || 0),
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    res.json(order);
  } catch (error: any) {
    console.error('Error updating supplier order:', error);
    res.status(500).json({ 
      error: 'Failed to update supplier order',
      details: error.message 
    });
  }
});

// Delete an order
router.delete('/:supplierId/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    await prisma.supplierOrder.delete({
      where: { id: orderId },
    });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting supplier order:', error);
    res.status(500).json({ error: 'Failed to delete supplier order' });
  }
});

export default router;
