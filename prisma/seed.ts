import { PrismaClient, Prisma, ProductStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: 'Jamaican Beach Hat',
    description: 'Handwoven straw hat perfect for beach vacations',
    category: 'Apparel',
    tags: ['hat', 'beach', 'handwoven'],
    price: '24.99',
    imageUrl: 'beach-hat.jpg',
    sku: 'BH-001',
    stock: 50,
    minOrder: 5,
    isActive: true,
    isFeatured: true,
    status: ProductStatus.ACTIVE
  },
  {
    name: 'Floral Sandals',
    description: 'Comfortable sandals with floral design',
    category: 'Footwear',
    tags: ['sandals', 'floral', 'beach'],
    price: '34.99',
    imageUrl: 'flower-sandals.jpg',
    sku: 'FS-002',
    stock: 30,
    minOrder: 3,
    isActive: true,
    isFeatured: true,
    status: ProductStatus.ACTIVE
  },
  {
    name: 'Jamaican Art Print',
    description: 'Beautiful art print showcasing Jamaican culture',
    category: 'Home Decor',
    tags: ['art', 'print', 'jamaica', 'culture'],
    price: '19.99',
    imageUrl: 'jamaica-art.jpg',
    sku: 'JA-003',
    stock: 100,
    minOrder: 10,
    isActive: true,
    isFeatured: false,
    status: ProductStatus.ACTIVE
  },
  {
    name: 'Handwoven Basket',
    description: 'Traditional Jamaican handwoven basket',
    category: 'Home Decor',
    tags: ['basket', 'handwoven', 'traditional'],
    price: '27.99',
    imageUrl: 'jamaican-basket.jpg',
    sku: 'JB-004',
    stock: 20,
    minOrder: 2,
    isActive: true,
    isFeatured: false,
    status: ProductStatus.ACTIVE
  },
  {
    name: 'Shell Necklace',
    description: 'Necklace made with natural Caribbean shells',
    category: 'Jewelry',
    tags: ['necklace', 'shell', 'handmade'],
    price: '15.99',
    imageUrl: 'shell-necklace.jpg',
    sku: 'SN-005',
    stock: 40,
    minOrder: 5,
    isActive: true,
    isFeatured: false,
    status: ProductStatus.ACTIVE
  },
  {
    name: 'Island Souvenir',
    description: 'Unique handcrafted souvenir from the islands',
    category: 'Souvenirs',
    tags: ['souvenir', 'handcrafted', 'gift'],
    price: '12.99',
    imageUrl: 'souviner.jpg',
    sku: 'IS-006',
    stock: 75,
    minOrder: 10,
    isActive: true,
    isFeatured: false,
    status: ProductStatus.ACTIVE
  }
];

async function main() {
  // Create admin user
  const adminEmail = 'admin@resortfresh.com';
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Admin User',
      },
    });
    console.log('Created admin user');
  }

  // Add sample products
  console.log('Adding sample products...');
  
  for (const product of sampleProducts) {
    const existingProduct = await prisma.product.findUnique({
      where: { sku: product.sku },
    });

    if (!existingProduct) {
      const createdProduct = await prisma.product.create({
        data: {
          ...product,
          price: new Prisma.Decimal(product.price),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created product: ${createdProduct.name}`);
    } else {
      console.log(`Product with SKU ${product.sku} already exists`);
    }
  }
  
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
