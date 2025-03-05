import express, { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/emailService';
import { OrderStatus, Prisma } from '@prisma/client';
import { orderService } from '../services/orderService';

const router = express.Router();

// Define interfaces for request body
interface CreateOrderRequestBody {
  items: { productId: string; variantId?: string; quantity: number }[];
  paymentMethod: string;
}

// Create a new order
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').isString(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('paymentMethod').isString(),
  ],
  validateRequest,
  async (req: Request<any, any, CreateOrderRequestBody>, res: Response) => {
    try {
      const { items, paymentMethod } = req.body;

      // Validate stock availability
      const insufficientStockItems = await orderService.validateStockAvailability(items);
      if (insufficientStockItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some items have insufficient stock',
          data: {
            insufficientStockItems,
          },
        });
      }

      // Generate a unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Process each order item
      const orderItems = await Promise.all(
        items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, price: true },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          // Handle variant pricing if applicable
          let price = product.price;
          
          if (item.variantId) {
            const variant = await prisma.$queryRaw<Array<{ price: Prisma.Decimal }>>`
              SELECT price FROM "ProductVariant" WHERE id = ${item.variantId}
            `;
            
            if (variant && variant.length > 0) {
              price = variant[0].price;
            }
          }

          return {
            productId: item.productId,
            ...(item.variantId && { variantId: item.variantId }),
            quantity: item.quantity,
            price,
            total: Prisma.Decimal.mul(price, item.quantity),
          };
        })
      );

      // Calculate order totals
      const subtotal = orderItems.reduce(
        (sum, item) => Prisma.Decimal.add(sum, item.total),
        new Prisma.Decimal(0)
      );
      
      const taxRate = 0.07; // 7% tax rate
      const tax = Prisma.Decimal.mul(subtotal, taxRate);
      
      const shippingRate = 0.05; // 5% shipping rate
      const shipping = Prisma.Decimal.mul(subtotal, shippingRate);
      
      const total = Prisma.Decimal.add(
        Prisma.Decimal.add(subtotal, tax),
        shipping
      );

      // Create the order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          paymentMethod,
          status: 'PENDING',
          items: {
            create: orderItems.map(item => {
              // Extract variantId before creating the record
              const { variantId, ...orderItemData } = item;
              return orderItemData;
            }),
          },
          subtotal,
          tax,
          shipping,
          total,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update inventory levels
      await orderService.updateInventoryLevels(
        items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );

      // Send order confirmation email
      await sendOrderConfirmationEmail(
        order.items[0].product.name,
        order.orderNumber,
        {
          items: order.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: Number(item.price),
            total: Number(item.total),
            variantInfo: '',  // We don't have variant info in OrderItem yet
          })),
          subtotal: Number(order.subtotal),
          tax: Number(order.tax),
          shipping: Number(order.shipping),
          total: Number(order.total),
        }
      );

      return res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order',
      });
    }
  }
);

// Get customer orders
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const customerId = req.user!.id;

    const where = {
      customerId,
      ...(status ? { status: status as string } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
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
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get customer orders with optional limit
router.get('/customer/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get order details
router.get('/:orderNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const customerId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customerId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Failed to fetch order details' });
  }
});

// Cancel order
router.post('/:orderNumber/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const customerId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        customerId,
        status: 'PENDING',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found or cannot be cancelled',
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Send email notification
    await sendOrderStatusUpdateEmail(
      order.items[0].product.name,
      order.orderNumber,
      'CANCELLED'
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

export default router;
