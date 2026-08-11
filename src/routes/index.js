import express from 'express';
import dbPool from '../db/pool.js';
import { asyncHandler } from '../middlewares/error.js';
import { buildYouTubeUploadBatchMarkdown } from '../webhooks/youtubeUploadBatch.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database connection check
router.get('/db-check', asyncHandler(async (req, res) => {
  try {
    const result = await dbPool.query('SELECT 1 as ok');
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
    });
  }
}));

// YouTube upload batch webhook for social media copy generation
router.post('/webhooks/youtube-upload-batch', (req, res) => {
  const markdown = buildYouTubeUploadBatchMarkdown(req.body);

  res.status(200).type('text/markdown').send(markdown);
});

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Magno Terra API',
    version: '1.0.0',
    description: 'E-commerce API for Magno Terra',
    endpoints: {
      health: '/health',
      dbCheck: '/db-check',
      api: '/api',
      youtubeUploadBatchWebhook: '/webhooks/youtube-upload-batch',
    },
  });
});

export default router;
