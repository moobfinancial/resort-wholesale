import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a password hash
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('Generated password hash:', passwordHash);
    
    // Check if an admin exists
    const existingAdmin = await prisma.admin.findFirst();
    
    if (existingAdmin) {
      console.log('Found existing admin, updating password');
      
      // Update the admin's password
      const updatedAdmin = await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: { passwordHash }
      });
      
      console.log('Updated admin:', {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name
      });
    } else {
      console.log('No admin found, creating new admin');
      
      // Create a new admin
      const newAdmin = await prisma.admin.create({
        data: {
          email: 'admin@resortfresh.com',
          passwordHash,
          name: 'Admin User'
        }
      });
      
      console.log('Created admin:', {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name
      });
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
