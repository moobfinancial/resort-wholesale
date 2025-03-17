import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with the API key from environment variables
const stripe = new Stripe(process.env.STRIPE_API_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const router = express.Router();

// Create a Stripe checkout session for the current cart
router.post('/create-session', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required',
      });
    }

    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    // Find customer's cart
    const cart = await prisma.cart.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty',
      });
    }
    
    // Get customer data for better checkout experience
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }
    
    // Create line items for Stripe
    const lineItems = cart.items.map((item: any) => {
      const variant = item.variant;
      const product = item.product;
      const price = variant ? variant.price.toNumber() : product.price.toNumber();
      const name = `${product.name}${variant ? ` (${Object.values(variant.attributes).join(', ')})` : ''}`;
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            images: [variant?.imageUrl || product.imageUrl].filter(Boolean) as string[],
            description: product.description || undefined,
            metadata: {
              productId: product.id,
              variantId: variant?.id || '',
            },
          },
          unit_amount: Math.round(price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      };
    });
    
    // Calculate shipping
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      const price = item.variant ? item.variant.price.toNumber() : item.product.price.toNumber();
      return sum + (price * item.quantity);
    }, 0);
    
    // Free shipping for orders over $500
    const shipping = subtotal > 500 ? 0 : 10;
    
    // Add shipping as a line item if not free
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping (3-5 business days)',
            images: [],
            metadata: {
              productId: 'shipping',
              variantId: '',
            },
          },
          unit_amount: Math.round(shipping * 100), // Stripe uses cents
        },
        quantity: 1,
      });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer.email,
      success_url: `${process.env.FRONTEND_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        cartId: cart.id,
        customerId,
        orderId,
      },
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    });
    
    // Return the session ID to the client
    res.json({
      status: 'success',
      data: {
        sessionId: session.id
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to create checkout session',
    });
  }
});

// Retrieve session status
router.get('/session-status', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const customerId = req.user?.id;
    const sessionId = req.query.session_id as string;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    if (!sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID is required',
      });
    }
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }
    
    // Check if the session was paid
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not completed',
      });
    }
    
    // Find order associated with this session
    const order = await prisma.order.findFirst({
      where: {
        customerId,
        OR: [
          { id: { contains: sessionId } },
          // Also check for legacy format
          { id: { contains: `Stripe-${sessionId}` } }
        ]
      },
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found for this session',
      });
    }
    
    // Return success response with order ID
    return res.json({
      status: 'success',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error retrieving session status:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to retrieve session status',
    });
  }
});

// Stripe webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
  // Get the signature from the header
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing Stripe signature',
    });
  }
  
  let event;
  
  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Webhook signature verification failed',
    });
  }
  
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // Extract the order ID from metadata
      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        console.error('No order ID found in session metadata');
        return res.status(400).json({
          status: 'error',
          message: 'No order ID found in session metadata'
        });
      }
      
      // Check if order by session ID already exists
      const existingOrder = await prisma.order.findFirst({
        where: { 
          paymentMethod: 'credit_card',
          OR: [
            { id: orderId }
          ]
        },
      });
      
      if (existingOrder) {
        console.log(`Order ${orderId} already exists`);
        return res.json({ 
          status: 'success',
          data: { received: true }
        });
      }
      
      // Update the order in the database
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          // Since there's no field for payment details, we'll just update the status
          paymentMethod: 'credit_card'
        }
      });
      
      console.log(`Order ${orderId} marked as paid and processing`);
    } catch (error) {
      console.error('Error processing successful checkout:', error);
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process checkout',
      });
    }
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.json({ 
    status: 'success',
    data: { received: true }
  });
});

export default router;
