import express from 'express';
import { buildYoutubeUploadBatchMarkdown } from '../social/youtubeUploadBatch.js';

const router = express.Router();

router.post('/youtube-upload-batch', (req, res) => {
  const markdown = buildYoutubeUploadBatchMarkdown(req.body);

  res.type('text/markdown').send(markdown);
});

export default router;
