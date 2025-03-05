import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../server/middleware/auth';
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

export default async function handler(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAdmin(req);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (req.method) {
      case 'GET':
        const suppliers = await prisma.supplier.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(suppliers);

      case 'POST':
        const formData = await req.formData();
        const body = Object.fromEntries(formData);

        // Process uploaded files
        let logoPath: string | null = null;
        let documentPaths: string[] = [];

        // Handle logo upload
        const logoFile = formData.get('logo') as File | null;
        if (logoFile) {
          const logoBuffer = await logoFile.arrayBuffer();
          const logoFileName = `${uuidv4()}${path.extname(logoFile.name)}`;
          const logoFilePath = path.join(process.cwd(), 'uploads', 'suppliers', logoFileName);
          
          // Ensure directory exists
          const uploadDir = path.join(process.cwd(), 'uploads');
          const supplierDir = path.join(uploadDir, 'suppliers');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
          }
          if (!fs.existsSync(supplierDir)) {
            fs.mkdirSync(supplierDir);
          }

          await fs.promises.writeFile(logoFilePath, Buffer.from(logoBuffer));
          logoPath = `/uploads/suppliers/${logoFileName}`;
        }

        // Handle document uploads
        const documentFiles = formData.getAll('documents') as File[];
        if (documentFiles.length > 0) {
          documentPaths = await Promise.all(documentFiles.map(async (file) => {
            const buffer = await file.arrayBuffer();
            const fileName = `${uuidv4()}${path.extname(file.name)}`;
            const filePath = path.join(process.cwd(), 'uploads', 'suppliers', fileName);
            await fs.promises.writeFile(filePath, Buffer.from(buffer));
            return `/uploads/suppliers/${fileName}`;
          }));
        }

        const supplier = await prisma.supplier.create({
          data: {
            name: body.name as string,
            contactPerson: body.contactPerson as string,
            email: body.email as string,
            phone: body.phone as string,
            address: body.address as Prisma.JsonValue,
            website: (body.website as string) || null,
            logo: logoPath,
            status: (body.status as string) || 'ACTIVE',
            category: body.category as string,
            paymentTerms: body.paymentTerms as string,
            documents: documentPaths,
          },
        });

        return NextResponse.json(supplier, { status: 201 });

      default:
        return NextResponse.json(
          { error: `Method ${req.method} Not Allowed` },
          { status: 405, headers: { Allow: 'GET, POST' } }
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
