import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { supplierService } from '../services/supplierService';
import { Prisma } from '@prisma/client';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const supplierDir = path.join(uploadDir, 'suppliers');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    if (!fs.existsSync(supplierDir)) {
      fs.mkdirSync(supplierDir);
    }
    
    cb(null, supplierDir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  },
});

// Get all suppliers
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await supplierService.getAllSuppliers({ page, limit });
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch suppliers',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// Create a new supplier
router.post('/', requireAdmin, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const body = req.body;

    // Process uploaded files
    let logoUrl: string | null = null;
    let notes = body.notes || null;

    if (files.logo) {
      logoUrl = `/uploads/suppliers/${files.logo[0].filename}`;
      // Store logo URL in notes field since SupplierData doesn't have a logo field
      notes = notes ? `${notes}\nLogo URL: ${logoUrl}` : `Logo URL: ${logoUrl}`;
    }

    if (files.documents) {
      // Store document URLs in notes field since SupplierData doesn't have a documents field
      const docUrls = files.documents.map(file => 
        `/uploads/suppliers/${file.filename}`
      );
      const docNote = `Document URLs: ${docUrls.join(', ')}`;
      notes = notes ? `${notes}\n${docNote}` : docNote;
    }

    // Map the request body to match SupplierData interface
    const supplierData = {
      name: body.name,
      contactName: body.contactPerson || body.contactName, // Support both field names
      email: body.email,
      phone: body.phone,
      address: typeof body.address === 'string' 
        ? JSON.parse(body.address) 
        : (body.address as Prisma.JsonValue),
      website: body.website || null,
      notes: notes,
      isActive: body.status === 'ACTIVE' || body.isActive === true || body.isActive === 'true',
    };

    const supplier = await supplierService.createSupplier(supplierData);
    
    res.status(201).json({
      status: 'success',
      data: {
        item: supplier
      }
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    res.status(503).json({ 
      status: 'error',
      message: 'Failed to create supplier',
      details: error.message 
    });
  }
});

// Get a specific supplier
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    
    if (!supplier) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Supplier not found' 
      });
    }
    
    res.json({
      status: 'success',
      data: {
        item: supplier
      }
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch supplier',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// Update a supplier
router.put('/:id', requireAdmin, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const body = req.body;
    
    // Check if supplier exists
    const existingSupplier = await supplierService.getSupplierById(id);
    
    if (!existingSupplier) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Supplier not found' 
      });
    }
    
    // Process uploaded files
    let notes = existingSupplier.notes || '';
    
    if (files.logo) {
      const logoUrl = `/uploads/suppliers/${files.logo[0].filename}`;
      // Update logo URL in notes
      if (notes.includes('Logo URL:')) {
        notes = notes.replace(/Logo URL: [^\n]+/, `Logo URL: ${logoUrl}`);
      } else {
        notes = notes ? `${notes}\nLogo URL: ${logoUrl}` : `Logo URL: ${logoUrl}`;
      }
    }
    
    if (files.documents) {
      // Add new document URLs to notes
      const docUrls = files.documents.map(file => 
        `/uploads/suppliers/${file.filename}`
      );
      const docNote = `Document URLs: ${docUrls.join(', ')}`;
      if (notes.includes('Document URLs:')) {
        notes = notes.replace(/Document URLs: [^\n]+/, docNote);
      } else {
        notes = notes ? `${notes}\n${docNote}` : docNote;
      }
    }
    
    // Update supplier
    const updatedData = {
      name: body.name || existingSupplier.name,
      contactName: body.contactPerson || body.contactName || existingSupplier.contactName,
      email: body.email || existingSupplier.email,
      phone: body.phone || existingSupplier.phone,
      address: body.address 
        ? (typeof body.address === 'string' 
            ? JSON.parse(body.address) 
            : (body.address as Prisma.JsonValue))
        : existingSupplier.address,
      website: body.website !== undefined ? body.website : existingSupplier.website,
      notes: notes,
      isActive: body.status === 'ACTIVE' || body.isActive === true || body.isActive === 'true' || existingSupplier.isActive,
    };
    
    const updatedSupplier = await supplierService.updateSupplier(id, updatedData);
    
    res.json({
      status: 'success',
      data: {
        item: updatedSupplier
      }
    });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    res.status(503).json({ 
      status: 'error',
      message: 'Failed to update supplier',
      details: error.message 
    });
  }
});

// Delete a supplier
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if supplier exists
    const existingSupplier = await supplierService.getSupplierById(id);
    
    if (!existingSupplier) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Supplier not found' 
      });
    }
    
    // Delete supplier
    await supplierService.deleteSupplier(id);
    
    res.json({
      status: 'success',
      data: {
        message: 'Supplier deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to delete supplier',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

export default router;
