import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Checking database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Get the admin model fields to check available columns
    const adminModelInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Admin'
    `;

    console.log("📊 Admin model columns:", adminModelInfo);

    // Check if admin exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email: "admin@resortfresh.com",
      },
    });

    const plainPassword = "admin123";
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    if (existingAdmin) {
      console.log("🔄 Updating existing admin account:");
      console.log("📧 Email: admin@resortfresh.com");

      // Update with only fields that exist in the schema
      await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          password: passwordHash,
          name: "Resort Fresh Admin",
        },
      });

      console.log("✅ Admin account updated successfully!");
      console.log("🔑 New password: admin123");
    } else {
      console.log("🆕 Creating new admin account...");

      // Create with only fields that exist in the schema
      await prisma.admin.create({
        data: {
          id: uuidv4(),
          email: "admin@resortfresh.com",
          name: "Resort Fresh Admin",
          password: passwordHash,
        },
      });

      console.log("✅ Created new admin user:");
      console.log("📧 Email: admin@resortfresh.com");
      console.log("🔑 Password: admin123");
    }

    // Test if we can login with these credentials
    console.log("\n🧪 Testing login with new credentials...");
    try {
      const admin = await prisma.admin.findUnique({
        where: { email: "admin@resortfresh.com" },
      });

      if (!admin) {
        console.error("❌ Admin account not found during test!");
        return;
      }

      const passwordMatch = await bcrypt.compare(plainPassword, admin.password);

      if (passwordMatch) {
        console.log("✅ Password verification successful!");
        console.log("🚀 You can now log in with:");
        console.log("📧 Email: admin@resortfresh.com");
        console.log("🔑 Password: admin123");
      } else {
        console.error("❌ Password verification failed!");
      }
    } catch (loginError) {
      console.error("❌ Error during login test:", loginError);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
