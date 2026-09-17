import express from 'express';
import { z } from 'zod';
import { buildYoutubeUploadBatchMarkdown } from '../lib/socialCopy.js';

const router = express.Router();

const youtubeUploadBatchSchema = z.object({
  event: z.literal('youtube_upload_batch'),
  videos: z.array(z.object({
    video_id: z.string().min(1),
    url: z.string().url(),
    job: z.string().min(1),
  })),
});

router.post('/youtube-upload-batch', (req, res) => {
  const body = req.body ?? {};

  if (!Array.isArray(body.videos) || body.videos.length === 0) {
    return res.type('text/markdown').send('NO_VIDEOS');
  }

  const parsedPayload = youtubeUploadBatchSchema.safeParse(body);

  if (!parsedPayload.success) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid youtube_upload_batch payload',
      details: parsedPayload.error.flatten(),
    });
  }

  return res
    .type('text/markdown')
    .send(buildYoutubeUploadBatchMarkdown(parsedPayload.data));
});

export default router;

