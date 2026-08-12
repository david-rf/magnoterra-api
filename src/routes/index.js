import express from 'express';
import dbPool from '../db/pool.js';
import { asyncHandler } from '../middlewares/error.js';
import {
  formatYoutubeUploadBatchMarkdown,
  YOUTUBE_UPLOAD_BATCH_EVENT,
} from '../social/youtubeUploadBatch.js';

const router = express.Router();

const sendYoutubeUploadBatchMarkdown = (req, res) => {
  const markdown = formatYoutubeUploadBatchMarkdown(req.body);

  res.type('text/markdown').send(markdown);
};

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

router.post('/webhooks', (req, res, next) => {
  if (
    req.body?.event !== YOUTUBE_UPLOAD_BATCH_EVENT
    && Array.isArray(req.body?.videos)
    && req.body.videos.length > 0
  ) {
    return res.status(400).json({
      error: 'Unsupported webhook event',
      message: `Expected event ${YOUTUBE_UPLOAD_BATCH_EVENT}`,
    });
  }

  try {
    return sendYoutubeUploadBatchMarkdown(req, res);
  } catch (error) {
    return next(error);
  }
});

router.post('/webhooks/youtube-upload-batch', (req, res, next) => {
  try {
    return sendYoutubeUploadBatchMarkdown(req, res);
  } catch (error) {
    return next(error);
  }
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
    },
  });
});

export default router;
