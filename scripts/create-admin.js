import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Generate a hashed password
    const passwordHash = await bcrypt.hash("admin123", 10);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: "admin@example.com" },
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        email: "admin@example.com",
        name: "Admin User",
        password: passwordHash,
      },
    });

    console.log("Admin user created successfully:", admin);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
