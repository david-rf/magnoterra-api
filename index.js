import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import env from './src/config/env.js';
import logger from './src/lib/logger.js';
import dbPool from './src/db/pool.js';
import routes from './src/routes/index.js';
import { errorHandler, notFound } from './src/middlewares/index.js';

// Load environment variables
dotenv.config();

const app = express();
const port = env.PORT;

// Security middleware
app.use(helmet());

// CORS configuration (temporary * for MVP)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // TODO: Configure production domains
    : '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Health check endpoint (before API routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
  });
});

// Database connection check
app.get('/db-check', async (req, res) => {
  try {
    const result = await dbPool.query('SELECT 1 as ok');
    res.json(result);
  } catch (error) {
    logger.error('Database check failed:', error.message);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
    });
  }
});

// API routes
app.use('/api', routes);

// Static files (if needed)
app.use('/public', express.static('public'));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await dbPool.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await dbPool.close();
  process.exit(0);
});

// Start server
app.listen(port, async () => {
  try {
    // Test database connection
    await dbPool.getPool();
    
    logger.info(`🚀 Magno Terra API server running on port ${port}`);
    logger.info(`📊 Environment: ${env.NODE_ENV}`);
    logger.info(`🔗 Health check: http://localhost:${port}/health`);
    logger.info(`🔗 Database check: http://localhost:${port}/db-check`);
    logger.info(`🔗 API base: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
});

export default app; 
