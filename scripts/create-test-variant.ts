import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

async function createTestVariant() {
  try {
    const variant = await prisma.ProductVariant.create({
      data: {
        id: crypto.randomUUID(),
        productId: 'b3cfd276-1a3a-4320-8347-7f7ecd7afac2', // Rose Quartz Beaded Necklace
        sku: 'ROSE-QUARTZ-PINK-S',
        price: 2.5,
        stock: 25,
        attributes: {
          color: 'Pink',
          size: 'Small'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('Created test variant:', variant);
    
    // Create a second variant to ensure multiple options are shown
    const variant2 = await prisma.ProductVariant.create({
      data: {
        id: crypto.randomUUID(),
        productId: 'b3cfd276-1a3a-4320-8347-7f7ecd7afac2', // Rose Quartz Beaded Necklace
        sku: 'ROSE-QUARTZ-WHITE-M',
        price: 3.0,
        stock: 15,
        attributes: {
          color: 'White',
          size: 'Medium'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('Created second test variant:', variant2);
    
  } catch (error) {
    console.error('Error creating test variants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestVariant()
  .then(() => console.log('Done'))
  .catch(console.error);
