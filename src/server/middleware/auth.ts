import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

// Define user interface for request
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         email: string;
//         role?: string;
//       };
//     }
//   }
// }

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      role?: string;
    };
  }
}

// Helper function to extract token from various sources
const extractToken = (req: Request): string | null => {
  // First check cookies
  const adminToken = req.cookies?.admin_token;
  if (adminToken) return adminToken;

  const customerToken = req.cookies?.customer_token;
  if (customerToken) return customerToken;

  // Then check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Fix for double "Bearer" prefix issue
    if (authHeader.startsWith("Bearer Bearer ")) {
      return authHeader.split("Bearer Bearer ")[1];
    }
    // Standard format
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.split("Bearer ")[1];
    }
    // Just in case the token is sent without the Bearer prefix
    return authHeader;
  }

  return null;
};

// Middleware to require admin role
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookies or Authorization header
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Admin authentication required",
        data: null,
      });
    }

    // Verify token
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role?: string;
      };

      // Check role
      if (!decoded.role || decoded.role.toLowerCase() !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Admin access required",
          data: null,
        });
      }

      // Validate admin exists in database
      try {
        const admin = await prisma.admin.findUnique({
          where: { id: decoded.id },
          select: { id: true },
        });

        if (!admin) {
          return res.status(401).json({
            status: "error",
            message: "Invalid admin account",
            data: null,
          });
        }
      } catch (dbError) {
        console.error("Database error in requireAdmin:", dbError);
        return res.status(500).json({
          status: "error",
          message: "Database error",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
          data: null,
        });
      }

      // Set user in request
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
        data: null,
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      status: "error",
      message: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error",
      data: null,
    });
  }
};

// Middleware to require authentication
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookies or Authorization header
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        data: null,
      });
    }

    // Verify token
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role?: string;
      };

      // Set user in request
      req.user = decoded;

      // We'll continue even if the customer doesn't exist in the database
      // The route handlers will handle this case appropriately
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
        data: null,
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      status: "error",
      message: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error",
      data: null,
    });
  }
};

// Middleware to optionally authenticate
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from cookies or Authorization header
    const token = extractToken(req);

    if (!token) {
      // No token, continue as guest
      return next();
    }

    // Verify token
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role?: string;
      };

      // Set user in request
      req.user = decoded;
    } catch (jwtError) {
      // Invalid token, just continue without setting user
      console.error("Optional auth JWT error:", jwtError);
    }

    next();
  } catch (error) {
    // Any error, continue as guest
    console.error("Optional auth middleware error:", error);
    next();
  }
};

export default {
  requireAuth,
  optionalAuth,
  requireAdmin,
};
