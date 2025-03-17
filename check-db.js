import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const productCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Product"`;
    console.log('Product count:', productCount[0].count);
    
    const featuredCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Product" WHERE "isFeatured" = true`;
    console.log('Featured product count:', featuredCount[0].count);
    
    const collections = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Collection"`;
    console.log('Collection count:', collections[0].count);
    
    const activeCollections = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Collection" WHERE "isActive" = true`;
    console.log('Active collection count:', activeCollections[0].count);
    
    // Check if there are any actual products
    const products = await prisma.$queryRaw`SELECT id, name FROM "Product" LIMIT 5`;
    console.log('Sample products:', products);
    
    // Check if there are any actual collections
    const collectionSamples = await prisma.$queryRaw`SELECT id, name FROM "Collection" LIMIT 5`;
    console.log('Sample collections:', collectionSamples);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
