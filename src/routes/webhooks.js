import express from 'express';
import { formatYoutubeUploadBatchMarkdown } from '../social/youtubeUploadBatch.js';

const router = express.Router();

const sendYoutubeUploadBatchMarkdown = (req, res) => {
  const markdown = formatYoutubeUploadBatchMarkdown(req.body);

  res.status(200).type('text/markdown').send(markdown);
};

router.post('/webhooks', sendYoutubeUploadBatchMarkdown);
router.post('/webhooks/youtube-upload-batch', sendYoutubeUploadBatchMarkdown);

export default router;
