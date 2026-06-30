import express from 'express';
import dbPool from '../db/pool.js';
import { buildYoutubeUploadBatchMarkdown } from '../lib/youtubeSocialCopy.js';
import { asyncHandler } from '../middlewares/error.js';

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

router.post('/webhooks', (req, res) => {
  const payload = req.body || {};

  if (payload.event && payload.event !== 'youtube_upload_batch') {
    return res.status(400).type('text/markdown').send('UNSUPPORTED_EVENT');
  }

  const markdown = buildYoutubeUploadBatchMarkdown(payload);

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
      webhooks: '/api/webhooks',
      api: '/api',
    },
  });
});

export default router;
