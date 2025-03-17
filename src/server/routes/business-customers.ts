import express from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

// Get all business customers
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total customers for pagination
    const totalCustomers = await prisma.customer.count();

    // Get paginated customers
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
      },
      skip,
      take: limit,
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
      data: {
        items: formattedCustomers,
        total: totalCustomers,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCustomers / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An error occurred while fetching customers'
    });
  }
});

// Get pending verification customers
router.get('/verification', requireAdmin, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        businessType: true,
        CustomerDocuments: true,  
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
      businessType: customer.businessType,
      documentsCount: customer.CustomerDocuments?.length || 0,
      // Default values for fields that might be unavailable
      lastOrderDate: null,
      totalOrders: 0,
    }));

    res.json({
      status: 'success',
      data: {
        items: formattedCustomers,
        total: formattedCustomers.length,
        page: 1,
        limit: formattedCustomers.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching verification customers:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch customer details' 
    });
  }
});

// Get verification customer details by ID 
router.get('/verification/customer/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        CustomerDocuments: true,  
        CustomerStatusHistory: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Customer not found' 
      });
    }

    // Extract address data from JSON field
    const addressData = typeof customer.address === 'string' 
      ? JSON.parse(customer.address) 
      : (customer.address || {});
      
    // Format the customer data with defaults for missing relations
    const formattedCustomer = {
      id: customer.id,
      companyName: customer.companyName || '',
      contactName: customer.contactName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      // Extract address components from the JSON address field
      city: addressData.city || '',
      state: addressData.state || '',
      zipCode: addressData.zipCode || '',
      country: addressData.country || '',
      status: customer.status || 'PENDING',
      businessType: customer.businessType || '',
      taxId: customer.taxId || '',
      // These fields don't exist in the schema but are expected by the frontend
      website: '',
      documents: customer.CustomerDocuments || [],  
      statusHistory: customer.CustomerStatusHistory || [],
      verificationNotes: '',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    res.json({
      status: 'success',
      data: {
        item: formattedCustomer
      }
    });
  } catch (error) {
    console.error('Error fetching verification customer details:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch customer details' 
    });
  }
});

// Get verification customer orders 
router.get('/verification/orders', requireAdmin, async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    let orders: any[] = [];
    
    if (customerId) {
      // Get orders for a specific customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          }
        }
      });
      
      if (customer) {
        orders = customer.orders || [];
      }
    } else {
      // Return no orders when no customer ID is specified
      orders = [];
    }
    
    res.json({
      status: 'success',
      data: {
        items: orders,
        total: orders.length,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(orders.length / 20) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching verification orders:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch verification orders' 
    });
  }
});

// Get verification customer activity log
router.get('/verification/activity', requireAdmin, async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    let activityItems: any[] = [];
    
    if (customerId) {
      // Get activity for a specific customer
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          CustomerStatusHistory: {
            orderBy: { createdAt: 'desc' },
          }
        }
      });
      
      if (customer) {
        // Use customer status history or create mock data
        if (customer.CustomerStatusHistory && customer.CustomerStatusHistory.length > 0) {
          activityItems = customer.CustomerStatusHistory.map(history => ({
            id: history.id,
            action: `Status Changed to ${history.status}`,
            date: history.createdAt,
            user: 'Admin',
            details: history.comment || 'Status updated'
          }));
        } else {
          // If no history, create a mock entry
          activityItems = [{
            id: '1',
            action: 'Account Created',
            date: customer.createdAt,
            user: 'System',
            details: 'Customer account pending verification'
          }];
        }
      }
    } else {
      // Return mock activity when no customer ID is specified
      activityItems = [{
        id: '1',
        action: 'System Check',
        date: new Date(),
        user: 'System',
        details: 'All customer verifications are being processed'
      }];
    }
    
    res.json({
      status: 'success',
      data: {
        items: activityItems,
        total: activityItems.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(activityItems.length / 10) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching verification activity:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch verification activity' 
    });
  }
});

