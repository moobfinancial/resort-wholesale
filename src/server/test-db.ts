import { prisma } from '../lib/prisma';

// This is a simple script to verify the prisma connection is working
async function testPrisma() {
  try {
    console.log('Testing Prisma connection...');
    
    // Try to query products as a simple test
    const productCount = await prisma.product.count();
    console.log(`Connection successful! Found ${productCount} products in the database.`);
    
    // Testing collection access
    const collectionCount = await prisma.collection.count();
    console.log(`Found ${collectionCount} collections in the database.`);
    
    // Create a test collection if none exist
    if (collectionCount === 0) {
      console.log('Creating a test collection...');
      const newCollection = await prisma.collection.create({
        data: {
          name: 'Sample Collection',
          description: 'This is a test collection created to verify Prisma functionality',
          imageUrl: '/images/collections/sample.jpg',
          isActive: true
        }
      });
      console.log('Successfully created test collection:', newCollection.id);
    }
    
    return true;
  } catch (error) {
    console.error('Prisma connection test failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma()
  .then((success) => {
    if (success) {
      console.log('Database connection verified!');
    } else {
      console.error('Database connection failed!');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Error running tests:', err);
    process.exit(1);
  });
