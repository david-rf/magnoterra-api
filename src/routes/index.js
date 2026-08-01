import express from 'express';
import dbPool from '../db/pool.js';
import { asyncHandler } from '../middlewares/error.js';

const router = express.Router();
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const CONTACT_CTA = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const cleanText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const truncateText = (value, maxLength) => {
  const text = cleanText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength).trim();
};

const getJobSummary = (job, fallback) => truncateText(job || fallback, 180);

const buildLinkedInCopy = (job) => {
  const jobSummary = getJobSummary(job, 'nuevo proyecto de puesta a tierra');

  return truncateText(
    [
      `Nuevo video: ${jobSummary}.`,
      'En Magno Terra acompanamos proyectos de puesta a tierra con una mirada tecnica, ordenada y aterrizada a las condiciones de cada obra.',
      'Cuando el alcance lo requiere, los criterios RIC N06 se revisan de forma condicionada al diseno, terreno y requerimientos aplicables.',
      `Conversemos como apoyar tu proximo proyecto: ${CONTACT_CTA}`,
      HASHTAGS,
    ].join(' '),
    LINKEDIN_LIMIT,
  );
};

const buildInstagramCaption = (job) => {
  const jobSummary = getJobSummary(job, 'Puesta a tierra en terreno');

  return truncateText(
    [
      `${jobSummary}.`,
      'Soluciones de puesta a tierra con foco tecnico y ejecucion en terreno.',
      'RIC N06 se evalua segun cada proyecto.',
      HASHTAGS,
    ].join(' '),
    INSTAGRAM_LIMIT,
  );
};

const formatVideoMarkdown = (video) => [
  '1) URL',
  cleanText(video.url),
  '',
  '2) Copy LinkedIn empresa',
  buildLinkedInCopy(video.job),
  '',
  '3) Caption Instagram',
  buildInstagramCaption(video.job),
];

const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (
    !payload ||
    payload.event !== 'youtube_upload_batch' ||
    !Array.isArray(payload.videos) ||
    payload.videos.length === 0
  ) {
    return 'NO_VIDEOS';
  }

  return payload.videos
    .map(formatVideoMarkdown)
    .map((lines) => lines.join('\n'))
    .join('\n\n---\n\n');
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

router.post('/webhooks/youtube-upload-batch', (req, res) => {
  const markdown = buildYoutubeUploadBatchMarkdown(req.body);

  res.type('text/markdown').send(markdown);
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
