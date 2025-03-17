import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a PostgreSQL client
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database successfully');

    // First, check the data type of the Product.id column
    const productIdType = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'id';
    `);
    
    const idType = productIdType.rows[0]?.data_type || 'uuid';
    console.log(`Product.id column type: ${idType}`);

    // Check if ProductVariant table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ProductVariant'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('ProductVariant table already exists, skipping creation');
    } else {
      console.log('Creating ProductVariant table...');
      
      // Create the ProductVariant table with matching data types
      await client.query(`
        CREATE TABLE "ProductVariant" (
          "id" ${idType === 'uuid' ? 'UUID' : 'TEXT'} PRIMARY KEY ${idType === 'uuid' ? 'DEFAULT gen_random_uuid()' : ''},
          "sku" TEXT UNIQUE NOT NULL,
          "price" DECIMAL(10, 2) NOT NULL,
          "stock" INTEGER NOT NULL DEFAULT 0,
          "attributes" JSONB NOT NULL DEFAULT '{}',
          "imageUrl" TEXT,
          "productId" ${idType === 'uuid' ? 'UUID' : 'TEXT'} NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      console.log('Created ProductVariant table');
    }

    // Check if variantId column exists in OrderItem
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'variantId'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log('variantId column already exists in OrderItem, skipping addition');
    } else {
      console.log('Adding variantId column to OrderItem...');
      
      // Add variantId column to OrderItem with matching data types
      await client.query(`
        ALTER TABLE "OrderItem" 
        ADD COLUMN "variantId" ${idType === 'uuid' ? 'UUID' : 'TEXT'},
        ADD CONSTRAINT "OrderItem_variantId_fkey" 
        FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);

      console.log('Added variantId column to OrderItem');
    }

    // Create indexes for performance
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
      CREATE INDEX IF NOT EXISTS "OrderItem_variantId_idx" ON "OrderItem"("variantId");
    `);

    console.log('Migration completed successfully');
    
    // Write a success message to a file for confirmation
    fs.writeFileSync(
      path.join(__dirname, 'migration-result.txt'), 
      `Migration completed successfully at ${new Date().toISOString()}`
    );

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
