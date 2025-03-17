// Script to ensure there are featured and new arrival products in the database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateProducts() {
  try {
    console.log('Checking products in database...');
    
    // First check if we have any products
    const productCount = await prisma.product.count();
    console.log(`Found ${productCount} total products`);
    
    if (productCount === 0) {
      console.log('No products found. Please add products first.');
      return;
    }
    
    // Get featured products
    const featuredProducts = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        status: 'PUBLISHED'
      }
    });
    console.log(`Found ${featuredProducts.length} featured products that are published`);
    
    // If no featured products, update some to be featured
    if (featuredProducts.length === 0) {
      // Get top 5 active products and make them featured
      const productsToUpdate = await prisma.product.findMany({
        where: {
          isActive: true
        },
        take: 5
      });
      
      if (productsToUpdate.length > 0) {
        console.log(`Updating ${productsToUpdate.length} products to be featured and published...`);
        
        for (const product of productsToUpdate) {
          await prisma.product.update({
            where: { id: product.id },
            data: { 
              isFeatured: true,
              status: 'PUBLISHED'
            }
          });
          console.log(`Updated product ${product.name} to be featured and published`);
        }
      }
    }
    
    // Check images
    const productsWithoutImages = await prisma.product.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ],
        isActive: true
      }
    });
    
    if (productsWithoutImages.length > 0) {
      console.log(`Found ${productsWithoutImages.length} products without images. Adding placeholder images...`);
      
      for (const product of productsWithoutImages) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: '/images/products/placeholder.jpg' }
        });
        console.log(`Updated product ${product.name} with placeholder image`);
      }
    }
    
    console.log('Product update complete!');
  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProducts();
