import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@talkai247.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        settings: {},
      },
    });

    console.log('Admin user created successfully:', admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
