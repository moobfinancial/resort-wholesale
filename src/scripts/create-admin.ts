import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email: 'admin@resortfresh.com'
      }
    });

    if (existingAdmin) {
      console.log('Admin already exists:');
      console.log('Email: admin@resortfresh.com');
      console.log('Use your existing password or reset it with the command below');
      
      // Update password if needed
      const passwordHash = await bcrypt.hash('password123', 10);
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { passwordHash }
      });
      
      console.log('Password has been reset to: password123');
      return;
    }

    // Create new admin
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const admin = await prisma.admin.create({
      data: {
        id: uuidv4(),
        email: 'admin@resortfresh.com',
        name: 'Admin',
        passwordHash,
        role: 'ADMIN',
      }
    });

    console.log('Created new admin user:');
    console.log('Email: admin@resortfresh.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
