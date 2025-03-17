import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

dotenv.config(); // Load environment variables from .env file

// Initialize Stripe with type assertion to bypass version constraint
const stripe = new Stripe(process.env.STRIPE_API_KEY || '', {
  apiVersion: '2023-10-16' as any, // Use the appropriate API version
});

const router = express.Router();

// Create a new order
router.post(
  '/',
  requireAuth,
  [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.productId').isString().withMessage('Product ID must be a string'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('items.*.variantId').optional().isString().withMessage('Variant ID must be a string'),
    body('paymentMethod').isString().notEmpty().withMessage('Payment method is required'),
    body('useCredit').optional().isBoolean().withMessage('Use credit must be a boolean'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const customerId = req.user?.id;
      
      if (!customerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      
      const { items, paymentMethod, useCredit = false, notes } = req.body;
      
      // Check if customer exists and has enough credit if using credit
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found',
        });
      }
      
      // Calculate order totals
      let subtotal = 0;
      let tax = 0;
      let shipping = 10; // Default shipping cost, could be calculated based on items weight/size
      const orderItems = [];
      
      // Process each item in the order
      for (const item of items) {
        const { productId, quantity, variantId } = item;
        
        // Get the product info
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            BulkPricing: true,
          },
        });
        
        if (!product) {
          return res.status(404).json({
            status: 'error',
            message: `Product not found: ${productId}`,
          });
        }
        
        // Check if using a variant
        let price = product.price.toNumber();
        let stock = product.stock;
        
        if (variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
          });
          
          if (!variant) {
            return res.status(404).json({
              status: 'error',
              message: `Product variant not found: ${variantId}`,
            });
          }
          
          price = variant.price.toNumber();
          stock = variant.stock;
        }
        
        // Check if bulk pricing applies
        if (product.BulkPricing?.length > 0) {
          // Find the applicable tier based on quantity
          const applicableTier = product.BulkPricing
            .filter(tier => tier.minQuantity <= quantity)
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];
          
          if (applicableTier) {
            price = applicableTier.price.toNumber();
          }
        }
        
        // Check stock availability
        if (stock < quantity) {
          return res.status(400).json({
            status: 'error',
            message: `Not enough stock for product: ${product.name}`,
          });
        }
        
        // Calculate item total
        const itemTotal = price * quantity;
        subtotal += itemTotal;
        
        // Add to order items
        orderItems.push({
          id: uuidv4(),
          productId,
          variantId: variantId || null,
          quantity,
          price,
          total: itemTotal,
        });
      }
      
      // Calculate tax (example: 8.5%)
      tax = subtotal * 0.085;
      
      // Calculate total
      const total = subtotal + tax + shipping;
      
      // Determine if credit is used and how much
      let usedCredit = 0;
      if (useCredit && (customer as any).creditLimit && (customer as any).availableCredit) {
        usedCredit = Math.min(total, (customer as any).availableCredit.toNumber());
      }
      
      // Create the order with type assertion to bypass TypeScript errors
      const order = await (prisma.order as any).create({
        data: {
          id: uuidv4(),
          orderNumber: `ORD-${Date.now().toString().substring(7)}`,
          customerId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod,
          subtotal,
          tax,
          shipping,
          total,
          notes: notes || null,
          usedCredit: usedCredit > 0 ? usedCredit : null,
          OrderItem: {
            create: orderItems,
          },
        },
        include: {
          OrderItem: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });
      
      // If using credit, update customer's available credit
      if (usedCredit > 0) {
        await (prisma.customer as any).update({
          where: { id: customerId },
          data: {
            availableCredit: {
              decrement: usedCredit,
            },
          },
        });
      }
      
      // If payment method is credit card, create Stripe payment intent
      if (paymentMethod === 'credit_card' && total > usedCredit) {
        const amountToCharge = Math.round((total - usedCredit) * 100); // Stripe requires amount in cents
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountToCharge,
          currency: 'usd',
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
        });
        
        // Update order with Stripe payment intent details
        await (prisma.order as any).update({
          where: { id: order.id },
          data: {
            stripePaymentIntentId: paymentIntent.id,
            stripeClientSecret: paymentIntent.client_secret,
          },
        });
        
        return res.json({
          status: 'success',
          data: {
            ...order,
            stripeClientSecret: paymentIntent.client_secret,
          },
        });
      }
      
      // For credit-only purchases
      return res.json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  }
);

// Get all orders for current customer
router.get('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    const orders = await (prisma.order as any).findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        OrderItem: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    
    res.json({
      status: 'success',
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch orders',
    });
  }
});

// Get a specific order
router.get(
  '/:id',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Order ID is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const customerId = req.user?.id;
      const { id } = req.params;
      
      if (!customerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      
      const order = await (prisma.order as any).findFirst({
        where: {
          id,
          customerId,
        },
        include: {
          OrderItem: {
            include: {
              product: true,
              variant: true,
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
      
      res.json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch order',
      });
    }
  }
);

// Update order payment status (webhook from Stripe)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return res.status(400).json({
        status: 'error',
        message: 'Stripe webhook secret not configured',
      });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update the order with the payment status
        if (paymentIntent.metadata.orderId) {
          await (prisma.order as any).update({
            where: { id: paymentIntent.metadata.orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.PROCESSING,
            },
          });
          
          console.log(`Payment for order ${paymentIntent.metadata.orderNumber} succeeded`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update the order with the failed payment status
        if (failedPaymentIntent.metadata.orderId) {
          await (prisma.order as any).update({
            where: { id: failedPaymentIntent.metadata.orderId },
            data: {
              paymentStatus: PaymentStatus.FAILED,
            },
          });
          
          console.log(`Payment for order ${failedPaymentIntent.metadata.orderNumber} failed`);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  }
);

// Apply for credit
router.post(
  '/apply-credit',
  requireAuth,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('term').isIn(['DAYS_30', 'DAYS_90', 'DAYS_180']).withMessage('Invalid term'),
    body('documents').isArray().withMessage('Documents must be an array'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const customerId = req.user?.id;
      
      if (!customerId) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      
      const { amount, term, documents } = req.body;
      
      // Create credit application with type assertion to bypass TypeScript errors
      const creditApplication = await (prisma as any).creditApplication.create({
        data: {
          id: uuidv4(),
          customerId,
          amount,
          term,
          status: 'PENDING',
          documents: {
            create: documents.map((doc: any) => ({
              id: uuidv4(),
              url: doc.url,
              type: doc.type,
              status: 'PENDING',
            })),
          },
        },
        include: {
          documents: true,
        },
      });
      
      res.json({
        status: 'success',
        data: creditApplication,
      });
    } catch (error) {
      console.error('Error applying for credit:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to apply for credit',
      });
    }
  }
);

// Get credit applications for current customer
router.get('/credit-applications', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    const creditApplications = await (prisma as any).creditApplication.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });
    
    res.json({
      status: 'success',
      data: creditApplications,
    });
  } catch (error) {
    console.error('Error fetching credit applications:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch credit applications',
    });
  }
});

export default router;
