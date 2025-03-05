import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../server/middleware/auth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Prisma } from '@prisma/client';

export const config = {
  runtime: 'edge',
  api: {
    bodyParser: false,
  },
};

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

export default async function handler(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAdmin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Missing supplier ID' }, { status: 400 });
    }

    switch (req.method) {
      case 'GET':
        const supplier = await prisma.supplier.findUnique({
          where: { id },
        });

        if (!supplier) {
          return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        return NextResponse.json(supplier);

      case 'PUT':
        const formData = await req.formData();
        const body = Object.fromEntries(formData);

        // Get existing supplier to handle file updates
        const existingSupplier = await prisma.supplier.findUnique({
          where: { id },
        });

        if (!existingSupplier) {
          return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        // Process uploaded files
        let logoPath = existingSupplier.logo;
        let documentPaths = existingSupplier.documents;

        // Handle logo upload
        const logoFile = formData.get('logo') as File | null;
        if (logoFile) {
          const logoBuffer = await logoFile.arrayBuffer();
          const logoFileName = `${uuidv4()}${path.extname(logoFile.name)}`;
          const logoFilePath = path.join(process.cwd(), 'uploads', 'suppliers', logoFileName);
          
          // Delete old logo if it exists
          if (existingSupplier.logo) {
            const oldLogoPath = path.join(process.cwd(), existingSupplier.logo);
            if (fs.existsSync(oldLogoPath)) {
              fs.unlinkSync(oldLogoPath);
            }
          }

          await fs.promises.writeFile(logoFilePath, Buffer.from(logoBuffer));
          logoPath = `/uploads/suppliers/${logoFileName}`;
        }

        // Handle document uploads
        const documentFiles = formData.getAll('documents') as File[];
        if (documentFiles.length > 0) {
          // Delete old documents
          existingSupplier.documents.forEach((doc: string) => {
            const oldDocPath = path.join(process.cwd(), doc);
            if (fs.existsSync(oldDocPath)) {
              fs.unlinkSync(oldDocPath);
            }
          });

          // Save new documents
          documentPaths = await Promise.all(documentFiles.map(async (file) => {
            const buffer = await file.arrayBuffer();
            const fileName = `${uuidv4()}${path.extname(file.name)}`;
            const filePath = path.join(process.cwd(), 'uploads', 'suppliers', fileName);
            await fs.promises.writeFile(filePath, Buffer.from(buffer));
            return `/uploads/suppliers/${fileName}`;
          }));
        }

        const updatedSupplier = await prisma.supplier.update({
          where: { id },
          data: {
            name: body.name as string,
            contactPerson: body.contactPerson as string,
            email: body.email as string,
            phone: body.phone as string,
            address: body.address as Prisma.JsonValue,
            website: (body.website as string) || null,
            logo: logoPath,
            status: body.status as string,
            category: body.category as string,
            paymentTerms: body.paymentTerms as string,
            documents: documentPaths,
          },
        });

        return NextResponse.json(updatedSupplier);

      case 'DELETE':
        // Get supplier to delete files
        const supplierToDelete = await prisma.supplier.findUnique({
          where: { id },
        });

        if (!supplierToDelete) {
          return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        // Delete logo and documents
        if (supplierToDelete.logo) {
          const logoPath = path.join(process.cwd(), supplierToDelete.logo);
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath);
          }
        }

        supplierToDelete.documents.forEach((doc: string) => {
          const docPath = path.join(process.cwd(), doc);
          if (fs.existsSync(docPath)) {
            fs.unlinkSync(docPath);
          }
        });

        await prisma.supplier.delete({
          where: { id },
        });

        return new NextResponse(null, { status: 204 });

      default:
        return NextResponse.json(
          { error: `Method ${req.method} Not Allowed` },
          { status: 405, headers: { Allow: 'GET, PUT, DELETE' } }
        );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
