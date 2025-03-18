import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { businessDetailsSchema } from "./customers";
import { prisma } from "../../lib/prisma";

const router = express.Router();

// Use the same JWT_SECRET as other auth modules
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const updateProfileSchema = z.object({
  contactName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// Removed unused schema

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = registerSchema.parse(
      req.body
    );

    // Check if user already exists
    const existingUser = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database - combine firstName and lastName for contactName
    const newUser = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        contactName: `${firstName} ${lastName}`,
        companyName: "", // Required by schema
        phone: "", // Required by schema
        businessType: "", // Required by schema
        taxId: "", // Required by schema
        address: {}, // Required by schema
        status: "PENDING", // Valid enum value in schema
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set token in HTTP-only cookie
    res.cookie("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Ensure cookie is available for all paths
    });

    // Split contactName into firstName and lastName for the frontend
    const nameParts = newUser.contactName.split(" ");
    const firstNamePart = nameParts[0] || "";
    const lastNamePart = nameParts.slice(1).join(" ") || "";

    // Return response in standardized format
    res.json({
      status: "success",
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: firstNamePart,
          lastName: lastNamePart,
          contactName: newUser.contactName,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Invalid request data",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.customer.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Split contactName into firstName and lastName for the frontend
    const nameParts = user.contactName.split(" ");
    const firstNamePart = nameParts[0] || "";
    const lastNamePart = nameParts.slice(1).join(" ") || "";

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set token in HTTP-only cookie
    res.cookie("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/", // Ensure cookie is available for all paths
    });

    // Return response in standardized format
    res.json({
      status: "success",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: firstNamePart,
          lastName: lastNamePart,
          contactName: user.contactName,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Invalid request data",
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Get token from cookie
  const token = _req.cookies.customer_token;

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Not authenticated",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };
    _req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { contactName, email, phone } = updateProfileSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;

    // Update user in database
    const updateData: any = {};
    if (contactName) updateData.contactName = contactName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const updatedUser = await prisma.customer.update({
      where: { id: userId },
      data: updateData,
    });

    // Split contactName into firstName and lastName for the frontend
    const nameParts = updatedUser.contactName.split(" ");
    const firstNamePart = nameParts[0] || "";
    const lastNamePart = nameParts.slice(1).join(" ") || "";

    // Return response in standardized format
    res.json({
      status: "success",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: firstNamePart,
          lastName: lastNamePart,
          contactName: updatedUser.contactName,
          phone: updatedUser.phone,
        },
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Invalid request data",
    });
  }
});

router.post("/logout", (_, res) => {
  // Clear the token cookie
  res.clearCookie("customer_token", {
    path: "/", // Ensure cookie is cleared for all paths
  });

  // Return success response
  res.json({
    status: "success",
    data: { message: "Logged out successfully" },
  });
});

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = (req.user as { id: string }).id;

    // Get user from database using raw query to avoid schema validation issues
    const users = await prisma.$queryRaw`
      SELECT 
        id, 
        email, 
        "contactName", 
        "companyName", 
        phone, 
        "businessType", 
        "taxId", 
        address, 
        status, 
        "creditLimit", 
        "creditStatus"
      FROM "Customer" 
      WHERE id = ${userId}
    `;

    const user = Array.isArray(users) && users.length > 0 ? users[0] : null;

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Split contactName into firstName and lastName for the frontend
    const nameParts = user.contactName.split(" ");
    const userFirstName = nameParts[0] || "";
    const userLastName = nameParts.slice(1).join(" ") || "";

    // Return response in standardized format
    res.json({
      status: "success",
      data: {
        user: {
          ...user,
          firstName: userFirstName,
          lastName: userLastName,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

router.put("/business-details", verifyToken, async (req, res) => {
  try {
    const customerId = (req.user as { id: string }).id;

    try {
      const data = businessDetailsSchema.parse(req.body);

      await prisma.customer.update({
        where: {
          id: customerId,
        },
        data: {
          companyName: data.companyName,
          businessType: data.businessType,
          taxId: data.taxId || "",
          address: data.address,
          phone: data.phone,
        },
      });

      res.json({
        status: "success",
        data: {
          message: "Business details updated successfully",
        },
      });
    } catch (validationError) {
      res.status(400).json({
        status: "error",
        message: "Validation error",
        details: validationError,
      });
    }
  } catch (error) {
    console.error("Error updating business details:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

export default router;
