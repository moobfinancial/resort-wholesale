import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

const { Pool } = pg;

// Load environment variables from .env file
dotenv.config({ path: join(projectRoot, '.env') });

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Script to insert a test product variant
 */
async function main() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to database...');
    
    // First, get a valid product ID to use for our variant
    const productResult = await client.query(`
      SELECT id, name, sku FROM "Product" LIMIT 1;
    `);
    
    if (productResult.rows.length === 0) {
      console.error('No products found in the database');
      return;
    }
    
    const product = productResult.rows[0];
    console.log(`Found product: ${product.name} (${product.id})`);
    
    // Create a test variant for this product
    const variantSku = `${product.sku}-TEST-VARIANT`;
    const variantPrice = 9.99;
    const variantStock = 25;
    const variantAttributes = JSON.stringify({
      color: "Blue",
      size: "Medium",
      material: "Cotton"
    });
    
    // Check if the variant already exists (by SKU)
    const existingVariant = await client.query(`
      SELECT id FROM "ProductVariant" WHERE sku = $1;
    `, [variantSku]);
    
    if (existingVariant.rows.length > 0) {
      console.log(`Variant with SKU ${variantSku} already exists, updating instead`);
      
      await client.query(`
        UPDATE "ProductVariant"
        SET price = $1, stock = $2, attributes = $3, "updatedAt" = NOW()
        WHERE sku = $4;
      `, [variantPrice, variantStock, variantAttributes, variantSku]);
      
      console.log(`Updated variant with SKU ${variantSku}`);
    } else {
      // Insert a new variant
      const insertResult = await client.query(`
        INSERT INTO "ProductVariant" (
          id, sku, price, stock, attributes, "productId", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING id;
      `, [variantSku, variantPrice, variantStock, variantAttributes, product.id]);
      
      console.log(`Created new variant with ID: ${insertResult.rows[0].id}`);
    }
    
    console.log('Test variant operation completed successfully!');
  } catch (error) {
    console.error('Error inserting test variant:', error);
  } finally {
    client.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
