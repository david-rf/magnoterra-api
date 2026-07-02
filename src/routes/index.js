import express from 'express';
import dbPool from '../db/pool.js';
import { asyncHandler } from '../middlewares/error.js';
import {
  buildYoutubeUploadBatchMarkdown,
  isSupportedYoutubeUploadBatch,
} from '../social/youtubeUploadBatchMarkdown.js';

const router = express.Router();

const youtubeUploadBatchWebhookPaths = [
  '/webhook',
  '/webhooks',
  '/webhooks/youtube-upload-batch',
];

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

// YouTube upload batch webhook for social media copy.
router.post(youtubeUploadBatchWebhookPaths, (req, res) => {
  if (!isSupportedYoutubeUploadBatch(req.body)) {
    return res.status(400).json({
      error: 'Unsupported event',
      expected: 'youtube_upload_batch',
    });
  }

  res.type('text/markdown').send(buildYoutubeUploadBatchMarkdown(req.body));
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
      youtubeUploadBatchWebhook: '/api/webhooks',
    },
  });
});

export default router;
