import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/error';
import usersRouter from './routes/users';
import assistantsRouter from './routes/assistants';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication
app.use(authenticate);

// Routes
app.use('/api/users', usersRouter);
app.use('/api/assistants', assistantsRouter);

// Error handling
app.use(errorHandler);

export default app;