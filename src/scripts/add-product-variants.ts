import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting product variants migration...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-product-variants.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL directly using Prisma's executeRaw
    const result = await prisma.$executeRawUnsafe(sql);
    
    console.log('Migration completed successfully!');
    console.log('Added ProductVariant table and updated OrderItem table.');
    
    return { success: true, message: 'Migration completed successfully!' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: `Migration failed: ${error.message}` };
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the migration
main()
  .then((result) => {
    console.log(result.message);
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
