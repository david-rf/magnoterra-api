import express from 'express';
import dbPool from '../db/pool.js';
import { asyncHandler } from '../middlewares/error.js';
import {
  buildYoutubeUploadBatchMarkdown,
  isYoutubeUploadBatchEvent,
} from '../social/youtubeUploadBatch.js';

const router = express.Router();

const sendYoutubeUploadBatchMarkdown = (req, res) => {
  res.type('text/markdown').send(buildYoutubeUploadBatchMarkdown(req.body));
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

// Generic webhook ingress for automation events
router.post('/webhooks', (req, res) => {
  if (!isYoutubeUploadBatchEvent(req.body)) {
    return res.status(400).type('text/markdown').send('UNSUPPORTED_EVENT');
  }

  return sendYoutubeUploadBatchMarkdown(req, res);
});

router.post('/webhooks/youtube-upload-batch', sendYoutubeUploadBatchMarkdown);
router.post('/webhooks/youtube_upload_batch', sendYoutubeUploadBatchMarkdown);

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
