import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { v4 as uuidv4 } from 'uuid';
// Define enums manually since they're not exported from @prisma/client
// These match the enums defined in the Prisma schema

// Define enums manually since they're not exported from @prisma/client
enum CreditApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

enum CreditTerm {
  DAYS_30 = 'DAYS_30',
  DAYS_90 = 'DAYS_90',
  DAYS_180 = 'DAYS_180'
}

const router = express.Router();

// Get all credit applications for the current customer
router.get('/customer', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const customerId = req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }
    
    const applications = await (prisma as any).creditApplication.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });
    
    res.json({
      status: 'success',
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching credit applications:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch credit applications',
    });
  }
});

// Get a specific credit application
router.get(
  '/customer/:id',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Application ID is required'),
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
      
      const application = await (prisma as any).creditApplication.findFirst({
        where: {
          id,
          customerId,
        },
        include: {
          documents: true,
        },
      });
      
      if (!application) {
        return res.status(404).json({
          status: 'error',
          message: 'Credit application not found',
        });
      }
      
      res.json({
        status: 'success',
        data: application,
      });
    } catch (error) {
      console.error('Error fetching credit application:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch credit application',
      });
    }
  }
);

// Create a new credit application
router.post(
  '/customer',
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
      
      // Check if customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found',
        });
      }
      
      // Create credit application
      const creditApplication = await (prisma as any).creditApplication.create({
        data: {
          id: uuidv4(),
          customerId,
          amount,
          term: term as CreditTerm,
          status: CreditApplicationStatus.PENDING,
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
      console.error('Error creating credit application:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create credit application',
      });
    }
  }
);

// Admin routes for credit applications

// Get all credit applications (admin only)
router.get(
  '/admin',
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }
      
      const applications = await (prisma as any).creditApplication.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              companyName: true,
              contactName: true,
              businessType: true,
              taxId: true,
            },
          },
          documents: true,
        },
      });
      
      res.json({
        status: 'success',
        data: applications,
      });
    } catch (error) {
      console.error('Error fetching credit applications:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch credit applications',
      });
    }
  }
);

// Get a specific credit application (admin only)
router.get(
  '/admin/:id',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Application ID is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }
      
      const { id } = req.params;
      
      const application = await (prisma as any).creditApplication.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              companyName: true,
              contactName: true,
              businessType: true,
              taxId: true,
              phone: true,
              address: true,
            },
          },
          documents: true,
        },
      });
      
      if (!application) {
        return res.status(404).json({
          status: 'error',
          message: 'Credit application not found',
        });
      }
      
      res.json({
        status: 'success',
        data: application,
      });
    } catch (error) {
      console.error('Error fetching credit application:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch credit application',
      });
    }
  }
);

// Approve a credit application (admin only)
router.post(
  '/admin/:id/approve',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Application ID is required'),
    body('creditLimit').isNumeric().withMessage('Credit limit must be a number'),
    body('term').isIn(['DAYS_30', 'DAYS_90', 'DAYS_180']).withMessage('Invalid term'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }
      
      const { id } = req.params;
      const { creditLimit, term } = req.body;
      
      // Find the application
      const application = await (prisma as any).creditApplication.findUnique({
        where: { id },
        include: {
          customer: true,
        },
      });
      
      if (!application) {
        return res.status(404).json({
          status: 'error',
          message: 'Credit application not found',
        });
      }
      
      // Check if application is already approved or rejected
      if (application.status !== CreditApplicationStatus.PENDING) {
        return res.status(400).json({
          status: 'error',
          message: `Application is already ${application.status.toLowerCase()}`,
        });
      }
      
      // Update application status
      const updatedApplication = await (prisma as any).creditApplication.update({
        where: { id },
        data: {
          status: CreditApplicationStatus.APPROVED,
          notes: req.body.notes,
        },
      });
      
      // Update customer credit information
      const updatedCustomer = await (prisma.customer as any).update({
        where: { id: application.customerId },
        data: {
          creditLimit,
          availableCredit: creditLimit,
          creditStatus: 'APPROVED',
          creditTerm: term as CreditTerm,
          creditApprovedAt: new Date(),
          creditExpiresAt: new Date(Date.now() + (
            term === 'DAYS_30' ? 30 * 24 * 60 * 60 * 1000 :
            term === 'DAYS_90' ? 90 * 24 * 60 * 60 * 1000 :
            180 * 24 * 60 * 60 * 1000
          )),
        },
      });
      
      res.json({
        status: 'success',
        data: {
          application: updatedApplication,
          customer: {
            id: updatedCustomer.id,
            creditLimit: updatedCustomer.creditLimit,
            availableCredit: updatedCustomer.availableCredit,
            creditStatus: updatedCustomer.creditStatus,
            creditTerm: updatedCustomer.creditTerm,
          },
        },
      });
    } catch (error) {
      console.error('Error approving credit application:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to approve credit application',
      });
    }
  }
);

// Reject a credit application (admin only)
router.post(
  '/admin/:id/reject',
  requireAuth,
  [
    param('id').isString().notEmpty().withMessage('Application ID is required'),
    body('reason').isString().notEmpty().withMessage('Rejection reason is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }
      
      const { id } = req.params;
      const { reason } = req.body;
      
      // Find the application
      const application = await (prisma as any).creditApplication.findUnique({
        where: { id },
      });
      
      if (!application) {
        return res.status(404).json({
          status: 'error',
          message: 'Credit application not found',
        });
      }
      
      // Check if application is already approved or rejected
      if (application.status !== CreditApplicationStatus.PENDING) {
        return res.status(400).json({
          status: 'error',
          message: `Application is already ${application.status.toLowerCase()}`,
        });
      }
      
      // Update application status
      const updatedApplication = await (prisma as any).creditApplication.update({
        where: { id },
        data: {
          status: CreditApplicationStatus.REJECTED,
          notes: reason,
        },
      });
      
      // Update customer credit status
      await (prisma.customer as any).update({
        where: { id: application.customerId },
        data: {
          creditStatus: 'REJECTED',
        },
      });
      
      res.json({
        status: 'success',
        data: updatedApplication,
      });
    } catch (error) {
      console.error('Error rejecting credit application:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to reject credit application',
      });
    }
  }
);

export default router;