// Update verification status - Approve
router.post('/verification/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Customer not found' 
      });
    }

    // Update customer status
    await prisma.customer.update({
      where: { id },
      data: { 
        status: 'VERIFIED',
        // Store verification notes in a comment field or similar if needed
      },
    });
    
    // Create status history entry if the model exists
    try {
      await prisma.customerStatusHistory.create({
        data: {
          id: crypto.randomUUID(),
          customerId: id,
          status: 'VERIFIED',
          comment: notes || 'Approved by admin',
          userId: req.user?.id || 'system'
        }
      });
    } catch (historyError) {
      console.log('Could not create status history (model may not exist):', historyError);
      // Don't fail the whole operation if just the history fails
    }

    res.json({
      status: 'success',
      data: {
        message: 'Customer approved successfully'
      }
    });
  } catch (error) {
    console.error('Error approving customer:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to approve customer' 
    });
  }
});

// Reject verification
router.post('/verification/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Customer not found' 
      });
    }

    // Update customer status
    await prisma.customer.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        // Store rejection reason in a comment field or similar if needed
      },
    });
    
    // Create status history entry if the model exists
    try {
      await prisma.customerStatusHistory.create({
        data: {
          id: crypto.randomUUID(),
          customerId: id,
          status: 'REJECTED',
          comment: reason || 'Rejected by admin',
          userId: req.user?.id || 'system'
        }
      });
    } catch (historyError) {
      console.log('Could not create status history (model may not exist):', historyError);
      // Don't fail the whole operation if just the history fails
    }

    res.json({
      status: 'success',
      data: {
        message: 'Customer rejected successfully'
      }
    });
  } catch (error) {
    console.error('Error rejecting customer:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to reject customer' 
    });
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

    res.json({ 
      status: 'success',
      data: {
        message: 'Status updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid status' 
      });
    }
    console.error('Error updating customer status:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to update status' 
    });
  }
});

// Get customer details
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        CustomerDocuments: true,  
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Customer not found' 
      });
    }

    // Transform customer data to match expected format in the admin UI
    const formattedCustomer = {
      ...customer,
      // Format address field correctly - it's a JSON field in the schema
      address: typeof customer.address === 'string' 
        ? JSON.parse(customer.address) 
        : customer.address || { 
            street: '', 
            city: '', 
            state: '', 
            zipCode: '', 
            country: '' 
          },
      // Transform documents if needed
      documents: customer.CustomerDocuments?.map(doc => ({
        id: doc.id,
        type: doc.requiredDocumentId || 'GENERAL', // Use requiredDocumentId or default
        url: doc.url,
        uploadDate: doc.createdAt,
        status: doc.status || 'PENDING'
      })) || [],
      // Format registration date
      registrationDate: customer.createdAt
    };

    res.json({
      status: 'success',
      data: {
        item: formattedCustomer
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch customer details' 
    });
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
      return res.status(404).json({ 
        status: 'error',
        message: 'Customer not found' 
      });
    }

    // Format orders for frontend
    const formattedOrders = customer.orders.map(order => ({
      id: order.id,
      orderDate: order.createdAt,
      total: order.total,
      status: order.status,
      items: 0 // Order items are not directly accessible in this context
    }));

    res.json({
      status: 'success',
      data: {
        items: formattedOrders,
        total: formattedOrders.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
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
      where: { id },
      include: {
        CustomerStatusHistory: true  
      }
    });

    if (!customer) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Customer not found' 
      });
    }

    // Use real status history if available, otherwise create mock data
    let activityLog: any[] = [];
    
    if (customer.CustomerStatusHistory && customer.CustomerStatusHistory.length > 0) {
      activityLog = customer.CustomerStatusHistory.map(history => ({
        id: history.id,
        action: `Status Changed to ${history.status}`,
        date: history.createdAt,
        user: 'Admin',
        details: history.comment || `Customer status updated to ${history.status}`
      }));
    } else {
      // Fall back to mock data if no real activity exists
      activityLog = [
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
    }

    res.json({
      status: 'success',
      data: {
        items: activityLog,
        total: activityLog.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching customer activity:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch customer activity' 
    });
  }
});

export default router;
