import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.Admin.findUnique({
      where: { email: "admin@resortfresh.com" },
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    // Create admin
    const hash = await bcrypt.hash("admin123", 10);
    const admin = await prisma.admin.create({
      data: {
        email: "admin@resortfresh.com",
        name: "Admin",
        password: hash,
      },
    });

    console.log("Admin created successfully:", admin);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
