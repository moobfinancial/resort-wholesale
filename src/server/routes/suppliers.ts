import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
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
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      status: 'success',
      data: {
        suppliers
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch suppliers' 
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
    let logoPath: string | null = null;
    let documentPaths: string[] = [];

    if (files.logo) {
      logoPath = `/uploads/suppliers/${files.logo[0].filename}`;
    }

    if (files.documents) {
      documentPaths = files.documents.map(file => 
        `/uploads/suppliers/${file.filename}`
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        id: uuidv4(), // Generate a unique ID
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: typeof body.address === 'string' 
          ? body.address 
          : (body.address as Prisma.JsonValue),
        website: body.website || null,
        logo: logoPath,
        status: body.status || 'ACTIVE',
        category: body.category,
        paymentTerms: body.paymentTerms,
        documents: documentPaths,
        updatedAt: new Date(), // Set the updatedAt field
      },
    });
    res.status(201).json({
      status: 'success',
      data: supplier
    });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ 
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
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({
      status: 'success',
      data: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch supplier' 
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

    // Get existing supplier to handle file updates
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Process uploaded files
    let logoPath = existingSupplier.logo;
    let documentPaths = existingSupplier.documents;

    // Update logo if new one is uploaded
    if (files.logo) {
      // Delete old logo if it exists
      if (existingSupplier.logo) {
        const oldLogoPath = path.join(process.cwd(), existingSupplier.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      logoPath = `/uploads/suppliers/${files.logo[0].filename}`;
    }

    // Update documents if new ones are uploaded
    if (files.documents) {
      // Delete old documents
      existingSupplier.documents.forEach((doc: string) => {
        const oldDocPath = path.join(process.cwd(), doc);
        if (fs.existsSync(oldDocPath)) {
          fs.unlinkSync(oldDocPath);
        }
      });
      documentPaths = files.documents.map(file => 
        `/uploads/suppliers/${file.filename}`
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: typeof body.address === 'string' 
          ? body.address 
          : (body.address as Prisma.JsonValue),
        website: body.website || null,
        logo: logoPath,
        status: body.status,
        category: body.category,
        paymentTerms: body.paymentTerms,
        documents: documentPaths,
        updatedAt: new Date(), // Set the updatedAt field
      },
    });
    res.json({
      status: 'success',
      data: supplier
    });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ 
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

    // Get supplier to delete files
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Delete logo and documents
    if (supplier.logo) {
      const logoPath = path.join(process.cwd(), supplier.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    supplier.documents.forEach((doc: string) => {
      const docPath = path.join(process.cwd(), doc);
      if (fs.existsSync(docPath)) {
        fs.unlinkSync(docPath);
      }
    });

    await prisma.supplier.delete({
      where: { id },
    });
    res.status(204).json({
      status: 'success',
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to delete supplier' 
    });
  }
});

export default router;
