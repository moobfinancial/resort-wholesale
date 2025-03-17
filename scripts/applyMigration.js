// Script to apply manual SQL migrations through Prisma
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runSqlMigration() {
  try {
    console.log('Starting SQL migration...');
    
    // Read the SQL file content
    const sqlPath = path.join(__dirname, '../prisma/migrations/manual/fix_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons to get individual SQL statements
    // But keep the DO $$ BEGIN ... END $$ block together
    const statements = [];
    let currentStatement = '';
    let insideBlock = false;
    
    sqlContent.split(';').forEach(statement => {
      statement = statement.trim();
      if (!statement) return;
      
      if (statement.includes('DO $$') || insideBlock) {
        insideBlock = true;
        currentStatement += statement + ';';
        
        if (statement.includes('END $$')) {
          insideBlock = false;
          statements.push(currentStatement);
          currentStatement = '';
        }
      } else {
        statements.push(statement + ';');
      }
    });
    
    // Execute each SQL statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\nExecuting SQL: ${statement.substring(0, 100)}...`);
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log('✓ SQL executed successfully');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('✓ Item already exists, continuing...');
          } else {
            console.error(`❌ Error executing SQL: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runSqlMigration();
