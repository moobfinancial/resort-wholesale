import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = express.Router();

// TODO: Move to environment variables
const JWT_SECRET = 'your-secret-key';

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
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

// In-memory store for users (replace with database in production)
const users = new Map<string, {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}>();

// Add a test user
users.set('customer@example.com', {
  id: '1',
  email: 'customer@example.com',
  firstName: 'Test',
  lastName: 'Customer',
  password: 'customer123',
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = registerSchema.parse(req.body);

    if (users.has(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    const newUser = {
      id: (users.size + 1).toString(),
      email,
      firstName,
      lastName,
      password, // In production, hash the password
    };

    users.set(email, newUser);

    const token = jwt.sign(
      { 
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = users.get(email);

    if (!user || user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

// Middleware to verify JWT token
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = updateProfileSchema.parse(req.body);
    const userId = (req.user as { id: string }).id;

    // Find the user's current email
    let currentUserEmail: string | undefined;
    for (const [userEmail, userData] of users.entries()) {
      if (userData.id === userId) {
        currentUserEmail = userEmail;
        break;
      }
    }

    if (!currentUserEmail) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // If email is being changed, check if new email is available
    if (email !== currentUserEmail && users.has(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use',
      });
    }

    const user = users.get(currentUserEmail)!;
    
    // Update user data
    const updatedUser = {
      ...user,
      firstName,
      lastName,
      email,
    };

    // If email changed, remove old entry and add new one
    if (email !== currentUserEmail) {
      users.delete(currentUserEmail);
      users.set(email, updatedUser);
    } else {
      users.set(currentUserEmail, updatedUser);
    }

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Profile update failed',
    });
  }
});

export default router;
