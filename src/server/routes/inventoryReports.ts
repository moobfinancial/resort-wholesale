import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { query } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { inventoryReportService } from '../services/inventoryReportService';

const router = express.Router();

// Get low stock products report
router.get(
  '/low-stock',
  requireAuth,
  [
    query('threshold').optional().isInt({ min: 1 }).toInt(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      const lowStockProducts = await inventoryReportService.getLowStockProducts(threshold);
      
      return res.status(200).json({
        success: true,
        data: lowStockProducts,
      });
    } catch (error) {
      console.error('Error generating low stock report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate low stock report',
      });
    }
  }
);

// Get inventory valuation report
router.get(
  '/valuation',
  requireAuth,
  async (_req: Request, res: Response) => {
    try {
      const valuation = await inventoryReportService.getInventoryValuation();
      
      return res.status(200).json({
        success: true,
        data: valuation,
      });
    } catch (error) {
      console.error('Error generating inventory valuation report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate inventory valuation report',
      });
    }
  }
);

// Get inventory turnover report
router.get(
  '/turnover',
  requireAuth,
  [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // Default to last 30 days if no date range provided
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const turnoverReport = await inventoryReportService.getInventoryTurnover(startDate, endDate);
      
      return res.status(200).json({
        success: true,
        data: {
          ...turnoverReport,
          period: {
            startDate,
            endDate,
          },
        },
      });
    } catch (error) {
      console.error('Error generating inventory turnover report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate inventory turnover report',
      });
    }
  }
);

export default router;
