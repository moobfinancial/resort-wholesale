import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating sample collections...');
    
    // Check if Collection table exists, create it if it doesn't
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Collection" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "imageUrl" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
        )
      `;
      console.log('Collection table created or already exists');
    } catch (error) {
      console.error('Error creating Collection table:', error);
    }

    // Create the CollectionToProduct join table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_CollectionToProduct" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_CollectionToProduct_pkey" PRIMARY KEY ("A", "B")
        )
      `;
      console.log('_CollectionToProduct table created or already exists');
    } catch (error) {
      console.error('Error creating _CollectionToProduct table:', error);
    }

    // Create sample collections
    const collections = [
      {
        id: 'coll-1',
        name: 'Summer Collection',
        description: 'Our latest summer products',
        imageUrl: '/images/categories/summer.jpg',
        isActive: true,
        updatedAt: new Date()
      },
      {
        id: 'coll-2',
        name: 'Bestsellers',
        description: 'Our most popular products',
        imageUrl: '/images/categories/bestsellers.jpg',
        isActive: true,
        updatedAt: new Date()
      },
      {
        id: 'coll-3',
        name: 'New Arrivals',
        description: 'Fresh new products',
        imageUrl: '/images/categories/new-arrivals.jpg',
        isActive: true,
        updatedAt: new Date()
      }
    ];
    
    // Insert collections
    for (const collection of collections) {
      await prisma.$executeRaw`
        INSERT INTO "Collection" ("id", "name", "description", "imageUrl", "isActive", "updatedAt")
        VALUES (${collection.id}, ${collection.name}, ${collection.description}, ${collection.imageUrl}, ${collection.isActive}, ${collection.updatedAt})
        ON CONFLICT ("id") DO UPDATE
        SET "name" = ${collection.name}, "description" = ${collection.description}, "imageUrl" = ${collection.imageUrl}, "isActive" = ${collection.isActive}, "updatedAt" = ${collection.updatedAt}
      `;
    }
    console.log('Sample collections created');

    console.log('Creating sample products...');
    
    // First check if BulkPricing table exists and create it if needed
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "BulkPricing" (
          "id" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "minQuantity" INTEGER NOT NULL,
          "price" DECIMAL(10,2) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "BulkPricing_pkey" PRIMARY KEY ("id")
        )
      `;
      console.log('BulkPricing table created or already exists');
    } catch (error) {
      console.error('Error creating BulkPricing table:', error);
    }
    
    // Create sample products
    const products = [
      {
        id: 'prod-1',
        name: 'Beach Towel',
        description: 'Luxury beach towel for resorts',
        price: 19.99,
        sku: 'BT001',
        stock: 100,
        minOrder: 10,
        category: 'Towels',
        tags: ['beach', 'towel', 'summer'],
        imageUrl: '/images/products/beach-towel.jpg',
        isActive: true,
        isFeatured: true,
        collectionId: 'coll-1',
        updatedAt: new Date()
      },
      {
        id: 'prod-2',
        name: 'Resort Slippers',
        description: 'Comfortable slippers for your guests',
        price: 9.99,
        sku: 'SL002',
        stock: 200,
        minOrder: 20,
        category: 'Footwear',
        tags: ['slippers', 'comfort', 'hotel'],
        imageUrl: '/images/products/slippers.jpg',
        isActive: true,
        isFeatured: true,
        collectionId: 'coll-2',
        updatedAt: new Date()
      },
      {
        id: 'prod-3',
        name: 'Luxury Bathrobes',
        description: 'Premium bathrobes for a spa-like experience',
        price: 39.99,
        sku: 'BR003',
        stock: 50,
        minOrder: 5,
        category: 'Bathroom',
        tags: ['bathrobe', 'luxury', 'spa'],
        imageUrl: '/images/products/bathrobe.jpg',
        isActive: true,
        isFeatured: true,
        collectionId: 'coll-2',
        updatedAt: new Date()
      },
      {
        id: 'prod-4',
        name: 'Eco-friendly Toiletries Set',
        description: 'Environmentally conscious toiletries for your hotel',
        price: 12.99,
        sku: 'ET004',
        stock: 150,
        minOrder: 15,
        category: 'Toiletries',
        tags: ['eco', 'toiletries', 'sustainable'],
        imageUrl: '/images/products/toiletries.jpg',
        isActive: true,
        isFeatured: false,
        updatedAt: new Date()
      },
      {
        id: 'prod-5',
        name: 'Premium Coffee Maker',
        description: 'High-quality coffee maker for guest rooms',
        price: 89.99,
        sku: 'CM005',
        stock: 30,
        minOrder: 2,
        category: 'Appliances',
        tags: ['coffee', 'maker', 'appliance'],
        imageUrl: '/images/products/coffee-maker.jpg',
        isActive: true,
        isFeatured: false,
        collectionId: 'coll-3',
        updatedAt: new Date()
      },
      {
        id: 'prod-6',
        name: 'Organic Bath Bombs',
        description: 'Luxurious organic bath bombs for spa services',
        price: 7.99,
        sku: 'BB006',
        stock: 120,
        minOrder: 12,
        category: 'Bathroom',
        tags: ['bath', 'organic', 'spa'],
        imageUrl: '/images/products/bath-bombs.jpg',
        isActive: true,
        isFeatured: false,
        collectionId: 'coll-3',
        updatedAt: new Date()
      }
    ];
    
    // Insert products
    for (const product of products) {
      // Check if the product exists first
      const existingProduct = await prisma.$queryRaw`
        SELECT id FROM "Product" WHERE id = ${product.id}
      `;
      
      if (existingProduct.length === 0) {
        // Create product - use array_cat for tags
        await prisma.$executeRaw`
          INSERT INTO "Product" (
            "id", "name", "description", "price", "sku", "stock", 
            "minOrder", "category", "tags", "imageUrl", "isActive", 
            "isFeatured", "updatedAt"
          )
          VALUES (
            ${product.id}, ${product.name}, ${product.description}, 
            ${product.price}, ${product.sku}, ${product.stock}, 
            ${product.minOrder}, ${product.category}, ${product.tags}::text[], 
            ${product.imageUrl}, ${product.isActive}, ${product.isFeatured}, 
            ${product.updatedAt}
          )
        `;
      } else {
        // Update product - use array_cat for tags
        await prisma.$executeRaw`
          UPDATE "Product"
          SET 
            "name" = ${product.name},
            "description" = ${product.description},
            "price" = ${product.price},
            "sku" = ${product.sku},
            "stock" = ${product.stock},
            "minOrder" = ${product.minOrder},
            "category" = ${product.category},
            "tags" = ${product.tags}::text[],
            "imageUrl" = ${product.imageUrl},
            "isActive" = ${product.isActive},
            "isFeatured" = ${product.isFeatured},
            "updatedAt" = ${product.updatedAt}
          WHERE id = ${product.id}
        `;
      }
      
      // Associate product with collection using the join table if collectionId is provided
      if (product.collectionId) {
        await prisma.$executeRaw`
          INSERT INTO "_CollectionToProduct" ("A", "B")
          VALUES (${product.collectionId}, ${product.id})
          ON CONFLICT ("A", "B") DO NOTHING
        `;
      }
    }
    console.log('Sample products created');
    
    // Create bulk pricing for products
    const bulkPricing = [
      {
        id: 'bulk-1',
        productId: 'prod-1',
        minQuantity: 20,
        price: 17.99,
        updatedAt: new Date()
      },
      {
        id: 'bulk-2',
        productId: 'prod-1',
        minQuantity: 50,
        price: 15.99,
        updatedAt: new Date()
      },
      {
        id: 'bulk-3',
        productId: 'prod-2',
        minQuantity: 50,
        price: 7.99,
        updatedAt: new Date()
      },
      {
        id: 'bulk-4',
        productId: 'prod-2',
        minQuantity: 100,
        price: 6.99,
        updatedAt: new Date()
      }
    ];
    
    // Insert bulk pricing
    for (const pricing of bulkPricing) {
      await prisma.$executeRaw`
        INSERT INTO "BulkPricing" ("id", "productId", "minQuantity", "price", "updatedAt")
        VALUES (${pricing.id}, ${pricing.productId}, ${pricing.minQuantity}, ${pricing.price}, ${pricing.updatedAt})
        ON CONFLICT ("id") DO UPDATE
        SET "productId" = ${pricing.productId}, "minQuantity" = ${pricing.minQuantity}, "price" = ${pricing.price}, "updatedAt" = ${pricing.updatedAt}
      `;
    }
    console.log('Bulk pricing created');

    console.log('Done seeding database!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
