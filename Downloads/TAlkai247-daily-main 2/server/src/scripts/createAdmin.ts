import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const hashedPassword = await hashPassword('Admin@247!');
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@talkai247.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        settings: {
          defaultTransparencyLevel: 'FULL',
          recordingEnabled: true,
          webSearchEnabled: true,
          notificationsEnabled: true
        },
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
